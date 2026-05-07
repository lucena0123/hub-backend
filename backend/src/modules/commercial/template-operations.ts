import { DEFAULT_STAGE_REQUIREMENTS, DEFAULT_TEMPLATE_DEFINITIONS } from './defaults';
import { resolveTemplateByStage } from './dispatch-templates';
import { isTemplateStrictModeEnabled } from './flags';
import { CommercialFlowError } from './flow';
import { CommercialLeadRepository } from './repository';
import type {
  CommercialTemplateChannel,
  DispatchCommercialCommunicationInput,
} from './types';

export async function seedCommercialDefaults(repository: CommercialLeadRepository): Promise<void> {
  for (const requirement of DEFAULT_STAGE_REQUIREMENTS) {
    await repository.seedStageRequirement(requirement);
  }

  for (const template of DEFAULT_TEMPLATE_DEFINITIONS) {
    const versionId = await repository.seedDefaultTemplate(template);

    if (template.bindAsDefault !== false) {
      await repository.upsertTemplateBinding({
        stage: template.stage,
        channel: template.channel,
        profileKey: null,
        templateVersionId: versionId,
        isDefault: true,
      });
    }
  }
}

export async function getTemplateWithVersionsOrThrow(
  repository: CommercialLeadRepository,
  templateId: string,
) {
  const result = await repository.getTemplateWithVersions(templateId);
  if (!result) {
    throw new CommercialFlowError('NOT_FOUND', 'Template comercial não encontrado.');
  }

  return result;
}

export async function upsertCommercialTemplateBinding(
  repository: CommercialLeadRepository,
  input: {
    stage: DispatchCommercialCommunicationInput['stage'];
    channel: CommercialTemplateChannel;
    profileKey: string | null;
    templateVersionId: string;
    isDefault: boolean;
  },
): Promise<void> {
  await repository.upsertTemplateBinding(input);
}

export async function resolveDispatchTemplateKey(
  repository: CommercialLeadRepository,
  input: DispatchCommercialCommunicationInput,
): Promise<string> {
  if (input.templateKey?.trim()) {
    return input.templateKey.trim();
  }

  const slug = await repository.resolvePublishedTemplateSlug({
    stage: input.stage,
    channel: input.channel,
  });
  if (slug) {
    return slug;
  }

  if (isTemplateStrictModeEnabled()) {
    throw new CommercialFlowError(
      'VALIDATION_ERROR',
      'Template não configurado para stage/canal.',
      {
        reasonCode: 'TEMPLATE_NOT_CONFIGURED',
        stage: input.stage,
        channel: input.channel,
      },
    );
  }

  return resolveTemplateByStage(input.channel, input.stage);
}
