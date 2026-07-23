import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { ExportHistoryRecord, ExportStatus } from '../export.model';
import { ExportGeneratorService } from './export-generator.service';

export class ExportQueueService {
  private static isProcessing = false;
  private static queue: string[] = []; // Stores Export ID

  static async enqueue(exportId: string) {
    this.queue.push(exportId);
    console.log(`[ExportQueue] Enqueued job: ${exportId}. Queue size: ${this.queue.length}`);
    this.processQueue(); // Fire and forget
  }

  private static async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const exportId = this.queue.shift();
      if (!exportId) continue;
      
      console.log(`[ExportQueue] Processing job: ${exportId}`);
      try {
        await this.processJob(exportId);
        console.log(`[ExportQueue] Job completed: ${exportId}`);
      } catch (error) {
        console.error(`[ExportQueue] Job failed: ${exportId}`, error);
      }
    }

    this.isProcessing = false;
  }

  private static async processJob(exportId: string) {
    const db = getFirestore();
    const docRef = db.collection('export_history').doc(exportId);
    
    // Mark as processing
    await docRef.update({
      status: 'processing',
      processingStartedAt: FieldValue.serverTimestamp()
    });

    try {
      const doc = await docRef.get();
      if (!doc.exists) throw new Error('Export record not found');
      
      const record = doc.data() as ExportHistoryRecord;
      
      // Check if cancelled
      if (record.status === 'failed') return;

      const startTime = Date.now();
      
      // GENERATE EXPORT (Delegate to Generator Service)
      const downloadUrl = await ExportGeneratorService.generate(record);
      
      const durationMs = Date.now() - startTime;
      const durationSec = (durationMs / 1000).toFixed(1) + 's';

      await docRef.update({
        status: 'completed',
        completedTime: FieldValue.serverTimestamp(),
        duration: durationSec,
        downloadUrl: downloadUrl
      });
      
    } catch (error: any) {
      await docRef.update({
        status: 'failed',
        errorMessage: error.message || 'Unknown error occurred during generation',
        completedTime: FieldValue.serverTimestamp()
      });
      throw error;
    }
  }
}
