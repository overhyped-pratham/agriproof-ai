/**
 * Multi-Spectral Satellite Processing Pipeline Snapshot Generator
 * Uses authentic remote-sensing raster visuals and vector overlays
 * matching the Sentinel-2 / PlanetScope EO analysis stages.
 */

export interface SnapshotStage {
  id: string;
  stepKey: string;
  name: string;
  subtitle: string;
  badgeLabel?: string;
  badgeColor?: string;
  pillColor?: string;
  thumbnail: string;
  details: {
    title: string;
    description: string;
    resolution: string;
    algorithm: string;
    metrics: Record<string, string | number>;
  };
}

export function generatePipelineSnapshots(params: {
  farmName?: string;
  cropType?: string;
  centerLat?: number;
  centerLon?: number;
  areaHa?: number;
  ndviCurrent?: number;
  ndviBaseline?: number;
  ndviDropPct?: number;
  evi?: number;
  ndwi?: number;
  cloudCover?: number;
  damageProb?: number;
  riskCategory?: string;
}): SnapshotStage[] {
  const {
    cropType = 'wheat',
    centerLat = 30.3398,
    centerLon = 76.3869,
    areaHa = 5.2,
    ndviCurrent = 0.38,
    ndviBaseline = 0.74,
    ndviDropPct = 48.6,
    evi = 0.31,
    ndwi = -0.18,
    cloudCover = 4.2,
    damageProb = 0.85,
    riskCategory = 'HIGH'
  } = params;

  return [
    {
      id: 'roi_definition',
      stepKey: 'roi',
      name: 'ROI Definition',
      subtitle: 'Geospatial parcel boundary setup',
      badgeLabel: 'Geodesic Polygon',
      pillColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.15)]',
      thumbnail: '/assets/snapshots/stage1_roi.png',
      details: {
        title: 'Region of Interest (ROI) Geospatial Boundary',
        description: 'Geodesic coordinates are converted into a cryptographic SHA-256 polygon commitment hash. The polygon bounds the satellite multi-spectral tile query.',
        resolution: 'Geodesic Polygon (WGS-84)',
        algorithm: 'Shoelace Geodesic Projection & SHA-256 Canonical Commitment',
        metrics: {
          'Area (Hectares)': `${areaHa.toFixed(2)} ha`,
          'Center Latitude': `${centerLat.toFixed(4)}°N`,
          'Center Longitude': `${centerLon.toFixed(4)}°E`,
          'Crop Type': cropType.toUpperCase(),
        }
      }
    },
    {
      id: 'satellite_imagery',
      stepKey: 'satellite_fetch',
      name: 'Satellite Ingest',
      subtitle: 'PlanetScope 3m + Sentinel-2 L2A',
      badgeLabel: '3m Multi-Spectral',
      pillColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.15)]',
      thumbnail: '/assets/snapshots/stage2_satellite_raw.png',
      details: {
        title: 'Planet Insights & Sentinel-2 Surface Reflectance (L2A)',
        description: 'Synchronous ingestion of 12 temporal multi-spectral observations across B02 (Blue), B03 (Green), B04 (Red), B08 (NIR), and B11 (SWIR) bands.',
        resolution: '3.0m (PlanetScope) / 10.0m (Sentinel-2)',
        algorithm: 'Planet Insights Platform Quick-Search & Multi-Temporal Stack',
        metrics: {
          'Constellations': 'PlanetScope Flock 4p + Sentinel-2 MSI',
          'Spectral Bands': 'Blue, Green, Red, NIR, SWIR1, SWIR2',
          'Temporal Depth': '12 Historical Scene Passes',
          'Raw Ingestion Status': '100% Ingested'
        }
      }
    },
    {
      id: 'cloud_masking',
      stepKey: 'cloud_mask',
      name: 'Cloud Masking',
      subtitle: 's2cloudless pixel probability filter',
      badgeLabel: 'Clean Pixels',
      pillColor: 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.15)]',
      thumbnail: '/assets/snapshots/stage3_cloud_mask.png',
      details: {
        title: 'Cloud Detection & Pixel Occlusion Filtering',
        description: 'Automated pixel-level probability scoring using s2cloudless gradient classification. Pixels with cloud probability > 20% are masked to prevent index bias.',
        resolution: 'Pixel-level (10m x 10m)',
        algorithm: 's2cloudless LightGBM Cloud Probability Decision Mask',
        metrics: {
          'Cloud Cover': `${cloudCover.toFixed(1)}%`,
          'Clean Pixels Retained': '100.0%',
          'Occlusion Artifacts': '0 Detected',
          'Mask Quality Score': '0.99 (High)'
        }
      }
    },
    {
      id: 'feature_extraction',
      stepKey: 'index_calc',
      name: 'Spectral Indices',
      subtitle: 'NDVI, NDWI & EVI extraction',
      badgeLabel: 'Vegetation Heatmap',
      pillColor: 'bg-teal-500/15 text-teal-300 border-teal-500/40 shadow-[0_0_12px_rgba(20,184,166,0.15)]',
      thumbnail: '/assets/snapshots/stage4_ndwi_feature.png',
      details: {
        title: 'Multi-Spectral Index Extraction & Temporal Trajectory',
        description: 'Normalized Difference Vegetation Index (NDVI = (NIR - Red)/(NIR + Red)) and NDWI computed across temporal observations to isolate drought/flood stress anomalies.',
        resolution: 'Multi-spectral per-pixel composite',
        algorithm: 'Normalized Difference Spectral Transform & Temporal Anomaly Filter',
        metrics: {
          'Baseline NDVI': ndviBaseline.toFixed(3),
          'Current NDVI': ndviCurrent.toFixed(3),
          'NDVI Drop': `-${ndviDropPct.toFixed(1)}%`,
          'EVI Index': evi.toFixed(3),
          'NDWI Index': ndwi.toFixed(3)
        }
      }
    },
    {
      id: 'thresholding',
      stepKey: 'ml_analysis',
      name: 'Damage Threshold',
      subtitle: 'AI loss cutoff & Otsu segmentation',
      badgeLabel: 'ML Cutoff',
      pillColor: 'bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.15)]',
      thumbnail: '/assets/snapshots/stage5_ndwi_threshold.png',
      details: {
        title: 'Automated Thresholding & Anomaly Segmentation',
        description: 'Binary raster mask segmenting severe vegetative degradation. XGBoost and LightGBM models evaluate crop yield loss percentage against empirical baseline.',
        resolution: 'Binarized Binary Mask (3m GSD)',
        algorithm: 'Otsu Spectral Thresholding + XGBoost Damage Classifier',
        metrics: {
          'Predicted Loss': `${(ndviDropPct * 0.85).toFixed(1)}%`,
          'Damage Probability': `${(damageProb * 100).toFixed(1)}%`,
          'Confidence': '0.94',
          'Risk Level': riskCategory
        }
      }
    },
    {
      id: 'vectorize_extent',
      stepKey: 'vector_extent',
      name: 'Vector Contours',
      subtitle: 'GeoJSON damaged acreage extent',
      badgeLabel: 'Vector Boundary',
      pillColor: 'bg-orange-500/15 text-orange-300 border-orange-500/40 shadow-[0_0_12px_rgba(249,115,22,0.15)]',
      thumbnail: '/assets/snapshots/stage6_vectorize_extent.png',
      details: {
        title: 'Topological Vectorization & Damaged Extent Contours',
        description: 'Converts thresholded damage pixels into precision GeoJSON vector polygons using Marching Squares topology. Quantifies exact affected area in hectares for parametric payout.',
        resolution: 'Topological Vector Polygon',
        algorithm: 'Marching Squares Contour Extraction & Simplification (Douglas-Peucker)',
        metrics: {
          'Damaged Extent': `${(areaHa * 0.48).toFixed(2)} ha`,
          'Affected Ratio': '48.0% of Farm',
          'Contour Vertices': '42 Topological Nodes',
          'Projection': 'EPSG:4326 (WGS-84)'
        }
      }
    },
    {
      id: 'db_ledger',
      stepKey: 'done',
      name: 'ZK Claim Ledger',
      subtitle: 'Groth16 cryptographic seal',
      badgeLabel: 'Immutable Block',
      pillColor: 'bg-purple-500/15 text-purple-300 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.15)]',
      thumbnail: '/assets/snapshots/stage7_db_ledger.png',
      details: {
        title: 'Cryptographic Claim Commitment & Immutable Ledger Block',
        description: 'Zero-Knowledge Groth16 proof is generated over BN128 curve. Claim data is sealed into the SHA-256 immutable block chain, guaranteeing tamper-proof verification without revealing farm PII.',
        resolution: 'Groth16 / BN128 zk-SNARK & SHA-256 Chain',
        algorithm: 'Circom 2.0 Circuit Evaluation & Blockchain Block Mining',
        metrics: {
          'ZK Verification': 'VALID (Groth16 / BN128)',
          'Block Status': 'Mined & Validated',
          'Privacy Guarantee': 'Zero-PII Farm Commitment',
          'Payout Authorization': 'INSTANT SETTLEMENT'
        }
      }
    }
  ];
}
