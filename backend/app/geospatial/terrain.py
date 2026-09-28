import math
from typing import List, Dict, Any, Tuple
from app.config import settings

class TerrainService:
    def __init__(self, size: float = 2500.0, resolution: int = 50, base_elevation: float = 98.0):
        self.size = size  # 2500 meters (covers 2.5km x 2.5km matching 2D map)
        self.resolution = resolution  # 50x50 grid points
        self.base_elevation = base_elevation
        self.grid = self._generate_terrain_grid()

    def _generate_terrain_grid(self) -> List[Dict[str, Any]]:
        """
        Generates a 50x50 elevation grid around local metric (0, 0).
        Coordinates range from -1250m to +1250m.
        """
        step = self.size / (self.resolution - 1)
        grid = []
        for i in range(self.resolution):
            z = -self.size / 2.0 + i * step
            for j in range(self.resolution):
                x = -self.size / 2.0 + j * step
                # Gentle natural gradient + subtle undulating variations across 2.5km
                elev = (
                    self.base_elevation
                    + 3.0 * math.sin(x / 400.0)
                    + 2.0 * math.cos(z / 450.0)
                    + 0.001 * (x + z)
                )
                grid.append({
                    "i": i,
                    "j": j,
                    "x": round(x, 2),
                    "z": round(z, 2),
                    "elevation": round(elev, 2)
                })
        return grid

    def get_elevation_at(self, x: float, z: float) -> float:
        """
        Bilinear interpolation to get ground elevation at any metric (x, z).
        """
        step = self.size / (self.resolution - 1)
        half_size = self.size / 2.0
        
        # Clamp to bounds
        clamped_x = max(-half_size, min(half_size, x))
        clamped_z = max(-half_size, min(half_size, z))
        
        gx = (clamped_x + half_size) / step
        gz = (clamped_z + half_size) / step
        
        j0 = min(int(gx), self.resolution - 2)
        i0 = min(int(gz), self.resolution - 2)
        j1 = j0 + 1
        i1 = i0 + 1
        
        tx = gx - j0
        tz = gz - i0
        
        def elev_at(i, j):
            return self.grid[i * self.resolution + j]["elevation"]
            
        e00 = elev_at(i0, j0)
        e10 = elev_at(i0, j1)
        e01 = elev_at(i1, j0)
        e11 = elev_at(i1, j1)
        
        top = (1 - tx) * e00 + tx * e10
        bottom = (1 - tx) * e01 + tx * e11
        return round((1 - tz) * top + tz * bottom, 2)

    def get_grid_data(self) -> Dict[str, Any]:
        return {
            "size": self.size,
            "resolution": self.resolution,
            "points": self.grid
        }

terrain_service = TerrainService()
