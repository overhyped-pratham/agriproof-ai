import httpx
from datetime import datetime, timedelta, date

BASE_URL = "https://api.open-meteo.com/v1"

CROP_TYPE_MAP = {
    "wheat": 0,
    "rice": 1,
    "soybean": 2,
    "corn": 3,
    "cotton": 4,
}


class WeatherRiskEngine:
    async def fetch_weather_data(
        self,
        lat: float,
        lon: float,
        start_date: str,
        end_date: str
    ) -> dict:
        """Fetch historical weather data from Open-Meteo archive API."""
        url = f"{BASE_URL}/archive"
        params = {
            "latitude": lat,
            "longitude": lon,
            "start_date": start_date,
            "end_date": end_date,
            "daily": "precipitation_sum,temperature_2m_max,temperature_2m_min,relative_humidity_2m_max",
            "timezone": "auto",
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            return resp.json().get("daily", {})

    async def compute_risk_scores(self, lat: float, lon: float) -> dict:
        """
        Fetches real 30-day weather data from Open-Meteo and computes
        drought/flood/heat risk scores based on actual observations.
        """
        today = date.today()
        start = (today - timedelta(days=30)).isoformat()
        end = today.isoformat()

        # Historical baseline: same 30-day window 5 years ago
        baseline_start = (today - timedelta(days=30 + 365 * 5)).isoformat()
        baseline_end = (today - timedelta(days=365 * 5)).isoformat()

        try:
            recent = await self.fetch_weather_data(lat, lon, start, end)
            baseline = await self.fetch_weather_data(lat, lon, baseline_start, baseline_end)
        except Exception as e:
            print(f"[WeatherRiskEngine] Open-Meteo API error: {e}. Using fallback.")
            return self._fallback_scores()

        # -- Rainfall --
        recent_rain = recent.get("precipitation_sum", [])
        baseline_rain = baseline.get("precipitation_sum", [])
        rainfall_mm_30d = sum(v for v in recent_rain if v is not None)
        baseline_mm_30d = sum(v for v in baseline_rain if v is not None)

        if baseline_mm_30d > 0:
            rainfall_anomaly_pct = ((rainfall_mm_30d - baseline_mm_30d) / baseline_mm_30d) * 100
        else:
            rainfall_anomaly_pct = 0.0

        # -- Temperature --
        max_temps = [v for v in recent.get("temperature_2m_max", []) if v is not None]
        min_temps = [v for v in recent.get("temperature_2m_min", []) if v is not None]
        all_temps = max_temps + min_temps
        temperature_mean = sum(all_temps) / len(all_temps) if all_temps else 25.0
        heat_stress_score = min(1.0, max(0.0, (temperature_mean - 30.0) / 15.0))

        # -- Humidity --
        humidity_vals = [v for v in recent.get("relative_humidity_2m_max", []) if v is not None]
        humidity_mean = sum(humidity_vals) / len(humidity_vals) if humidity_vals else 50.0

        # -- Drought / Flood risk --
        drought_risk = min(1.0, max(0.0, (-rainfall_anomaly_pct / 100.0) * 0.7 + heat_stress_score * 0.3))
        flood_risk = min(1.0, max(0.0, (rainfall_anomaly_pct / 100.0) * 0.8))

        overall_environmental_risk = self._classify_risk(max(drought_risk, flood_risk))

        return {
            "drought_risk": round(drought_risk, 4),
            "flood_risk": round(flood_risk, 4),
            "heat_stress": round(heat_stress_score, 4),
            "rainfall_mm_30d": round(rainfall_mm_30d, 2),
            "rainfall_anomaly_pct": round(rainfall_anomaly_pct, 2),
            "rain_anomaly_scaled": int(abs(rainfall_anomaly_pct) * 100),
            "temperature_mean": round(temperature_mean, 2),
            "humidity_mean": round(humidity_mean, 2),
            "overall_environmental_risk": overall_environmental_risk,
        }

    def _classify_risk(self, score: float) -> str:
        if score <= 0.3:
            return "LOW"
        elif score <= 0.6:
            return "MEDIUM"
        elif score <= 0.8:
            return "HIGH"
        else:
            return "CRITICAL"

    def _fallback_scores(self) -> dict:
        """Safe fallback when Open-Meteo is unreachable."""
        return {
            "drought_risk": 0.5,
            "flood_risk": 0.1,
            "heat_stress": 0.4,
            "rainfall_mm_30d": 30.0,
            "rainfall_anomaly_pct": -20.0,
            "rain_anomaly_scaled": 2000,
            "temperature_mean": 28.0,
            "humidity_mean": 50.0,
            "overall_environmental_risk": "MEDIUM",
        }
