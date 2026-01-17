
export function createPyodideClient(workerUrl: string) {
    const worker = new Worker(workerUrl, {type: "module"});
    let is_running = false;
    let is_killing = false;
    let seq = 0;
    const pending = new Map();

     function call(type: string, payload: { source: any; line: any; column: any; } | any) {
        const id = ++seq;
        return new Promise((resolve, reject) => {
            pending.set(id, { resolve, reject });
            worker.postMessage({ id, type, payload });
        });
    }

    const sabState = new SharedArrayBuffer(4 * 2); // [flag, len]
    const sabData  = new SharedArrayBuffer(64 * 1024);
    const interruptSAB = new SharedArrayBuffer(1);
    const interruptBuffer = new Uint8Array(interruptSAB);

    const state = new Int32Array(sabState);
    const data  = new Uint8Array(sabData);

  worker.onmessage = async (e) => {
    const { id, ok, type, result, error } = e.data;

    if (type === "stdout_loaded") {
        const terminal = document.querySelector("element-terminal")?.terminal;
        terminal?.clear();
        terminal?.writeln(result);
        return;
    }

    if (type === "stdout") {
        const terminal = document.querySelector("element-terminal")?.terminal;
        terminal?.write(result.replace(/\n/g, "\r\n"));
        return;
    }

    if (type === "stderr") {
        const terminal = document.querySelector("element-terminal")?.terminal;
        terminal?.write(`\x1b[31m${result.replace(/\n/g, "\r\n")}\x1b[0m`);
        return;
    }

    if (type === "stdin") {
        const terminal = document.querySelector("element-terminal");
        terminal!.get_input().then(content => {
            const bytes = new TextEncoder().encode(content);
    
            data.set(bytes.subarray(0, data.length));
            Atomics.store(state, 1, bytes.length); // len
            Atomics.store(state, 0, 1);            // flag=1 ready
            Atomics.notify(state, 0, 1);
        })
        return;
    }

    if (type === "run_finished") {
        is_running = false;
        window.dispatchEvent(new CustomEvent("pyodide-change", { detail: { is_running }}))
        return;
    }

    const p = pending.get(id);
    if (!p) return;
    pending.delete(id);
    ok ? p.resolve(result) : p.reject(new Error(error));
  };

  return {
    init: () => call("init", { sabState, sabData, interruptSAB }),
    complete: (source: any, line: any, column: any) => call("complete", { source, line, column }),
    run: (source: any) => {
        if (is_running) return;
        call("run", { source });
        is_running = true;
        window.dispatchEvent(new CustomEvent("pyodide-change", { detail: { is_running }}))
    },
    version: () => call("version", null),
    terminate: () => worker.terminate(),
    kill_process: () => {
        if (!is_running || is_killing) return;
        is_killing = true;
        interruptBuffer[0] = 2;      // SIGINT
        Atomics.store(state, 0, 1);  // Wake up stdin wait if it's stuck
        Atomics.notify(state, 0, 1);
        is_killing = false;
    },
    is_running: () => is_running
  };
}
