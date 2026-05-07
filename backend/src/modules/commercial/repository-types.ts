import type {
  CommercialLeadStatus,
  CommercialTemplateChannel,
  CommercialTemplateRecord,
  CommercialTemplateVersionRecord,
  DispatchCommercialCommunicationInput,
} from './types';
import type { DEFAULT_STAGE_REQUIREMENTS, DEFAULT_TEMPLATE_DEFINITIONS } from './defaults';

export interface CommercialLeadListFilters {
  status?: CommercialLeadStatus;
  responsavel?: string;
  limit?: number;
  offset?: number;
}

export interface CommercialAssetListFilters {
  stage?: CommercialLeadStatus;
  assetType?: string;
}

export interface CommercialCalendarReconciliationListFilters {
  status?: 'pending' | 'resolved' | 'ignored';
  limit?: number;
}

export interface EnqueueCalendarReconciliationInput {
  calendarConfigId: string;
  googleEventId: string;
  attendeeEmail: string | null;
  eventStart: string | null;
  eventEnd: string | null;
  reasonCode: string;
  payload: Record<string, unknown>;
}

export interface CommercialTemplateListFilters {
  channel?: CommercialTemplateChannel;
  stage?: DispatchCommercialCommunicationInput['stage'];
  isActive?: boolean;
}

export interface CommercialTemplateSummary {
  id: string;
  channel: CommercialTemplateChannel;
  stage: DispatchCommercialCommunicationInput['stage'];
  slug: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  latestVersionId: string | null;
  latestVersion: number | null;
  latestStatus: string | null;
}

export interface CommercialTemplateWithVersions {
  template: CommercialTemplateRecord;
  versions: CommercialTemplateVersionRecord[];
}

export interface UpsertCommercialTemplateBindingInput {
  stage: DispatchCommercialCommunicationInput['stage'];
  channel: CommercialTemplateChannel;
  profileKey: string | null;
  templateVersionId: string;
  isDefault: boolean;
}

export type DefaultStageRequirementDefinition = (typeof DEFAULT_STAGE_REQUIREMENTS)[number];
export type DefaultTemplateDefinition = (typeof DEFAULT_TEMPLATE_DEFINITIONS)[number];

export interface CommercialTemplateMetadata {
  id: string;
  stage: DispatchCommercialCommunicationInput['stage'];
  channel: CommercialTemplateChannel;
  name?: string;
  isActive?: boolean;
}

export interface CommercialTemplateVersionMetadata {
  id: string;
  version: number;
}
