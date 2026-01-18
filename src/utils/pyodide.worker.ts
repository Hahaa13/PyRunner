import * as pyodide from "pyodide";
import pyscript from "../assets/jedi_script.py?raw";

let pyodideInstance: pyodide.PyodideAPI | null = null;
let state!: Int32Array;
let data!: Uint8Array;
let interruptBuffer!: Uint8Array;

async function initPyodide() {
    if (pyodideInstance != null) return pyodideInstance;
    
    console.debug("Initializing pyodide");

    pyodideInstance = await pyodide.loadPyodide({indexURL: "https://cdn.jsdelivr.net/pyodide/v0.29.1/full/", fullStdLib: false});
    await pyodideInstance.loadPackage("jedi");
    await pyodideInstance.runPythonAsync(pyscript);
    pyodideInstance.setInterruptBuffer(interruptBuffer);

    const init_log_string = `[Python Runner] <Python ${await pyodideInstance.runPythonAsync("sys.version")}>\r\n`;
    self.postMessage({ id: null, ok: true, type: "stdout_loaded", result: init_log_string });

    const td = new TextDecoder();

    pyodideInstance.setStdout({
        write: (buf: Uint8Array) => {
            const s = td.decode(buf);
            self.postMessage({ id: null, ok: true, type: "stdout", result: s });
            return buf.length;
        },
        isatty: true,
    });

    pyodideInstance.setStderr({
        write: (buf: Uint8Array) => {
            const s = td.decode(buf);
            self.postMessage({ id: null, ok: true, type: "stderr", result: s });
            return buf.length;
        },
        isatty: true,
    });


    pyodideInstance.setStdin({
        stdin: () => {
            self.postMessage({ id: null, ok: true, type: "stdin" });
            
            Atomics.store(state, 0, 0);
            Atomics.wait(state, 0, 0); // block until flag != 0

            const len = Atomics.load(state, 1);
            const bytes = data.slice(0, len);
            const result = td.decode(bytes);

            return result;
        }
    });

    console.debug("Pyodide initialized");
    return pyodideInstance;
}

self.onmessage = async (event) => {
    const {id, type, payload} = event.data;

    switch (type) {
        case "init":
            state = new Int32Array(payload.sabState);
            data = new Uint8Array(payload.sabData);
            interruptBuffer = new Uint8Array(payload.interruptSAB);

            await initPyodide();
            self.postMessage({id, type, ok:true, result: "Pyodide initialized"});
            return;

        case "run":
            if (!pyodideInstance) return;

            console.debug("Running python script");
            pyodideInstance.runPythonAsync(`run_user_code(${JSON.stringify(payload.source)})`).then((res) => {
                if (!res.ok) self.postMessage({ type: "stderr", result: res.error });
                self.postMessage({ type: "stdout", result: "\n<Python exited with code " + res.exit_code + ">\n" });
            }).finally(() => {
                self.postMessage({ id, type: "run_finished" });
            });

            return;
        
        case "complete":
            if (!pyodideInstance) {
                return;
            }

            const { source, line, column } = payload;
            console.debug("Running jedi completion");
            pyodideInstance.runPythonAsync(`jedi_complete(${JSON.stringify(source)}, ${line}, ${column})`).then((res) => {
                const result = JSON.parse(res);
                self.postMessage({ id, type, ok: true, result });
            }).catch();
            return;
    }
}