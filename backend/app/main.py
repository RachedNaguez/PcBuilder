from fastapi import FastAPI
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file
from fastapi.middleware.cors import CORSMiddleware
from app.api import chat, components, builds

app = FastAPI(title="PC Builder API")

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173",
                   "http://localhost:3000"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(components.router,
                   prefix="/api/components", tags=["components"])
app.include_router(builds.router, prefix="/api/builds", tags=["builds"])


@app.get("/")
async def root():
    return {"message": "PC Builder API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
