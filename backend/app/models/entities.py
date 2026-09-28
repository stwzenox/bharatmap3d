from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.session import Base
import json

class Parcel(Base):
    __tablename__ = "parcels"

    id = Column(Integer, primary_key=True, index=True)
    parcel_id = Column(String(50), unique=True, index=True, nullable=False)
    geometry = Column(JSON, nullable=False)  # GeoJSON dict
    area = Column(Float, nullable=False)      # square meters
    land_use = Column(String(50), default="Residential")
    survey_number = Column(String(50), nullable=False)
    status = Column(String(50), default="Active")

    # Relationships
    buildings = relationship("Building", back_populates="parcel", cascade="all, delete-orphan")
    vertical_parcels = relationship("VerticalParcel", back_populates="parcel")

class Building(Base):
    __tablename__ = "buildings"

    id = Column(Integer, primary_key=True, index=True)
    building_id = Column(String(50), unique=True, index=True, nullable=False)
    parcel_id = Column(String(50), ForeignKey("parcels.parcel_id"), nullable=False)
    geometry = Column(JSON, nullable=False)  # GeoJSON polygon dict
    ground_elevation = Column(Float, nullable=False, default=100.0)
    roof_elevation = Column(Float, nullable=False, default=115.0)
    height = Column(Float, nullable=False, default=15.0)
    floor_count = Column(Integer, nullable=False, default=5)
    building_type = Column(String(50), default="Residential")
    building_name = Column(String(255), nullable=True)
    owner = Column(String(255), nullable=True)
    primary_ulpin = Column(String(50), nullable=True)
    metadata_json = Column(JSON, nullable=True)

    # Relationships
    parcel = relationship("Parcel", back_populates="buildings")
    floors = relationship("Floor", back_populates="building", cascade="all, delete-orphan")
    vertical_parcels = relationship("VerticalParcel", back_populates="building")

class Floor(Base):
    __tablename__ = "floors"

    id = Column(Integer, primary_key=True, index=True)
    floor_id = Column(String(50), unique=True, index=True, nullable=False)
    building_id = Column(String(50), ForeignKey("buildings.building_id"), nullable=False)
    floor_number = Column(Integer, nullable=False)
    z_min = Column(Float, nullable=False)
    z_max = Column(Float, nullable=False)
    area = Column(Float, nullable=False)
    geometry = Column(JSON, nullable=False)

    # Relationships
    building = relationship("Building", back_populates="floors")
    vertical_parcels = relationship("VerticalParcel", back_populates="floor")

class VerticalParcel(Base):
    __tablename__ = "vertical_parcels"

    id = Column(Integer, primary_key=True, index=True)
    vertical_parcel_id = Column(String(50), unique=True, index=True, nullable=False)
    parcel_id = Column(String(50), ForeignKey("parcels.parcel_id"), nullable=False)
    building_id = Column(String(50), ForeignKey("buildings.building_id"), nullable=False)
    floor_id = Column(String(50), ForeignKey("floors.floor_id"), nullable=False)
    geometry = Column(JSON, nullable=False)
    z_min = Column(Float, nullable=False)
    z_max = Column(Float, nullable=False)
    area = Column(Float, nullable=False)
    volume = Column(Float, nullable=False)
    property_type = Column(String(50), default="Apartment")

    # Relationships
    parcel = relationship("Parcel", back_populates="vertical_parcels")
    building = relationship("Building", back_populates="vertical_parcels")
    floor = relationship("Floor", back_populates="vertical_parcels")
    property_record = relationship("Property", back_populates="vertical_parcel", uselist=False)

class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(String(50), unique=True, index=True, nullable=False)
    ulpin = Column(String(100), unique=True, index=True, nullable=False)
    vertical_parcel_id = Column(String(50), ForeignKey("vertical_parcels.vertical_parcel_id"), nullable=False)
    owner_name = Column(String(100), nullable=False)
    property_type = Column(String(50), default="Residential Unit")
    status = Column(String(50), default="Registered")
    verification_status = Column(String(50), default="Verified Cadastral Record")

    # Relationships
    vertical_parcel = relationship("VerticalParcel", back_populates="property_record")

class UndergroundAsset(Base):
    __tablename__ = "underground_assets"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(String(50), unique=True, index=True, nullable=False)
    asset_type = Column(String(50), nullable=False) # e.g., Basement, Gas Pipeline, Water Main
    geometry = Column(JSON, nullable=False)
    z_min = Column(Float, nullable=False)
    z_max = Column(Float, nullable=False)
    owner = Column(String(100), default="Municipal Utility")
    status = Column(String(50), default="Active")

class GnssStation(Base):
    __tablename__ = "gnss_stations"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(String(50), unique=True, index=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    elevation = Column(Float, nullable=False)
    accuracy = Column(Float, nullable=False, default=0.03)

class ValidationResult(Base):
    __tablename__ = "validation_results"

    id = Column(Integer, primary_key=True, index=True)
    object_id = Column(String(50), nullable=False)
    object_type = Column(String(50), nullable=False) # Parcel, Building, Floor, Property
    validation_type = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False) # VALID, WARNING, ERROR
    message = Column(Text, nullable=False)
    status = Column(String(50), default="Active")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="citizen", nullable=False) # citizen, admin, superadmin
    status = Column(String(20), default="active", nullable=False) # active, pending, approved, rejected
    organization = Column(String(100), default="Public Citizen")
    created_at = Column(String(50), nullable=True)

