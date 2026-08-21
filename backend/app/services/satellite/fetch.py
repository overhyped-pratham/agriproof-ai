import numpy as np
from datetime import datetime, timedelta

class SatelliteDataFetcher:
    def __init__(self, use_mock: bool = True):
        self.use_mock = use_mock
        
    async def fetch_time_series(
        self, 
        center_lat: float, 
        center_lon: float,
        start_date: str,
        end_date: str,
        n_observations: int = 12
    ) -> list[dict]:
        if self.use_mock:
            return self._generate_mock_data(start_date, end_date, n_observations)
        else:
            # Implement Sentinel Hub logic here
            return self._generate_mock_data(start_date, end_date, n_observations)

    def _generate_mock_data(self, start_date: str, end_date: str, n_observations: int) -> list[dict]:
        observations = []
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")
        step = (end - start) / max(1, n_observations - 1)
        
        for i in range(n_observations):
            obs_date = start + step * i
            
            # Base reflections for vegetation
            b02 = np.random.normal(0.04, 0.01, (64, 64))
            b03 = np.random.normal(0.06, 0.01, (64, 64))
            b04 = np.random.normal(0.05, 0.01, (64, 64))
            b08 = np.random.normal(0.35, 0.05, (64, 64))
            b11 = np.random.normal(0.15, 0.02, (64, 64))
            b12 = np.random.normal(0.08, 0.01, (64, 64))
            
            # Simulate a drop in NDVI at the end for drought stress
            if i >= n_observations - 3:
                b04 = b04 * 2.0  # Higher red reflectance
                b08 = b08 * 0.6  # Lower NIR reflectance
            
            observations.append({
                "date": obs_date.strftime("%Y-%m-%d"),
                "cloud_cover": np.random.uniform(0, 20),
                "bands": {
                    "B02": b02,
                    "B03": b03,
                    "B04": b04,
                    "B08": b08,
                    "B11": b11,
                    "B12": b12
                }
            })
        return observations
