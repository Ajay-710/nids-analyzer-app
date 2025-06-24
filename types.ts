
export interface NetworkDataRow extends Record<string, any> {
  // Represents a single row from the uploaded CSV.
  // Properties will be dynamically determined by CSV headers.
}

export interface AnomalyDetectionResult extends NetworkDataRow {
  isAnomaly: boolean;
  distanceToCentroid?: number;
  cluster?: number;
}

export interface Point {
  features: number[];
  originalData: NetworkDataRow;
}

export interface Centroid extends Array<number> {}
    