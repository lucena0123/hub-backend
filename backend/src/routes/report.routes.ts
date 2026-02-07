import { FastifyPluginAsync } from 'fastify';
import { validateReportGenerate, validateWeeklyReportGenerate } from '../validators/report';

const reportRoutes: FastifyPluginAsync = async (fastify) => {
  const { prisma } = fastify;
  const { reports: reportGenerator } = fastify.services;

  // Generate monthly report for a client
  fastify.post('/api/reports/generate/:clientId', async (request, reply) => {
    try {
      const { clientId } = request.params as { clientId: string };

      const validation = validateReportGenerate(request.body);
      if (!validation.valid) {
        reply.status(400);
        return { error: 'Validation failed', details: validation.errors };
      }

      const { month, year } = validation.data!;

      const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { id: true }
      });
      if (!client) {
        reply.status(404);
        return { error: 'Client not found' };
      }

      const report = await reportGenerator.generateMonthlyReport(clientId, month, year);

      reply.status(201);
      return report;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        error: 'Failed to generate report',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Generate weekly report for a client (custom date range)
  fastify.post('/api/reports/generate-weekly/:clientId', async (request, reply) => {
    try {
      const { clientId } = request.params as { clientId: string };

      const validation = validateWeeklyReportGenerate(request.body);
      if (!validation.valid) {
        reply.status(400);
        return { error: 'Validation failed', details: validation.errors };
      }

      const { startDate, endDate } = validation.data!;

      const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { id: true }
      });
      if (!client) {
        reply.status(404);
        return { error: 'Client not found' };
      }

      const report = await reportGenerator.generateWeeklyReport(clientId, startDate, endDate);

      reply.status(201);
      return report;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        error: 'Failed to generate weekly report',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Get report history for a client
  fastify.get('/api/reports/:clientId/history', async (request, reply) => {
    try {
      const { clientId } = request.params as { clientId: string };

      const reports = await reportGenerator.getReportHistory(clientId);

      return reports;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        error: 'Failed to fetch report history',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Download a specific report PDF
  fastify.get('/api/reports/:reportId/download', async (request, reply) => {
    try {
      const { reportId } = request.params as { reportId: string };

      const report = await reportGenerator.getReportById(reportId);

      if (!report) {
        reply.status(404);
        return {
          error: 'Report not found',
          message: 'No report found with the given ID',
        };
      }

      if (!report.filePath) {
        reply.status(404);
        return {
          error: 'File not found',
          message: 'PDF file not available for this report',
        };
      }

      reply.type('application/pdf');
      reply.header('Content-Disposition', `attachment; filename="${report.title}.pdf"`);

      const fs = require('fs');
      const stream = fs.createReadStream(report.filePath);

      return reply.send(stream);
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        error: 'Failed to download report',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
};

export default reportRoutes;
