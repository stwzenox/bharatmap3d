import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.models.entities import User, Building, Property

import uuid
client = TestClient(app)

def test_signup_citizen():
    email = f"citizen.{uuid.uuid4().hex[:6]}@test.com"
    res = client.post("/api/auth/signup", json={
        "name": "New Citizen User",
        "email": email,
        "password": "Password123!",
        "role": "citizen"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "citizen"
    assert data["status"] == "active"
    assert data["user_id"].startswith("CIT-")

def test_signup_admin_pending():
    email = f"officer.{uuid.uuid4().hex[:6]}@test.com"
    res = client.post("/api/auth/signup", json={
        "name": "Cadastral Inspector",
        "email": email,
        "password": "Password123!",
        "role": "admin"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "admin"
    assert data["status"] == "pending"
    assert data["user_id"].startswith("ADM-")

    # Try logging in before approval -> Should fail with 403
    login_res = client.post("/api/auth/login", json={
        "email": email,
        "password": "Password123!"
    })
    assert login_res.status_code == 403
    assert "pending" in login_res.json()["detail"].lower()

def test_superadmin_approval_workflow():
    # 1. Login as Super Admin
    sa_res = client.post("/api/auth/login", json={
        "email": "superadmin@cadastre.gov.in",
        "password": "SuperAdmin@2026"
    })
    assert sa_res.status_code == 200
    assert sa_res.json()["user"]["role"] == "superadmin"

    # 2. List Admins
    admins_res = client.get("/api/auth/admins")
    assert admins_res.status_code == 200
    admins = admins_res.json()
    assert len(admins) >= 2

    # 3. Find pending admin and approve
    pending_admin = next((a for a in admins if a["status"] == "pending"), None)
    assert pending_admin is not None

    appr_res = client.post(f"/api/auth/admins/{pending_admin['user_id']}/approve")
    assert appr_res.status_code == 200
    assert appr_res.json()["admin"]["status"] == "approved"

    # 4. Now the approved admin can log in!
    admin_login = client.post("/api/auth/login", json={
        "email": pending_admin["email"],
        "password": "Pending@2026" if pending_admin["email"] == "sharma.admin@gmail.com" else "Password123!"
    })
    assert admin_login.status_code == 200
    assert admin_login.json()["user"]["status"] == "approved"

def test_superadmin_dashboard_metrics():
    res = client.get("/api/auth/superadmin/dashboard")
    assert res.status_code == 200
    m = res.json()
    assert m["total_buildings"] >= 8
    assert m["registered_buildings"] >= 1
    assert m["total_parcels"] >= 15
    assert m["active_admins"] >= 1

def test_building_pipeline_creation():
    # Execute the 5-step 3D building creation pipeline
    res = client.post("/api/buildings/pipeline-create", json={
        "parcel_id": "P001",
        "building_type": "Digital Twin Commercial Hub",
        "height": 21.0,
        "floor_count": 7,
        "owner_name": "UP Infrastructure Development Board",
        "property_type": "Commercial Cadastral Suite",
        "data_source": "Drone Photogrammetry & LiDAR Point Cloud",
        "apartments_per_floor": 2
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "building" in data
    bldg = data["building"]
    assert bldg["floor_count"] == 7
    assert len(bldg["primary_ulpin"]) == 14
    assert bldg["primary_ulpin"].isalnum()
    assert len(data["floors"]) == 7
    assert len(data["properties"]) == 14 # 7 floors * 2 units
    assert "step_details" in data
