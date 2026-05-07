import type { Pool } from 'pg';
import type {
  CommercialAssetRecord,
  CommercialCalendarConfigRecord,
  CommercialCalendarReconciliationItem,
  CommercialDailySummary,
  CommercialDispatchHealthSummary,
  CommercialFollowupDue,
  CommercialIntegrationEvent,
  CommercialLeadRecord,
  CommercialLeadTimelineEvent,
  CommercialRetentionAlert,
  CommercialSlaAlert,
  CommercialTemplateChannel,
  CommercialTemplateVersionStatus,
  CreateCommercialTemplateInput,
  CreateCommercialAssetInput,
  DispatchCommercialCommunicationInput,
  ResolveCommercialCalendarReconciliationInput,
  UpdateCommercialTemplateInput,
  UpsertCommercialCalendarConfigInput,
} from './types';
import type {
  CommercialAssetListFilters,
  CommercialCalendarReconciliationListFilters,
  CommercialLeadListFilters,
  CommercialTemplateListFilters,
  CommercialTemplateMetadata,
  CommercialTemplateSummary,
  CommercialTemplateVersionMetadata,
  CommercialTemplateWithVersions,
  DefaultStageRequirementDefinition,
  DefaultTemplateDefinition,
  EnqueueCalendarReconciliationInput,
  UpsertCommercialTemplateBindingInput,
} from './repository-types';
import { CommercialCalendarRepository } from './calendar-repository';
import { CommercialLeadRecordRepository } from './lead-record-repository';
import { CommercialReportingRepository } from './reporting-repository';
import { CommercialTemplateRepository } from './template-repository';

export class CommercialLeadRepository {
  private readonly calendarRepository: CommercialCalendarRepository;
  private readonly leadRecordRepository: CommercialLeadRecordRepository;
  private readonly reportingRepository: CommercialReportingRepository;
  private readonly templateRepository: CommercialTemplateRepository;

  constructor(pool: Pool) {
    this.calendarRepository = new CommercialCalendarRepository(pool);
    this.leadRecordRepository = new CommercialLeadRecordRepository(pool);
    this.reportingRepository = new CommercialReportingRepository(pool);
    this.templateRepository = new CommercialTemplateRepository(pool);
  }

  async findLeadRow(leadId: string): Promise<any | null> {
    return this.leadRecordRepository.findLeadRow(leadId);
  }

  async findLeadRecord(leadId: string): Promise<CommercialLeadRecord | null> {
    return this.leadRecordRepository.findLeadRecord(leadId);
  }

  async listLeadRecords(filters?: CommercialLeadListFilters): Promise<CommercialLeadRecord[]> {
    return this.leadRecordRepository.listLeadRecords(filters);
  }

  async listLeadAssets(leadId: string, filters?: CommercialAssetListFilters): Promise<CommercialAssetRecord[]> {
    return this.leadRecordRepository.listLeadAssets(leadId, filters);
  }

  async createLeadAsset(leadId: string, input: CreateCommercialAssetInput): Promise<CommercialAssetRecord> {
    return this.leadRecordRepository.createLeadAsset(leadId, input);
  }

  async getDailySummary(): Promise<CommercialDailySummary> {
    return this.reportingRepository.getDailySummary();
  }

  async listIntegrationEvents(leadId: string, limit?: number): Promise<CommercialIntegrationEvent[]> {
    return this.reportingRepository.listIntegrationEvents(leadId, limit);
  }

  async getDispatchHealthSummary(windowDays?: number): Promise<CommercialDispatchHealthSummary> {
    return this.reportingRepository.getDispatchHealthSummary(windowDays);
  }

  async listLeadTimeline(leadId: string, limit?: number): Promise<CommercialLeadTimelineEvent[]> {
    return this.reportingRepository.listLeadTimeline(leadId, limit);
  }

  async listRetentionDue(limit?: number): Promise<CommercialRetentionAlert[]> {
    return this.reportingRepository.listRetentionDue(limit);
  }

  async listFollowupsDue(limit?: number): Promise<CommercialFollowupDue[]> {
    return this.reportingRepository.listFollowupsDue(limit);
  }

  async listSlaAlerts(maxAgeHours?: number, limit?: number): Promise<CommercialSlaAlert[]> {
    return this.reportingRepository.listSlaAlerts(maxAgeHours, limit);
  }

  async listCalendarConfigs(): Promise<CommercialCalendarConfigRecord[]> {
    return this.calendarRepository.listCalendarConfigs();
  }

  async listActiveCalendarConfigs(): Promise<CommercialCalendarConfigRecord[]> {
    return this.calendarRepository.listActiveCalendarConfigs();
  }

  async createCalendarConfig(input: UpsertCommercialCalendarConfigInput): Promise<CommercialCalendarConfigRecord> {
    return this.calendarRepository.createCalendarConfig(input);
  }

  async updateCalendarConfig(
    id: string,
    input: Partial<UpsertCommercialCalendarConfigInput>,
  ): Promise<CommercialCalendarConfigRecord | null> {
    return this.calendarRepository.updateCalendarConfig(id, input);
  }

  async findActiveCalendarConfigByResponsavel(responsavel: string): Promise<CommercialCalendarConfigRecord | null> {
    return this.calendarRepository.findActiveCalendarConfigByResponsavel(responsavel);
  }

  async listCalendarReconciliationQueue(
    filters?: CommercialCalendarReconciliationListFilters,
  ): Promise<CommercialCalendarReconciliationItem[]> {
    return this.calendarRepository.listCalendarReconciliationQueue(filters);
  }

  async findCalendarReconciliationPayload(id: string): Promise<Record<string, unknown> | null> {
    return this.calendarRepository.findCalendarReconciliationPayload(id);
  }

  async updateCalendarReconciliation(
    id: string,
    input: ResolveCommercialCalendarReconciliationInput,
  ): Promise<CommercialCalendarReconciliationItem> {
    return this.calendarRepository.updateCalendarReconciliation(id, input);
  }

  async enqueueCalendarReconciliation(input: EnqueueCalendarReconciliationInput): Promise<number> {
    return this.calendarRepository.enqueueCalendarReconciliation(input);
  }

  async listTemplates(filters?: CommercialTemplateListFilters): Promise<CommercialTemplateSummary[]> {
    return this.templateRepository.listTemplates(filters);
  }

  async getTemplateWithVersions(templateId: string): Promise<CommercialTemplateWithVersions | null> {
    return this.templateRepository.getTemplateWithVersions(templateId);
  }

  async upsertTemplateBinding(input: UpsertCommercialTemplateBindingInput): Promise<void> {
    await this.templateRepository.upsertTemplateBinding(input);
  }

  async resolvePublishedTemplateSlug(input: {
    stage: DispatchCommercialCommunicationInput['stage'];
    channel: CommercialTemplateChannel;
  }): Promise<string | null> {
    return this.templateRepository.resolvePublishedTemplateSlug(input);
  }

  async createTemplateWithInitialVersion(input: CreateCommercialTemplateInput): Promise<{
    templateId: string;
    versionId: string;
    versionStatus: CommercialTemplateVersionStatus;
  }> {
    return this.templateRepository.createTemplateWithInitialVersion(input);
  }

  async findTemplateMetadata(templateId: string): Promise<CommercialTemplateMetadata | null> {
    return this.templateRepository.findTemplateMetadata(templateId);
  }

  async updateTemplateMetadata(templateId: string, input: UpdateCommercialTemplateInput): Promise<void> {
    await this.templateRepository.updateTemplateMetadata(templateId, input);
  }

  async createTemplateVersion(templateId: string, input: UpdateCommercialTemplateInput): Promise<{
    versionId: string;
    status: CommercialTemplateVersionStatus;
  }> {
    return this.templateRepository.createTemplateVersion(templateId, input);
  }

  async findTemplateVersionToPublish(
    templateId: string,
    versionId?: string,
  ): Promise<CommercialTemplateVersionMetadata | null> {
    return this.templateRepository.findTemplateVersionToPublish(templateId, versionId);
  }

  async markTemplateVersionPublished(templateId: string, versionId: string): Promise<void> {
    await this.templateRepository.markTemplateVersionPublished(templateId, versionId);
  }

  async seedStageRequirement(requirement: DefaultStageRequirementDefinition): Promise<void> {
    await this.templateRepository.seedStageRequirement(requirement);
  }

  async seedDefaultTemplate(template: DefaultTemplateDefinition): Promise<string> {
    return this.templateRepository.seedDefaultTemplate(template);
  }
}
