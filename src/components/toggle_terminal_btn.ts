import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("element-toggle-terminal-btn")
export class ToggleTerminalBtn extends LitElement {
    protected createRenderRoot(): HTMLElement | DocumentFragment {
        return this;
    }

    protected clickHandler() {
        const terminal = document.querySelector("element-terminal");
        terminal?.toggle()
    }

    protected render(): unknown {
        return html`
            <button @click="${this.clickHandler}" class="w-11 h-11 p-0 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-2 stroke-gray-500 hover:stroke-indigo-500 fill-none" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M7 11l2-2-2-2" />
                    <path d="M11 13h4" />
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                </svg>
            </button>
        `;
    }
}