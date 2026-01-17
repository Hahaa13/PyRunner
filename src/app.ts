import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { Editor } from "./components/editor";
import { TerminalElement } from "./components/terminal";
import { RunBtn } from "./components/run_btn";
import "./components/toggle_terminal_btn";

@customElement("main-app")
export class MainApp extends LitElement {
    protected createRenderRoot(): HTMLElement | DocumentFragment {
        return this;
    }

    protected render(): unknown {
        const terminal = new TerminalElement();
        terminal.style.height = "256px"
        terminal.className = "w-full resizable touch-none will-change-transform relative p-0 box-border"; 
        const editor = new Editor();
        editor.className = "w-full flex-1 min-h-0";
        const runBtn = new RunBtn();
        return html`
            <div class="flex w-full h-16 items-center justify-between px-5 bg-[#1E1E1E] border-b-2 border-zinc-800">
                <div class="flex gap-x-3 items-center">
                    <img src="/python.svg" alt="python logo" class="w-8 h-8">
                    <span class="text-2xl font-bold text-white">Runner</span>
                </div>
                <div class="flex items-center gap-x-3 flex-row-reverse w-full">
                    ${runBtn}
                    <element-toggle-terminal-btn></element-toggle-terminal-btn>
                </div>
            </div>
            <div class="w-full h-[calc(100%-4rem)] flex flex-col flex-nowrap">
                ${editor}
                ${terminal}
            </div>
        `
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "main-app": MainApp;
    }
}