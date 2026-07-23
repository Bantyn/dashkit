import { Request, Response } from 'express';
import { ExportService } from './export.service';

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
      const downloadUrl = await ExportService.getDownloadUrl(id);
      
      // Since our fallback mock URL is just a string, in a real app we might proxy the download or redirect.
      // If it's a signed S3 URL, we just redirect.
      if (downloadUrl.startsWith('http')) {
        // Redirecting to the actual file URL for download
        res.redirect(downloadUrl);
      } else {
        // If it was stored locally, we'd send the file
        res.download(downloadUrl);
      }
    } catch (error: any) {
      console.error('downloadExport error:', error);
      res.status(404).json({ success: false, message: error.message });
    }
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
