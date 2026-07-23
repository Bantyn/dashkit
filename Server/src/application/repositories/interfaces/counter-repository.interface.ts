export interface ICounterRepository {
  getCounters(): Promise<any[]>;
  createCounter(counter: any): Promise<void>;
  updateCounter(id: string, counter: any): Promise<void>;
}
