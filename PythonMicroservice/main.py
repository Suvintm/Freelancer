from fastapi import FastAPI
import os

app = FastAPI(title="SuviX Python AI/Media Service", version="1.0.0")

@app.get("/health")
def health():
    return {"status": "UP", "service": "python-microservice"}

@app.get("/api/v1/ai/health")
def ai_health():
    return {"status": "UP", "service": "python-ai-microservice"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
