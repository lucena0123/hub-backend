import { v4 as uuidv4 } from 'uuid';
import type { CommercialFormLink, CommercialFormType } from './types';
import { resolveCommercialFormsBaseUrl } from './urls';

export function buildCommercialFormLink(
  leadId: string,
  formType: CommercialFormType,
  formToken?: string,
): CommercialFormLink {
  const token = formToken || uuidv4();
  const baseUrl = resolveCommercialFormsBaseUrl();

  return {
    leadId,
    formType,
    formToken: token,
    url: `${baseUrl}/forms/${formType}?token=${token}&leadId=${leadId}`,
  };
}
