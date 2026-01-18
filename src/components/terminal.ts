import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import interact from "interactjs";

const xtermtheme = {
  foreground: '#D4D4D4', // Default foreground color
  background: '#1E1E1E',
  cursor: '#FFFFFF',     // Cursor color
  cursorAccent: '#000000', // Accent color for block cursor
  selectionBackground: '#264F78', // Selection background color
  selectionForeground: undefined, // Use default foreground
  selectionInactiveBackground: undefined, // Use default selection background
  black: '#000000',
  red: '#CD3131',
  green: '#0DCC91', // A modern green
  yellow: '#E5E510',
  blue: '#2472C8',
  magenta: '#BC3FBC',
  cyan: '#00BCEE',
  white: '#E5E5E5',
  brightBlack: '#666666',
  brightRed: '#FF4545',
  brightGreen: '#14D4A4',
  brightYellow: '#FFF565',
  brightBlue: '#3B88FD',
  brightMagenta: '#D64ED6',
  brightCyan: '#1DFCFE',
  brightWhite: '#FFFFFF'
};

@customElement("element-terminal")
export class TerminalElement extends LitElement {
    terminal: Terminal = new Terminal({
        theme: xtermtheme,
        cursorBlink: true,
        lineHeight: 1.0
    });

    protected createRenderRoot(): HTMLElement | DocumentFragment {
        return this;
    }

    async get_input() {
        let datainput = "";
        let cursorPos = 0;
        let done = false;

        const listen = this.terminal.onData(e => {
            switch (e) {
                case "\r": // Enter
                    done = true;
                    listen.dispose();
                    return;

                case "\u007F": // Backspace
                    if (datainput.length > 0 && cursorPos > 0) {
                        datainput = datainput.slice(0, cursorPos - 1) + datainput.slice(cursorPos);
                        cursorPos--;
                    }
                    return;

                case "\x1b[D": // Left arrow
                    if (cursorPos > 0) {
                        cursorPos--;
                    }
                    return;

                case "\x1b[C": // Right arrow
                    if (cursorPos < datainput.length) {
                        cursorPos++;
                    }
                    return;

                default:
                    datainput = datainput.slice(0, cursorPos) + e + datainput.slice(cursorPos);
                    cursorPos++;
            }
        });

        while (!done) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        return datainput;
    }


    protected firstUpdated(): void {
        window.terminal = this.terminal;
        this.terminal.open(document.getElementById("terminal")!);

        const fitAddon = new FitAddon();
        this.terminal.loadAddon(fitAddon);
        
        
        let raf = 0;
        const fitStable = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                fitAddon.fit();
                requestAnimationFrame(() => fitAddon.fit());
            });
        };
        fitStable();
        
        this.terminal.writeln("Loading...")
        
        let currentPos = 0;
        let contentLength = 0;
        this.terminal.onKey(e => {
            switch (e.domEvent.code) {
                case "Enter":
                    this.terminal.writeln("");
                    currentPos = 0;
                    break;

                case "ArrowLeft":
                    if (currentPos > 0) {
                        this.terminal.write("\x1b[D");
                        currentPos--;
                    }
                    break;

                case "ArrowRight":
                    if (currentPos < contentLength) {
                        this.terminal.write("\x1b[C");
                        currentPos++;
                    }
                    break;

                case "ArrowUp":
                case "ArrowDown":
                    break;

                case "Backspace":
                    if (currentPos > 0) {
                        this.terminal.write("\x1b[D\x1b[P");
                        currentPos--;
                        contentLength--;
                    }
                    break;

                default:
                    if (currentPos < contentLength) {
                        this.terminal.write("\x1b[@");
                    }
                    this.terminal.write(e.key);
                    currentPos += e.key.length;
                    contentLength += e.key.length;
                    break;
            }
        });

        interact('.resizable').resizable({
            edges: { top: true },

            modifiers: [
                interact.modifiers.restrictSize({
                min: { width: Infinity, height: 80 }
                })
            ],

            listeners: {
                start (event) {
                    const target = event.target
                    target._startHeight = target.offsetHeight
                    target._currentHeight = target._startHeight
                    target._tempTranslate = 0
                },

                move (event) {
                    const target = event.target

                    target._currentHeight += event.deltaRect.height
                    if (target._currentHeight < 80) {
                        target._currentHeight = 80
                    }

                    target._tempTranslate = event.deltaRect.top

                    target.style.transform = `translateY(${target._tempTranslate}px)`
                    target.style.height = `${target._currentHeight}px`
                },

                end (event) {
                    const target = event.target
                    target.style.transform = ''
                    target.style.height = `${target._currentHeight}px`
                    fitStable();
                }
            }
        })

        const ro = new ResizeObserver(() => fitStable());
        ro.observe(this.querySelector("#terminal")!);
    }

    toggle() {
        const toggled = !this.classList.toggle("hidden");
        if (toggled) this.style.height = "256px";
        return toggled;
    }
    
    protected render(): unknown {
        return html`<div id="terminal" class="w-full h-full border-t-5 p-3 border-zinc-800 hover:border-gray-700 focus-within:border-gray-700"></div>`;
    }
}

declare global {
    interface Window { terminal: Terminal }
    interface HTMLElementTagNameMap {
        "element-terminal": TerminalElement;
    }
}