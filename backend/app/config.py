from pydantic import BaseModel
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend directory or project root
load_dotenv(Path(__file__).resolve().parent.parent / '.env')
load_dotenv(Path(__file__).resolve().parent.parent.parent / '.env')

class Settings(BaseModel):
    PROJECT_NAME: str = "BharatMap3D"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Coordinate Reference System (Prayagraj, Uttar Pradesh Tangent Plane Origin)
    ORIGIN_LAT: float = 25.4358
    ORIGIN_LNG: float = 81.8463
    ORIGIN_ELEVATION: float = 98.0
    
    # Database - resolve absolute path to workspace root
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{(Path(__file__).resolve().parent.parent.parent / 'cadastral.db').as_posix()}"
    )
    
    # ULPIN demo format prefix
    COUNTRY_CODE: str = "IN"
    STATE_CODE: str = "UP"
    DEMO_PREFIX: str = "DEMO"

settings = Settings()
