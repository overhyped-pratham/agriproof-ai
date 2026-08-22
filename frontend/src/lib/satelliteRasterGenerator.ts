/**
 * Procedural Satellite Multi-Spectral Raster Generator
 * Generates high-fidelity satellite earth observation canvases matching
 * professional remote-sensing tools (Sentinel Hub, PlanetScope, EOS Crop Monitoring).
 *
 * Supports:
 * - Vegetation Indices: NDVI, EVI, NDRE, MSAVI, RECI
 * - Moisture & Water Indices: NDWI, NDMI, SAVI, BSI
 * - Cloud & Shadow Detection: s2cloudless probability mask
 * - Parametric Loss: Marching Squares / Threshold Damage Segmentation Mask
 * - True Color RGB & False Color CIR
 */

function hash2d(ix: number, iy: number, seed: number): number {
  let n = ix * 374761393 + iy * 668265263 + seed * 1274126177;
  n = (n ^ (n >> 13)) * 1274126177;
  n = n ^ (n >> 16);
  return (n & 0x7fffffff) / 0x7fffffff;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function valueNoise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = smoothstep(x - ix);
  const fy = smoothstep(y - iy);

  const v00 = hash2d(ix, iy, seed);
  const v10 = hash2d(ix + 1, iy, seed);
  const v01 = hash2d(ix, iy + 1, seed);
  const v11 = hash2d(ix + 1, iy + 1, seed);

  return lerp(lerp(v00, v10, fx), lerp(v01, v11, fx), fy);
}

function fbm(x: number, y: number, seed: number, octaves = 5): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * valueNoise(x * frequency, y * frequency, seed + i * 37);
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  return value;
}

// ── Color Palettes for Various Remote Sensing Indices ──────────────────────────

// NDVI: Red/Orange (0.1 - 0.3), Yellow (0.4 - 0.55), Green (0.6 - 0.9)
const NDVI_PALETTE: [number, number[]][] = [
  [0.0,  [180, 40, 30]],   // Severe bare/dead
  [0.25, [230, 110, 40]],  // Drought stress / scorched
  [0.45, [245, 215, 65]],  // Moderate vegetation
  [0.65, [110, 200, 50]],  // Vigorous crop
  [0.85, [30, 150, 45]],   // Dense lush canopy
  [1.0,  [15, 100, 30]],   // Peak biomass
];

// EVI: Enhanced Vegetation Index (Vibrant emerald to deep jungle green with subtle blue NIR tint)
const EVI_PALETTE: [number, number[]][] = [
  [0.0,  [160, 50, 40]],   // Soil / Low EVI
  [0.25, [210, 140, 40]],  // Sparse canopy
  [0.5,  [175, 220, 50]],  // Moderate EVI
  [0.75, [35, 195, 80]],   // High biomass
  [1.0,  [10, 130, 90]],   // Saturated high-index canopy
];

// NDWI: Water & Leaf Moisture Index (Cyan to deep royal navy moisture)
const NDWI_PALETTE: [number, number[]][] = [
  [0.0,  [210, 140, 90]],  // Dry arid soil
  [0.25, [180, 190, 150]], // Marginal moisture
  [0.5,  [90, 190, 220]],  // Moderate water content
  [0.75, [30, 130, 220]],  // High surface moisture / canal
  [1.0,  [10, 60, 170]],   // Saturated open water
];

// NDMI: Pale lilac to deep saturated moisture blue
const NDMI_PALETTE: [number, number[]][] = [
  [0.0,  [220, 215, 235]], // Severe water deficit
  [0.3,  [185, 180, 225]], // Low moisture
  [0.55, [145, 150, 215]], // Moderate canopy water
  [0.8,  [90, 110, 200]],  // High moisture
  [1.0,  [45, 65, 170]],   // Saturated canopy
];

// Cloud Mask Palette: Crisp White / Light Cyan Clouds with dark shadow buffer
const CLOUDMASK_PALETTE: [number, number[]][] = [
  [0.0,  [20, 30, 40]],    // Clear sky (transparent in rendering)
  [0.4,  [40, 50, 70]],    // Thin haze
  [0.7,  [180, 215, 240]], // Cloud boundary
  [0.9,  [240, 250, 255]], // Dense cumulus cloud
  [1.0,  [255, 255, 255]], // Saturated cloud core
];

// Threshold Mask: Binary failure segmentation (Bright Red = Loss triggered, Dark Slate = Intact)
const THRESHOLD_PALETTE: [number, number[]][] = [
  [0.0,  [239, 68, 68]],   // Severe damage / Trigger met (<0.30 NDVI)
  [0.35, [249, 115, 22]],  // Borderline stress (0.30 - 0.40 NDVI)
  [0.55, [30, 41, 59]],    // Normal intact crop
  [1.0,  [15, 23, 42]],    // Healthy baseline
];

// CIR False-Color (NIR, Red, Green): Magenta/Pink healthy, Cyan/Gray bare
const CIR_PALETTE: [number, number[]][] = [
  [0.0,  [120, 135, 150]], // Bare soil / urban
  [0.3,  [160, 90, 120]],  // Stressed canopy
  [0.6,  [210, 55, 95]],   // Moderate vigor
  [0.85, [245, 30, 80]],   // Vivid pink peak NIR
  [1.0,  [180, 15, 60]],   // Dense foliage
];

// Classified False-Color (Urban blue, low vigor amber, high vigor green)
const FALSECOLOR_PALETTE: [number, number[]][] = [
  [0.0,  [59, 130, 246]],  // Water/Bare Soil
  [0.25, [239, 68, 68]],   // Severe Deficit (Red)
  [0.50, [234, 179, 8]],   // Moderate Stress (Yellow/Orange)
  [0.75, [34, 197, 94]],   // High Vigor (Green)
  [1.0,  [16, 185, 129]],  // Peak Biomass (Emerald)
];

// OneSoil-Style 3D Productivity Variability (Low = Crimson/Orange, Medium = Gold, High = Green)
const VARIABILITY_PALETTE: [number, number[]][] = [
  [0.0,  [220, 38, 38]],   // Low Productivity Zone (Red)
  [0.35, [249, 115, 22]],  // Lower-Mid Zone (Orange)
  [0.55, [234, 179, 8]],   // Medium Productivity Zone (Yellow/Gold)
  [0.75, [132, 204, 22]],  // Upper-Mid Zone (Lime)
  [1.0,  [34, 197, 94]],   // High Productivity Zone (Emerald)
];

// Pre-Event Peak Healthy Biomass
const PRE_EVENT_PALETTE: [number, number[]][] = [
  [0.0,  [100, 140, 60]],
  [0.4,  [65, 160, 45]],
  [0.75, [25, 185, 50]],
  [1.0,  [10, 210, 55]],
];

// True Color Natural RGB
const TRUECOLOR_PALETTE: [number, number[]][] = [
  [0.0,  [130, 100, 65]],  // Dry soil
  [0.3,  [100, 110, 50]],  // Yellow-green crop
  [0.6,  [45, 105, 35]],   // Green field
  [0.85, [25, 75, 20]],    // Deep forest/canopy
  [1.0,  [15, 55, 15]],    // Very dark foliage
];

function interpolatePalette(palette: [number, number[]][], val: number): [number, number, number] {
  const v = Math.max(0, Math.min(1, val));
  for (let i = 0; i < palette.length - 1; i++) {
    const [t1, c1] = palette[i];
    const [t2, c2] = palette[i + 1];
    if (v >= t1 && v <= t2) {
      const frac = (v - t1) / (t2 - t1);
      return [
        Math.round(lerp(c1[0], c2[0], frac)),
        Math.round(lerp(c1[1], c2[1], frac)),
        Math.round(lerp(c1[2], c2[2], frac)),
      ];
    }
  }
  const last = palette[palette.length - 1][1];
  return [last[0], last[1], last[2]];
}

export type RasterMode = 
  | 'ndvi'
  | 'evi'
  | 'ndwi'
  | 'ndmi'
  | 'cloudmask'
  | 'threshold'
  | 'vector'
  | 'ndre'
  | 'msavi'
  | 'reci'
  | 'playground'
  | 'baseline'
  | 'current'
  | 'cir'
  | 'falsecolor'
  | 'variability'
  | 'preevent'
  | 'truecolor';

/**
 * Generates an ultra-detailed satellite raster data URL with contour fields,
 * agricultural parcel boundaries, and spectral gradients.
 */
export function generateSatelliteRaster(
  mode: RasterMode = 'ndvi',
  width = 640,
  height = 400,
  seed = 42,
  severity = 0.5
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  let activePalette = NDVI_PALETTE;
  if (mode === 'evi') activePalette = EVI_PALETTE;
  else if (mode === 'ndwi') activePalette = NDWI_PALETTE;
  else if (mode === 'ndmi') activePalette = NDMI_PALETTE;
  else if (mode === 'cloudmask') activePalette = CLOUDMASK_PALETTE;
  else if (mode === 'threshold') activePalette = THRESHOLD_PALETTE;
  else if (mode === 'cir') activePalette = CIR_PALETTE;
  else if (mode === 'falsecolor') activePalette = FALSECOLOR_PALETTE;
  else if (mode === 'variability') activePalette = VARIABILITY_PALETTE;
  else if (mode === 'preevent') activePalette = PRE_EVENT_PALETTE;
  else if (mode === 'truecolor' || mode === 'baseline') activePalette = TRUECOLOR_PALETTE;
  else if (mode === 'current') activePalette = NDVI_PALETTE;

  // 1. Pixel Grid Synthesis using Multi-Octave Fractal Noise
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  const scale = mode === 'cloudmask' ? 0.003 : 0.007;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Organic in-field gradient + slight directional bias
      let n = fbm(x * scale, y * scale, seed, 5);

      if (mode === 'cloudmask') {
        // High threshold cloud puffs in top-right and corners
        n = Math.pow(n, 1.8);
      } else if (mode === 'threshold') {
        // Quantize into distinct damage zones: <0.30 (Triggered Red) vs Intact
        n = n * (1.0 - severity * 0.5);
      } else if (mode === 'current' || (mode === 'ndvi' && severity > 0.4)) {
        const swath = Math.sin((x / width) * Math.PI) * (1.0 - (y / height) * 0.4);
        n = Math.max(0.05, n * (1.0 - severity * 0.65) - swath * 0.2);
      } else if (mode === 'baseline') {
        n = Math.min(0.95, n * 0.85 + 0.25); // Lush peak vegetation
      }

      const rgb = interpolatePalette(activePalette, n);

      // Fine sensor grain
      const grain = (hash2d(x, y, seed + 888) - 0.5) * 8;

      data[idx]     = Math.max(0, Math.min(255, rgb[0] + grain));
      data[idx + 1] = Math.max(0, Math.min(255, rgb[1] + grain));
      data[idx + 2] = Math.max(0, Math.min(255, rgb[2] + grain));
      data[idx + 3] = mode === 'cloudmask' ? Math.round(n * 220) : 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // 2. Draw Agricultural Parcel Outlines & Field Headlands
  if (mode !== 'cloudmask') {
    ctx.strokeStyle = mode === 'threshold' ? 'rgba(239, 68, 68, 0.6)' : 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);

    const pSize = 55 + (seed % 20);
    for (let px = pSize; px < width; px += pSize) {
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
      ctx.stroke();
    }
    for (let py = pSize; py < height; py += pSize) {
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // 3. Sensor Overlay Grid Lines & Coordinate Ticks
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x < width; x += 100) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 100) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  return canvas.toDataURL('image/png');
}
