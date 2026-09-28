import { Building, Parcel, VerticalParcel, PropertyRecord } from '../types';
import { ORIGIN_LAT, ORIGIN_LNG } from './coordinates';
import { format14DigitUlpin } from './ulpin';

export type MainCategory = 'residential' | 'hospital' | 'school' | 'commercial' | 'civic' | 'unregistered_buildings' | 'unregistered_land';

export interface CategorizedBuilding {
  building_id: string;
  name: string;
  category: 'residential' | 'hospital' | 'school' | 'commercial' | 'civic';
  categoryLabel: string;
  building_type: string;
  isRegistered: boolean;
  ulpin: string | null;
  floor_count: number;
  height: number;
  plot_area: number;
  built_up_area: number;
  parcel_id: string;
  survey_number: string;
  owner: string;
  address: string;
  coordinates: [number, number];
  unregisteredReason?: string;
  cadastralRisk?: 'High' | 'Moderate' | 'Low';
  missingDocs?: string[];
  unitCount?: number;
  specialty?: string;
  image_url?: string;
  facilityDetails?: string;
  studentCount?: number;
  landAreaAcres?: number;
}

export interface CategorizedLand {
  parcel_id: string;
  survey_number: string;
  land_use: string;
  category: 'residential' | 'hospital' | 'school' | 'commercial' | 'civic' | 'unregistered';
  categoryLabel: string;
  area_sqm: number;
  area_acres: number;
  isRegistered: boolean;
  status: string;
  owner: string;
  coordinates: [number, number];
  unregisteredReason?: string;
  cadastralRisk?: 'High' | 'Moderate' | 'Low';
  disputeType?: string;
  actionRequired?: string;
}

export interface CategoriesSummary {
  residential: {
    count: number;
    registered: number;
    unregistered: number;
    units: number;
    buildings: CategorizedBuilding[];
  };
  hospital: {
    count: number;
    registered: number;
    unregistered: number;
    emergencyFacilities: number;
    buildings: CategorizedBuilding[];
  };
  school: {
    count: number;
    registered: number;
    unregistered: number;
    campuses: number;
    buildings: CategorizedBuilding[];
  };
  commercial: {
    count: number;
    registered: number;
    unregistered: number;
    buildings: CategorizedBuilding[];
  };
  civic: {
    count: number;
    registered: number;
    unregistered: number;
    buildings: CategorizedBuilding[];
  };
  unregisteredBuildings: {
    count: number;
    highRisk: number;
    moderateRisk: number;
    buildings: CategorizedBuilding[];
  };
  unregisteredLand: {
    count: number;
    totalAreaSqm: number;
    totalAreaAcres: number;
    highRisk: number;
    parcels: CategorizedLand[];
  };
  totalBuildings: number;
  totalParcels: number;
}

// Well-known Prayagraj landmarks and categorical metadata mapping
const KNOWN_BUILDING_METADATA: Record<string, Partial<CategorizedBuilding>> = {
  B001: {
    name: 'Commercial High-Rise Complex (Corporate Tower)',
    category: 'commercial',
    categoryLabel: 'Commercial Complex',
    owner: 'Uttar Pradesh Industrial Development Corp.',
    address: 'Civil Lines, Prayagraj 211001',
    isRegistered: true,
    ulpin: 'UP2110B0101001',
    coordinates: [25.4365, 81.8468],
    image_url: '/images/residential_towers.jpg',
    facilityDetails: 'Corporate Tech Suites',
    landAreaAcres: 2.1
  },
  B002: {
    name: 'Civic Administrative Center & Revenue Office',
    category: 'civic',
    categoryLabel: 'Civic / Government',
    owner: 'Revenue & Cadastral Mapping Department',
    address: 'Collectorate Compound, Prayagraj 211002',
    isRegistered: true,
    ulpin: 'UP2110B0201001',
    coordinates: [25.4339, 81.8445],
    image_url: '/images/category_banner.jpg',
    facilityDetails: 'Revenue Cadastre Secretariat',
    landAreaAcres: 3.4
  },
  B003: {
    name: 'Jeevan Jyoti Hospital (Multi-Specialty Wing)',
    category: 'hospital',
    categoryLabel: 'Hospital & Healthcare',
    building_type: 'Healthcare / Hospital Wing',
    owner: 'Jeevan Jyoti Health & Trauma Trust',
    address: 'Grand Trunk Road, Rambagh, Prayagraj 211003',
    isRegistered: true,
    ulpin: 'UP2110B0301001',
    coordinates: [25.4370, 81.8464],
    specialty: 'Trauma & Emergency Care, 180 Inpatient Beds, ICU Wing',
    image_url: '/images/hospital_building.jpg',
    facilityDetails: 'Trauma & Emergency Care',
    studentCount: 180,
    landAreaAcres: 2.8
  },
  B004: {
    name: 'Prayagraj Central Multi-Family Residential Enclave',
    category: 'residential',
    categoryLabel: 'Residential (Apartment)',
    building_type: 'Residential (Apartment)',
    owner: 'Govt Verified Citizen & RWA Society',
    address: 'Sector 10, Civil Lines, Prayagraj 211001',
    isRegistered: true,
    ulpin: 'UP2110B0401001',
    coordinates: [25.4352, 81.8441],
    unitCount: 20,
    image_url: '/images/residential_towers.jpg',
    facilityDetails: 'Gated Luxury Society',
    studentCount: 20,
    landAreaAcres: 1.9
  },
  B005: {
    name: 'Prayagraj Central Public Transit Terminal',
    category: 'civic',
    categoryLabel: 'Civic / Infrastructure',
    owner: 'State Road Transport Corporation',
    address: 'Civil Station, Prayagraj 211001',
    isRegistered: true,
    ulpin: 'UP2110B0501001',
    coordinates: [25.4339, 81.8457],
    image_url: '/images/category_banner.jpg',
    facilityDetails: 'Intermodal Transit Hub',
    landAreaAcres: 4.2
  },
  B006: {
    name: 'Dviarka & Ranjana Diagnostic Hospital Center',
    category: 'hospital',
    categoryLabel: 'Hospital & Healthcare',
    building_type: 'Diagnostic Health Center',
    owner: 'Dviarka Healthcare Ltd.',
    address: 'Opp. Grand Trunk Corridor, Prayagraj 211003',
    isRegistered: true,
    ulpin: 'UP2110B0601001',
    coordinates: [25.4362, 81.8453],
    specialty: 'Radiology, Pathology & Multi-Specialty Outpatient',
    image_url: '/images/hospital_building.jpg',
    facilityDetails: 'Advanced MRI & Diagnostics',
    studentCount: 95,
    landAreaAcres: 1.5
  },
  B007: {
    name: 'Civil Lines Green Enclave Residential Society',
    category: 'residential',
    categoryLabel: 'Residential (Housing Society)',
    building_type: 'Residential Apartments',
    owner: 'Prayagraj Housing Cooperative',
    address: 'Civil Lines North, Prayagraj 211001',
    isRegistered: true,
    ulpin: 'UP2110B0701001',
    coordinates: [25.4339, 81.8454],
    unitCount: 24,
    image_url: '/images/residential_towers.jpg',
    facilityDetails: 'Multi-Family Enclave',
    studentCount: 24,
    landAreaAcres: 2.1
  },
  B008: {
    name: 'Yamuna View Heights (Residential Tower)',
    category: 'residential',
    categoryLabel: 'Residential (Tower)',
    building_type: 'Residential High-Rise',
    owner: 'Ganga-Yamuna Builders & Verified Citizens',
    address: 'Baird Road, Prayagraj 211002',
    isRegistered: true,
    ulpin: 'UP2110B0801001',
    coordinates: [25.4348, 81.8472],
    unitCount: 32,
    image_url: '/images/residential_towers.jpg',
    facilityDetails: 'High-Rise Twin Towers',
    studentCount: 32,
    landAreaAcres: 2.6
  },
  B009: {
    name: 'Corporate Technology Hub & IT Park',
    category: 'commercial',
    categoryLabel: 'Commercial Office',
    owner: 'UP Electronics Development Corporation',
    address: 'Tech Corridor, Prayagraj 211004',
    isRegistered: true,
    ulpin: 'UP2110B0901001',
    coordinates: [25.4375, 81.8480],
    image_url: '/images/category_banner.jpg',
    facilityDetails: 'Software & IT Infrastructure',
    landAreaAcres: 3.8
  },
  B010: {
    name: 'Arya Kanya Degree College (Main Campus & Academic Block)',
    category: 'school',
    categoryLabel: 'School & Education',
    building_type: 'Educational Institution / College',
    owner: 'Arya Kanya Shiksha Samiti (Affiliated State University)',
    address: 'Muthiganj / Kydganj Marg, Prayagraj 211003',
    isRegistered: true,
    ulpin: 'UP2110B1001B01',
    coordinates: [25.4355, 81.8475],
    specialty: 'Higher Education Campus, Library & Science Laboratories',
    image_url: '/images/school_campus.jpg',
    facilityDetails: 'UG & PG Programs',
    studentCount: 2300,
    landAreaAcres: 3.1
  },
  B011: {
    name: 'Ranjana Maternity & Pediatric Care Hospital',
    category: 'hospital',
    categoryLabel: 'Hospital & Healthcare',
    building_type: 'Hospital / Children Clinic',
    owner: 'Dr. Ranjana Memorial Health Foundation',
    address: 'Near Old G.T. Road, Prayagraj 211003',
    isRegistered: true,
    ulpin: 'UP2110B1101001',
    coordinates: [25.4378, 81.8451],
    specialty: 'Pediatrics, Neonatal Care & 40 Inpatient Beds',
    image_url: '/images/hospital_building.jpg',
    facilityDetails: 'Pediatrics & Neonatal Care',
    studentCount: 40,
    landAreaAcres: 1.2
  },
  B012: {
    name: 'Civil Lines Building B012',
    category: 'school',
    categoryLabel: 'School & Education',
    building_type: 'Senior Secondary School',
    owner: 'District Basic Education Board',
    address: 'Civil Lines West, Prayagraj 211001',
    isRegistered: true,
    ulpin: 'UP2110B1201A01',
    coordinates: [25.4382, 81.8465],
    specialty: 'CBSE Affiliated, Grades 1-12, 1,200 Students',
    image_url: '/images/school_campus.jpg',
    facilityDetails: 'CBSE Affiliated Grades 1-12',
    studentCount: 1200,
    landAreaAcres: 2.4
  },
  B013: {
    name: 'Rambagh G+4 Unauthorized Vertical Extension',
    category: 'unregistered_buildings' as any,
    categoryLabel: '⚠️ Unregistered Building',
    building_type: 'Unregistered Vertical Expansion',
    owner: 'Unregistered Private Occupant',
    address: 'Alleyway 4, Rambagh, Prayagraj 211003',
    isRegistered: false,
    ulpin: null,
    floor_count: 5,
    height: 16.5,
    coordinates: [25.4368, 81.8479],
    unregisteredReason: 'Sanctioned for G+2 only. Floors 3-5 constructed without municipal permit or structural clearance. No 14-Digit 3D ULPIN issued.',
    cadastralRisk: 'High',
    missingDocs: ['3D ULPIN Deed', 'Municipal Building Sanction', 'Fire Safety NOC', 'Structural Stability Certificate'],
    image_url: '/images/category_banner.jpg',
    facilityDetails: 'Unauthorized Vertical Additions',
    landAreaAcres: 0.8
  },
  B014: {
    name: 'Triveni Royal Residential Apartments',
    category: 'residential',
    categoryLabel: 'Residential (Apartment)',
    building_type: 'Residential Complex',
    owner: 'Private Resident Owners',
    address: 'Near New Triveni Cottage, Prayagraj 211001',
    isRegistered: true,
    ulpin: 'UP2110B1401001',
    coordinates: [25.4380, 81.8440],
    unitCount: 16,
    image_url: '/images/residential_towers.jpg',
    facilityDetails: 'Gated Residential Society',
    studentCount: 16,
    landAreaAcres: 1.7
  },
  B015: {
    name: 'Old Katra Informal Commercial Tenement',
    category: 'unregistered_buildings' as any,
    categoryLabel: '⚠️ Unregistered Building',
    building_type: 'Informal Commercial Structure',
    owner: 'Disputed Occupants / Unverified',
    address: 'Katra Bazaar Border, Prayagraj 211002',
    isRegistered: false,
    ulpin: null,
    floor_count: 4,
    height: 12.8,
    coordinates: [25.4345, 81.8432],
    unregisteredReason: 'Occupies un-mutated inherited parcel without municipal tax registration or vertical subdivision cadastre. Pending BhuNaksha sync.',
    cadastralRisk: 'High',
    missingDocs: ['Title Deed (Registry)', 'Cadastral Mutation Certificate', '3D ULPIN Assignment'],
    image_url: '/images/category_banner.jpg',
    facilityDetails: 'Commercial Tenement Encroachment',
    landAreaAcres: 0.6
  },
  B016: {
    name: 'Civil Lines Building B016',
    category: 'school',
    categoryLabel: 'School & Education',
    building_type: 'Vocational Training Institute',
    owner: 'State Skill Development Council',
    address: 'Kydganj Extn., Prayagraj 211003',
    isRegistered: true,
    ulpin: 'UP2110B1601A01',
    coordinates: [25.4350, 81.8482],
    specialty: 'Computer Labs & Technical Vocational Training',
    image_url: '/images/category_banner.jpg',
    facilityDetails: 'Computer Labs Technical Training',
    studentCount: 850,
    landAreaAcres: 1.8
  },
  B017: {
    name: 'Tara Health Care & Emergency Clinic',
    category: 'hospital',
    categoryLabel: 'Hospital & Healthcare',
    building_type: 'Healthcare Clinic',
    owner: 'Tara Medical Care Associates',
    address: 'Grand Trunk Road, Prayagraj 211003',
    isRegistered: true,
    ulpin: 'UP2110B1701001',
    coordinates: [25.4366, 81.8492],
    specialty: '24/7 Outpatient & Emergency Primary Care',
    image_url: '/images/hospital_building.jpg',
    facilityDetails: '24/7 Outpatient & Emergency',
    studentCount: 60,
    landAreaAcres: 1.4
  },
  B018: {
    name: 'Civil Lines Back-Alley Unauthorized Storehouse',
    category: 'unregistered_buildings' as any,
    categoryLabel: '⚠️ Unregistered Building',
    building_type: 'Unregistered Commercial Godown',
    owner: 'Unregistered Commercial Tenant',
    address: 'Back Service Lane, Civil Lines, Prayagraj 211001',
    isRegistered: false,
    ulpin: null,
    floor_count: 3,
    height: 9.5,
    coordinates: [25.4361, 81.8438],
    unregisteredReason: 'Constructed within right-of-way buffer zone of public storm drain. Lacks 3D ULPIN and valid ownership title deed.',
    cadastralRisk: 'Moderate',
    missingDocs: ['Municipal Clearance', '3D ULPIN Deed', 'Drainage Buffer NOC'],
    image_url: '/images/category_banner.jpg',
    facilityDetails: 'Drain Buffer Godown',
    landAreaAcres: 0.5
  }
};

// Well-known Unregistered Land Parcels
const UNREGISTERED_LAND_RECORDS: CategorizedLand[] = [
  {
    parcel_id: 'P016',
    survey_number: 'SURV-UNREG-901/UP',
    land_use: 'Unsurveyed Nazul Land (Urban Reserve)',
    category: 'unregistered',
    categoryLabel: '⚠️ Unregistered Land',
    area_sqm: 2450.0,
    area_acres: 0.61,
    isRegistered: false,
    status: 'Unregistered / Pending Survey',
    owner: 'State Government (Under Encroachment Risk)',
    coordinates: [25.4372, 81.8485],
    unregisteredReason: 'Government Nazul land missing vectorized boundary polygon in State BhuNaksha. Multiple unauthorized temporary stalls reported.',
    cadastralRisk: 'High',
    disputeType: 'Encroachment into Public Right-of-Way',
    actionRequired: 'Deploy DGPS / Total Station survey team & assign Land ULPIN'
  },
  {
    parcel_id: 'P017',
    survey_number: 'SURV-UNREG-902/UP',
    land_use: 'Drainage Canal Buffer Zone',
    category: 'unregistered',
    categoryLabel: '⚠️ Unregistered Land',
    area_sqm: 1820.5,
    area_acres: 0.45,
    isRegistered: false,
    status: 'Encroachment Alert',
    owner: 'Irrigation & Flood Control Department',
    coordinates: [25.4342, 81.8465],
    unregisteredReason: 'Canal corridor reserve land with unverified private boundary claims. No digital mutation or 14-digit ULPIN registered.',
    cadastralRisk: 'High',
    disputeType: 'Environmental & Flood Line Encroachment',
    actionRequired: 'Issue Cadastral Eviction Notice & Demarcate Geofence'
  },
  {
    parcel_id: 'P018',
    survey_number: 'SURV-UNREG-903/UP',
    land_use: 'Disputed Private Inheritance Plot',
    category: 'unregistered',
    categoryLabel: '⚠️ Unregistered Land',
    area_sqm: 3110.0,
    area_acres: 0.77,
    isRegistered: false,
    status: 'Disputed Title (Sub-Judice)',
    owner: 'Private Heirs (Under Civil Litigation)',
    coordinates: [25.4385, 81.8470],
    unregisteredReason: 'Sub-judice title litigation pending at Prayagraj Civil Court since 2019. Partition deed unexecuted, ULPIN generation blocked.',
    cadastralRisk: 'Moderate',
    disputeType: 'Family Partition & Boundary Partition Dispute',
    actionRequired: 'Await Civil Court Decree or apply Fast-Track Lok Adalat Mediation'
  }
];

export function getCadastralCategoriesData(
  buildings: Building[],
  parcels: Parcel[],
  verticalProperties: VerticalParcel[] = [],
  properties: PropertyRecord[] = []
): CategoriesSummary {
  const processedBuildingIds = new Set<string>();
  const categorizedBuildings: CategorizedBuilding[] = [];

  // Helper to safely extract centroid coordinates from any geometry polygon format
  const getCentroid = (coords: any): [number, number] => {
    try {
      if (!coords || !Array.isArray(coords)) return [ORIGIN_LAT, ORIGIN_LNG];
      let ring = coords[0];
      // Recursively unwrap nested MultiPolygon coordinates if needed
      while (Array.isArray(ring) && Array.isArray(ring[0]) && Array.isArray(ring[0][0])) {
        ring = ring[0];
      }
      if (!Array.isArray(ring) || ring.length === 0) return [ORIGIN_LAT, ORIGIN_LNG];
      let sumLat = 0;
      let sumLng = 0;
      let validCount = 0;
      for (const pt of ring) {
        if (Array.isArray(pt) && typeof pt[0] === 'number' && typeof pt[1] === 'number' && !isNaN(pt[0]) && !isNaN(pt[1])) {
          sumLng += pt[0];
          sumLat += pt[1];
          validCount++;
        }
      }
      if (validCount === 0) return [ORIGIN_LAT, ORIGIN_LNG];
      return [sumLat / validCount, sumLng / validCount];
    } catch {
      return [ORIGIN_LAT, ORIGIN_LNG];
    }
  };

  // 1. Process all existing buildings in the store
  for (const b of buildings) {
    if (!b || !b.building_id) continue;
    const bId = b.building_id.toUpperCase();
    processedBuildingIds.add(bId);

    const known = KNOWN_BUILDING_METADATA[bId] || {};
    const bTypeLower = (b.building_type || known.building_type || '').toLowerCase();
    const bNameLower = (b.building_name || known.name || '').toLowerCase();

    // Determine category
    let category: 'residential' | 'hospital' | 'school' | 'commercial' | 'civic' = 'commercial';
    let categoryLabel = 'Commercial Office';

    if (
      bTypeLower.includes('hospital') ||
      bTypeLower.includes('health') ||
      bTypeLower.includes('clinic') ||
      bTypeLower.includes('medical') ||
      bNameLower.includes('hospital') ||
      bNameLower.includes('health')
    ) {
      category = 'hospital';
      categoryLabel = 'Hospital & Healthcare';
    } else if (
      bTypeLower.includes('school') ||
      bTypeLower.includes('college') ||
      bTypeLower.includes('education') ||
      bTypeLower.includes('academy') ||
      bTypeLower.includes('vidyalaya') ||
      bNameLower.includes('college') ||
      bNameLower.includes('school')
    ) {
      category = 'school';
      categoryLabel = 'School & Education';
    } else if (
      bTypeLower.includes('residential') ||
      bTypeLower.includes('apartment') ||
      bTypeLower.includes('housing') ||
      bTypeLower.includes('home') ||
      bTypeLower.includes('flat') ||
      bNameLower.includes('residential') ||
      bNameLower.includes('apartment')
    ) {
      category = 'residential';
      categoryLabel = 'Residential (Apartment)';
    } else if (
      bTypeLower.includes('civic') ||
      bTypeLower.includes('transit') ||
      bTypeLower.includes('admin') ||
      bTypeLower.includes('court') ||
      bTypeLower.includes('government')
    ) {
      category = 'civic';
      categoryLabel = 'Civic / Government';
    }

    // Override with known metadata if available
    if (known.category && known.category !== ('unregistered_buildings' as any)) {
      category = known.category;
      categoryLabel = known.categoryLabel || categoryLabel;
    }

    const coords: [number, number] = b.geometry?.coordinates ? getCentroid(b.geometry.coordinates) : (known.coordinates || [ORIGIN_LAT, ORIGIN_LNG]);
    const floorCount = b.floor_count || known.floor_count || 5;
    const height = b.height || known.height || 15.0;
    const plotArea = b.geometry?.coordinates ? 1240.36 : 1000;
    const builtUpArea = plotArea * floorCount * 0.82;
    const isUnreg = (known as any).isRegistered === false;

    categorizedBuildings.push({
      building_id: b.building_id,
      name: b.building_name || known.name || `Building ${b.building_id} (${categoryLabel})`,
      category: isUnreg ? ('unregistered_buildings' as any) : category,
      categoryLabel: isUnreg ? '⚠️ Unregistered Building' : categoryLabel,
      building_type: b.building_type || known.building_type || categoryLabel,
      isRegistered: !isUnreg,
      ulpin: isUnreg ? null : (b.primary_ulpin || known.ulpin || format14DigitUlpin(b.building_id, 'F01', 'P01')),
      floor_count: floorCount,
      height: height,
      plot_area: Math.round(plotArea),
      built_up_area: Math.round(builtUpArea),
      parcel_id: b.parcel_id || known.parcel_id || 'P001',
      survey_number: known.survey_number || `SURV-${b.building_id}/UP`,
      owner: b.owner || known.owner || 'Govt Verified Citizen',
      address: known.address || 'Civil Lines, Prayagraj, Uttar Pradesh 211001',
      coordinates: coords,
      unregisteredReason: known.unregisteredReason,
      cadastralRisk: known.cadastralRisk,
      missingDocs: known.missingDocs,
      unitCount: known.unitCount || (category === 'residential' ? floorCount * 4 : undefined),
      specialty: known.specialty,
      image_url: known.image_url || (category === 'school' ? '/images/school_campus.jpg' : category === 'hospital' ? '/images/hospital_building.jpg' : category === 'residential' ? '/images/residential_towers.jpg' : '/images/category_banner.jpg'),
      facilityDetails: known.facilityDetails || (category === 'school' ? 'CBSE Affiliated Grades 1-12' : category === 'hospital' ? 'Multi-Specialty Care' : category === 'residential' ? 'Residential Apartments' : 'Commercial Complex'),
      studentCount: known.studentCount || (category === 'school' ? 1200 : category === 'hospital' ? 150 : category === 'residential' ? floorCount * 4 : undefined),
      landAreaAcres: known.landAreaAcres || Math.round((plotArea / 4046.86) * 10) / 10 || 2.2
    });
  }

  // 2. Inject known hospital, school, and unregistered demo assets if not present
  for (const [kId, kMeta] of Object.entries(KNOWN_BUILDING_METADATA)) {
    if (!processedBuildingIds.has(kId)) {
      const isUnreg = kMeta.isRegistered === false;
      categorizedBuildings.push({
        building_id: kId,
        name: kMeta.name || `Building ${kId}`,
        category: (kMeta.category || 'commercial') as any,
        categoryLabel: kMeta.categoryLabel || 'Commercial',
        building_type: kMeta.building_type || 'Commercial Complex',
        isRegistered: !isUnreg,
        ulpin: isUnreg ? null : (kMeta.ulpin || format14DigitUlpin(kId, 'F01', 'P01')),
        floor_count: kMeta.floor_count || 5,
        height: kMeta.height || 15.0,
        plot_area: kMeta.plot_area || 1200,
        built_up_area: kMeta.built_up_area || 4800,
        parcel_id: kMeta.parcel_id || 'P001',
        survey_number: kMeta.survey_number || `SURV-${kId}/UP`,
        owner: kMeta.owner || 'Uttar Pradesh Authority',
        address: kMeta.address || 'Prayagraj, UP 211001',
        coordinates: kMeta.coordinates || [ORIGIN_LAT, ORIGIN_LNG],
        unregisteredReason: kMeta.unregisteredReason,
        cadastralRisk: kMeta.cadastralRisk,
        missingDocs: kMeta.missingDocs,
        unitCount: kMeta.unitCount,
        specialty: kMeta.specialty,
        image_url: kMeta.image_url || (kMeta.category === 'school' ? '/images/school_campus.jpg' : kMeta.category === 'hospital' ? '/images/hospital_building.jpg' : kMeta.category === 'residential' ? '/images/residential_towers.jpg' : '/images/category_banner.jpg'),
        facilityDetails: kMeta.facilityDetails || (kMeta.category === 'school' ? 'Educational Campus' : kMeta.category === 'hospital' ? 'Healthcare Facility' : 'Urban Structure'),
        studentCount: kMeta.studentCount,
        landAreaAcres: kMeta.landAreaAcres || 2.4
      });
      processedBuildingIds.add(kId);
    }
  }

  // 3. Process Land Parcels
  const categorizedParcels: CategorizedLand[] = [];
  const processedParcelIds = new Set<string>();

  for (const p of parcels) {
    if (!p || !p.parcel_id) continue;
    const pId = p.parcel_id.toUpperCase();
    processedParcelIds.add(pId);

    const luLower = (p.land_use || '').toLowerCase();
    let pCat: 'residential' | 'hospital' | 'school' | 'commercial' | 'civic' | 'unregistered' = 'commercial';
    let pCatLabel = 'Commercial Land';

    if (luLower.includes('hospital') || luLower.includes('health') || luLower.includes('medical')) {
      pCat = 'hospital';
      pCatLabel = 'Hospital Campus Ground';
    } else if (luLower.includes('school') || luLower.includes('college') || luLower.includes('education')) {
      pCat = 'school';
      pCatLabel = 'Educational Campus Land';
    } else if (luLower.includes('residential') || luLower.includes('housing')) {
      pCat = 'residential';
      pCatLabel = 'Residential Land Plot';
    } else if (luLower.includes('park') || luLower.includes('civic') || luLower.includes('transit')) {
      pCat = 'civic';
      pCatLabel = 'Civic & Public Amenity';
    }

    const coords: [number, number] = p.geometry?.coordinates ? getCentroid(p.geometry.coordinates) : [ORIGIN_LAT, ORIGIN_LNG];
    const area = p.area || 1500;
    const isReg = p.status === 'Active';

    categorizedParcels.push({
      parcel_id: p.parcel_id,
      survey_number: p.survey_number || `SURV-${p.parcel_id}/UP`,
      land_use: p.land_use || 'Urban Parcel',
      category: isReg ? pCat : 'unregistered',
      categoryLabel: isReg ? pCatLabel : '⚠️ Unregistered Land',
      area_sqm: Math.round(area * 10) / 10,
      area_acres: Math.round((area / 4046.86) * 100) / 100,
      isRegistered: isReg,
      status: p.status || 'Active',
      owner: 'State Cadastral Registry',
      coordinates: coords
    });
  }

  // 4. Inject specific unregistered land records
  for (const unregLand of UNREGISTERED_LAND_RECORDS) {
    if (!processedParcelIds.has(unregLand.parcel_id.toUpperCase())) {
      categorizedParcels.push(unregLand);
      processedParcelIds.add(unregLand.parcel_id.toUpperCase());
    }
  }

  // Separate building groups
  const residentialBldgs = categorizedBuildings.filter(b => b.category === 'residential' && b.isRegistered);
  const hospitalBldgs = categorizedBuildings.filter(b => b.category === 'hospital' && b.isRegistered);
  const schoolBldgs = categorizedBuildings.filter(b => b.category === 'school' && b.isRegistered);
  const commercialBldgs = categorizedBuildings.filter(b => b.category === 'commercial' && b.isRegistered);
  const civicBldgs = categorizedBuildings.filter(b => b.category === 'civic' && b.isRegistered);
  const unregisteredBldgs = categorizedBuildings.filter(b => !b.isRegistered || b.category === ('unregistered_buildings' as any));
  const unregisteredLand = categorizedParcels.filter(p => !p.isRegistered || p.category === 'unregistered');

  const residentialUnits = residentialBldgs.reduce((acc, b) => acc + (b.unitCount || (b.floor_count * 4)), 0);
  const totalUnregLandSqm = unregisteredLand.reduce((acc, p) => acc + p.area_sqm, 0);
  const totalUnregLandAcres = Math.round((totalUnregLandSqm / 4046.86) * 100) / 100;

  return {
    residential: {
      count: residentialBldgs.length,
      registered: residentialBldgs.length,
      unregistered: 0,
      units: residentialUnits,
      buildings: residentialBldgs
    },
    hospital: {
      count: hospitalBldgs.length,
      registered: hospitalBldgs.length,
      unregistered: 0,
      emergencyFacilities: hospitalBldgs.length,
      buildings: hospitalBldgs
    },
    school: {
      count: schoolBldgs.length,
      registered: schoolBldgs.length,
      unregistered: 0,
      campuses: schoolBldgs.length,
      buildings: schoolBldgs
    },
    commercial: {
      count: commercialBldgs.length,
      registered: commercialBldgs.length,
      unregistered: 0,
      buildings: commercialBldgs
    },
    civic: {
      count: civicBldgs.length,
      registered: civicBldgs.length,
      unregistered: 0,
      buildings: civicBldgs
    },
    unregisteredBuildings: {
      count: unregisteredBldgs.length,
      highRisk: unregisteredBldgs.filter(b => b.cadastralRisk === 'High').length,
      moderateRisk: unregisteredBldgs.filter(b => b.cadastralRisk !== 'High').length,
      buildings: unregisteredBldgs
    },
    unregisteredLand: {
      count: unregisteredLand.length,
      totalAreaSqm: Math.round(totalUnregLandSqm),
      totalAreaAcres: totalUnregLandAcres,
      highRisk: unregisteredLand.filter(p => p.cadastralRisk === 'High').length,
      parcels: unregisteredLand
    },
    totalBuildings: categorizedBuildings.length,
    totalParcels: categorizedParcels.length
  };
}
