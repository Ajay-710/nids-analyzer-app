
import { Point, Centroid, AnomalyDetectionResult, NetworkDataRow } from '../types';
import { DEFAULT_K_CLUSTERS, MAX_KMEANS_ITERATIONS, ANOMALY_THRESHOLD_PERCENTILE } from '../constants';

function euclideanDistance(point1: number[], point2: number[]): number {
  if (point1.length !== point2.length) return Infinity; // Should not happen with consistent features
  return Math.sqrt(
    point1.reduce((sum, val, index) => sum + (val - point2[index]) ** 2, 0)
  );
}

function initializeCentroids(points: Point[], k: number): Centroid[] {
  const shuffled = [...points].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, k).map(p => [...p.features]);
}

function assignToClusters(points: Point[], centroids: Centroid[]): { assignments: number[], distances: number[] } {
  const assignments: number[] = [];
  const distances: number[] = [];
  points.forEach(point => {
    let minDistance = Infinity;
    let clusterIndex = 0;
    centroids.forEach((centroid, index) => {
      const distance = euclideanDistance(point.features, centroid);
      if (distance < minDistance) {
        minDistance = distance;
        clusterIndex = index;
      }
    });
    assignments.push(clusterIndex);
    distances.push(minDistance);
  });
  return { assignments, distances };
}

function updateCentroids(points: Point[], assignments: number[], k: number, featureLength: number): Centroid[] {
  const newCentroids: Centroid[] = Array(k).fill(null).map(() => Array(featureLength).fill(0));
  const clusterCounts: number[] = Array(k).fill(0);

  points.forEach((point, index) => {
    const clusterIndex = assignments[index];
    point.features.forEach((feature, featureIndex) => {
      newCentroids[clusterIndex][featureIndex] += feature;
    });
    clusterCounts[clusterIndex]++;
  });

  return newCentroids.map((centroid, index) => {
    if (clusterCounts[index] === 0) {
      // If a cluster is empty, re-initialize its centroid to a random point's features.
      // This is a simple strategy; more sophisticated methods exist.
      const randomPointIndex = Math.floor(Math.random() * points.length);
      return points.length > 0 ? [...points[randomPointIndex].features] : Array(featureLength).fill(0);
    }
    return centroid.map(sum => sum / clusterCounts[index]);
  });
}

export function detectAnomaliesWithKMeans(
  data: NetworkDataRow[],
  featureKeys: string[],
  k: number = DEFAULT_K_CLUSTERS,
  maxIterations: number = MAX_KMEANS_ITERATIONS,
  anomalyThresholdPercentile: number = ANOMALY_THRESHOLD_PERCENTILE
): AnomalyDetectionResult[] {
  if (!data || data.length === 0) return [];
  if (featureKeys.length === 0) {
    return data.map(item => ({ ...item, isAnomaly: false, cluster: 0, distanceToCentroid: 0 }));
  }

  const points: Point[] = data.map(item => ({
    features: featureKeys.map(key => {
      const val = parseFloat(item[key]);
      return isNaN(val) ? 0 : val; // Handle non-numeric or missing by defaulting to 0
    }),
    originalData: item,
  }));
  
  const featureLength = points[0]?.features.length || 0;
  if (featureLength === 0) { // All selected features were non-numeric for all rows
      return data.map(item => ({ ...item, isAnomaly: false, cluster: 0, distanceToCentroid: 0 }));
  }

  if (points.length < k) {
    // Not enough data points for k clusters. Mark all based on some simple heuristic or as non-anomalous.
    // For simplicity, mark all as non-anomalous if less points than k.
    return data.map(item => ({ ...item, isAnomaly: false, cluster: 0, distanceToCentroid: 0 }));
  }

  let centroids = initializeCentroids(points, k);
  let assignmentsData = { assignments: [] as number[], distances: [] as number[] };

  for (let iter = 0; iter < maxIterations; iter++) {
    assignmentsData = assignToClusters(points, centroids);
    const newCentroids = updateCentroids(points, assignmentsData.assignments, k, featureLength);
    
    let converged = true;
    for (let i = 0; i < k; i++) {
        if (!centroids[i] || !newCentroids[i] || euclideanDistance(centroids[i], newCentroids[i]) > 0.001) {
            converged = false;
            break;
        }
    }
    centroids = newCentroids;
    if (converged && iter > 0) break;
  }
  
  const results: AnomalyDetectionResult[] = [];
  const pointDistances: number[] = [];

  points.forEach((point, index) => {
    const clusterIndex = assignmentsData.assignments[index];
    const centroid = centroids[clusterIndex];
    let distance = 0;
    if (centroid) { // centroid might be undefined if k > points.length, handled earlier
      distance = euclideanDistance(point.features, centroid);
    }
    pointDistances.push(distance);
    results.push({
      ...point.originalData,
      isAnomaly: false, // Will be updated later
      distanceToCentroid: parseFloat(distance.toFixed(3)),
      cluster: clusterIndex,
    });
  });

  if (pointDistances.length === 0) return results.map(r => ({...r, isAnomaly: false}));

  const sortedDistances = [...pointDistances].sort((a, b) => a - b);
  // Ensure index is within bounds
  const thresholdIndex = Math.min(Math.floor(sortedDistances.length * anomalyThresholdPercentile), sortedDistances.length - 1);
  const thresholdDistance = sortedDistances[thresholdIndex];
  
  // A point is an anomaly if its distance is greater than the threshold,
  // AND it's not the case where all points are equidistant (e.g., all distances are 0).
  // The latter can happen with very small or uniform datasets.
  const allDistancesSame = sortedDistances.length > 0 && sortedDistances[0] === sortedDistances[sortedDistances.length - 1];

  return results.map((result, index) => ({
    ...result,
    isAnomaly: !allDistancesSame && (result.distanceToCentroid || 0) > thresholdDistance,
  }));
}
    