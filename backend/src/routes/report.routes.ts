import { FastifyPluginAsync } from 'fastify';
import { validateReportGenerate } from '../validators/report';

const reportRoutes: FastifyPluginAsync = async (fastify) => {
  const { pool } = fastify;
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

      const clientCheck = await pool.query('SELECT id FROM clients WHERE id = $1', [clientId]);
      if (clientCheck.rows.length === 0) {
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
