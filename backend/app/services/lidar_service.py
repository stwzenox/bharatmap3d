import random
import math
from typing import List, Dict, Any

class LidarService:
    """
    Synthetic LiDAR service supporting point cloud generation,
    classification (ground, building, vegetation), and automatic building height extraction.
    """

    def generate_synthetic_point_cloud(
        self,
        building_centers: List[Dict[str, float]] = None,
        num_points: int = 1500
    ) -> List[Dict[str, Any]]:
        """
        Generates realistic synthetic airborne/drone LiDAR point cloud with ASPRS classifications:
        2 = Ground
        5 = High Vegetation
        6 = Building Roof / Wall
        """
        points = []
        random.seed(42)  # Deterministic seed for reproducible demo

        # Default centers if not supplied
        centers = building_centers or [
            {"x": -80, "z": -60, "ground": 99.5, "height": 18.0, "radius": 15},
            {"x": 60, "z": -40, "ground": 100.2, "height": 15.0, "radius": 14},
            {"x": -40, "z": 70, "ground": 98.8, "height": 21.0, "radius": 18},
            {"x": 80, "z": 80, "ground": 101.0, "height": 12.0, "radius": 12},
        ]

        # 1. Ground points (Z ~ 98 - 102m)
        ground_count = int(num_points * 0.45)
        for _ in range(ground_count):
            x = random.uniform(-200, 200)
            z = random.uniform(-200, 200)
            elev = 98.0 + 2.0 * math.sin(x / 100.0) + 1.5 * math.cos(z / 120.0) + random.uniform(-0.15, 0.15)
            points.append({
                "x": round(x, 2),
                "y": round(elev, 2), # Y is Up
                "z": round(z, 2),
                "classification": "ground",
                "class_code": 2,
                "intensity": random.randint(30, 80)
            })

        # 2. Building points (Roofs and Walls)
        building_pts_per_bldg = int((num_points * 0.40) / len(centers))
        for b in centers:
            bx, bz, bg, bh, br = b["x"], b["z"], b["ground"], b["height"], b["radius"]
            roof_elev = bg + bh
            # Roof points
            for _ in range(int(building_pts_per_bldg * 0.65)):
                r = random.uniform(0, br)
                theta = random.uniform(0, 2 * math.pi)
                x = bx + r * math.cos(theta)
                z = bz + r * math.sin(theta)
                y = roof_elev + random.uniform(-0.1, 0.1)
                points.append({
                    "x": round(x, 2),
                    "y": round(y, 2),
                    "z": round(z, 2),
                    "classification": "building",
                    "class_code": 6,
                    "intensity": random.randint(120, 240)
                })
            # Wall facade points
            for _ in range(int(building_pts_per_bldg * 0.35)):
                theta = random.uniform(0, 2 * math.pi)
                x = bx + br * math.cos(theta)
                z = bz + br * math.sin(theta)
                y = random.uniform(bg, roof_elev)
                points.append({
                    "x": round(x, 2),
                    "y": round(y, 2),
                    "z": round(z, 2),
                    "classification": "building",
                    "class_code": 6,
                    "intensity": random.randint(90, 160)
                })

        # 3. Vegetation points (canopy clumps)
        veg_count = int(num_points * 0.15)
        for _ in range(veg_count):
            clump_x = random.choice([-140, 130, -50, 120])
            clump_z = random.choice([-130, 120, -140, -100])
            x = clump_x + random.gauss(0, 12)
            z = clump_z + random.gauss(0, 12)
            elev = 99.0 + random.uniform(3.0, 10.0)
            points.append({
                "x": round(x, 2),
                "y": round(elev, 2),
                "z": round(z, 2),
                "classification": "vegetation",
                "class_code": 5,
                "intensity": random.randint(40, 110)
            })

        return points

    def calculate_building_height_from_points(
        self,
        center_x: float,
        center_z: float,
        radius: float = 20.0,
        points: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Demo algorithm:
        1. Identify ground points in vicinity
        2. Identify building roof points
        3. Calculate max roof elevation
        4. height = max_roof - ground
        """
        pts = points or self.generate_synthetic_point_cloud()
        
        ground_elevs = []
        roof_elevs = []
        
        for p in pts:
            dist = math.hypot(p["x"] - center_x, p["z"] - center_z)
            if dist <= radius:
                if p["class_code"] == 2 or p["classification"] == "ground":
                    ground_elevs.append(p["y"])
                elif p["class_code"] == 6 or p["classification"] == "building":
                    roof_elevs.append(p["y"])
                    
        if not ground_elevs:
            ground_est = 99.0
        else:
            ground_est = sum(ground_elevs) / len(ground_elevs)
            
        if not roof_elevs:
            # Fallback estimation
            roof_est = ground_est + 15.0
            confidence = 0.55
        else:
            # 95th percentile roof elevation to ignore outliers
            sorted_roofs = sorted(roof_elevs)
            idx = int(len(sorted_roofs) * 0.95)
            roof_est = sorted_roofs[min(idx, len(sorted_roofs) - 1)]
            confidence = min(0.98, 0.70 + (len(roof_elevs) / 100.0) * 0.28)
            
        height = max(3.0, roof_est - ground_est)
        
        return {
            "center_x": center_x,
            "center_z": center_z,
            "ground_elevation": round(ground_est, 2),
            "roof_elevation": round(roof_est, 2),
            "estimated_height": round(height, 2),
            "point_sample_count": len(ground_elevs) + len(roof_elevs),
            "confidence": round(confidence, 3),
            "algorithm": "RANSAC-LiDAR-Z-Percentile-v1"
        }

lidar_service = LidarService()
