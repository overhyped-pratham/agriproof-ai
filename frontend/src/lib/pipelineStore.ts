/**
 * Central Processing Store & Real-Time Pipeline State Management
 * Tracks stage states: 'pending' | 'processing' | 'completed' | 'error',
 * live progress percentages, and real dynamic output image URLs.
 */

export interface PipelineStage {
  id: string; // 'roi_definition' | 'satellite_imagery' | 'cloud_masking' | 'feature_extraction' | 'thresholding' | 'vectorize_extent' | 'db_ledger'
  title: string;
  subtitle: string;
  badgeLabel: string;
  pillColor: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  imageUrl?: string;
  previewUrl?: string;
  metadata?: Record<string, any>;
  message?: string;
}

export const INITIAL_PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'roi_definition',
    title: 'ROI Definition',
    subtitle: 'Geospatial parcel boundary setup',
    badgeLabel: 'Geodesic Polygon',
    pillColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.15)]',
    status: 'pending',
    progress: 0,
    previewUrl: '/assets/snapshots/stage1_roi.png'
  },
  {
    id: 'satellite_imagery',
    title: 'Satellite Ingest',
    subtitle: 'PlanetScope 3m + Sentinel-2 L2A',
    badgeLabel: '3m Multi-Spectral',
    pillColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.15)]',
    status: 'pending',
    progress: 0,
    previewUrl: '/assets/snapshots/stage2_satellite_raw.png'
  },
  {
    id: 'cloud_masking',
    title: 'Cloud Masking',
    subtitle: 's2cloudless pixel probability filter',
    badgeLabel: 'Clean Pixels',
    pillColor: 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.15)]',
    status: 'pending',
    progress: 0,
    previewUrl: '/assets/snapshots/stage3_cloud_mask.png'
  },
  {
    id: 'feature_extraction',
    title: 'Spectral Indices',
    subtitle: 'NDVI, NDWI & EVI extraction',
    badgeLabel: 'Vegetation Heatmap',
    pillColor: 'bg-teal-500/15 text-teal-300 border-teal-500/40 shadow-[0_0_12px_rgba(20,184,166,0.15)]',
    status: 'pending',
    progress: 0,
    previewUrl: '/assets/snapshots/stage4_ndwi_feature.png'
  },
  {
    id: 'thresholding',
    title: 'Damage Threshold',
    subtitle: 'AI loss cutoff & Otsu segmentation',
    badgeLabel: 'ML Cutoff',
    pillColor: 'bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.15)]',
    status: 'pending',
    progress: 0,
    previewUrl: '/assets/snapshots/stage5_ndwi_threshold.png'
  },
  {
    id: 'vectorize_extent',
    title: 'Vector Contours',
    subtitle: 'GeoJSON damaged acreage extent',
    badgeLabel: 'Vector Boundary',
    pillColor: 'bg-orange-500/15 text-orange-300 border-orange-500/40 shadow-[0_0_12px_rgba(249,115,22,0.15)]',
    status: 'pending',
    progress: 0,
    previewUrl: '/assets/snapshots/stage6_vectorize_extent.png'
  },
  {
    id: 'db_ledger',
    title: 'ZK Claim Ledger',
    subtitle: 'Groth16 cryptographic seal',
    badgeLabel: 'Immutable Block',
    pillColor: 'bg-purple-500/15 text-purple-300 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.15)]',
    status: 'pending',
    progress: 0,
    previewUrl: '/assets/snapshots/stage7_db_ledger.png'
  }
];

export interface PipelineEvent {
  jobId?: string;
  farmId?: string;
  stage?: string;
  step?: string;
  status: 'pending' | 'processing' | 'completed' | 'complete' | 'running' | 'error';
  progress?: number;
  message?: string;
  imageUrl?: string;
  metadata?: Record<string, any>;
  data?: Record<string, any>;
}

// Stage alias normalizer (mapping backend step keys to stage IDs)
export function normalizeStageId(stageKey: string): string {
  const map: Record<string, string> = {
    roi: 'roi_definition',
    roi_definition: 'roi_definition',
    satellite_fetch: 'satellite_imagery',
    satellite_imagery: 'satellite_imagery',
    cloud_mask: 'cloud_masking',
    cloud_masking: 'cloud_masking',
    index_calc: 'feature_extraction',
    feature_extraction: 'feature_extraction',
    ml_analysis: 'thresholding',
    thresholding: 'thresholding',
    vector_extent: 'vectorize_extent',
    vectorize_extent: 'vectorize_extent',
    eligibility: 'db_ledger',
    done: 'db_ledger',
    db_ledger: 'db_ledger'
  };
  return map[stageKey] || stageKey;
}

export function updatePipelineWithEvent(
  currentStages: PipelineStage[],
  event: PipelineEvent
): PipelineStage[] {
  const rawKey = event.stage || event.step;
  if (!rawKey) return currentStages;

  // Handle special terminal 'done'
  if (rawKey === 'done' && (event.status === 'completed' || event.status === 'complete')) {
    return currentStages.map(s => ({
      ...s,
      status: 'completed',
      progress: 100
    }));
  }

  const normalizedId = normalizeStageId(rawKey);
  const normalizedStatus: 'pending' | 'processing' | 'completed' | 'error' =
    event.status === 'running' || event.status === 'processing'
      ? 'processing'
      : event.status === 'completed' || event.status === 'complete'
      ? 'completed'
      : event.status === 'error'
      ? 'error'
      : 'pending';

  return currentStages.map((stage) => {
    if (stage.id === normalizedId) {
      return {
        ...stage,
        status: normalizedStatus,
        progress: event.progress !== undefined ? event.progress : (normalizedStatus === 'completed' ? 100 : stage.progress),
        imageUrl: event.imageUrl ? event.imageUrl : stage.imageUrl,
        message: event.message || stage.message,
        metadata: event.metadata || event.data || stage.metadata
      };
    }
    return stage;
  });
}
