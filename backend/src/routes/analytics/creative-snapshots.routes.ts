import { FastifyPluginAsync } from 'fastify';

const creativeSnapshotsRoutes: FastifyPluginAsync = async (fastify) => {
  const { pool } = fastify;

  // Get a creative snapshot by ID
  fastify.get<{
    Params: { snapshotId: string };
  }>('/api/creative-snapshots/:snapshotId', async (request, reply) => {
    try {
      const { snapshotId } = request.params;

      const result = await pool.query(
        `SELECT
          id,
          creative_id,
          platform,
          content_hash,
          captured_at,
          last_seen_at,
          headline,
          primary_text,
          description,
          cta_type,
          destination_url,
          image_url,
          thumbnail_url,
          video_id,
          format,
          is_dynamic,
          headlines,
          primary_texts,
          descriptions,
          cta_types,
          destination_urls,
          object_story_spec,
          asset_feed_spec
        FROM ad_creative_snapshots
        WHERE id = $1
        LIMIT 1`,
        [snapshotId]
      );

      if (result.rows.length === 0) {
        reply.status(404);
        return { error: 'Creative snapshot not found' };
      }

      const row = result.rows[0] as any;
      return {
        snapshotId: row.id,
        creativeId: row.creative_id,
        platform: row.platform,
        contentHash: row.content_hash,
        capturedAt: row.captured_at,
        lastSeenAt: row.last_seen_at,
        headline: row.headline,
        primaryText: row.primary_text,
        description: row.description,
        ctaType: row.cta_type,
        destinationUrl: row.destination_url,
        imageUrl: row.image_url,
        thumbnailUrl: row.thumbnail_url,
        videoId: row.video_id,
        format: row.format,
        isDynamic: Boolean(row.is_dynamic),
        headlines: row.headlines,
        primaryTexts: row.primary_texts,
        descriptions: row.descriptions,
        ctaTypes: row.cta_types,
        destinationUrls: row.destination_urls,
        objectStorySpec: row.object_story_spec,
        assetFeedSpec: row.asset_feed_spec,
      };
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch creative snapshot',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // List snapshots for a creative
  fastify.get<{
    Params: { creativeId: string };
    Querystring: { limit?: string };
  }>('/api/creatives/:creativeId/snapshots', async (request, reply) => {
    try {
      const { creativeId } = request.params;
      const limit = Math.max(1, Math.min(200, Number.parseInt(request.query.limit || '50', 10) || 50));

      const result = await pool.query(
        `SELECT
          id,
          creative_id,
          platform,
          content_hash,
          captured_at,
          last_seen_at,
          headline,
          primary_text,
          description,
          cta_type,
          destination_url,
          image_url,
          thumbnail_url,
          video_id,
          format,
          is_dynamic
        FROM ad_creative_snapshots
        WHERE creative_id = $1
        ORDER BY captured_at DESC
        LIMIT $2`,
        [creativeId, limit]
      );

      const snapshots = result.rows.map((row: any) => ({
        snapshotId: row.id,
        creativeId: row.creative_id,
        platform: row.platform,
        contentHash: row.content_hash,
        capturedAt: row.captured_at,
        lastSeenAt: row.last_seen_at,
        headline: row.headline,
        primaryText: row.primary_text,
        description: row.description,
        ctaType: row.cta_type,
        destinationUrl: row.destination_url,
        imageUrl: row.image_url,
        thumbnailUrl: row.thumbnail_url,
        videoId: row.video_id,
        format: row.format,
        isDynamic: Boolean(row.is_dynamic),
      }));

      return { creativeId, total: snapshots.length, snapshots };
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to list creative snapshots',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
};

export default creativeSnapshotsRoutes;

