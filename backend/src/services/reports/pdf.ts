import puppeteer from 'puppeteer';

import type { AIReportContent, ClientLeadFunnelSummary, ClientPerformanceSummary } from '../../types/metrics';
import { generateReportHTML } from '../report-template';

export const generateReportPdf = async (params: {
  performance: ClientPerformanceSummary;
  aiContent: AIReportContent;
  outputPath: string;
  title: string;
  options?: { recommendationsHeading?: string; leadFunnel?: ClientLeadFunnelSummary | null };
}): Promise<void> => {
  const { performance, aiContent, outputPath, title, options } = params;

  const html = generateReportHTML(performance, aiContent, title, options);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  // Wait for Chart.js to finish rendering (if applicable and used by the template).
  const hasChartRenderedFlag = await page.evaluate(() => Object.prototype.hasOwnProperty.call(globalThis as any, 'chartRendered'));
  if (hasChartRenderedFlag) {
    try {
      await page.waitForFunction('window.chartRendered === true', { timeout: 5000 });
    } catch {
      console.warn('Chart rendering timeout or check failed, proceeding with PDF generation anyway.');
    }
  }

  await page.pdf({
    path: outputPath,
    format: 'A4',
    margin: {
      top: '20mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm',
    },
    printBackground: true,
  });

  await browser.close();
};

