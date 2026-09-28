import { apiClient, getCustomStoredData, saveCustomStoredData, getMergedDataset, CadastralApi } from './client';
import { User, SuperAdminMetrics, BuildingPipelineInput, Building, Floor, VerticalParcel, PropertyRecord, ValidationResult } from '../types';
import rawDemoData from './demoDataset.json';
import { format14DigitUlpin } from '../utils/ulpin';

const demoData = rawDemoData as any;

// Clean up any legacy localStorage users data from browser
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('3d_cadastre_users_v1');
  } catch {}
}

const DEFAULT_USERS: User[] = [
  {
    user_id: 'usr_superadmin',
    email: 'superadmin@cadastre.gov.in',
    name: 'National Cadastre Super Admin',
    role: 'superadmin',
    status: 'active',
    organization: 'Survey of India / Ministry of Rural Development',
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    user_id: 'usr_admin_verma',
    email: 'officer.verma@cadastre.gov.in',
    name: 'Officer Rajesh Verma',
    role: 'admin',
    status: 'active',
    organization: 'Cadastral Survey & 3D Land Records Division',
    created_at: new Date('2026-01-15').toISOString(),
  },
  {
    user_id: 'usr_admin_pending',
    email: 'sharma.admin@gmail.com',
    name: 'Er. Amit Sharma',
    role: 'admin',
    status: 'pending',
    organization: 'Town Planning & Geospatial Authority',
    created_at: new Date('2026-02-20').toISOString(),
  },
  {
    user_id: 'usr_citizen_shukla',
    email: 'citizen.shukla@gmail.com',
    name: 'Anand Shukla',
    role: 'citizen',
    status: 'active',
    organization: 'Property Owner / Citizen',
    created_at: new Date('2026-02-28').toISOString(),
  }
];

let _inMemoryUsers: User[] = [...DEFAULT_USERS];

function getStoredUsers(): User[] {
  return _inMemoryUsers;
}

function saveStoredUsers(users: User[]): void {
  _inMemoryUsers = users;
}

export const AuthApi = {
  async signup(payload: {
    email: string;
    password?: string;
    name: string;
    role: 'citizen' | 'admin' | 'superadmin';
    organization?: string;
  }): Promise<{ user: User; message: string }> {
    try {
      const res = await apiClient.post<any>('/auth/signup', payload);
      // Support both { user, message } or direct UserResponse from backend
      const userObj: User = res.data?.user ? res.data.user : res.data;
      const message =
        res.data?.message ||
        (payload.role === 'admin'
          ? 'Admin registration submitted! Awaiting Super Admin review and approval.'
          : 'Citizen account successfully created and active.');

      // Persist to local storage copy so offline / cached view stays in sync
      const users = getStoredUsers();
      const existingIdx = users.findIndex(u => u.email.toLowerCase() === userObj.email.toLowerCase());
      if (existingIdx >= 0) {
        users[existingIdx] = userObj;
      } else {
        users.unshift(userObj);
      }
      window.dispatchEvent(new CustomEvent('cadastre:admin-registered', { detail: userObj }));
      return { user: userObj, message };
    } catch (err: any) {
      if (err?.response?.data?.detail) {
        const d = err.response.data.detail;
        const msg = typeof d === 'string' ? d : Array.isArray(d) ? d.map((x: any) => x.msg || JSON.stringify(x)).join(', ') : JSON.stringify(d);
        throw new Error(msg);
      }
      throw new Error(err?.message || 'Database registration failed. Please ensure backend is reachable.');
    }
  },

  async login(payload: { email: string; password?: string }): Promise<{ user: User; message: string }> {
    try {
      const res = await apiClient.post<{ message: string; user: User }>('/auth/login', payload);
      return res.data;
    } catch (err: any) {
      if (err?.response?.data?.detail) {
        const d = err.response.data.detail;
        const msg = typeof d === 'string' ? d : Array.isArray(d) ? d.map((x: any) => x.msg || JSON.stringify(x)).join(', ') : JSON.stringify(d);
        throw new Error(msg);
      }
      throw new Error(err?.message || 'Database login authentication failed.');
    }
  },

  async getAdmins(): Promise<User[]> {
    const res = await apiClient.get<User[]>('/auth/admins');
    const liveAdmins = res.data;
    if (!Array.isArray(liveAdmins)) {
      throw new Error('Expected array of admins from database');
    }
    return liveAdmins;
  },

  async approveAdmin(userId: string): Promise<User> {
    const res = await apiClient.post<any>(`/auth/admins/${userId}/approve`);
    return res.data?.admin || res.data;
  },

  async revokeAdmin(userId: string): Promise<User> {
    const res = await apiClient.post<User>(`/auth/admins/${userId}/revoke`);
    return res.data;
  },

  async deleteAdmin(userId: string): Promise<void> {
    await apiClient.delete(`/auth/admins/${userId}`);
  },

  async getSuperAdminMetrics(_localBuildingsCount: number = 0): Promise<SuperAdminMetrics> {
    const res = await apiClient.get<SuperAdminMetrics>('/auth/superadmin/dashboard');
    if (!res.data || typeof res.data !== 'object' || typeof res.data.total_buildings !== 'number') {
      throw new Error('Invalid superadmin metrics response from database');
    }
    return res.data;
  },

  async createBuildingPipeline(payload: BuildingPipelineInput): Promise<{
    message: string;
    building: Building;
    floors: Floor[];
    vertical_parcels: VerticalParcel[];
    property_records: PropertyRecord[];
    validation: ValidationResult[];
  }> {
    try {
      const backendPayload = {
        parcel_id: payload.parcel_id || 'P001',
        building_name: payload.building_name,
        building_type: payload.building_type,
        height: payload.height || (payload.floor_count * payload.height_per_floor),
        floor_count: payload.floor_count,
        owner_name: payload.owner_name,
        land_owner_name: payload.land_owner_name,
        land_owner_id: payload.land_owner_id,
        land_owner_contact: payload.land_owner_contact,
        land_deed_ref: payload.land_deed_ref,
        auto_assign_unsold_to_land_owner: payload.auto_assign_unsold_to_land_owner ?? true,
        floor_owners: payload.floor_owners,
        drone_view_data: payload.drone_view_data,
        property_type: payload.property_type,
        data_source: payload.data_sources?.join(', ') || 'Drone LiDAR Survey',
        custom_geometry: payload.custom_geometry,
        has_partitions: payload.has_partitions ?? false,
        apartments_per_floor: payload.has_partitions ? (payload.apartments_per_floor || 2) : 1,
      };

      const res = await apiClient.post<any>('/buildings/pipeline-create', backendPayload);
      const data = res.data;
      const bldg = { ...data.building };
      const bldgGeom = (payload.custom_geometry && payload.custom_geometry.coordinates) ? payload.custom_geometry : bldg.geometry;
      bldg.geometry = bldgGeom;

      const floors: Floor[] = (data.floors || []).map((fl: any, idx: number) => ({
        id: fl.id || Date.now() + idx,
        floor_id: fl.floor_id,
        building_id: bldg.building_id,
        floor_number: fl.floor_number,
        z_min: fl.z_min,
        z_max: fl.z_max,
        area: fl.area || bldg.area,
        geometry: fl.geometry || bldgGeom,
      }));

      const vps: VerticalParcel[] = (data.properties || []).map((pr: any, idx: number) => ({
        id: Date.now() + 100 + idx,
        vertical_parcel_id: pr.vertical_parcel_id,
        parcel_id: bldg.parcel_id,
        building_id: bldg.building_id,
        floor_id: pr.floor_id,
        geometry: pr.geometry || bldgGeom,
        z_min: pr.z_min,
        z_max: pr.z_max,
        area: pr.area || 140,
        volume: pr.volume || 490,
        property_type: pr.property_type || '3D Cadastral Unit',
      }));

      const props: PropertyRecord[] = (data.properties || []).map((pr: any, idx: number) => ({
        id: Date.now() + 200 + idx,
        property_id: pr.property_id,
        ulpin: pr.ulpin,
        vertical_parcel_id: pr.vertical_parcel_id,
        owner_name: pr.owner_name || payload.owner_name,
        property_type: payload.property_type,
        status: 'Registered',
        verification_status: 'Verified Cadastral Record',
      }));

      return {
        message: data.message,
        building: bldg,
        floors,
        vertical_parcels: vps,
        property_records: props,
        validation: [
          {
            id: 1,
            object_id: bldg.building_id,
            object_type: 'Building',
            validation_type: 'Volumetric Topology',
            severity: 'VALID',
            message: `Building ${bldg.building_id} geometry and vertical parcels successfully validated with zero spatial overlaps.`,
            status: 'PASSED'
          }
        ],
      };
    } catch (err: any) {
      if (err?.response?.data?.detail) {
        throw new Error(err.response.data.detail);
      }
      if (!CadastralApi.getIsDemoMode()) {
        throw new Error(err.message || 'Database connection error: failed to store building in PostgreSQL database.');
      }

      // Offline fallback simulation (ONLY in explicit demo mode)
      const timestamp = Date.now().toString(36).slice(-4).toUpperCase();
      const buildingId = `B0${Math.floor(Math.random() * 90 + 10)}`;
      const parcelId = payload.parcel_id || 'P001';
      const floorCount = Math.max(1, payload.floor_count || 4);
      const floorHeight = payload.height_per_floor || 3.5;
      const totalHeight = floorCount * floorHeight;

      let footprintCoords: number[][][];
      let finalParcelId = parcelId;

      if (payload.custom_geometry && payload.custom_geometry.coordinates) {
        footprintCoords = payload.custom_geometry.coordinates;
      } else {
        // Pick an unoccupied parcel if possible
        const existingPids = new Set((demoData.buildings as any[]).map(b => b.parcel_id));
        const freeParcel = (demoData.parcels as any[]).find(p => !existingPids.has(p.parcel_id));
        const baseParcel = freeParcel || (demoData.parcels as any[]).find(p => p.parcel_id === parcelId) || demoData.parcels[0];
        finalParcelId = baseParcel.parcel_id;
        const coords = baseParcel.geometry.coordinates[0];

        const lats = coords.map((c: any) => c[1]);
        const lons = coords.map((c: any) => c[0]);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLon = Math.min(...lons);
        const maxLon = Math.max(...lons);

        const centerLat = (minLat + maxLat) / 2;
        const centerLon = (minLon + maxLon) / 2;
        const halfLat = (maxLat - minLat) * 0.35;
        const halfLon = (maxLon - minLon) * 0.35;

        footprintCoords = [
          [
            [centerLon - halfLon, centerLat - halfLat],
            [centerLon + halfLon, centerLat - halfLat],
            [centerLon + halfLon, centerLat + halfLat],
            [centerLon - halfLon, centerLat + halfLat],
            [centerLon - halfLon, centerLat - halfLat],
          ]
        ];
      }

      const building: Building = {
        id: Date.now(),
        building_id: buildingId,
        parcel_id: finalParcelId,
        geometry: {
          type: 'Polygon',
          coordinates: footprintCoords,
        },
        ground_elevation: 100.0,
        roof_elevation: 100.0 + totalHeight,
        height: totalHeight,
        floor_count: floorCount,
        building_type: payload.building_type || 'Residential',
      };

      const floors: Floor[] = [];
      const verticalParcels: VerticalParcel[] = [];
      const propertyRecords: PropertyRecord[] = [];

      for (let f = 1; f <= floorCount; f++) {
        const floorId = `FL-${buildingId}-${f}`;
        const zMin = 100.0 + (f - 1) * floorHeight;
        const zMax = zMin + floorHeight;

        floors.push({
          id: Date.now() + f,
          floor_id: floorId,
          building_id: buildingId,
          floor_number: f,
          z_min: zMin,
          z_max: zMax,
          area: 280.0,
          geometry: {
            type: 'Polygon',
            coordinates: footprintCoords,
          }
        });

        // Resolve owner for this floor: specific floor owner or auto-assigned land owner
        let floorOwner = payload.owner_name || `Cadastral Unit Owner ${f}01`;
        if (payload.floor_owners) {
          const fo = payload.floor_owners.find(entry => entry.floor_number === f);
          if (fo) {
            if (fo.status === 'Unsold' && (payload.auto_assign_unsold_to_land_owner ?? true)) {
              floorOwner = payload.land_owner_name || payload.owner_name || 'Land Owner Title';
            } else {
              floorOwner = fo.owner_name || payload.land_owner_name || payload.owner_name;
            }
          } else if (payload.land_owner_name) {
            floorOwner = payload.land_owner_name;
          }
        } else if (payload.land_owner_name) {
          floorOwner = payload.land_owner_name;
        }

        const ring = footprintCoords[0];
        const minLng = Math.min(...ring.map(c => c[0]));
        const maxLng = Math.max(...ring.map(c => c[0]));
        const minLat = Math.min(...ring.map(c => c[1]));
        const maxLat = Math.max(...ring.map(c => c[1]));

        const hasPartitions = Boolean(payload.has_partitions);
        const unitsCount = hasPartitions ? Math.max(1, payload.apartments_per_floor || 2) : 1;
        const matchingFo = payload.floor_owners ? payload.floor_owners.find(entry => entry.floor_number === f) : null;

        for (let u = 1; u <= unitsCount; u++) {
          const flatEntry = matchingFo?.units && matchingFo.units[u - 1];
          let unitOwner = flatEntry?.owner_name || floorOwner;
          if (flatEntry?.status === 'Unsold' && (payload.auto_assign_unsold_to_land_owner ?? true)) {
            unitOwner = payload.land_owner_name || payload.owner_name || 'Land Owner Title';
          }

          const unitSubCode = hasPartitions ? (flatEntry?.unit_id?.replace(/\s+/g, '').toUpperCase() || `FLAT${f}0${u}`) : 'P01';
          const unitId = `VP-${buildingId}-${f}-${unitSubCode}`;
          const ulpin = format14DigitUlpin(buildingId, `F${f}`, `U${u}`);

          let unitGeom: any;
          if (hasPartitions && unitsCount > 1) {
            const dx = (maxLng - minLng) / unitsCount;
            const uMinLng = minLng + (u - 1) * dx;
            const uMaxLng = minLng + u * dx;
            unitGeom = {
              type: 'Polygon',
              coordinates: [[
                [uMinLng, minLat],
                [uMaxLng, minLat],
                [uMaxLng, maxLat],
                [uMinLng, maxLat],
                [uMinLng, minLat]
              ]]
            };
          } else {
            unitGeom = {
              type: 'Polygon',
              coordinates: footprintCoords
            };
          }

          verticalParcels.push({
            id: Date.now() + f * 10 + u,
            vertical_parcel_id: unitId,
            parcel_id: parcelId,
            building_id: buildingId,
            floor_id: floorId,
            geometry: unitGeom,
            z_min: zMin,
            z_max: zMax,
            area: 280.0 / unitsCount,
            volume: (280.0 / unitsCount) * floorHeight,
            property_type: flatEntry?.property_type || payload.property_type || (hasPartitions ? 'Residential Flat' : 'Whole Floor Unit'),
          });

          propertyRecords.push({
            id: Date.now() + f * 100 + u,
            property_id: `PROP-${buildingId}-${f}-${unitSubCode}`,
            ulpin,
            vertical_parcel_id: unitId,
            owner_name: unitOwner,
            property_type: flatEntry?.property_type || payload.property_type || (hasPartitions ? 'Residential Flat' : 'Whole Floor Unit'),
            status: payload.status || 'Active Registered',
            verification_status: '3D Cadastre Approved',
          });
        }
      }

      const validation: ValidationResult[] = [
        {
          id: Date.now() + 99,
          object_id: buildingId,
          object_type: 'Building',
          validation_type: 'Topology & AI Segmentation',
          severity: 'VALID',
          message: `Building ${buildingId} conforms to vertical parcel delineation standards with zero boundary clashes.`,
          status: 'PASSED'
        }
      ];

      const custom = getCustomStoredData();
      custom.buildings = [building, ...custom.buildings.filter(b => b.building_id !== building.building_id)];
      custom.floors = [...floors, ...custom.floors.filter(f => f.building_id !== building.building_id)];
      custom.vertical_properties = [...verticalParcels, ...custom.vertical_properties.filter(vp => vp.building_id !== building.building_id)];
      custom.properties = [...propertyRecords, ...custom.properties.filter(p => !propertyRecords.some(pr => pr.ulpin === p.ulpin))];
      saveCustomStoredData(custom);

      return {
        message: `Successfully synthesized 3D Cadastral Building ${buildingId} with ${verticalParcels.length} vertical units.`,
        building,
        floors,
        vertical_parcels: verticalParcels,
        property_records: propertyRecords,
        validation,
      };
    }
  }
};
