import puppeteer from "puppeteer";

export class PdfGeneratorService {
  /**
   * Generates a PDF invoice using Puppeteer by navigating to the frontend print URL.
   */
  async generateInvoicePdf(invoice: any, shopName?: string, shopAddress?: string, shopPhone?: string): Promise<Buffer> {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:4200";
    const targetUrl = `${frontendUrl}/${invoice.shopId}/invoices/${invoice.id}/print`;

    console.log(`[PdfGeneratorService] Launching Puppeteer for ${targetUrl}`);
    
    // Launch headless browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    try {
      const page = await browser.newPage();
      
      // Navigate to the exact invoice print URL and wait for network to be completely idle
      await page.goto(targetUrl, {
        waitUntil: 'networkidle0',
        timeout: 30000, // 30 seconds timeout
      });

      // Optional: If the frontend has an animation or delay before the print modal triggers, wait a moment.
      // E.g. invoice-print-page.component.ts sets a 1000ms timeout before window.print()
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate the PDF from the rendered HTML
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true, // Ensure colors and backgrounds from CSS are included
        margin: {
          top: '0mm',
          right: '0mm',
          bottom: '0mm',
          left: '0mm',
        },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      // Ensure the browser is always closed to prevent memory leaks
      await browser.close();
    }
  }
}

export const pdfGeneratorService = new PdfGeneratorService();
