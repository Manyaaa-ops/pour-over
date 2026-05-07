from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(
    title="Pour-Over AI API",
    description="AI-powered coffee pour analysis and training platform",
    version="1.0.0"
)

# Allow Vercel frontend and localhost for development
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "https://pour-over-qpxo.vercel.app,http://localhost:3000,http://127.0.0.1:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

from app.routes import analysis, auth

app.include_router(analysis.router, prefix="/api/v1/analysis", tags=["analysis"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])

@app.get("/")
async def root():
    return {"message": "Pour-Over AI API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "pour-over-ai"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)