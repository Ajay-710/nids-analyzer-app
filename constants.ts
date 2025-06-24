
export const DEFAULT_K_CLUSTERS = 3;
export const MAX_KMEANS_ITERATIONS = 20;
export const ANOMALY_THRESHOLD_PERCENTILE = 0.95; // Top 5% of distances are anomalies

// Default features to try for K-Means if available in CSV.
// Users will be able to select from available numeric features.
export const DEFAULT_NUMERIC_FEATURES_FOR_ANALYSIS: string[] = ['duration', 'src_bytes', 'dst_bytes'];
    