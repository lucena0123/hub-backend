import type { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import type {
  CommercialTemplateChannel,
  CommercialTemplateVersionStatus,
  CreateCommercialTemplateInput,
  DispatchCommercialCommunicationInput,
  UpdateCommercialTemplateInput,
} from './types';
import { mapTemplateRow, mapTemplateVersionRow } from './mappers';
import type {
  CommercialTemplateListFilters,
  CommercialTemplateMetadata,
  CommercialTemplateSummary,
  CommercialTemplateVersionMetadata,
  CommercialTemplateWithVersions,
  DefaultStageRequirementDefinition,
  DefaultTemplateDefinition,
  UpsertCommercialTemplateBindingInput,
} from './repository-types';

export class CommercialTemplateRepository {
  constructor(private readonly pool: Pool) {}

  async listTemplates(filters?: CommercialTemplateListFilters): Promise<CommercialTemplateSummary[]> {
    const params: unknown[] = [];
    const where: string[] = [];

    if (filters?.channel) {
      params.push(filters.channel);
      where.push(`t.channel = $${params.length}`);
    }

    if (filters?.stage) {
      params.push(filters.stage);
      where.push(`t.stage = $${params.length}`);
    }

    if (filters?.isActive !== undefined) {
      params.push(filters.isActive);
      where.push(`t.is_active = $${params.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const result = await this.pool.query(
      `SELECT
         t.id,
         t.channel,
         t.stage,
         t.slug,
         t.name,
         t.is_active,
         t.created_at,
         t.updated_at,
         v.id AS latest_version_id,
         v.version AS latest_version,
         v.status AS latest_status
       FROM commercial_templates t
       LEFT JOIN LATERAL (
         SELECT id, version, status
         FROM commercial_template_versions
         WHERE template_id = t.id
         ORDER BY version DESC
         LIMIT 1
       ) v ON true
       ${whereSql}
       ORDER BY t.updated_at DESC`,
      params,
    );

    return result.rows.map((row) => ({
      id: row.id,
      channel: row.channel,
      stage: row.stage,
      slug: row.slug,
      name: row.name,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      latestVersionId: row.latest_version_id || null,
      latestVersion: row.latest_version != null ? Number(row.latest_version) : null,
      latestStatus: row.latest_status || null,
    }));
  }

  async getTemplateWithVersions(templateId: string): Promise<CommercialTemplateWithVersions | null> {
    const templateResult = await this.pool.query(
      `SELECT id, channel, stage, slug, name, is_active, created_at, updated_at
       FROM commercial_templates
       WHERE id = $1
       LIMIT 1`,
      [templateId],
    );

    if (!templateResult.rows[0]) {
      return null;
    }

    const versionsResult = await this.pool.query(
      `SELECT id, template_id, version, content_json, status, created_by, created_at
       FROM commercial_template_versions
       WHERE template_id = $1
       ORDER BY version DESC`,
      [templateId],
    );

    return {
      template: mapTemplateRow(templateResult.rows[0]),
      versions: versionsResult.rows.map((row) => mapTemplateVersionRow(row)),
    };
  }

  async upsertTemplateBinding(input: UpsertCommercialTemplateBindingInput): Promise<void> {
    const existing = await this.pool.query(
      `SELECT id
       FROM commercial_template_bindings
       WHERE stage = $1
         AND channel = $2
         AND COALESCE(profile_key, '') = COALESCE($3, '')
       LIMIT 1`,
      [input.stage, input.channel, input.profileKey],
    );

    if (existing.rows[0]) {
      await this.pool.query(
        `UPDATE commercial_template_bindings
         SET template_version_id = $2,
             is_default = $3
         WHERE id = $1`,
        [existing.rows[0].id, input.templateVersionId, input.isDefault],
      );
      return;
    }

    await this.pool.query(
      `INSERT INTO commercial_template_bindings (id, stage, channel, profile_key, template_version_id, is_default, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
      [uuidv4(), input.stage, input.channel, input.profileKey, input.templateVersionId, input.isDefault],
    );
  }

  async resolvePublishedTemplateSlug(input: {
    stage: DispatchCommercialCommunicationInput['stage'];
    channel: CommercialTemplateChannel;
  }): Promise<string | null> {
    const binding = await this.pool.query(
      `SELECT t.slug
       FROM commercial_template_bindings b
       JOIN commercial_template_versions v ON v.id = b.template_version_id
       JOIN commercial_templates t ON t.id = v.template_id
       WHERE b.stage = $1
         AND b.channel = $2
         AND b.profile_key IS NULL
         AND t.is_active = TRUE
         AND v.status = 'published'
       ORDER BY b.is_default DESC, v.version DESC
       LIMIT 1`,
      [input.stage, input.channel],
    );

    return binding.rows[0]?.slug ? String(binding.rows[0].slug) : null;
  }

  async createTemplateWithInitialVersion(input: CreateCommercialTemplateInput): Promise<{
    templateId: string;
    versionId: string;
    versionStatus: CommercialTemplateVersionStatus;
  }> {
    const templateId = uuidv4();
    const versionId = uuidv4();
    const versionStatus = input.status || 'draft';

    await this.pool.query(
      `INSERT INTO commercial_templates (id, channel, stage, slug, name, is_active, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,TRUE,NOW(),NOW())`,
      [templateId, input.channel, input.stage, input.slug.trim(), input.name.trim()],
    );

    await this.pool.query(
      `INSERT INTO commercial_template_versions (id, template_id, version, content_json, status, created_by, created_at)
       VALUES ($1,$2,1,$3::jsonb,$4,$5,NOW())`,
      [versionId, templateId, JSON.stringify(input.content || {}), versionStatus, input.createdBy || null],
    );

    return { templateId, versionId, versionStatus };
  }

  async findTemplateMetadata(templateId: string): Promise<CommercialTemplateMetadata | null> {
    const current = await this.pool.query(
      `SELECT id, name, is_active, stage, channel
       FROM commercial_templates
       WHERE id = $1
       LIMIT 1`,
      [templateId],
    );

    const template = current.rows[0];
    return template
      ? {
          id: template.id,
          name: template.name,
          isActive: Boolean(template.is_active),
          stage: template.stage,
          channel: template.channel,
        }
      : null;
  }

  async updateTemplateMetadata(templateId: string, input: UpdateCommercialTemplateInput): Promise<void> {
    await this.pool.query(
      `UPDATE commercial_templates
       SET name = COALESCE($2, name),
           is_active = COALESCE($3, is_active),
           updated_at = NOW()
       WHERE id = $1`,
      [templateId, input.name?.trim() || null, input.isActive ?? null],
    );
  }

  async createTemplateVersion(templateId: string, input: UpdateCommercialTemplateInput): Promise<{
    versionId: string;
    status: CommercialTemplateVersionStatus;
  }> {
    const versionResult = await this.pool.query(
      `SELECT COALESCE(MAX(version), 0)::int AS version
       FROM commercial_template_versions
       WHERE template_id = $1`,
      [templateId],
    );
    const nextVersion = Number(versionResult.rows[0]?.version || 0) + 1;
    const versionId = uuidv4();
    const status = input.status || 'draft';

    await this.pool.query(
      `INSERT INTO commercial_template_versions (id, template_id, version, content_json, status, created_by, created_at)
       VALUES ($1,$2,$3,$4::jsonb,$5,$6,NOW())`,
      [versionId, templateId, nextVersion, JSON.stringify(input.content), status, input.createdBy || null],
    );

    return { versionId, status };
  }

  async findTemplateVersionToPublish(
    templateId: string,
    versionId?: string,
  ): Promise<CommercialTemplateVersionMetadata | null> {
    const versionResult = versionId
      ? await this.pool.query(
          `SELECT id, version FROM commercial_template_versions WHERE id = $1 AND template_id = $2 LIMIT 1`,
          [versionId, templateId],
        )
      : await this.pool.query(
          `SELECT id, version
           FROM commercial_template_versions
           WHERE template_id = $1
           ORDER BY version DESC
           LIMIT 1`,
          [templateId],
        );

    const version = versionResult.rows[0];
    return version ? { id: version.id, version: Number(version.version) } : null;
  }

  async markTemplateVersionPublished(templateId: string, versionId: string): Promise<void> {
    await this.pool.query(
      `UPDATE commercial_template_versions
       SET status = CASE WHEN id = $2 THEN 'published' ELSE 'archived' END
       WHERE template_id = $1
         AND status IN ('published', 'archived', 'draft')`,
      [templateId, versionId],
    );
  }

  async seedStageRequirement(requirement: DefaultStageRequirementDefinition): Promise<void> {
    await this.pool.query(
      `INSERT INTO commercial_stage_requirements
        (id, stage, requirement_key, requirement_type, config_json, is_required, profile_key, created_at, updated_at)
       SELECT $1,$2,$3,$4,$5::jsonb,$6,$7,NOW(),NOW()
       WHERE NOT EXISTS (
         SELECT 1
         FROM commercial_stage_requirements
         WHERE stage = $2
           AND requirement_key = $3
           AND COALESCE(profile_key, '') = COALESCE($7, '')
       )`,
      [
        uuidv4(),
        requirement.stage,
        requirement.requirementKey,
        requirement.requirementType,
        JSON.stringify(requirement.config || {}),
        requirement.isRequired,
        requirement.profileKey || null,
      ],
    );
  }

  async seedDefaultTemplate(template: DefaultTemplateDefinition): Promise<string> {
    const existing = await this.pool.query(
      `SELECT id
       FROM commercial_templates
       WHERE slug = $1
       LIMIT 1`,
      [template.slug],
    );

    let templateId = existing.rows[0]?.id as string | undefined;
    if (!templateId) {
      templateId = uuidv4();
      await this.pool.query(
        `INSERT INTO commercial_templates (id, channel, stage, slug, name, is_active, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,TRUE,NOW(),NOW())`,
        [templateId, template.channel, template.stage, template.slug, template.name],
      );
    }

    const version = await this.pool.query(
      `SELECT id
       FROM commercial_template_versions
       WHERE template_id = $1
         AND version = 1
       LIMIT 1`,
      [templateId],
    );

    let versionId = version.rows[0]?.id as string | undefined;
    if (!versionId) {
      versionId = uuidv4();
      await this.pool.query(
        `INSERT INTO commercial_template_versions (id, template_id, version, content_json, status, created_at)
         VALUES ($1,$2,1,$3::jsonb,'published',NOW())`,
        [versionId, templateId, JSON.stringify(template.content || {})],
      );
    }

    return versionId;
  }
}
