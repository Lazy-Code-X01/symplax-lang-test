from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def root():
    return {"ok": True, "app": "python-fastapi", "mode": "auto-detect (no Dockerfile)"}
