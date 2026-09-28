from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict

# Parcel Schemas
class ParcelBase(BaseModel):
    parcel_id: str
    geometry: Dict[str, Any]
    area: float
    land_use: str = "Residential"
    survey_number: str
    status: str = "Active"

class ParcelCreate(ParcelBase):
    pass

class ParcelResponse(ParcelBase):
    id: int
    class Config:
        from_attributes = True

# Building Schemas
class BuildingBase(BaseModel):
    building_id: str
    parcel_id: str
    geometry: Dict[str, Any]
    ground_elevation: float
    roof_elevation: float
    height: float
    floor_count: int
    building_type: str = "Residential"
    building_name: Optional[str] = None
    owner: Optional[str] = None
    primary_ulpin: Optional[str] = None

class BuildingCreate(BuildingBase):
    pass

class BuildingResponse(BuildingBase):
    id: int
    class Config:
        from_attributes = True

class BuildingOwnerUpdateRequest(BaseModel):
    owner_name: Optional[str] = None
    building_name: Optional[str] = None
    building_type: Optional[str] = None
    land_owner_contact: Optional[str] = None
    land_owner_id: Optional[str] = None
    land_deed_ref: Optional[str] = None
    tax_assessment_id: Optional[str] = None
    registry_status: Optional[str] = None
    update_child_properties: Optional[bool] = True

# Floor Schemas
class FloorBase(BaseModel):
    floor_id: str
    building_id: str
    floor_number: int
    z_min: float
    z_max: float
    area: float
    geometry: Dict[str, Any]

class FloorCreate(FloorBase):
    pass

class FloorResponse(FloorBase):
    id: int
    class Config:
        from_attributes = True

# Vertical Parcel Schemas
class VerticalParcelBase(BaseModel):
    vertical_parcel_id: str
    parcel_id: str
    building_id: str
    floor_id: str
    geometry: Dict[str, Any]
    z_min: float
    z_max: float
    area: float
    volume: float
    property_type: str = "Apartment"

class VerticalParcelCreate(VerticalParcelBase):
    pass

class VerticalParcelResponse(VerticalParcelBase):
    id: int
    class Config:
        from_attributes = True

# Property Schemas
class PropertyBase(BaseModel):
    property_id: str
    ulpin: str
    vertical_parcel_id: str
    owner_name: str
    property_type: str = "Residential Unit"
    status: str = "Registered"
    verification_status: str = "Verified Cadastral Record"

class PropertyCreate(PropertyBase):
    pass

class PropertyResponse(PropertyBase):
    id: int
    class Config:
        from_attributes = True

# Underground Asset Schemas
class UndergroundAssetBase(BaseModel):
    asset_id: str
    asset_type: str
    geometry: Dict[str, Any]
    z_min: float
    z_max: float
    owner: str = "Municipal Utility"
    status: str = "Active"

class UndergroundAssetCreate(UndergroundAssetBase):
    pass

class UndergroundAssetResponse(UndergroundAssetBase):
    id: int
    class Config:
        from_attributes = True

# GNSS Station Schemas
class GnssStationBase(BaseModel):
    station_id: str
    latitude: float
    longitude: float
    elevation: float
    accuracy: float = 0.03

class GnssStationCreate(GnssStationBase):
    pass

class GnssStationResponse(GnssStationBase):
    id: int
    class Config:
        from_attributes = True

# Validation Schemas
class ValidationResultResponse(BaseModel):
    id: int
    object_id: str
    object_type: str
    validation_type: str
    severity: str
    message: str
    status: str
    class Config:
        from_attributes = True

# ULPIN Generation
class UlpinGenerateRequest(BaseModel):
    building_id: str
    floor_id: str
    property_id: str
    owner_name: Optional[str] = "Govt Allocated Citizen"
    property_type: Optional[str] = "Residential Unit"

class UlpinGenerateResponse(BaseModel):
    ulpin: str
    property_id: str
    vertical_parcel_id: str
    message: str
    created: bool

# Dashboard Summary
class DashboardMetrics(BaseModel):
    total_parcels: int
    total_buildings: int
    total_floors: int
    total_vertical_properties: int
    total_ulpins: int
    underground_assets: int
    validation_errors: int
    validation_warnings: int

# Auth Schemas
class UserSignup(BaseModel):
    name: str
    email: str
    password: str
    role: str = "citizen" # "citizen" or "admin"
    organization: Optional[str] = "Municipal Cadastre"

class UserLogin(BaseModel):
    email: str
    password: Optional[str] = "DemoAdminPass123"

class UserResponse(BaseModel):
    id: int
    user_id: str
    name: str
    email: str
    role: str
    status: str
    organization: Optional[str] = None
    created_at: Optional[str] = None

class AdminApprovalRequest(BaseModel):
    admin_id: str
    action: str = "approve" # "approve" or "reject"

class SuperAdminMetrics(BaseModel):
    total_buildings: int
    registered_buildings: int
    total_parcels: int
    total_vertical_properties: int
    total_ulpins: int
    active_admins: int
    pending_admins: int

# 5-Step 3D Building Creation Pipeline Schema
class BuildingPipelineCreateRequest(BaseModel):
    parcel_id: str
    building_id: Optional[str] = None
    building_type: str = "Residential Complex"
    height: float = 18.0
    floor_count: int = 6
    ground_elevation: Optional[float] = 100.0
    owner_name: str = "Civil Lines Land Holdings"
    property_type: str = "3D Cadastral Property"
    data_source: str = "Drone LiDAR Survey"
    custom_geometry: Optional[Dict[str, Any]] = None
    has_partitions: Optional[bool] = False
    apartments_per_floor: Optional[int] = 1
    building_name: Optional[str] = None
    land_owner_name: Optional[str] = None
    land_owner_id: Optional[str] = None
    land_owner_contact: Optional[str] = None
    land_deed_ref: Optional[str] = None
    auto_assign_unsold_to_land_owner: Optional[bool] = True
    floor_owners: Optional[List[Dict[str, Any]]] = None
    drone_view_data: Optional[Dict[str, Any]] = None


