import { describe, expect, it } from 'vitest';

import {
  applyNamingOverride,
  buildAdNameSuggestion,
  buildAdSetNameSuggestion,
  buildCampaignNameSuggestion,
  isSafeGovernanceSuggestion,
} from './naming';
import type { MetaGovernanceEntityType, MetaNamingOverrideRecord } from './types';

const buildOverride = (
  entityType: MetaGovernanceEntityType,
  data?: Partial<MetaNamingOverrideRecord>,
): MetaNamingOverrideRecord => ({
  id: 'override-1',
  clientId: 'client-1',
  entityType,
  entityExternalId: null,
  productKey: null,
  themeKey: null,
  audienceKey: null,
  overridePayload: { expectedName: 'OVERRIDE_NAME' },
  priority: 10,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...data,
});

describe('meta-governance naming', () => {
  it('builds a canonical campaign name from the approved nomenclature', () => {
    const suggestion = buildCampaignNameSuggestion({
      entityExternalId: '120240932661560563',
      currentName: '[PREVIDENCIÁRIO] Maternidade | Público: CE/RJ | Obj: Mensagens',
      objective: 'OUTCOME_ENGAGEMENT',
      createdTime: '2026-02-02T10:00:00.000Z',
    });

    expect(suggestion.expectedName).toBe(
      '[OBJ=LEAD] [PROD=Maternidade] [FUNIL=MOFU] [PREVIDENCIARIO] [CONT] [BUDGET=UNK] [REG=BR-CE+RJ] [LANG=PT] [2026-02-02] |CAM',
    );
    expect(suggestion.safeToApply).toBe(true);
    expect(suggestion.tokens.themeTag).toBe('PREVIDENCIARIO');
  });

  it('builds a canonical adset name inheriting funnel from the campaign objective', () => {
    const suggestion = buildAdSetNameSuggestion({
      entityExternalId: '120240932229140563',
      currentName: 'Publico Aberto | 20-50 | Manual+Geral | BR | IG',
      campaignName: '[TRABALHISTA] Rescisão Indireta | Público: Geral | Obj: Mensagens',
      campaignObjective: 'OUTCOME_ENGAGEMENT',
      createdTime: '2026-02-02T10:00:00.000Z',
      sequenceNumber: 1,
    });

    expect(suggestion.expectedName).toBe(
      '01_[AUD=Publico_Aberto_20_50_Manual_Geral] [HEAT=COLD] [WIN=ALL] [FUNIL=MOFU] [PLAC=IG] [REG=BR] [LANG=PT] [2026-02-02] |AS',
    );
    expect(suggestion.safeToApply).toBe(true);
  });

  it('builds a canonical ad name and rejects unresolved suggestions', () => {
    const suggestion = buildAdNameSuggestion({
      entityExternalId: '120241280831550563',
      currentName: 'Imagem - RescisaoIndireta - "Cansado de ser desrespeitado no trabalho?" - CTA WhatsApp - V2',
      campaignName: '[TRABALHISTA] Rescisão Indireta | Público: Geral | Obj: Mensagens',
      createdTime: '2026-02-11T10:00:00.000Z',
    });

    expect(suggestion.expectedName).toBe(
      'AD_[ANG=RescisaoIndireta] [FORM=IMG] [VAR=v02] [CTA=WHATSAPP] [LANG=PT] [REG=BR] [2026-02-11] |AD',
    );
    expect(isSafeGovernanceSuggestion(suggestion.expectedName)).toBe(true);
    expect(isSafeGovernanceSuggestion('AD_[ANG=UNK] [FORM=IMG] [VAR=v??] [CTA=?] [LANG=PT] [REG=BR] [2026-02-11] |AD')).toBe(
      false,
    );
  });

  it('preserves canonical campaign tags when the current name already follows the approved pattern', () => {
    const suggestion = buildCampaignNameSuggestion({
      entityExternalId: 'campaign-1',
      currentName: '[OBJ=LEAD] [PROD=Maternidade] [FUNIL=MOFU] [PREVIDENCIARIO] [CONT] [BUDGET=UNK] [REG=BR-CE+RJ] [LANG=PT] [2026-02-02] |CAM',
      objective: 'OUTCOME_ENGAGEMENT',
      createdTime: '2026-02-02T11:56:14.000Z',
    });

    expect(suggestion.expectedName).toBe(
      '[OBJ=LEAD] [PROD=Maternidade] [FUNIL=MOFU] [PREVIDENCIARIO] [CONT] [BUDGET=UNK] [REG=BR-CE+RJ] [LANG=PT] [2026-02-02] |CAM',
    );
    expect(suggestion.safeToApply).toBe(true);
  });

  it('preserves canonical adset and ad tags while only correcting the real created date', () => {
    const adsetSuggestion = buildAdSetNameSuggestion({
      entityExternalId: 'adset-1',
      currentName: '02_[AUD=Publico_Aberto_Geral_Advantage_Geral] [HEAT=COLD] [WIN=ALL] [FUNIL=MOFU] [PLAC=ADVPLUS] [REG=BR] [LANG=PT] [2026-04-14] |AS',
      campaignName: '[OBJ=LEAD] [PROD=Direitos_Trabalhistas] [FUNIL=MOFU] [TRABALHISTA] [CONT] [BUDGET=UNK] [REG=BR] [LANG=PT] [2026-04-14] |CAM',
      campaignObjective: 'OUTCOME_ENGAGEMENT',
      createdTime: '2026-04-15T17:36:17.000Z',
      sequenceNumber: 1,
    });

    const adSuggestion = buildAdNameSuggestion({
      entityExternalId: 'ad-1',
      currentName: 'AD_[ANG=Demissao_Geral] [FORM=IMG] [VAR=v01] [TESTE_CR] [CTA=WHATSAPP] [LANG=PT] [REG=BR] [2025-10-20] |AD',
      campaignName: '[OBJ=LEAD] [PROD=Direitos_Trabalhistas] [FUNIL=MOFU] [TRABALHISTA] [CONT] [BUDGET=UNK] [REG=BR] [LANG=PT] [2025-10-20] |CAM',
      createdTime: '2025-10-21T00:35:53.000Z',
    });

    expect(adsetSuggestion.expectedName).toBe(
      '02_[AUD=Publico_Aberto_Geral_Advantage_Geral] [HEAT=COLD] [WIN=ALL] [FUNIL=MOFU] [PLAC=ADVPLUS] [REG=BR] [LANG=PT] [2026-04-15] |AS',
    );
    expect(adsetSuggestion.safeToApply).toBe(true);

    expect(adSuggestion.expectedName).toBe(
      'AD_[ANG=Demissao_Geral] [FORM=IMG] [VAR=v01] [TESTE_CR] [CTA=WHATSAPP] [LANG=PT] [REG=BR] [2025-10-21] |AD',
    );
    expect(adSuggestion.safeToApply).toBe(true);
  });

  it('applies exact overrides before the deterministic rule', () => {
    const defaultSuggestion = buildCampaignNameSuggestion({
      entityExternalId: 'campaign-1',
      currentName: 'Campanha Produto X - Cliente A',
      objective: 'OUTCOME_TRAFFIC',
      createdTime: '2026-02-23T10:00:00.000Z',
    });

    const overridden = applyNamingOverride(defaultSuggestion, [
      buildOverride('campaign', {
        entityExternalId: 'campaign-1',
        overridePayload: { expectedName: '[OBJ=TRAFFIC] [PROD=Produto_X] [FUNIL=TOFU] [CONT] [BUDGET=UNK] [REG=BR] [LANG=PT] [2026-02-23] |CAM' },
      }),
    ]);

    expect(overridden.expectedName).toBe(
      '[OBJ=TRAFFIC] [PROD=Produto_X] [FUNIL=TOFU] [CONT] [BUDGET=UNK] [REG=BR] [LANG=PT] [2026-02-23] |CAM',
    );
    expect(overridden.overrideApplied).toBe(true);
  });
});
