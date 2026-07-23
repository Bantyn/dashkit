export interface IFeatureRepository {
  getFeatures(): Promise<any[]>;
  createFeature(feature: any): Promise<void>;
  updateFeature(id: string, feature: any): Promise<void>;
}
