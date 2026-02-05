import type { OptimizationTheme } from '../../types';

export const OPTIMIZATION_CENTER_PLAYBOOK_V1_THEMES: OptimizationTheme[] = [
  {
    key: 'trabalhista',
    name: 'Direito Trabalhista',
    description: 'Campanhas ligadas a direitos do trabalhador (demissão, rescisão, verbas, etc.).',
    tags: ['TRABALHISTA', 'TRABALHO'],
    keywords: ['trabalh', 'rescis', 'demiss', 'gestante', 'gravidez', 'verbas', 'fgts', 'salário', 'salario'],
    targets: {
      targetCplGoodMax: 12,
      targetCplOkMax: 18,
      targetCplBadMin: 25,
      qualificationRateTargetMin: 12,
      firstReplyRateMin: 28,
    },
  },
  {
    key: 'passageiro_aereo',
    name: 'Direito do Passageiro Aéreo',
    description: 'Atraso/cancelamento de voo, bagagem, overbooking, reembolso.',
    tags: ['PASSAGEIRO', 'AÉREO', 'AEREO', 'VOO'],
    keywords: ['passageiro', 'voo', 'aéreo', 'aereo', 'bagagem', 'overbooking', 'cancel', 'atras'],
    targets: {
      targetCplGoodMax: 9,
      targetCplOkMax: 14,
      targetCplBadMin: 20,
      qualificationRateTargetMin: 10,
      firstReplyRateMin: 25,
    },
  },
  {
    key: 'salario_maternidade',
    name: 'Salário Maternidade',
    description: 'Benefícios relacionados a maternidade e direitos de gestantes.',
    tags: ['MATERNIDADE', 'SALARIO_MATERNIDADE'],
    keywords: ['matern', 'salário maternidade', 'salario maternidade', 'gestante', 'gravidez'],
    targets: {
      targetCplGoodMax: 11,
      targetCplOkMax: 16,
      targetCplBadMin: 23,
      qualificationRateTargetMin: 14,
      firstReplyRateMin: 28,
    },
  },
  {
    key: 'geral',
    name: 'Geral',
    description: 'Fallback quando o tema não é detectado.',
    tags: [],
    keywords: [],
  },
];

