from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Agriculture AI Orchestrator"
    API_V1_STR: str = "/api/v1"
    
    # Databases
    DATABASE_URL: str = "postgresql://agri_user:agri_pass@localhost:5432/smart_agriculture"
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # LLM Settings
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
