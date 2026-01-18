import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import * as monaco from "monaco-editor";
import { createPyodideClient } from "../utils/pyodide_manager";

@customElement("element-editor")
export class Editor extends LitElement {
    editor: monaco.editor.IStandaloneCodeEditor | undefined;
    pyodideClient: { r?: any; init?: () => Promise<unknown>; complete?: (source: any, line: any, column: any) => Promise<unknown>; run?: (source: any) => Promise<unknown>; terminate?: () => void; } | any;

    protected createRenderRoot(): HTMLElement | DocumentFragment {
        return this;
    }

    debounceAsync(fn: any, delay: any) {
        let t: any = null;
        let pendingReject: any = null;

        return (...args: any) =>
            new Promise((resolve, reject) => {
            if (t) clearTimeout(t);
            if (pendingReject) pendingReject(new Error("Debounced"));

            pendingReject = reject;

            t = setTimeout(async () => {
                pendingReject = null;
                try {
                    resolve(await fn(...args));
                } catch (e) {
                    reject(e);
                }
            }, delay);
        });
    }

    async registerJediWebCompletions(pyodideClient: any) {
        await pyodideClient.init();

        monaco.languages.registerCompletionItemProvider("python", {
            triggerCharacters: [".", "_"],

            provideCompletionItems: async (model, position) => {
                // Lấy full source
                const source = model.getValue();

                // Monaco position là 1-based line, 1-based column (column)
                const line = position.lineNumber;

                // Jedi column là 0-based index theo dòng
                const column0 = position.column - 1;

                const word = model.getWordUntilPosition(position);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn,
                };

                async function runJedi(source: any, line: any, col: any) {
                    const jsonStr = await pyodideClient.complete(source, line, col);
                    return jsonStr;
                }
                const runJediDebounced = this.debounceAsync(runJedi, 250);

                try {
                    const items: any = await runJediDebounced(source, line, column0);
                    const suggestions = items.map((it: any) => {
                        let kind = monaco.languages.CompletionItemKind.Text;
                        if (it.type === "function") kind = monaco.languages.CompletionItemKind.Function;
                        else if (it.type === "class") kind = monaco.languages.CompletionItemKind.Class;
                        else if (it.type === "module") kind = monaco.languages.CompletionItemKind.Module;
                        else if (it.type === "statement") kind = monaco.languages.CompletionItemKind.Variable;
                        else if (it.type === "keyword") kind = monaco.languages.CompletionItemKind.Keyword;
                        else if (it.type === "property") kind = monaco.languages.CompletionItemKind.Property;

                        let insertText; 
                        let insertRules = undefined;

                        if (it.type === "function") {
                            insertText = `${it.label}($1)`;
                            insertRules = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
                        } else {
                            insertText = it.label;
                        }

                        const label = it.signature ? `${it.label}${it.signature}` : it.label;
                        return {
                            label,
                            kind,
                            insertText,
                            insertTextRules: insertRules,
                            range,
                            documentation: it.type,
                        };
                    });

                    return { suggestions };
                } catch (e) {
                    return { suggestions: [] };
                }
            },
        });
    }

    async firstUpdated() {
        this.pyodideClient = await createPyodideClient();

        this.editor = monaco.editor.create(document.getElementById("editor")!, {
            value: localStorage.getItem("editorvalue") || "print('Hello, world!')",
            language: "python",
            theme: "vs-dark",
            automaticLayout: true,
            minimap: { enabled: false }
        });

        const debounceSave = this.debounceAsync(async () => {
            localStorage.setItem("editorvalue", this.editor!.getValue())
            return true;
        }, 500);
        this.editor.getModel()?.onDidChangeContent(() => {
            debounceSave().catch(() => { /* Ignore debounce rejections */ });
        })

        this.registerJediWebCompletions(this.pyodideClient);
    }

    render() {
        return html`
            <div id="editor" class="w-full h-full"></div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "element-editor": Editor;
    }
}