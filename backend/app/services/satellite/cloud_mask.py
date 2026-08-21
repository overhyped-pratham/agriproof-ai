import numpy as np

class CloudMaskService:
    def __init__(self):
        pass
    
    def compute_cloud_mask(self, bands_stack: np.ndarray) -> np.ndarray:
        # Dummy cloud masking, simply generating random probabilities
        if len(bands_stack.shape) == 4:
            T, H, W, C = bands_stack.shape
            return np.random.uniform(0, 1, (H, W))
        return np.random.uniform(0, 1, (64, 64))
    
    def apply_mask(self, band_data: np.ndarray, cloud_mask: np.ndarray, threshold: float = 0.4) -> np.ndarray:
        masked_data = np.copy(band_data)
        masked_data[cloud_mask > threshold] = np.nan
        return masked_data
