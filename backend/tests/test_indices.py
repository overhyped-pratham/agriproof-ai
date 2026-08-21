import pytest
import numpy as np
from app.services.satellite.indices import (
    calculate_ndvi, calculate_evi, calculate_savi, 
    calculate_gndvi, calculate_ndwi, calculate_ndmi
)

def test_calculate_ndvi():
    nir = np.array([0.5, 0.8, 0.2])
    red = np.array([0.1, 0.2, 0.2])
    # (0.5-0.1)/(0.5+0.1) = 0.666
    # (0.8-0.2)/(0.8+0.2) = 0.6
    # (0.2-0.2)/(0.2+0.2) = 0.0
    expected = np.array([0.66666667, 0.6, 0.0])
    np.testing.assert_allclose(calculate_ndvi(nir, red), expected, rtol=1e-5)

def test_calculate_evi():
    nir = np.array([0.8])
    red = np.array([0.1])
    blue = np.array([0.05])
    # 2.5 * (0.8 - 0.1) / (0.8 + 6*0.1 - 7.5*0.05 + 1) = 2.5 * 0.7 / (0.8 + 0.6 - 0.375 + 1) = 1.75 / 2.025 = 0.8641975
    expected = np.array([0.86419753])
    np.testing.assert_allclose(calculate_evi(nir, red, blue), expected, rtol=1e-5)

def test_calculate_ndwi():
    green = np.array([0.15])
    nir = np.array([0.4])
    # (0.15 - 0.4) / (0.15 + 0.4) = -0.25 / 0.55 = -0.454545
    expected = np.array([-0.45454545])
    np.testing.assert_allclose(calculate_ndwi(green, nir), expected, rtol=1e-5)
