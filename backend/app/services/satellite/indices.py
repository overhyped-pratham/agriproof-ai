import numpy as np

def calculate_ndvi(nir: np.ndarray, red: np.ndarray) -> np.ndarray:
    denominator = nir + red
    return np.divide(nir - red, denominator, out=np.zeros_like(nir, dtype=float), where=denominator != 0)

def calculate_evi(nir: np.ndarray, red: np.ndarray, blue: np.ndarray) -> np.ndarray:
    denominator = nir + 6 * red - 7.5 * blue + 1
    return np.divide(2.5 * (nir - red), denominator, out=np.zeros_like(nir, dtype=float), where=denominator != 0)

def calculate_savi(nir: np.ndarray, red: np.ndarray, L: float = 0.5) -> np.ndarray:
    denominator = nir + red + L
    return np.divide((1 + L) * (nir - red), denominator, out=np.zeros_like(nir, dtype=float), where=denominator != 0)

def calculate_gndvi(nir: np.ndarray, green: np.ndarray) -> np.ndarray:
    denominator = nir + green
    return np.divide(nir - green, denominator, out=np.zeros_like(nir, dtype=float), where=denominator != 0)

def calculate_ndwi(green: np.ndarray, nir: np.ndarray) -> np.ndarray:
    denominator = green + nir
    return np.divide(green - nir, denominator, out=np.zeros_like(green, dtype=float), where=denominator != 0)

def calculate_ndmi(nir: np.ndarray, swir: np.ndarray) -> np.ndarray:
    denominator = nir + swir
    return np.divide(nir - swir, denominator, out=np.zeros_like(nir, dtype=float), where=denominator != 0)

def calculate_bsi(swir: np.ndarray, red: np.ndarray, nir: np.ndarray, blue: np.ndarray) -> np.ndarray:
    """Bare Soil Index (BSI) = ((SWIR + Red) - (NIR + Blue)) / ((SWIR + Red) + (NIR + Blue))"""
    numerator = (swir + red) - (nir + blue)
    denominator = (swir + red) + (nir + blue)
    return np.divide(numerator, denominator, out=np.zeros_like(nir, dtype=float), where=denominator != 0)

def compute_all_indices(bands: dict) -> dict:
    b02 = bands.get("B02", np.zeros(1))
    b03 = bands.get("B03", np.zeros(1))
    b04 = bands.get("B04", np.zeros(1))
    b08 = bands.get("B08", np.zeros(1))
    b11 = bands.get("B11", np.zeros(1))

    return {
        "ndvi": calculate_ndvi(b08, b04),
        "evi": calculate_evi(b08, b04, b02),
        "savi": calculate_savi(b08, b04),
        "gndvi": calculate_gndvi(b08, b03),
        "ndwi": calculate_ndwi(b03, b08),
        "ndmi": calculate_ndmi(b08, b11),
        "bsi": calculate_bsi(b11, b04, b08, b02),
    }

def mean_index(index_array: np.ndarray) -> float:
    return float(np.nanmean(index_array)) if not np.isnan(np.nanmean(index_array)) else 0.0
