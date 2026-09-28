import time
import sys
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.parcels import router as parcels_router
from app.api.buildings import router as buildings_router
from app.api.floors import router as floors_router
from app.api.properties import router as properties_router
from app.api.ulpin import router as ulpin_router
from app.api.validation import router as validation_router
from app.api.infrastructure import router as infra_router
from app.api.imports import router as imports_router
from app.api.auth import router as auth_router
from app.api.map3d import router as map3d_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for BharatMap3D - 3D ULPIN & Vertical Property Mapping System (SIH 2026 Problem Statement 11 Prototype)"
)

# Enable CORS for frontend local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(parcels_router, prefix=settings.API_V1_STR)
app.include_router(buildings_router, prefix=settings.API_V1_STR)
app.include_router(floors_router, prefix=settings.API_V1_STR)
app.include_router(properties_router, prefix=settings.API_V1_STR)
app.include_router(ulpin_router, prefix=settings.API_V1_STR)
app.include_router(validation_router, prefix=settings.API_V1_STR)
app.include_router(infra_router, prefix=settings.API_V1_STR)
app.include_router(imports_router, prefix=settings.API_V1_STR)
app.include_router(map3d_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def startup_event():
    from app.database.session import SessionLocal, Base, engine
    from app.models.entities import Parcel
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Parcel).count() == 0:
            from seed.generate_demo_data import generate_all_demo_data
            generate_all_demo_data()
    except Exception as e:
        print(f"Auto-initializing database tables: {e}")
        from seed.generate_demo_data import generate_all_demo_data
        generate_all_demo_data()
    finally:
        db.close()


STARTUP_TIME = time.time()

@app.get("/server-info")
@app.get(f"{settings.API_V1_STR}/server-info")
def get_server_info():
    """
    Real-time Server Information & System Health Probe
    Reports FastAPI microservice runtime, PostgreSQL 17 database latency & counts,
    geospatial projection engine status, and registered API health routes.
    """
    from datetime import datetime, timezone
    from app.database.session import SessionLocal
    from sqlalchemy import text
    import shapely
    import pyproj

    db = SessionLocal()
    db_status = {}
    try:
        t0 = time.perf_counter()
        db.execute(text("SELECT 1")).fetchone()
        ping_ms = round((time.perf_counter() - t0) * 1000, 2)

        db_version_row = db.execute(text("SELECT version();")).fetchone()
        db_version_str = db_version_row[0] if db_version_row else "PostgreSQL (Unknown version)"

        counts_row = db.execute(text("""
            SELECT
                (SELECT COUNT(*) FROM parcels),
                (SELECT COUNT(*) FROM buildings),
                (SELECT COUNT(*) FROM floors),
                (SELECT COUNT(*) FROM vertical_parcels),
                (SELECT COUNT(*) FROM properties),
                (SELECT COUNT(*) FROM underground_assets),
                (SELECT COUNT(*) FROM gnss_stations),
                (SELECT COUNT(*) FROM users)
        """)).fetchone()

        db_host = "Localhost SQLite"
        if "@" in settings.DATABASE_URL:
            db_host = settings.DATABASE_URL.split("@")[-1].split("/")[0]

        db_status = {
            "status": "healthy",
            "connection": "connected",
            "engine": "PostgreSQL 17" if "PostgreSQL" in db_version_str else "SQLite",
            "version": db_version_str.split("on")[0].strip() if "on" in db_version_str else db_version_str,
            "host": db_host,
            "database": "postgres" if "postgresql" in settings.DATABASE_URL.lower() else "cadastral.db",
            "ping_ms": ping_ms,
            "tables": {
                "parcels": counts_row[0] or 0,
                "buildings": counts_row[1] or 0,
                "floors": counts_row[2] or 0,
                "vertical_parcels": counts_row[3] or 0,
                "properties": counts_row[4] or 0,
                "underground_assets": counts_row[5] or 0,
                "gnss_stations": counts_row[6] or 0,
                "users": counts_row[7] or 0,
            }
        }
    except Exception as e:
        db_status = {
            "status": "degraded",
            "connection": "disconnected",
            "error": str(e),
            "ping_ms": -1,
            "tables": {}
        }
    finally:
        db.close()

    uptime_secs = int(time.time() - STARTUP_TIME)
    uptime_str = f"{uptime_secs // 3600}h {(uptime_secs % 3600) // 60}m {uptime_secs % 60}s"

    return {
        "status": "healthy" if db_status.get("status") == "healthy" else "degraded",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": "Production Cloud" if "postgresql" in settings.DATABASE_URL.lower() else "Development",
        "server": {
            "framework": "FastAPI 0.110+",
            "python_version": sys.version.split()[0],
            "platform": sys.platform,
            "pid": os.getpid(),
            "uptime": uptime_str,
            "uptime_seconds": uptime_secs,
            "cors_origin": "*"
        },
        "database": db_status,
        "spatial_engine": {
            "status": "active",
            "shapely_version": getattr(shapely, "__version__", "2.0.3"),
            "pyproj_version": getattr(pyproj, "__version__", "3.6.1"),
            "reference_origin": {
                "latitude": settings.ORIGIN_LAT,
                "longitude": settings.ORIGIN_LNG,
                "elevation_m": settings.ORIGIN_ELEVATION,
                "location": "Prayagraj, Uttar Pradesh, India (EPSG:4326 to Metric ENU)"
            }
        },
        "endpoints": [
            {"name": "Parcels Registry", "path": f"{settings.API_V1_STR}/parcels", "method": "GET", "category": "Cadastral Core"},
            {"name": "3D Buildings Mesh", "path": f"{settings.API_V1_STR}/buildings", "method": "GET", "category": "Cadastral Core"},
            {"name": "Extruded Floors", "path": f"{settings.API_V1_STR}/floors", "method": "GET", "category": "3D Geometry"},
            {"name": "Vertical Parcels", "path": f"{settings.API_V1_STR}/vertical-properties", "method": "GET", "category": "3D Geometry"},
            {"name": "Property Deeds (ULPIN)", "path": f"{settings.API_V1_STR}/properties", "method": "GET", "category": "Registry & Rights"},
            {"name": "Dashboard KPI Metrics", "path": f"{settings.API_V1_STR}/dashboard", "method": "GET", "category": "Analytics"},
            {"name": "Officer Directory (RBAC)", "path": f"{settings.API_V1_STR}/auth/admins", "method": "GET", "category": "Security & RBAC"},
            {"name": "Spatial Validation Audit", "path": f"{settings.API_V1_STR}/validation", "method": "GET", "category": "Validation"},
            {"name": "Subsurface Utilities", "path": f"{settings.API_V1_STR}/underground-assets", "method": "GET", "category": "Infrastructure"},
            {"name": "CORS / GNSS Stations", "path": f"{settings.API_V1_STR}/gnss", "method": "GET", "category": "Infrastructure"},
            {"name": "Server Diagnostics", "path": f"{settings.API_V1_STR}/server-info", "method": "GET", "category": "System"}
        ]
    }

@app.get("/")
def root():
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "Operational",
        "reference_origin": {
            "latitude": settings.ORIGIN_LAT,
            "longitude": settings.ORIGIN_LNG,
            "elevation_m": settings.ORIGIN_ELEVATION,
            "location": "Prayagraj, Uttar Pradesh, India"
        },
        "docs_url": "/docs"
    }

@app.get("/health")
@app.get(f"{settings.API_V1_STR}/health")
def health_check():
    from fastapi.responses import JSONResponse
    from app.database.session import SessionLocal
    from sqlalchemy import text
    db = SessionLocal()
    try:
        t0 = time.perf_counter()
        db.execute(text("SELECT 1")).fetchone()
        ping_ms = round((time.perf_counter() - t0) * 1000, 2)
        return {
            "status": "healthy",
            "database": "PostgreSQL 17",
            "host": "46.247.108.191",
            "port": 30182,
            "ping_ms": ping_ms,
            "connected": True
        }
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "database_offline",
                "database": "PostgreSQL 17",
                "host": "46.247.108.191",
                "port": 30182,
                "connected": False,
                "error": str(e)
            }
        )
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
