import { 
  IAnalyticsRepository, 
  CollectionKey, 
  AnalyticsCollectionsBundle 
} from "../interfaces/analytics-repository.interface";
import { NotImplementedError } from "../../../shared/utils/errors";

export class SqlServerAnalyticsRepository implements IAnalyticsRepository {
  async loadShopData(
    _shopId: string, 
    _needed: CollectionKey[], 
    _branchId?: string, 
    _startDate?: Date
  ): Promise<AnalyticsCollectionsBundle> {
    throw new NotImplementedError("SqlServerAnalyticsRepository.loadShopData is not implemented.");
  }
}
