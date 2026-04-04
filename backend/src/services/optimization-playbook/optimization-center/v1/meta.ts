import type { OptimizationCenterPlaybook } from '../../types';
import { getPromptDefinition } from '../../../ai-prompts';

export const OPTIMIZATION_CENTER_PLAYBOOK_V1_META = {
  key: 'optimization-center',
  version: 'v1.2.0',
  updatedAt: '2026-02-04',
  description:
    'Playbook de otimização multi-escopo para campanhas de mensagens, leads, conversão, tráfego e awareness, com regras por perfil e guardrails de dados.',
  copy: {
    preferredCtaTypes: ['WHATSAPP_MESSAGE', 'SEND_MESSAGE'],
    prohibitedPhrases: ['garantido', '100%', 'resultado garantido', 'causa ganha', 'processo ganho'],
    notes: 'Regras de copy são heurísticas; ajustar conforme políticas da Meta e compliance do cliente.',
  },
  ai: {
    copySuggestions: {
      enabled: true,
      requiresEnv: 'OPENAI_API_KEY',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      promptId: getPromptDefinition('copy-generator').id,
      promptVersion: getPromptDefinition('copy-generator').version,
    },
  },
} satisfies Pick<OptimizationCenterPlaybook, 'key' | 'version' | 'updatedAt' | 'description' | 'copy' | 'ai'>;
