import { Request, Response } from 'express';
import { ExportService } from './export.service';
import { ExportGeneratorService } from './services/export-generator.service';
import { ExportHistoryRecord } from './export.model';
import { getFirestore } from 'firebase-admin/firestore';
import path from 'path';
import fs from 'fs';

export class ExportController {
  
  static async requestExport(req: Request, res: Response) {
    try {
      const payload = req.body;
      const userId = (req as any).user?.uid || 'admin';
      const userName = (req as any).user?.name || 'Super Admin';

      const exportId = await ExportService.requestExport(payload, userId, userName);
      
      res.status(202).json({
        success: true,
        message: 'Export job queued successfully',
        data: { exportId }
      });
    } catch (error: any) {
      console.error('requestExport error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getHistory(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.uid;
      const history = await ExportService.getHistory(userId);
      
      res.status(200).json({
        success: true,
        data: history
      });
    } catch (error: any) {
      console.error('getHistory error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch export history' });
    }
  }

  static async downloadExport(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const db = getFirestore();
      const doc = await db.collection('export_history').doc(id).get();
      
      if (!doc.exists) {
        return res.status(404).json({ success: false, message: 'Export record not found' });
      }

      const record = doc.data() as ExportHistoryRecord;
      const exportsDir = path.join(process.cwd(), 'uploads', 'exports');
      
      if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
      }

      const files = fs.readdirSync(exportsDir);
      let matchingFile = files.find(f => f.startsWith(id));

      // If file does not exist locally or has legacy fake storage.clothify.com URL, generate on the fly!
      if (!matchingFile || (record.downloadUrl && record.downloadUrl.includes('storage.clothify.com'))) {
        console.log(`[ExportController] File not found or legacy URL for export ${id}. Regenerating...`);
        const newUrl = await ExportGeneratorService.generate(record);
        
        // Refresh matching file after regeneration
        const updatedFiles = fs.readdirSync(exportsDir);
        matchingFile = updatedFiles.find(f => f.startsWith(id));

        // Update Firestore document with new valid URL
        await db.collection('export_history').doc(id).update({
          downloadUrl: newUrl,
          status: 'completed',
        });
      }

      if (!matchingFile) {
        return res.status(404).json({ success: false, message: 'Export file could not be generated' });
      }

      const filePath = path.join(exportsDir, matchingFile);
      const downloadName = record.name || matchingFile;

      // Update download count
      await db.collection('export_history').doc(id).update({
        downloadCount: (record.downloadCount || 0) + 1
      });

      return res.download(filePath, downloadName);
    } catch (error: any) {
      console.error('downloadExport error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to download export file' });
    }
  }

  static async serveExportFile(req: Request, res: Response) {
    return ExportController.downloadExport(req, res);
  }

  static async cancelExport(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      await ExportService.cancelExport(id);
      
      res.status(200).json({
        success: true,
        message: 'Export cancelled successfully'
      });
    } catch (error: any) {
      console.error('cancelExport error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
