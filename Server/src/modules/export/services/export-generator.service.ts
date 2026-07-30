import { ExportHistoryRecord } from '../export.model';
import { ReportDataFetcher } from './report-data-fetcher.service';
import { ExcelReportBuilder } from './excel-report-builder.service';
import { PdfReportBuilder } from './pdf-report-builder.service';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';
import path from 'path';
import fs from 'fs';

export class ExportGeneratorService {
  
  static async generate(record: ExportHistoryRecord): Promise<string> {
    console.log(`[ExportGenerator] Starting real database report generation for module: ${record.module}, format: ${record.format}`);
    
    // 1. Fetch Real Database Data & Calculate Executive KPIs
    const reportData = await ReportDataFetcher.fetch(record);
    
    let tempBasePath = path.join(os.tmpdir(), `export_${uuidv4()}`);
    let ext = '';

    // 2. Build Report Document according to format
    if (record.format === 'excel' || record.format === 'csv') {
      await ExcelReportBuilder.build(record, reportData, tempBasePath);
      ext = record.format === 'csv' ? '.csv' : '.xlsx';
    } else if (record.format === 'pdf') {
      await PdfReportBuilder.build(record, reportData, tempBasePath);
      ext = '.pdf';
    } else if (record.format === 'json') {
      ext = '.json';
      fs.writeFileSync(`${tempBasePath}${ext}`, JSON.stringify(reportData, null, 2));
    } else {
      throw new Error(`Export format '${record.format}' is not supported.`);
    }

    const tempFilePath = `${tempBasePath}${ext}`;

    // 3. Store Generated File in Local Uploads Storage Directory
    const exportsDir = path.join(process.cwd(), 'uploads', 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    const safeName = record.name || `${record.module}_report${ext}`;
    const targetFileName = `${record.id}_${safeName}`;
    const finalPath = path.join(exportsDir, targetFileName);

    if (fs.existsSync(tempFilePath)) {
      fs.copyFileSync(tempFilePath, finalPath);
      try { fs.unlinkSync(tempFilePath); } catch (e) {}
    }

    // 4. Generate Local Download API URL
    const baseUrl = process.env.PUBLIC_API_URL || 'http://localhost:3003';
    const downloadUrl = `${baseUrl}/api/v1/superadmin/exports/file/${record.id}`;
    
    console.log(`[ExportGenerator] Enterprise Report successfully generated & stored at: ${finalPath}`);
    return downloadUrl;
  }
}
