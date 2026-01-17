import jedi, json, sys, traceback, builtins

_real_input = builtins.input

def _patched_input(prompt=""):
    sys.stdout.write(str(prompt))
    sys.stdout.flush()
    return _real_input()

builtins.input = _patched_input

def run_user_code(code: str, filename="main.py"):
    try:
        compiled = compile(code, filename, "exec")
        exec(compiled, globals())
        return {"ok": True, "error": ""}
    except Exception:
        return {"ok": False, "error": traceback.format_exc()}
    
def jedi_complete(source: str, line: int, column: int):
    try:
        script = jedi.Script(source)
        comps = script.complete(line, column)
        out = []

        for c in comps[:50]:
            sig = ""
            try:
                sigs = c.get_signatures()
                if sigs:
                    params = [p.name for p in sigs[0].params]
                    sig = "(" + ", ".join(params) + ")"
            except Exception:
                pass

            out.append({
                "label": c.name,
                "type": c.type,
                "complete": c.complete or "",
                "signature": sig
            })

        return json.dumps(out)
    except Exception:
        return "[]"

