from abc import ABC, abstractmethod
from typing import List, Dict, Any, Tuple
import math

class BuildingExtractionService(ABC):
    """Abstract interface for AI building footprint extraction (e.g. Segment Anything Model / YOLOv8-OBB)"""
    @abstractmethod
    def extract_footprints(self, raster_or_polygon_input: Any) -> List[Dict[str, Any]]:
        pass

class FloorSegmentationService(ABC):
    """Abstract interface for AI floor height and facade segmentation (e.g., Mask2Former / PointNet++)"""
    @abstractmethod
    def segment_floors(self, building_id: str, height: float, floor_count: int, ground_elev: float) -> List[Dict[str, Any]]:
        pass

class PointCloudClassificationService(ABC):
    """Abstract interface for 3D point cloud classification (e.g. RandLA-Net / Point Transformer)"""
    @abstractmethod
    def classify_points(self, raw_points: List[Tuple[float, float, float]]) -> List[Dict[str, Any]]:
        pass


class BuildingExtractionServiceDemo(BuildingExtractionService):
    """
    Deterministic demo implementation mimicking SAM / Geospatial AI pipeline.
    Identifies building candidate footprints within parcel boundaries.
    """
    def extract_footprints(self, raster_or_polygon_input: Any) -> List[Dict[str, Any]]:
        return [
            {
                "model": "Segment-Anything-Geospatial-v2-Demo",
                "detected_buildings": 8,
                "confidence_avg": 0.942,
                "status": "Ready for 3D extrusion"
            }
        ]

class FloorSegmentationServiceDemo(FloorSegmentationService):
    """
    Deterministic demo implementation calculating vertical floor divisions and apartment subdivisions.
    """
    def segment_floors(self, building_id: str, height: float, floor_count: int, ground_elev: float) -> List[Dict[str, Any]]:
        if floor_count <= 0 or height <= 0:
            return []
        floor_h = height / floor_count
        floors = []
        for i in range(floor_count):
            z_min = round(ground_elev + i * floor_h, 2)
            z_max = round(ground_elev + (i + 1) * floor_h, 2)
            floors.append({
                "floor_number": i + 1,
                "floor_id": f"{building_id}_F{i + 1:02d}",
                "z_min": z_min,
                "z_max": z_max,
                "floor_height": round(floor_h, 2)
            })
        return floors

class PointCloudClassificationServiceDemo(PointCloudClassificationService):
    """
    Deterministic rule-based point cloud classifier.
    Classes: 1 = Unassigned, 2 = Ground, 5 = High Vegetation, 6 = Building Roof/Wall.
    """
    def classify_points(self, raw_points: List[Tuple[float, float, float]]) -> List[Dict[str, Any]]:
        classified = []
        for x, y, z in raw_points:
            # y is elevation in local ENU
            if y < 99.0:
                cls_name = "Ground"
                cls_code = 2
            elif y > 105.0 and math.sqrt(x**2 + z**2) > 180:
                cls_name = "Vegetation"
                cls_code = 5
            elif y >= 100.0:
                cls_name = "Building"
                cls_code = 6
            else:
                cls_name = "Ground"
                cls_code = 2
            classified.append({
                "x": round(x, 2),
                "y": round(y, 2),
                "z": round(z, 2),
                "class_code": cls_code,
                "class_name": cls_name
            })
        return classified

building_ai = BuildingExtractionServiceDemo()
floor_ai = FloorSegmentationServiceDemo()
pointcloud_ai = PointCloudClassificationServiceDemo()
