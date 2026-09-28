import uvicorn
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables (.env)
load_dotenv(Path(__file__).resolve().parent / ".env")

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    
    print(f"==================================================")
    print(f"  BharatMap3D FastAPI Backend")
    print(f"  Listening on: http://{host}:{port}")
    print(f"  Swagger Docs: http://localhost:{port}/docs")
    print(f"==================================================")
    
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
