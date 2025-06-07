import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "PC Builder API"
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    MODEL_NAME: str = os.getenv("MODEL_NAME", "llama-3.3-70b-versatile")
    CSV_DIR: str = os.getenv("CSV_DIR", "../csv")
    CHROMA_DB_DIR: str = os.getenv("CHROMA_DB_DIR", "../chroma_db")

settings = Settings()