from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# Engine configuration with pooling & pre-ping for remote PostgreSQL
db_url = settings.DATABASE_URL
is_sqlite = db_url.startswith("sqlite")

# If psycopg2 is not installed, auto-fallback to pure-Python pg8000 if available
if db_url.startswith("postgresql://") and "+psycopg" not in db_url and "+pg8000" not in db_url:
    try:
        import psycopg2
    except ImportError:
        try:
            import pg8000
            db_url = db_url.replace("postgresql://", "postgresql+pg8000://", 1)
        except ImportError:
            pass

engine = create_engine(
    db_url,
    connect_args={"check_same_thread": False} if is_sqlite else {
        "connect_timeout": 15,
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    },
    pool_pre_ping=True,
    pool_size=5 if not is_sqlite else 5,
    max_overflow=5 if not is_sqlite else 10,
    pool_recycle=300,
    pool_timeout=30,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
