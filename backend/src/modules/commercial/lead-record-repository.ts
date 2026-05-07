import type { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import type {
  CommercialAssetRecord,
  CommercialLeadRecord,
  CreateCommercialAssetInput,
} from './types';
import { mapAssetRow, mapCommercialLeadRow } from './mappers';
import type { CommercialAssetListFilters, CommercialLeadListFilters } from './repository-types';

export class CommercialLeadRecordRepository {
  constructor(private readonly pool: Pool) {}

  async findLeadRow(leadId: string): Promise<any | null> {
    const result = await this.pool.query('SELECT * FROM commercial_leads WHERE lead_id = $1 LIMIT 1', [leadId]);
    return result.rows[0] || null;
  }

  async findLeadRecord(leadId: string): Promise<CommercialLeadRecord | null> {
    const row = await this.findLeadRow(leadId);
    return row ? mapCommercialLeadRow(row) : null;
  }

  async listLeadRecords(filters?: CommercialLeadListFilters): Promise<CommercialLeadRecord[]> {
    const where: string[] = [];
    const params: unknown[] = [];

    if (filters?.status) {
      params.push(filters.status);
      where.push(`status_atual = $${params.length}`);
    }

    if (filters?.responsavel) {
      params.push(filters.responsavel);
      where.push(`responsavel = $${params.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const limit = Math.min(Math.max(filters?.limit ?? 50, 1), 200);
    const offset = Math.max(filters?.offset ?? 0, 0);

    params.push(limit);
    params.push(offset);

    const result = await this.pool.query(
      `SELECT * FROM commercial_leads ${whereSql} ORDER BY updated_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    return result.rows.map((row) => mapCommercialLeadRow(row));
  }

  async listLeadAssets(leadId: string, filters?: CommercialAssetListFilters): Promise<CommercialAssetRecord[]> {
    const params: unknown[] = [leadId];
    const where = ['lead_id = $1'];

    if (filters?.stage) {
      params.push(filters.stage);
      where.push(`stage = $${params.length}`);
    }

    if (filters?.assetType) {
      params.push(filters.assetType);
      where.push(`asset_type = $${params.length}`);
    }

    const result = await this.pool.query(
      `SELECT id, lead_id, stage, asset_type, storage_provider, storage_ref, url, version, checksum, created_by, created_at
       FROM commercial_assets
       WHERE ${where.join(' AND ')}
       ORDER BY created_at DESC`,
      params,
    );

    return result.rows.map((row) => mapAssetRow(row));
  }

  async createLeadAsset(leadId: string, input: CreateCommercialAssetInput): Promise<CommercialAssetRecord> {
    const inserted = await this.pool.query(
      `INSERT INTO commercial_assets
        (id, lead_id, stage, asset_type, storage_provider, storage_ref, url, version, checksum, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id, lead_id, stage, asset_type, storage_provider, storage_ref, url, version, checksum, created_by, created_at`,
      [
        uuidv4(),
        leadId,
        input.stage,
        input.assetType.trim(),
        input.storageProvider?.trim() || 'google_drive',
        input.storageRef?.trim() || null,
        input.url.trim(),
        input.version ?? 1,
        input.checksum?.trim() || null,
        input.createdBy || null,
      ],
    );

    return mapAssetRow(inserted.rows[0]);
  }
}
