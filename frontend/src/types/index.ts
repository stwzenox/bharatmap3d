export interface Parcel {
  id: number;
  parcel_id: string;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
  area: number;
  land_use: string;
  survey_number: string;
  status: string;
}

export interface Building {
  id: number;
  building_id: string;
  parcel_id: string;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
  ground_elevation: number;
  roof_elevation: number;
  height: number;
  floor_count: number;
  building_type: string;
  building_name?: string;
  owner?: string;
  primary_ulpin?: string;
  area?: number;
  metadata_json?: Record<string, any>;
}

export interface Floor {
  id: number;
  floor_id: string;
  building_id: string;
  floor_number: number;
  z_min: number;
  z_max: number;
  area: number;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
}

export interface VerticalParcel {
  id: number;
  vertical_parcel_id: string;
  parcel_id: string;
  building_id: string;
  floor_id: string;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
  z_min: number;
  z_max: number;
  area: number;
  volume: number;
  property_type: string;
  owner_name?: string;
  unit_name?: string;
}

export interface PropertyRecord {
  id: number;
  property_id: string;
  ulpin: string;
  vertical_parcel_id: string;
  owner_name: string;
  property_type: string;
  status: string;
  verification_status: string;
}

export interface UndergroundAsset {
  id: number;
  asset_id: string;
  asset_type: string;
  geometry: {
    type: string;
    coordinates: any;
  };
  z_min: number;
  z_max: number;
  owner: string;
  status: string;
}

export interface GnssStation {
  id: number;
  station_id: string;
  latitude: float;
  longitude: float;
  elevation: float;
  accuracy: number;
}

export type float = number;

export interface ValidationResult {
  id: number;
  object_id: string;
  object_type: string;
  validation_type: string;
  severity: 'VALID' | 'WARNING' | 'ERROR';
  message: string;
  status: string;
}

export interface TerrainPoint {
  i: number;
  j: number;
  x: number;
  z: number;
  elevation: number;
}

export interface TerrainData {
  size: number;
  resolution: number;
  points: TerrainPoint[];
}

export interface LidarPoint {
  x: number;
  y: number;
  z: number;
  classification: string;
  class_code: number;
  intensity: number;
}

export interface DashboardMetrics {
  total_parcels: number;
  total_buildings: number;
  total_floors: number;
  total_vertical_properties: number;
  total_ulpins: number;
  underground_assets: number;
  validation_errors: number;
  validation_warnings: number;
}

export type UserRole = 'guest' | 'citizen' | 'admin' | 'superadmin';
export type UserStatus = 'active' | 'pending' | 'revoked' | 'rejected' | 'approved';

export interface User {
  user_id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  organization?: string;
  created_at?: string;
}

export interface AdminUser extends User {
  role: 'admin';
}

export interface SuperAdminMetrics {
  total_buildings: number;
  registered_buildings: number;
  total_parcels: number;
  total_vertical_properties: number;
  total_ulpins: number;
  active_admins: number;
  pending_admins: number;
  total_users: number;
}

export interface FloorPartitionUnit {
  unit_id: string;
  unit_name: string;
  owner_name: string;
  status: 'Purchased' | 'Unsold';
  property_type?: string;
  area_sqm?: number;
}

export interface FloorOwnerEntry {
  floor_number: number;
  floor_label: string;
  unit_code: string;
  owner_name: string;
  status: 'Purchased' | 'Unsold';
  z_min: number;
  z_max: number;
  property_type?: string;
  ulpin?: string;
  has_partitions?: boolean;
  partition_count?: number;
  units?: FloorPartitionUnit[];
}

export interface DroneViewMetadata {
  mode: 'manual' | 'auto';
  filename?: string;
  preview_url?: string;
  gsd?: string;
  altitude?: string;
  timestamp?: string;
  source_layer?: string;
}

export interface BuildingPipelineInput {
  parcel_id: string;
  building_name: string;
  building_type: string;
  floor_count: number;
  height_per_floor: number;
  data_sources: string[];
  officer_name: string;
  officer_notes: string;
  owner_name: string;
  property_type: string;
  status: string;
  has_partitions?: boolean;
  apartments_per_floor?: number;
  survey_number?: string;
  land_use?: string;
  height?: number;
  custom_geometry?: {
    type: string;
    coordinates: number[][][];
  };
  land_owner_name?: string;
  land_owner_id?: string;
  land_owner_contact?: string;
  land_deed_ref?: string;
  auto_assign_unsold_to_land_owner?: boolean;
  floor_owners?: FloorOwnerEntry[];
  drone_view_data?: DroneViewMetadata;
}


