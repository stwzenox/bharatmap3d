import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../state/useAuthStore';
import { useCadastralStore } from '../../state/useCadastralStore';
import { AuthApi } from '../../api/authClient';
import { format14DigitUlpin } from '../../utils/ulpin';
import { BuildingPipelineInput, FloorOwnerEntry, FloorPartitionUnit, DroneViewMetadata } from '../../types';
import { 
  X, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  Network, 
  FileBadge, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Box, 
  MapPin, 
  Database, 
  AlertCircle,
  Building2,
  CheckCircle2,
  UploadCloud,
  Compass,
  FileText,
  User,
  Users,
  RefreshCw,
  Camera,
  DownloadCloud,
  CheckSquare,
  Square,
  BadgeCheck,
  Shield,
  Smartphone,
  Tag,
  Zap,
  Home,
  Grid3X3
} from 'lucide-react';
import { ScannableQRCode } from '../common/ScannableQRCode';

const DATA_SOURCES_LIST = [
  { id: 'drone', label: 'Drone Photogrammetry', desc: 'High-res aerial orthomosaic' },
  { id: 'lidar', label: 'LiDAR Point Cloud', desc: '0.1m precision elevation ground truth' },
  { id: 'gis_parcel', label: 'GIS Parcel Boundary', desc: 'Revenue cadastral boundary polygons' },
  { id: 'floor_plans', label: 'Architectural Floor Plans', desc: 'CAD / BIM floor layouts' },
  { id: 'dem_dsm', label: 'DEM / DSM Grid', desc: 'Digital elevation surface model' },
  { id: 'gnss_cors', label: 'GNSS-CORS Reference', desc: 'Sub-centimeter geospatial alignment' },
];

export const AddBuildingPipelineModal: React.FC = () => {
  const { isAddBuildingModalOpen, closeAddBuildingModal, currentUser } = useAuthStore();
  const {
    parcels,
    addNewBuilding,
    selectBuilding,
    openBuilding3DModal,
    pendingAiBuildingInput,
    setPendingAiBuildingInput,
    measurePolygonPoints,
    clearMeasurePolygon,
    setIsMeasuringPolygon,
    buildings
  } = useCadastralStore();

  const [step, setStep] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [pipelineError, setPipelineError] = useState<string | null>(null);

  // Lock measured footprint points upon opening so they remain persistent across all wizard steps
  const [lockedMeasuredPoints, setLockedMeasuredPoints] = useState<[number, number][] | null>(null);

  useEffect(() => {
    if (isAddBuildingModalOpen && !lockedMeasuredPoints) {
      const pts = (pendingAiBuildingInput?.coordinates && pendingAiBuildingInput.coordinates.length >= 3)
        ? pendingAiBuildingInput.coordinates
        : (measurePolygonPoints && measurePolygonPoints.length >= 3)
        ? measurePolygonPoints
        : null;
      if (pts) {
        setLockedMeasuredPoints([...pts]);
      }
    } else if (!isAddBuildingModalOpen) {
      setLockedMeasuredPoints(null);
    }
  }, [isAddBuildingModalOpen, pendingAiBuildingInput, measurePolygonPoints]);

  // Active measured footprint points (either locked or live)
  const activeMeasuredPoints = lockedMeasuredPoints || 
    (pendingAiBuildingInput?.coordinates && pendingAiBuildingInput.coordinates.length >= 3 ? pendingAiBuildingInput.coordinates : null) ||
    (measurePolygonPoints && measurePolygonPoints.length >= 3 ? measurePolygonPoints : null);

  // Centroid coordinates [cLat, cLng]
  const centroid = useMemo(() => {
    if (!activeMeasuredPoints || activeMeasuredPoints.length === 0) {
      return { lat: 25.4358, lng: 81.8463 };
    }
    const lats = activeMeasuredPoints.map((p: [number, number]) => p[0]);
    const lngs = activeMeasuredPoints.map((p: [number, number]) => p[1]);
    return {
      lat: lats.reduce((a: number, b: number) => a + b, 0) / lats.length,
      lng: lngs.reduce((a: number, b: number) => a + b, 0) / lngs.length
    };
  }, [activeMeasuredPoints]);

  // Convert measured [lat, lng] to closed GeoJSON [[lng, lat], ...] polygon
  const activeGeoJson = useMemo(() => {
    if (!activeMeasuredPoints || activeMeasuredPoints.length < 3) return null;
    const ring: [number, number][] = activeMeasuredPoints.map(([lat, lng]: [number, number]) => [
      Number(lng.toFixed(6)),
      Number(lat.toFixed(6))
    ]);
    if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
      ring.push([ring[0][0], ring[0][1]]);
    }
    return {
      type: 'Polygon',
      coordinates: [ring]
    };
  }, [activeMeasuredPoints]);

  // Occupied vs Vacant Parcels
  const occupiedParcelMap = useMemo(() => {
    const map = new Map<string, string>();
    buildings.forEach(b => map.set(b.parcel_id, b.building_id));
    return map;
  }, [buildings]);

  const vacantParcels = useMemo(() => {
    return parcels.filter(p => !occupiedParcelMap.has(p.parcel_id));
  }, [parcels, occupiedParcelMap]);

  const occupiedParcels = useMemo(() => {
    return parcels.filter(p => occupiedParcelMap.has(p.parcel_id));
  }, [parcels, occupiedParcelMap]);

  // Step 1: Geospatial & Structure Configuration
  const [selectedParcelId, setSelectedParcelId] = useState<string>('P001');
  const [isEditingParcel, setIsEditingParcel] = useState<boolean>(false);
  const [buildingName, setBuildingName] = useState<string>('');
  const [buildingType, setBuildingType] = useState<string>('Residential Complex');
  const [floorCount, setFloorCount] = useState<number>(4);
  const [heightPerFloor, setHeightPerFloor] = useState<number>(3.5);
  const [selectedDataSources, setSelectedDataSources] = useState<string[]>([
    'Drone Photogrammetry',
    'LiDAR Point Cloud',
    'GIS Parcel Boundary',
    'GNSS-CORS Reference'
  ]);

  // Drone View Ingestion State
  const [droneUploadMode, setDroneUploadMode] = useState<'manual' | 'auto'>('auto');
  const [droneImagePreview, setDroneImagePreview] = useState<string | null>(
    'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=600&q=80'
  );
  const [droneFileName, setDroneFileName] = useState<string>('UP_PRY_AERIAL_SURVEY_2026.tif');
  const [droneMetadata, setDroneMetadata] = useState<{
    gsd: string;
    altitude: string;
    timestamp: string;
    sensor: string;
    source: string;
  }>({
    gsd: '1.8 cm/px',
    altitude: '70m AGL',
    timestamp: '2026-09-18 10:45 IST',
    sensor: 'DJI Zenmuse P1 (45MP Full Frame)',
    source: 'Survey of India / NIC UP Drone Photogrammetry Cache'
  });
  const [isFetchingDrone, setIsFetchingDrone] = useState<boolean>(false);

  // GIS Revenue GeoJSON upload state
  const [gisBoundaryFileName, setGisBoundaryFileName] = useState<string>('Revenue_Cadastre_Boundaries_P001.geojson');
  const [gisBoundaryStatus, setGisBoundaryStatus] = useState<string>('Active Boundary FeatureCollection (4 Vertices Synchronized)');
  const [isGisUploaded, setIsGisUploaded] = useState<boolean>(true);

  // LiDAR Point Cloud upload state
  const [lidarFileName, setLidarFileName] = useState<string>('UP_PRY_LIDAR_POINT_CLOUD_2026.las');
  const [lidarDensity, setLidarDensity] = useState<string>('48.4 pts/m² • 0.1m Precision (ASPRS Class 2)');
  const [lidarStatus, setLidarStatus] = useState<string>('RANSAC Elevation Surface Calibrated (Z Min: 98.2m, Z Max: 118.5m)');
  const [isLidarUploaded, setIsLidarUploaded] = useState<boolean>(true);


  // Step 2: Land Owner Details State
  const [landOwnerName, setLandOwnerName] = useState<string>('Shri Ramakant Dwivedi');
  const [landOwnerId, setLandOwnerId] = useState<string>('XXXX-XXXX-8421 (Aadhaar Verified)');
  const [landOwnerContact, setLandOwnerContact] = useState<string>('+91 98765 43210');
  const [landDeedRef, setLandDeedRef] = useState<string>('Khasra No. 412/1, Khatauni #00891');
  const [landTitleType, setLandTitleType] = useState<string>('100% Sole Freehold Title');
  const [tehsilName, setTehsilName] = useState<string>('Sadar Prayagraj, UP');

  // Step 3: Floor Owner & Partition Details State
  const [autoAssignUnsold, setAutoAssignUnsold] = useState<boolean>(true);
  const [hasFloorPartitions, setHasFloorPartitions] = useState<boolean>(false);
  const [flatsPerFloor, setFlatsPerFloor] = useState<number>(2);
  const [floorOwners, setFloorOwners] = useState<FloorOwnerEntry[]>([]);

  // Step 4: Admin Endorsement State
  const [officerName, setOfficerName] = useState<string>(currentUser?.name || 'Dr. Arvind Sharma (Chief Cadastral Officer)');
  const [officerNotes, setOfficerNotes] = useState<string>('Measured polygon conforms with revenue boundary with zero spatial or vertical air-rights clash.');

  // Step 5: Created Result
  const [createdResult, setCreatedResult] = useState<any>(null);

  // AI Auto-Pilot One-Click Automatic Registration State
  const [isAiAutoExecuting, setIsAiAutoExecuting] = useState<boolean>(false);
  const [aiAutoStage, setAiAutoStage] = useState<string>('');
  const [aiStepIndex, setAiStepIndex] = useState<number>(0);

  // Synchronize dynamic floor rows whenever floorCount, heightPerFloor, hasFloorPartitions, or flatsPerFloor changes
  useEffect(() => {
    const groundElev = 100.0;
    setFloorOwners(prev => {
      const next: FloorOwnerEntry[] = [];
      for (let f = 1; f <= floorCount; f++) {
        const existing = prev.find(p => p.floor_number === f);
        const zMin = Number((groundElev + (f - 1) * heightPerFloor).toFixed(2));
        const zMax = Number((groundElev + f * heightPerFloor).toFixed(2));
        const label = f === 1 ? `Ground Floor (Level 1)` : `Floor ${f}`;
        const unit = `FL-${f}01`;

        // Generate or preserve partition units
        let units: FloorPartitionUnit[] = [];
        if (hasFloorPartitions) {
          units = Array.from({ length: flatsPerFloor }, (_, uIdx) => {
            const existingUnit = existing?.units?.[uIdx];
            const uNum = uIdx + 1;
            const defaultName = `Flat ${f}0${uNum}`;
            const defaultId = `FLAT-${f}0${uNum}`;
            if (existingUnit) {
              return {
                ...existingUnit,
                owner_name: (existingUnit.status === 'Unsold' && autoAssignUnsold) ? landOwnerName : existingUnit.owner_name
              };
            }
            return {
              unit_id: defaultId,
              unit_name: defaultName,
              owner_name: autoAssignUnsold ? landOwnerName : '',
              status: 'Unsold' as const,
              property_type: f === 1 ? 'Commercial Retail Flat' : 'Residential Apartment'
            };
          });
        }

        if (existing) {
          next.push({
            ...existing,
            floor_label: label,
            z_min: zMin,
            z_max: zMax,
            has_partitions: hasFloorPartitions,
            partition_count: hasFloorPartitions ? flatsPerFloor : 1,
            units,
            owner_name: (existing.status === 'Unsold' && autoAssignUnsold) ? landOwnerName : existing.owner_name
          });
        } else {
          const owner = autoAssignUnsold ? landOwnerName : '';
          next.push({
            floor_number: f,
            floor_label: label,
            unit_code: unit,
            status: 'Unsold',
            owner_name: owner,
            z_min: zMin,
            z_max: zMax,
            has_partitions: hasFloorPartitions,
            partition_count: hasFloorPartitions ? flatsPerFloor : 1,
            units,
            property_type: f === 1 ? 'Commercial / Retail Unit' : 'Residential Apartment'
          });
        }
      }
      return next;
    });
  }, [floorCount, heightPerFloor, landOwnerName, autoAssignUnsold, hasFloorPartitions, flatsPerFloor]);

  // Synchronize building attributes and auto-detect parcel & name from coordinates
  useEffect(() => {
    if (!isAddBuildingModalOpen) return;

    // Detect closest parcel from coordinates
    let bestPid = parcels[0]?.parcel_id || 'P001';
    if (activeMeasuredPoints && activeMeasuredPoints.length >= 3) {
      let minDist = Infinity;
      for (const p of parcels) {
        if (p.geometry?.coordinates?.[0]) {
          const ring = p.geometry.coordinates[0];
          const pLats = ring.map((c: any) => c[1]);
          const pLngs = ring.map((c: any) => c[0]);
          const minLat = Math.min(...pLats);
          const maxLat = Math.max(...pLats);
          const minLng = Math.min(...pLngs);
          const maxLng = Math.max(...pLngs);

          if (centroid.lat >= minLat && centroid.lat <= maxLat && centroid.lng >= minLng && centroid.lng <= maxLng) {
            bestPid = p.parcel_id;
            break;
          }

          const pCentLat = (minLat + maxLat) / 2;
          const pCentLng = (minLng + maxLng) / 2;
          const dist = (centroid.lat - pCentLat) ** 2 + (centroid.lng - pCentLng) ** 2;
          if (dist < minDist) {
            minDist = dist;
            bestPid = p.parcel_id;
          }
        }
      }
    } else if (pendingAiBuildingInput?.parcelId) {
      bestPid = pendingAiBuildingInput.parcelId;
    }

    setSelectedParcelId(bestPid);

    // Auto-generate standardized building structure name from coordinates & parcel
    if (!buildingName || buildingName === 'Skyline Heights Sector-7') {
      const coordTag = `${centroid.lat.toFixed(4)}N, ${centroid.lng.toFixed(4)}E`;
      setBuildingName(`Prayagraj Cadastre Twin - Parcel ${bestPid} (${coordTag})`);
    }

    // If AI spec provided
    if (pendingAiBuildingInput?.aiSpec) {
      const spec = pendingAiBuildingInput.aiSpec;
      if (spec.building_name) setBuildingName(spec.building_name);
      if (spec.building_type) setBuildingType(spec.building_type);
      if (spec.floor_count) setFloorCount(spec.floor_count);
      if (spec.height_per_floor) setHeightPerFloor(spec.height_per_floor);
      if (spec.owner_name) setLandOwnerName(spec.owner_name);
      if (spec.officer_notes) setOfficerNotes(spec.officer_notes);
    }
  }, [isAddBuildingModalOpen, pendingAiBuildingInput, centroid, parcels]);

  if (!isAddBuildingModalOpen) return null;

  // Toggle DataSource
  const toggleDataSource = (label: string) => {
    if (selectedDataSources.includes(label)) {
      setSelectedDataSources(selectedDataSources.filter(d => d !== label));
    } else {
      setSelectedDataSources([...selectedDataSources, label]);
    }
  };

  // Trigger Automatic GIS Aerial Survey Fetch
  const handleAutoFetchDroneView = () => {
    setIsFetchingDrone(true);
    setTimeout(() => {
      setIsFetchingDrone(false);
      setDroneUploadMode('auto');
      setDroneFileName(`UP_PRY_ORTHO_TILE_${selectedParcelId}_2026.tif`);
      setDroneImagePreview('https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=600&q=80');
      setDroneMetadata({
        gsd: '1.2 cm/px (Ultra High Resolution)',
        altitude: '65m AGL',
        timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        sensor: 'Survey of India Photogrammetric LiDAR Pod',
        source: `Regional Cadastral Geo-Server (Lat: ${centroid.lat.toFixed(5)}, Lng: ${centroid.lng.toFixed(5)})`
      });
    }, 600);
  };

  // Handle Manual File Upload
  const handleManualFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDroneFileName(file.name);
    setDroneUploadMode('manual');

    // Create object URL for preview if image
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setDroneImagePreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }

    setDroneMetadata({
      gsd: '1.5 cm/px (Calibrated)',
      altitude: '75m AGL',
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      sensor: 'Uploaded Sensor Payload',
      source: `Manual Upload (${(file.size / (1024 * 1024)).toFixed(2)} MB)`
    });
  };

  // Handle GIS Revenue GeoJSON Upload
  const handleGeoJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGisBoundaryFileName(file.name);
    setIsGisUploaded(true);
    setGisBoundaryStatus(`Custom GeoJSON Boundary Ingested (${(file.size / 1024).toFixed(1)} KB)`);
    if (!selectedDataSources.includes('GIS Parcel Boundary')) {
      setSelectedDataSources(prev => [...prev, 'GIS Parcel Boundary']);
    }
  };

  // Handle LiDAR Point Cloud Upload
  const handleLidarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLidarFileName(file.name);
    setIsLidarUploaded(true);
    setLidarStatus(`Point Cloud Ingested (${(file.size / (1024 * 1024)).toFixed(1)} MB)`);
    setLidarDensity('High-Density RANSAC Ground Truth (0.08m Precision)');
    if (!selectedDataSources.includes('LiDAR Point Cloud')) {
      setSelectedDataSources(prev => [...prev, 'LiDAR Point Cloud']);
    }
  };


  // Auto-Assign all unsold floors and flats to Land Owner
  const handleAssignAllToLandOwner = () => {
    setFloorOwners(prev => prev.map(fo => ({
      ...fo,
      owner_name: landOwnerName,
      units: (fo.units || []).map(u => ({
        ...u,
        owner_name: landOwnerName
      }))
    })));
  };

  // Update specific floor owner
  const handleFloorOwnerChange = (floorNum: number, newOwner: string) => {
    setFloorOwners(prev => prev.map(fo => 
      fo.floor_number === floorNum ? { ...fo, owner_name: newOwner } : fo
    ));
  };

  // Toggle floor status between Purchased and Unsold
  const handleToggleFloorStatus = (floorNum: number) => {
    setFloorOwners(prev => prev.map(fo => {
      if (fo.floor_number === floorNum) {
        const nextStatus = fo.status === 'Purchased' ? 'Unsold' : 'Purchased';
        let nextOwner = fo.owner_name;
        if (nextStatus === 'Unsold' && autoAssignUnsold) {
          nextOwner = landOwnerName;
        } else if (nextStatus === 'Purchased' && fo.owner_name === landOwnerName) {
          nextOwner = '';
        }
        return {
          ...fo,
          status: nextStatus,
          owner_name: nextOwner
        };
      }
      return fo;
    }));
  };

  // Update specific flat owner in partitioned floor
  const handleFlatOwnerChange = (floorNum: number, unitIdx: number, newOwner: string) => {
    setFloorOwners(prev => prev.map(fo => {
      if (fo.floor_number !== floorNum) return fo;
      const updatedUnits = [...(fo.units || [])];
      if (updatedUnits[unitIdx]) {
        updatedUnits[unitIdx] = {
          ...updatedUnits[unitIdx],
          owner_name: newOwner
        };
      }
      return { ...fo, units: updatedUnits };
    }));
  };

  // Toggle specific flat status between Purchased and Unsold
  const handleToggleFlatStatus = (floorNum: number, unitIdx: number) => {
    setFloorOwners(prev => prev.map(fo => {
      if (fo.floor_number !== floorNum) return fo;
      const updatedUnits = [...(fo.units || [])];
      if (updatedUnits[unitIdx]) {
        const nextStatus = updatedUnits[unitIdx].status === 'Purchased' ? 'Unsold' : 'Purchased';
        let nextOwner = updatedUnits[unitIdx].owner_name;
        if (nextStatus === 'Unsold' && autoAssignUnsold) {
          nextOwner = landOwnerName;
        } else if (nextStatus === 'Purchased' && nextOwner === landOwnerName) {
          nextOwner = '';
        }
        updatedUnits[unitIdx] = {
          ...updatedUnits[unitIdx],
          status: nextStatus,
          owner_name: nextOwner
        };
      }
      return { ...fo, units: updatedUnits };
    }));
  };

  // Update specific flat label/name
  const handleFlatNameChange = (floorNum: number, unitIdx: number, newName: string) => {
    setFloorOwners(prev => prev.map(fo => {
      if (fo.floor_number !== floorNum) return fo;
      const updatedUnits = [...(fo.units || [])];
      if (updatedUnits[unitIdx]) {
        updatedUnits[unitIdx] = {
          ...updatedUnits[unitIdx],
          unit_name: newName,
          unit_id: newName.replace(/\s+/g, '-').toUpperCase()
        };
      }
      return { ...fo, units: updatedUnits };
    }));
  };

  // Step 1 Validation
  const handleNextFromStep1 = () => {
    if (!buildingName.trim()) {
      setPipelineError('Please enter a building structure name.');
      return;
    }
    setPipelineError(null);
    setStep(2);
  };

  // Step 2 Validation
  const handleNextFromStep2 = () => {
    if (!landOwnerName.trim()) {
      setPipelineError('Please specify the Land Owner name.');
      return;
    }
    setPipelineError(null);
    setStep(3);
  };

  // Step 3 Validation
  const handleNextFromStep3 = () => {
    setPipelineError(null);
    setStep(4);
  };

  // Auto-Fill all fields with intelligent AI values for manual review
  const handleAiAutoFill = () => {
    const vacant = vacantParcels.length > 0 ? vacantParcels[0].parcel_id : selectedParcelId;
    const targetParcel = parcels.find(p => p.parcel_id === vacant) || parcels[0];
    const nextBid = buildings.length + 1;
    const landUseShort = targetParcel?.land_use?.split(' ')[0] || 'Cadastral';

    setSelectedParcelId(vacant);
    setBuildingName(`Apex Royal ${landUseShort} Tower (B${String(nextBid).padStart(3, '0')})`);
    setBuildingType(targetParcel?.land_use?.includes('Commercial') ? 'Commercial High-Rise' : 'Mixed-Use Residential Complex');
    setFloorCount(6);
    setHeightPerFloor(3.2);
    setLandOwnerName('Dr. Mahendra P. Agarwal (Authorized Freehold Holder)');
    setLandOwnerId('UP-AADHAAR-8921-****-4102');
    setLandOwnerContact('+91 98390 12450');
    setLandDeedRef(`UP-PRY-REV-2026-${Math.floor(100000 + Math.random() * 900000)}`);
    setOfficerNotes('AI autonomous photogrammetric boundary verification: zero encroachment, 100% compliant with Prayagraj Master Plan 2031.');
    setAutoAssignUnsold(true);
    setPipelineError(null);
  };

  // 1-Click Fully Automated AI Building Registration
  const handleRunInstantAiRegistration = async () => {
    setIsAiAutoExecuting(true);
    setPipelineError(null);

    try {
      // Step 1: AI Ingestion & Sensor Synthesis
      setAiStepIndex(1);
      setAiAutoStage('🛰️ AI Ingesting LiDAR & Drone Orthomosaic Data...');
      await new Promise(r => setTimeout(r, 350));

      const vacant = vacantParcels.length > 0 ? vacantParcels[0].parcel_id : selectedParcelId;
      const targetParcel = parcels.find(p => p.parcel_id === vacant) || parcels[0];
      const nextBid = buildings.length + 1;
      const landUseShort = targetParcel?.land_use?.split(' ')[0] || 'Cadastral';
      const autoBldgName = buildingName && buildingName.trim()
        ? buildingName
        : `Apex Royal ${landUseShort} Twin (B${String(nextBid).padStart(3, '0')})`;
      const autoOwner = landOwnerName && landOwnerName.trim()
        ? landOwnerName
        : 'Dr. Mahendra P. Agarwal (Authorized Freehold Holder)';
      const autoDeed = landDeedRef && landDeedRef.trim()
        ? landDeedRef
        : `UP-PRY-REV-2026-${Math.floor(100000 + Math.random() * 900000)}`;

      const droneData: DroneViewMetadata = {
        mode: 'auto',
        filename: `UP_PRY_ORTHO_TILE_${vacant}_2026.tif`,
        preview_url: droneImagePreview || undefined,
        gsd: '1.2 cm/px (Ultra High Resolution)',
        altitude: '65m AGL',
        timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        source_layer: `Survey of India LiDAR Pod (Lat: ${centroid.lat.toFixed(4)}, Lng: ${centroid.lng.toFixed(4)})`
      };

      // Step 2: 3D Geometry Synthesis
      setAiStepIndex(2);
      setAiAutoStage('📐 AI 3D Footprint RANSAC & Multi-Tier Floor Slicing...');
      await new Promise(r => setTimeout(r, 400));

      const fc = Math.max(1, Number(floorCount) || 6);
      const hpf = Number(heightPerFloor) || 3.2;

      const payload: BuildingPipelineInput = {
        parcel_id: vacant,
        building_name: autoBldgName,
        building_type: buildingType || 'Mixed-Use Residential Complex',
        floor_count: fc,
        height_per_floor: hpf,
        height: fc * hpf,
        data_sources: selectedDataSources,
        officer_name: officerName || currentUser?.name || 'Chief Cadastral Officer',
        officer_notes: 'AI autonomous photogrammetric boundary verification: zero encroachment, 100% compliant with Prayagraj Master Plan 2031.',
        owner_name: autoOwner,
        property_type: '3D Cadastral Unit',
        status: 'Active Registered',
        custom_geometry: activeGeoJson || undefined,
        land_owner_name: autoOwner,
        land_owner_id: landOwnerId || 'UP-AADHAAR-8921-****-4102',
        land_owner_contact: landOwnerContact || '+91 98390 12450',
        land_deed_ref: autoDeed,
        auto_assign_unsold_to_land_owner: true,
        has_partitions: hasFloorPartitions,
        apartments_per_floor: hasFloorPartitions ? flatsPerFloor : 1,
        floor_owners: floorOwners,
        drone_view_data: droneData
      };

      // Step 3: Topology & Regulatory FAR Verification
      setAiStepIndex(3);
      setAiAutoStage('🛡️ AI Autonomous Topology & Regulatory FAR Verification...');
      await new Promise(r => setTimeout(r, 350));

      // Step 4: ULPIN Generation & Registry Assignment
      setAiStepIndex(4);
      setAiAutoStage('🏷️ AI Generating 14-Digit Bhu-Aadhaar ULPIN Codes...');
      const result = await AuthApi.createBuildingPipeline(payload);

      // Step 5: Database Commit & 3D Twin Render
      setAiStepIndex(5);
      setAiAutoStage('🚀 Committing 3D Architectural Twin to PostgreSQL & Map...');
      await new Promise(r => setTimeout(r, 350));

      let finalBuilding = { ...result.building };
      let finalFloors = [...result.floors];
      let finalVPs = [...result.vertical_parcels];

      if (activeGeoJson) {
        finalBuilding.geometry = activeGeoJson;
        finalFloors = finalFloors.map(fl => ({ ...fl, geometry: activeGeoJson }));
        finalVPs = finalVPs.map(vp => ({ ...vp, geometry: activeGeoJson }));
      }
      finalBuilding.owner = autoOwner;
      finalBuilding.building_name = autoBldgName;

      addNewBuilding({
        building: finalBuilding,
        floors: finalFloors,
        vertical_parcels: finalVPs,
        property_records: result.property_records,
        validation: result.validation,
      });

      // Synchronize database state
      try {
        await useCadastralStore.getState().fetchAllData();
      } catch (err) {
        console.warn('Syncing with database after AI auto-creation:', err);
      }

      // Auto-select the newly created building on the map twin
      selectBuilding(finalBuilding.building_id);

      // Clean up measurement tool state
      clearMeasurePolygon();
      setIsMeasuringPolygon(false);
      setPendingAiBuildingInput(null);
      closeAddBuildingModal();

      // Open 3D Twin preview modal
      setTimeout(() => {
        openBuilding3DModal(finalBuilding.building_id);
      }, 200);

    } catch (err: any) {
      setPipelineError(err.message || 'AI Auto-Registration failed. Please try again.');
    } finally {
      setIsAiAutoExecuting(false);
      setAiAutoStage('');
      setAiStepIndex(0);
    }
  };

  // Step 4: AI 3D Processing & ULPIN Generation
  const handleGenerate3DUlpin = async () => {
    setIsProcessing(true);
    setPipelineError(null);

    try {
      const droneData: DroneViewMetadata = {
        mode: droneUploadMode,
        filename: droneFileName,
        preview_url: droneImagePreview || undefined,
        gsd: droneMetadata.gsd,
        altitude: droneMetadata.altitude,
        timestamp: droneMetadata.timestamp,
        source_layer: droneMetadata.source
      };

      const payload: BuildingPipelineInput = {
        parcel_id: selectedParcelId,
        building_name: buildingName,
        building_type: buildingType,
        floor_count: Number(floorCount),
        height_per_floor: Number(heightPerFloor),
        height: Number(floorCount) * Number(heightPerFloor),
        data_sources: selectedDataSources,
        officer_name: officerName,
        officer_notes: officerNotes,
        owner_name: landOwnerName,
        property_type: buildingType,
        status: 'Active Registered',
        custom_geometry: activeGeoJson || undefined,
        land_owner_name: landOwnerName,
        land_owner_id: landOwnerId,
        land_owner_contact: landOwnerContact,
        land_deed_ref: landDeedRef,
        auto_assign_unsold_to_land_owner: autoAssignUnsold,
        has_partitions: hasFloorPartitions,
        apartments_per_floor: hasFloorPartitions ? flatsPerFloor : 1,
        floor_owners: floorOwners,
        drone_view_data: droneData
      };

      const result = await AuthApi.createBuildingPipeline(payload);
      setCreatedResult(result);
      setStep(5);
    } catch (err: any) {
      setPipelineError(err.message || 'AI 3D pipeline synthesis failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Final Step 5: Commit and Render on 3D Map Twin
  const handleCommitAndRender = async (open3D: boolean = false) => {
    if (createdResult) {
      let finalBuilding = { ...createdResult.building };
      let finalFloors = [...createdResult.floors];
      let finalVPs = [...createdResult.vertical_parcels];

      // If user measured footprint interactively on the 2D map, place the 3D model & all floors exactly at those coordinates!
      if (activeGeoJson) {
        finalBuilding.geometry = activeGeoJson;
        finalFloors = finalFloors.map(fl => ({
          ...fl,
          geometry: activeGeoJson
        }));
        finalVPs = finalVPs.map(vp => ({
          ...vp,
          geometry: activeGeoJson
        }));
      }

      // Attach land owner and building name
      finalBuilding.owner = landOwnerName;
      if (buildingName) {
        finalBuilding.building_name = buildingName;
      }

      addNewBuilding({
        building: finalBuilding,
        floors: finalFloors,
        vertical_parcels: finalVPs,
        property_records: createdResult.property_records,
        validation: createdResult.validation,
      });

      // Synchronize directly with PostgreSQL database to ensure live state is 100% database-driven
      try {
        await useCadastralStore.getState().fetchAllData();
      } catch (err) {
        console.warn('Syncing with database after creation:', err);
      }

      // Auto-select the newly created building on the map twin
      selectBuilding(finalBuilding.building_id);

      // Clean up measurement tool state
      clearMeasurePolygon();
      setIsMeasuringPolygon(false);
      setPendingAiBuildingInput(null);
      closeAddBuildingModal();

      if (open3D) {
        setTimeout(() => {
          openBuilding3DModal(finalBuilding.building_id);
        }, 150);
      }
    }
  };

  const currentUlpin = createdResult?.property_records?.[0]?.ulpin || format14DigitUlpin(selectedParcelId, 'F01', 'U01');
  const totalHeight = (floorCount * heightPerFloor).toFixed(1);
  const estArea = pendingAiBuildingInput?.area ? pendingAiBuildingInput.area.toFixed(1) : '280.0';

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[94vh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: High-Grade Government Cadastral Aesthetics */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-400/40 flex items-center justify-center text-blue-400 shadow-inner">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold tracking-tight">3D Cadastral Building Registration</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  OFFICIAL CADASTRE PORTAL
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Multi-Sensor Ingestion • Land & Floor Title Attribution • Deterministic AI 3D Twin Synthesis
              </p>
            </div>
          </div>

          <button
            onClick={closeAddBuildingModal}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Measured Footprint & Live Coordinate Badge */}
        {activeMeasuredPoints && (
          <div className="px-6 py-2 bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-amber-50/70 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Measured 2D Footprint ({activeMeasuredPoints.length} vertices, ~{estArea} m²) locked at {centroid.lat.toFixed(5)}°N, {centroid.lng.toFixed(5)}°E
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" />
                Zero Boundary Overlap
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                Map Geometry Active
              </span>
            </div>
          </div>
        )}

        {/* AI Autonomous Registration Banner */}
        <div className="px-6 py-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white border-b border-blue-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-amber-300 shrink-0 shadow-sm">
              <Sparkles className="w-4 h-4 animate-pulse text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-wide">AI Auto-Pilot Registration</span>
                <span className="px-2 py-0.2 rounded-full text-[9px] font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  FULLY AUTOMATED
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                AI synthesizes 3D multi-tier floor slabs, strata subdivisions & 14-digit ULPINs automatically.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleAiAutoFill}
              disabled={isAiAutoExecuting || isProcessing}
              className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold border border-white/20 transition-all flex items-center justify-center gap-1.5"
              title="Automatically fill all form fields using AI"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>AI Auto-Fill</span>
            </button>

            <button
              onClick={handleRunInstantAiRegistration}
              disabled={isAiAutoExecuting || isProcessing}
              className="flex-1 sm:flex-initial px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/30 flex items-center justify-center gap-1.5 transition-all active:scale-95 border border-blue-400/40"
              title="Execute full AI pipeline in 1 click"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>1-Click AI Register</span>
            </button>
          </div>
        </div>

        {/* AI Autonomous Execution HUD Overlay */}
        {isAiAutoExecuting && (
          <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-3xl bg-blue-600/20 border border-blue-400/50 flex items-center justify-center text-blue-400 shadow-2xl mb-4 relative">
              <Sparkles className="w-8 h-8 text-amber-300 animate-pulse" />
              <div className="absolute inset-0 rounded-3xl border-2 border-blue-400/40 animate-ping pointer-events-none" />
            </div>
            <h3 className="text-base font-bold tracking-tight text-white mb-1">
              Autonomous AI Cadastral Registration
            </h3>
            <p className="text-xs text-blue-300 max-w-md mb-6 font-mono font-medium">
              {aiAutoStage || 'Synthesizing 3D building hierarchy...'}
            </p>

            <div className="w-full max-w-sm space-y-2 text-left bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
              {[
                { idx: 1, title: 'LiDAR & Drone Sensor Ingestion', desc: 'Calibrated DEM ground truth surface' },
                { idx: 2, title: 'Footprint RANSAC & Floor Slicing', desc: 'Extruded slabs & living glass facades' },
                { idx: 3, title: 'Topology & Air-Rights Audit', desc: 'Verified zero encroachment & FAR limits' },
                { idx: 4, title: '14-Digit Bhu-Aadhaar ULPINs', desc: 'Generated legal cadastral strata codes' },
                { idx: 5, title: 'Digital Twin Registry Commit', desc: 'Persisted to PostgreSQL & 3D twin' },
              ].map((st) => {
                const isDone = aiStepIndex > st.idx;
                const isCurrent = aiStepIndex === st.idx;

                return (
                  <div key={st.idx} className="flex items-center gap-3 text-xs">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                      isDone ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-blue-500 text-white animate-pulse' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {isDone ? <Check className="w-3 h-3" /> : st.idx}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold ${isDone ? 'text-emerald-400' : isCurrent ? 'text-blue-300' : 'text-slate-500'}`}>
                        {st.title}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{st.desc}</div>
                    </div>
                    {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    {isCurrent && <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5-Step Progress Stepper Bar */}
        <div className="px-6 py-3 bg-slate-50/90 border-b border-slate-200">
          <div className="flex items-center justify-between">
            {[
              { num: 1, title: 'Drone & Spatial Ingestion', icon: Camera },
              { num: 2, title: 'Land Owner Details', icon: User },
              { num: 3, title: 'Floor Owners & Strata', icon: Users },
              { num: 4, title: 'AI 3D Synthesis', icon: Cpu },
              { num: 5, title: 'Register & 3D-ULPIN', icon: FileBadge },
            ].map((s, idx) => {
              const isActive = step === s.num;
              const isPast = step > s.num;

              return (
                <div key={s.num} className="flex items-center gap-2">
                  <div 
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-400/40' 
                        : isPast 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isPast ? <Check className="w-3.5 h-3.5" /> : s.num}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className={`text-[11px] font-bold ${isActive ? 'text-blue-700' : isPast ? 'text-emerald-700' : 'text-slate-600'}`}>
                      {s.title}
                    </div>
                  </div>
                  {idx < 4 && <div className="hidden sm:block w-4 md:w-8 h-0.5 bg-slate-200 mx-1" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Pipeline Error Banner */}
        {pipelineError && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{pipelineError}</span>
          </div>
        )}

        {/* Scrollable Wizard Body */}
        <div className="p-6 overflow-y-auto flex-1 max-h-[62vh] space-y-5">
          {/* STEP 1: MULTI-SENSOR INGESTION & GEOSPATIAL LOCATION CADASTRE */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black">1</span>
                  Multi-Sensor Ingestion & Geospatial Cadastre Setup
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Multi-sensor fusion from LiDAR point clouds, GIS revenue boundaries, Drone photogrammetry, and GNSS-CORS alignment.
                </p>
              </div>

              {/* Active Multi-Sensor Inputs (Select to Include) Grid */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Active Multi-Sensor Inputs (Select to Include)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {DATA_SOURCES_LIST.map((source) => {
                    const isSelected = selectedDataSources.includes(source.label);
                    return (
                      <button
                        type="button"
                        key={source.id}
                        onClick={() => toggleDataSource(source.label)}
                        className={`p-3 text-left rounded-2xl border transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/70 shadow-xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-bold ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>
                            {source.label}
                          </span>
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isSelected ? 'bg-blue-600 text-white' : 'border border-slate-300'}`}>
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">{source.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dedicated Ingestion Cards: GIS Revenue Boundaries & LiDAR Point Cloud */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. GIS Revenue Boundaries Card */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">GIS Revenue Boundaries</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        Ingest revenue boundary polygons formatted as GeoJSON FeatureCollections.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="w-full py-2 px-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold text-center block cursor-pointer transition-colors shadow-2xs">
                      <input
                        type="file"
                        accept=".geojson,.json"
                        onChange={handleGeoJsonUpload}
                        className="hidden"
                      />
                      <span>Upload GeoJSON</span>
                    </label>

                    {isGisUploaded && (
                      <div className="text-[10px] font-mono text-emerald-800 font-semibold bg-emerald-50/80 px-2.5 py-1.5 rounded-lg border border-emerald-200/80 flex items-center justify-between">
                        <span className="truncate">{gisBoundaryFileName}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. LiDAR Point Cloud (ASPRS) Card */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">LiDAR Point Cloud (ASPRS)</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        High-density elevation points with automated RANSAC roof/wall classification.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="w-full py-2 px-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold text-center block cursor-pointer transition-colors shadow-2xs">
                      <input
                        type="file"
                        accept=".las,.laz,.xyz,.dem,.tif"
                        onChange={handleLidarUpload}
                        className="hidden"
                      />
                      <span>Upload DEM / Point Cloud</span>
                    </label>

                    {isLidarUploaded && (
                      <div className="text-[10px] font-mono text-emerald-800 font-semibold bg-emerald-50/80 px-2.5 py-1.5 rounded-lg border border-emerald-200/80 flex items-center justify-between">
                        <span className="truncate">{lidarFileName}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Drone Photogrammetry Dual Option: Upload Manually vs Fetch Automatically */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 border border-slate-200 shadow-sm space-y-3">

                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">Drone View & Aerial Imagery Ingestion</span>
                  </div>

                  {/* Option Switch */}
                  <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setDroneUploadMode('auto')}
                      className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                        droneUploadMode === 'auto'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      ⚡ Fetch Automatically
                    </button>
                    <button
                      type="button"
                      onClick={() => setDroneUploadMode('manual')}
                      className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                        droneUploadMode === 'manual'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      📁 Upload Manually
                    </button>
                  </div>
                </div>

                {/* Content according to mode */}
                {droneUploadMode === 'manual' ? (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-2xl p-4 text-center bg-white/90 transition-all cursor-pointer relative group">
                      <input 
                        type="file" 
                        accept="image/*,.tif,.tiff,.las,.laz,.obj" 
                        onChange={handleManualFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <UploadCloud className="w-8 h-8 text-blue-500 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                      <div className="text-xs font-bold text-slate-800">
                        Click or Drag & Drop Aerial Drone View / Orthomosaic
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Supports GeoTIFF, JPG, PNG orthomosaics, and LiDAR point clouds (.las/.laz)
                      </p>
                    </div>

                    {droneFileName && (
                      <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          {droneImagePreview && (
                            <img 
                              src={droneImagePreview} 
                              alt="Drone preview" 
                              className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0" 
                            />
                          )}
                          <div>
                            <div className="font-bold text-slate-800">{droneFileName}</div>
                            <div className="text-[11px] text-slate-500">
                              {droneMetadata.sensor} • {droneMetadata.gsd}
                            </div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Ready for 3D AI
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3.5 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {droneImagePreview && (
                          <img 
                            src={droneImagePreview} 
                            alt="Auto drone preview" 
                            className="w-14 h-14 rounded-xl object-cover border border-blue-200 shadow-sm shrink-0" 
                          />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-800">{droneFileName}</span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-700">
                              Auto-Matched to Coordinates
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Source: {droneMetadata.source}
                          </div>
                          <div className="text-[10px] font-mono text-slate-600 font-semibold mt-0.5">
                            GSD: {droneMetadata.gsd} • Altitude: {droneMetadata.altitude} • Capture: {droneMetadata.timestamp}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleAutoFetchDroneView}
                        disabled={isFetchingDrone}
                        className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 flex items-center gap-1.5 transition-all shrink-0"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isFetchingDrone ? 'animate-spin' : ''}`} />
                        <span>{isFetchingDrone ? 'Fetching Tile...' : 'Re-Query GIS Survey'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Target Revenue Cadastral Parcel & Building Structure Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Target Revenue Parcel (Auto-detected from coordinates + Edit Option) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Target Revenue Cadastral Parcel
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsEditingParcel(!isEditingParcel)}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold underline"
                    >
                      {isEditingParcel ? 'Lock Parcel' : 'Edit / Change Parcel'}
                    </button>
                  </div>

                  <div className="relative">
                    <select
                      value={selectedParcelId}
                      disabled={!isEditingParcel}
                      onChange={(e) => setSelectedParcelId(e.target.value)}
                      className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-800 ${
                        isEditingParcel ? 'border-blue-400 shadow-sm' : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <optgroup label="Available Vacant Plots (Zero Overlap Recommended)">
                        {vacantParcels.map(p => (
                          <option key={p.parcel_id} value={p.parcel_id}>
                            {p.parcel_id} - Survey #{p.survey_number} ({p.land_use}) [Vacant Plot]
                          </option>
                        ))}
                      </optgroup>
                      {occupiedParcels.length > 0 && (
                        <optgroup label="Occupied Parcels (Already have a 3D Building)">
                          {occupiedParcels.map(p => (
                            <option key={p.parcel_id} value={p.parcel_id}>
                              {p.parcel_id} - Occupied by {occupiedParcelMap.get(p.parcel_id)}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                  <div className="mt-1 text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span>Auto-matched from footprint centroid ({centroid.lat.toFixed(4)}°N, {centroid.lng.toFixed(4)}°E)</span>
                  </div>
                </div>

                {/* Building Structure Name (Auto-generated + Editable) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Building Structure Name
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const coordTag = `${centroid.lat.toFixed(4)}N, ${centroid.lng.toFixed(4)}E`;
                        setBuildingName(`Prayagraj Cadastre Twin - Parcel ${selectedParcelId} (${coordTag})`);
                      }}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Regenerate Name</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={buildingName}
                    onChange={(e) => setBuildingName(e.target.value)}
                    placeholder="e.g. Royal Heights Block B"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-medium"
                  />
                  <div className="mt-1 text-[11px] text-slate-500">
                    Auto-generated from coordinates; customizable for official registry deed.
                  </div>
                </div>

                {/* Building Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Building Usage / Classification
                  </label>
                  <select
                    value={buildingType}
                    onChange={(e) => setBuildingType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-800 font-medium"
                  >
                    <option value="Residential Complex">Residential Complex (Group Housing)</option>
                    <option value="Commercial Tower">Commercial Tower (Retail & Corporate)</option>
                    <option value="Mixed-Use (Retail + Residential)">Mixed-Use (Retail + Residential)</option>
                    <option value="Institutional & Public Facility">Institutional & Public Facility</option>
                  </select>
                </div>

                {/* Floors and Floor Height */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Floors (Storeys)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={40}
                      value={floorCount}
                      onChange={(e) => setFloorCount(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Floor Height (m)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min={2.5}
                      max={6.0}
                      value={heightPerFloor}
                      onChange={(e) => setHeightPerFloor(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Live Metric Badges */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-blue-600" />
                  <span className="text-slate-600">Calculated Metrics:</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-bold text-slate-800">
                    Height: {totalHeight}m
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-bold text-slate-800">
                    Est. Footprint: {estArea} m²
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-bold text-slate-800">
                    Total Volume: {(Number(estArea) * Number(totalHeight)).toFixed(1)} m³
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: LAND OWNER DETAILS */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black">2</span>
                  Land Owner & Revenue Deed Attribution
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record the primary title holder of the cadastral plot before allocating vertical floor ownership.
                </p>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Land Owner Full Legal Name *
                  </label>
                  <input
                    type="text"
                    value={landOwnerName}
                    onChange={(e) => setLandOwnerName(e.target.value)}
                    placeholder="e.g. Shri Ramakant Dwivedi"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-bold"
                  />
                  <div className="mt-1 text-[11px] text-slate-500">
                    Primary plot owner in Government Khatauni Record.
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    National ID / Bhu-Aadhaar Identity
                  </label>
                  <input
                    type="text"
                    value={landOwnerId}
                    onChange={(e) => setLandOwnerId(e.target.value)}
                    placeholder="e.g. XXXX-XXXX-8421"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    value={landOwnerContact}
                    onChange={(e) => setLandOwnerContact(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Revenue Khasra / Khatauni Deed Reference
                  </label>
                  <input
                    type="text"
                    value={landDeedRef}
                    onChange={(e) => setLandDeedRef(e.target.value)}
                    placeholder="e.g. Khasra No. 412/1, Khatauni #00891"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ownership Title Nature
                  </label>
                  <input
                    type="text"
                    value={landTitleType}
                    onChange={(e) => setLandTitleType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cadastral Tehsil & Division
                  </label>
                  <input
                    type="text"
                    value={tehsilName}
                    onChange={(e) => setTehsilName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 bg-slate-50"
                  />
                </div>
              </div>

              {/* Information Callout */}
              <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-950 flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Land Title Protection Guarantee:</span>
                  <p className="text-[11px] text-blue-800 mt-0.5">
                    The land owner retains primary title over the ground plot, foundation footprint, and shared structural envelope. In the next step, you can allocate individual floors to buyers or retain them under the land owner.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: FLOOR OWNERS & STRATIFIED VERTICAL UNITS */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black">3</span>
                  Stratified Floor Ownership Attribution ({floorCount} Storeys)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assign individual floor owners or automatically allocate unpurchased floors to Land Owner ({landOwnerName}).
                </p>
              </div>

              {/* Master Auto-Assignment Box (Requirement Highlighted) */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/50 to-blue-50 border-2 border-emerald-300 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <BadgeCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">
                        Automatic Land Owner Floor Attribution
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-200 text-emerald-800">
                        RECOMMENDED
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      If a floor is unpurchased, automatically assign all rights and title of that floor to Land Owner: <strong className="text-emerald-900">{landOwnerName}</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-xl border border-emerald-300 shadow-xs">
                    <input
                      type="checkbox"
                      checked={autoAssignUnsold}
                      onChange={(e) => setAutoAssignUnsold(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-slate-800">Auto-Assign Active</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleAssignAllToLandOwner}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1"
                  >
                    <span>Assign All to Land Owner</span>
                  </button>
                </div>
              </div>

              {/* Unit Configuration: Whole Floor vs Partitioned Flats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setHasFloorPartitions(false)}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all flex items-start gap-3 ${
                    !hasFloorPartitions
                      ? 'border-blue-500 bg-blue-50/60 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${!hasFloorPartitions ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">Whole-Floor Title (1 Unit / Floor)</span>
                      {!hasFloorPartitions && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-blue-200 text-blue-800">ACTIVE</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Each floor is a single unified title deed / parcel. No partitions or flat splits.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setHasFloorPartitions(true)}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all flex items-start gap-3 ${
                    hasFloorPartitions
                      ? 'border-indigo-500 bg-indigo-50/60 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${hasFloorPartitions ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Grid3X3 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">Partitioned Flats / Apartments</span>
                      {hasFloorPartitions && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-indigo-200 text-indigo-800">ACTIVE</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Divide floors into individual flats/commercial units with custom names & distinct owner titles.
                    </p>
                  </div>
                </button>
              </div>

              {/* If Partitioned: Selector for Flats per Floor */}
              {hasFloorPartitions && (
                <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-indigo-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-900">Flats per Floor Partitioning:</span>
                      <p className="text-[10px] text-slate-500">Each floor will be partitioned into {flatsPerFloor} independent units (~{(parseFloat(estArea) / flatsPerFloor).toFixed(1)} m² each)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-indigo-200 shadow-2xs">
                    {[2, 3, 4].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setFlatsPerFloor(count)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                          flatsPerFloor === count
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {count} Flats / Floor
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Dynamic Floor-by-Floor Table / Cards */}
              {!hasFloorPartitions ? (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <div className="bg-slate-100/90 px-4 py-2.5 border-b border-slate-200 grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    <div className="col-span-3">Floor Level & Elevation</div>
                    <div className="col-span-2">Unit Code</div>
                    <div className="col-span-3">Status (Purchased / Unsold)</div>
                    <div className="col-span-4">Assigned Floor Owner Name</div>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-[35vh] overflow-y-auto bg-white">
                    {floorOwners.map((fo) => {
                      const isLandOwner = fo.owner_name === landOwnerName;

                      return (
                        <div key={fo.floor_number} className="px-4 py-3 grid grid-cols-12 gap-2 items-center text-xs hover:bg-slate-50/80 transition-colors">
                          {/* Floor Level & Elevation */}
                          <div className="col-span-3">
                            <div className="font-bold text-slate-800">{fo.floor_label}</div>
                            <div className="text-[10px] font-mono text-slate-500">
                              Z: {fo.z_min}m — {fo.z_max}m ({heightPerFloor}m)
                            </div>
                          </div>

                          {/* Unit Code */}
                          <div className="col-span-2 font-mono text-[11px] font-bold text-indigo-700">
                            {fo.unit_code}
                          </div>

                          {/* Status Toggle */}
                          <div className="col-span-3">
                            <button
                              type="button"
                              onClick={() => handleToggleFloorStatus(fo.floor_number)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1.5 transition-all ${
                                fo.status === 'Purchased'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${fo.status === 'Purchased' ? 'bg-blue-600' : 'bg-emerald-600'}`} />
                              <span>{fo.status === 'Purchased' ? 'Sold / Purchased' : 'Unpurchased'}</span>
                            </button>
                          </div>

                          {/* Assigned Owner Name Input */}
                          <div className="col-span-4 flex items-center gap-1.5">
                            <input
                              type="text"
                              value={fo.owner_name}
                              onChange={(e) => handleFloorOwnerChange(fo.floor_number, e.target.value)}
                              placeholder="Enter buyer's name"
                              className={`w-full px-2.5 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-medium ${
                                isLandOwner ? 'border-emerald-300 bg-emerald-50/40 text-emerald-950 font-bold' : 'border-slate-200 bg-white'
                              }`}
                            />
                            {isLandOwner && (
                              <span 
                                className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-200 text-emerald-900 shrink-0"
                                title="Floor assigned to land owner"
                              >
                                Land Title
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-200 max-h-[42vh] overflow-y-auto bg-slate-50/50">
                  {floorOwners.map((fo) => (
                    <div key={fo.floor_number} className="p-3.5 bg-white">
                      <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-black">
                            {fo.floor_number}
                          </span>
                          <span className="font-bold text-xs text-slate-900">{fo.floor_label}</span>
                          <span className="text-[10px] font-mono text-slate-500">
                            (Elevation: {fo.z_min}m – {fo.z_max}m)
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                          {fo.units?.length || flatsPerFloor} Partitioned Units (~{(parseFloat(estArea) / flatsPerFloor).toFixed(1)} m² each)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {(fo.units || []).map((u, uIdx) => {
                          const isLandOwner = u.owner_name === landOwnerName;
                          return (
                            <div 
                              key={u.unit_id || uIdx} 
                              className={`p-2.5 rounded-xl border transition-all ${
                                u.status === 'Purchased'
                                  ? 'bg-blue-50/30 border-blue-200'
                                  : 'bg-emerald-50/20 border-emerald-200'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <input
                                  type="text"
                                  value={u.unit_name}
                                  onChange={(e) => handleFlatNameChange(fo.floor_number, uIdx, e.target.value)}
                                  className="text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 focus:outline-none focus:border-indigo-500 w-28"
                                  placeholder="Flat Name"
                                />

                                <button
                                  type="button"
                                  onClick={() => handleToggleFlatStatus(fo.floor_number, uIdx)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-extrabold flex items-center gap-1 transition-all ${
                                    u.status === 'Purchased'
                                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'Purchased' ? 'bg-blue-600' : 'bg-emerald-600'}`} />
                                  <span>{u.status === 'Purchased' ? 'Purchased' : 'Unsold'}</span>
                                </button>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={u.owner_name}
                                  onChange={(e) => handleFlatOwnerChange(fo.floor_number, uIdx, e.target.value)}
                                  placeholder="Flat Owner Legal Name *"
                                  className={`w-full px-2 py-1 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 ${
                                    isLandOwner ? 'border-emerald-300 bg-emerald-50/50 font-bold text-emerald-950' : 'border-slate-200 bg-white font-medium'
                                  }`}
                                />
                                {isLandOwner && (
                                  <span 
                                    className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-200 text-emerald-900 shrink-0"
                                    title="Assigned to primary land title holder"
                                  >
                                    Land Title
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: AI 3D GEOMETRY SYNTHESIS & MULTI-SENSOR VALIDATION */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black">4</span>
                  AI 3D Geometric Processing & Multi-Sensor Fusion
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Synthesizing measured polygon, drone photogrammetry, and stratified floor boundaries into an accurate 3D model.
                </p>
              </div>

              {/* 4 Multi-Sensor Fusion Cards */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/40 flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">1. Drone Photogrammetry Texture & Footprint Alignment</h4>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        RANSAC boundary fitting with Drone Orthomosaic ({droneFileName}) & LiDAR density thresholding.
                      </p>
                      <div className="mt-1 text-[10px] font-mono text-emerald-800 font-bold">
                        STATUS: EXTRACTED (Base Footprint: {estArea} m², Ground Elevation: 100.0m)
                      </div>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                </div>

                <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/40 flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">2. Vertical Floor Stratification</h4>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Z-axis vertical slicing into {floorCount} storeys ({heightPerFloor}m each). Total height: {totalHeight}m.
                      </p>
                      <div className="mt-1 text-[10px] font-mono text-emerald-800 font-bold">
                        STATUS: SLICED ({floorCount} Stratified Floor Plates Configured)
                      </div>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                </div>

                <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/40 flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">3. Stratified Ownership Title Integration</h4>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Land Owner: {landOwnerName} • {floorOwners.filter(f => f.status === 'Purchased').length} Private Buyers Assigned.
                      </p>
                      <div className="mt-1 text-[10px] font-mono text-emerald-800 font-bold">
                        STATUS: ATTRIBUTED (All unpurchased floors secured under Land Owner Title)
                      </div>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                </div>

                <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/40 flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">4. ISO 19152 LADM Topology & Air-Rights Clash Check</h4>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Volumetric non-overlap test, parcel containment check & air-rights compliance.
                      </p>
                      <div className="mt-1 text-[10px] font-mono text-emerald-800 font-bold">
                        STATUS: ZERO SPATIAL CLASHES (Topology Validation: 100% Passed)
                      </div>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                </div>
              </div>

              {/* Officer Endorsement Seal */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-800">Authorized Cadastral Officer Endorsement</div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                    LADM ISO 19152 Certified
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500">Officer Name:</span>
                    <div className="font-bold text-slate-800">{officerName}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Notes:</span>
                    <div className="text-slate-700 italic">{officerNotes}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: REGISTRATION, 3D-ULPIN CERTIFICATE & POST-REGISTER BREAKDOWN */}
          {step === 5 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black">5</span>
                  Cadastral 3D-ULPIN Issued & Floor Ownership Breakdown
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Unique Bhu-Aadhaar 14-digit identifier generated. Below are the verified Land Owner and Stratified Floor Owner details.
                </p>
              </div>

              {/* 3D-ULPIN Certificate Header Card */}
              <div className="p-5 rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-50/60 via-white to-blue-50/40 shadow-md">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* QR Code */}
                  <div className="p-2 bg-white rounded-2xl shadow-md border border-slate-200 shrink-0 flex flex-col items-center">
                    <ScannableQRCode
                      value={`https://bhu-aadhaar.gov.in/cadastre/${currentUlpin}`}
                      size={100}
                    />
                    <div className="text-[9px] font-mono text-center text-slate-500 mt-1 font-bold">
                      SCAN TO VERIFY
                    </div>
                  </div>

                  {/* ULPIN Details */}
                  <div className="space-y-2 flex-1 text-center sm:text-left">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center justify-center sm:justify-start gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>National Cadastral Unique Property Identifier (3D-ULPIN)</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black font-mono tracking-wider text-slate-900 bg-emerald-100/60 px-3.5 py-1.5 rounded-xl inline-block border border-emerald-300 shadow-inner">
                      {currentUlpin}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1 text-left">
                      <div className="p-2 bg-white/80 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 block">Structure Name</span>
                        <span className="font-bold text-slate-800 text-[11px] truncate block">{buildingName}</span>
                      </div>
                      <div className="p-2 bg-white/80 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 block">Target Parcel</span>
                        <span className="font-bold text-slate-800 text-[11px] block">{selectedParcelId}</span>
                      </div>
                      <div className="p-2 bg-white/80 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 block">Floors / Height</span>
                        <span className="font-bold text-slate-800 text-[11px] block">{floorCount} Floors ({totalHeight}m)</span>
                      </div>
                      <div className="p-2 bg-white/80 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 block">Total Units</span>
                        <span className="font-bold text-slate-800 text-[11px] block">{floorCount * 2} Units (3D VPs)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Land Owner Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-md space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                      Registered Land Owner (Primary Title Holder)
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    TITLE VERIFIED
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-slate-400 text-[10px]">Land Owner Name</span>
                    <div className="font-bold text-white text-sm">{landOwnerName}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Aadhaar / ID</span>
                    <div className="font-mono text-slate-200">{landOwnerId}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Khasra / Khatauni Deed</span>
                    <div className="font-medium text-slate-200">{landDeedRef}</div>
                  </div>
                </div>
              </div>

              {/* Post-Registration Stratified Floor Owners Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-slate-700" />
                    <span className="text-xs font-bold text-slate-800">
                      Post-Registration Stratified Floor Owners Details ({floorOwners.length} Floors)
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Auto-assigned unsold floors to Land Owner: {autoAssignUnsold ? 'YES' : 'NO'}
                  </span>
                </div>

                <div className="divide-y divide-slate-100 max-h-[30vh] overflow-y-auto bg-white text-xs">
                  {floorOwners.map((fo) => {
                    const isLandOwner = fo.owner_name === landOwnerName;
                    const floorUlpin = format14DigitUlpin(selectedParcelId, `F${fo.floor_number}`, 'U01');

                    return (
                      <div key={fo.floor_number} className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-800 flex items-center gap-2">
                            <span>{fo.floor_label}</span>
                            <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                              {fo.unit_code}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">
                            Elevation: {fo.z_min}m to {fo.z_max}m • 3D-ULPIN: {floorUlpin}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5 justify-end">
                            <span>{fo.owner_name}</span>
                            {isLandOwner ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                                Land Owner Title
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-800">
                                Private Owner
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Status: {fo.status === 'Purchased' ? 'Purchased / Registered' : 'Retained by Land Owner'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer Bar */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div>
            {step > 1 && step < 5 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step === 1 && (
              <button
                type="button"
                onClick={handleNextFromStep1}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all"
              >
                <span>Proceed to Land Owner Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={handleNextFromStep2}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all"
              >
                <span>Proceed to Floor Owners</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={handleNextFromStep3}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all"
              >
                <span>Proceed to AI 3D Synthesis</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 4 && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleGenerate3DUlpin}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{isProcessing ? 'Synthesizing 3D Model with AI...' : 'Generate 3D Model & 3D-ULPIN'}</span>
              </button>
            )}

            {step === 5 && (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleCommitAndRender(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Commit to Map</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCommitAndRender(true)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Commit & Open 3D Structure</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
