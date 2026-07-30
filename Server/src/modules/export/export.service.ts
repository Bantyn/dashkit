import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { ExportHistoryRecord, ExportHistorySchema } from './export.model';
import { ExportQueueService } from './services/export-queue.service';
import { v4 as uuidv4 } from 'uuid';

export class ExportService {
  private static collectionName = 'export_history';

  static async requestExport(payload: any, userId: string, userName: string): Promise<string> {
    // Validate payload
    const parsed = ExportHistorySchema.omit({
      status: true, requestedBy: true, requestedTime: true 
    }).parse(payload);

    const db = getFirestore();
    const exportId = uuidv4();
    
    const record: ExportHistoryRecord = {
      id: exportId,
      name: parsed.name || `${parsed.module}_${Date.now()}.${parsed.format}`,
      module: parsed.module,
      format: parsed.format,
      requestedBy: userId,
      requestedByName: userName,
      requestedTime: FieldValue.serverTimestamp(),
      status: 'pending',
      downloadCount: 0,
      filters: parsed.filters,
      columns: parsed.columns
    };

    // Save to Firestore
    await db.collection(this.collectionName).doc(exportId).set(record);

    // Enqueue for background processing
    await ExportQueueService.enqueue(exportId);

    return exportId;
  }

  static async getHistory(userId?: string): Promise<ExportHistoryRecord[]> {
    const db = getFirestore();
    let query: FirebaseFirestore.Query = db.collection(this.collectionName).orderBy('requestedTime', 'desc').limit(50);
    
    if (userId) {
      // In a real multi-tenant scenario, filter by shopId as well.
      // query = query.where('requestedBy', '==', userId);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        requestedTime: data.requestedTime ? data.requestedTime.toDate().toISOString() : new Date().toISOString(),
        completedTime: data.completedTime ? data.completedTime.toDate().toISOString() : undefined,
      } as ExportHistoryRecord;
    });
  }

  static async getDownloadUrl(exportId: string): Promise<string> {
    const db = getFirestore();
    const doc = await db.collection(this.collectionName).doc(exportId).get();
    
    if (!doc.exists) {
      throw new Error('Export not found');
    }

    const record = doc.data() as ExportHistoryRecord;
    if (record.status !== 'completed' || !record.downloadUrl) {
      throw new Error('Export file is not ready or failed.');
    }

    // Optionally increment download count
    await db.collection(this.collectionName).doc(exportId).update({
      downloadCount: FieldValue.increment(1)
    });

    return record.downloadUrl;
  }

  static async cancelExport(exportId: string): Promise<void> {
    const db = getFirestore();
    const doc = await db.collection(this.collectionName).doc(exportId).get();
    
    if (!doc.exists) throw new Error('Export not found');
    
    const record = doc.data() as ExportHistoryRecord;
    if (record.status === 'completed' || record.status === 'failed') {
      throw new Error('Cannot cancel a completed or failed export');
    }

    await db.collection(this.collectionName).doc(exportId).update({
      status: 'failed',
      errorMessage: 'Cancelled by user',
      completedTime: FieldValue.serverTimestamp()
    });
  }
}
