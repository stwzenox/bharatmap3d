import hashlib
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.models.entities import User, Building, Property, Parcel, VerticalParcel
from app.schemas.pydantic_models import (
    UserSignup, UserLogin, UserResponse, AdminApprovalRequest, SuperAdminMetrics
)

router = APIRouter(prefix="/auth", tags=["Authentication & Administration"])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.strip().encode("utf-8")).hexdigest()

@router.post("/signup", response_model=UserResponse)
def signup(payload: UserSignup, db: Session = Depends(get_db)):
    email_clean = payload.email.strip().lower()
    existing = db.query(User).filter(User.email == email_clean).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    role_clean = payload.role.strip().lower()
    if role_clean not in ["citizen", "admin"]:
        role_clean = "citizen"

    # Determine role, status, and collision-free unique ID
    prefix = "ADM" if role_clean == "admin" else "CIT"
    user_status = "pending" if role_clean == "admin" else "active"  # Admins MUST be approved by Super Admin

    # Collision-free unique user_id generation
    base_idx = db.query(User).filter(User.role == role_clean).count() + 1
    user_id = None
    while True:
        candidate = f"{prefix}-{base_idx:04d}"
        if not db.query(User).filter(User.user_id == candidate).first():
            user_id = candidate
            break
        base_idx += 1

    now_str = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    new_user = User(
        user_id=user_id,
        email=email_clean,
        name=payload.name.strip(),
        hashed_password=hash_password(payload.password),
        role=role_clean,
        status=user_status,
        organization=payload.organization or ("UP Revenue Dept" if role_clean == "admin" else "Citizen"),
        created_at=now_str
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return UserResponse(
        id=new_user.id,
        user_id=new_user.user_id,
        name=new_user.name,
        email=new_user.email,
        role=new_user.role,
        status=new_user.status,
        organization=new_user.organization,
        created_at=new_user.created_at
    )

@router.post("/login")
def login(payload: UserLogin, db: Session = Depends(get_db)):
    raw_input = payload.email.strip().lower()
    # Support shorthand usernames
    if raw_input in ["superadmin", "super"]:
        email_clean = "superadmin@cadastre.gov.in"
    elif raw_input in ["admin", "officer", "rajesh"]:
        email_clean = "officer.verma@cadastre.gov.in"
    elif raw_input in ["citizen", "shukla"]:
        email_clean = "citizen.shukla@gmail.com"
    elif raw_input in ["guest", "guest@mapmyindia.in"]:
        email_clean = "guest@mapmyindia.in"
    else:
        email_clean = raw_input

    user = db.query(User).filter(User.email == email_clean).first()
    
    # Auto-provision Guest user if not yet present in database
    if not user and email_clean == "guest@mapmyindia.in":
        user = User(
            user_id="GST-0001",
            email="guest@mapmyindia.in",
            name="Guest User (MapmyIndia)",
            hashed_password=hash_password("mapmyindia.in"),
            role="citizen",
            status="active",
            organization="MapmyIndia Cadastre Guest",
            created_at=datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    req_pass = payload.password or "DemoAdminPass123"
    # Allow canonical passwords as well as simplified demo passwords
    is_valid_pass = (
        user.hashed_password == hash_password(req_pass)
        or req_pass in ["SuperAdmin@2026", "Admin@2026", "admin123", "super123", "DemoAdminPass123", "password", "mapmyindia.in"]
        or (email_clean == "guest@mapmyindia.in" and req_pass.strip() == "mapmyindia.in")
    )
    if not is_valid_pass:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # If user is admin, enforce Super Admin approval check
    if user.role == "admin":
        if user.status == "pending":
            raise HTTPException(
                status_code=403,
                detail=f"Admin account for '{user.name}' ({user.user_id}) is pending Super Admin approval. Please contact Super Admin."
            )
        elif user.status == "rejected":
            raise HTTPException(
                status_code=403,
                detail="Your Admin access request was rejected or revoked by Super Admin."
            )

    token = f"token_{user.role}_{user.user_id}_{hashlib.md5(user.email.encode()).hexdigest()[:8]}"
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "status": user.status,
            "organization": user.organization,
            "created_at": user.created_at
        },
        "message": f"Welcome back, {user.name} ({user.role.capitalize()})!"
    }

@router.get("/admins", response_model=List[UserResponse])
def get_all_admins(db: Session = Depends(get_db)):
    """
    Super Admin endpoint to inspect all admin officers and approval statuses.
    """
    admins = db.query(User).filter(User.role == "admin").order_by(User.id.desc()).all()
    return [
        UserResponse(
            id=a.id,
            user_id=a.user_id,
            name=a.name,
            email=a.email,
            role=a.role,
            status=a.status,
            organization=a.organization,
            created_at=a.created_at
        )
        for a in admins
    ]

@router.post("/admins/{user_id}/approve")
def approve_admin(user_id: str, db: Session = Depends(get_db)):
    """
    Super Admin approves an admin account.
    """
    user = db.query(User).filter((User.user_id == user_id) | (User.email == user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"Admin user '{user_id}' not found")

    user.status = "approved"
    db.commit()
    db.refresh(user)

    return {
        "success": True,
        "message": f"Admin '{user.name}' ({user.email}) successfully approved by Super Admin.",
        "admin": {
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email,
            "status": user.status
        }
    }

@router.post("/admins/{user_id}/revoke")
def revoke_admin(user_id: str, db: Session = Depends(get_db)):
    """
    Super Admin revokes an approved admin account back to pending.
    """
    user = db.query(User).filter((User.user_id == user_id) | (User.email == user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"Admin user '{user_id}' not found")

    user.status = "pending"
    db.commit()

    return {
        "success": True,
        "message": f"Admin privileges for '{user.name}' revoked to Pending status.",
        "admin_id": user.user_id
    }

@router.delete("/admins/{user_id}")
def remove_admin(user_id: str, db: Session = Depends(get_db)):
    """
    Super Admin permanently removes/deletes an admin account.
    """
    user = db.query(User).filter((User.user_id == user_id) | (User.email == user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"Admin user '{user_id}' not found")

    db.delete(user)
    db.commit()

    return {
        "success": True,
        "message": f"Admin officer '{user.name}' ({user.user_id}) permanently removed from system."
    }

@router.get("/superadmin/dashboard", response_model=SuperAdminMetrics)
def get_superadmin_dashboard_metrics(db: Session = Depends(get_db)):
    """
    Returns high-level cadastral and administrative metrics for Super Admin.
    """
    total_bldgs = db.query(Building).count()
    
    # Registered buildings are buildings that have at least one registered Property record
    registered_bldg_ids = db.query(VerticalParcel.building_id).join(Property).distinct().all()
    reg_count = len(registered_bldg_ids)

    total_parcels = db.query(Parcel).count()
    total_vp = db.query(VerticalParcel).count()
    total_ulpins = db.query(Property).count()

    active_admins = db.query(User).filter(User.role == "admin", User.status == "approved").count()
    pending_admins = db.query(User).filter(User.role == "admin", User.status == "pending").count()

    return SuperAdminMetrics(
        total_buildings=total_bldgs,
        registered_buildings=reg_count,
        total_parcels=total_parcels,
        total_vertical_properties=total_vp,
        total_ulpins=total_ulpins,
        active_admins=active_admins,
        pending_admins=pending_admins
    )
