import { OPTIMIZATION_CENTER_PLAYBOOK_V1_THEMES } from './optimization-playbook/optimization-center/v1/themes';

export type CopyValidationSeverity = 'error' | 'warning' | 'info';

export type CopyValidationIssue = {
  ruleId: string;
  severity: CopyValidationSeverity;
  title: string;
  message: string;
  suggestion?: string;
};

export type CopyValidationInput = {
  headline?: string;
  primaryText?: string;
  description?: string;
  ctaType?: string;
  themeKey?: string;
};

export type CopyValidationResult = {
  valid: boolean;
  score: number;
  issues: CopyValidationIssue[];
  summary: { errors: number; warnings: number; info: number };
  theme: { themeKey: string; themeName: string } | null;
};

const PREFERRED_CTA_TYPES = ['WHATSAPP_MESSAGE', 'SEND_MESSAGE'];
const PROHIBITED_PHRASES = ['garantido', '100%', 'resultado garantido', 'causa ganha', 'processo ganho'];

const normalize = (text: string) => text.toLowerCase().trim();

export function validateCreativeCopy(input: CopyValidationInput): CopyValidationResult {
  const issues: CopyValidationIssue[] = [];

  const headline = (input.headline ?? '').trim();
  const primaryText = (input.primaryText ?? '').trim();
  const ctaType = (input.ctaType ?? '').trim();
  const themeKey = (input.themeKey ?? '').trim();

  // Resolve theme
  const theme = themeKey
    ? OPTIMIZATION_CENTER_PLAYBOOK_V1_THEMES.find((t) => t.key === themeKey) ?? null
    : null;

  // 1. Missing headline
  if (!headline) {
    issues.push({
      ruleId: 'copy-missing-headline',
      severity: 'error',
      title: 'Headline ausente',
      message: 'O criativo não possui headline.',
      suggestion: 'Adicione uma headline clara e objetiva que comunique o benefício principal.',
    });
  }

  // 2. Headline length
  if (headline) {
    if (headline.length < 10) {
      issues.push({
        ruleId: 'copy-headline-too-short',
        severity: 'warning',
        title: 'Headline muito curta',
        message: `Headline com ${headline.length} caracteres (mínimo recomendado: 10).`,
        suggestion: 'Expanda a headline para comunicar melhor o benefício ou a proposta.',
      });
    }
    if (headline.length > 60) {
      issues.push({
        ruleId: 'copy-headline-too-long',
        severity: 'warning',
        title: 'Headline muito longa',
        message: `Headline com ${headline.length} caracteres (máximo recomendado: 60).`,
        suggestion: 'Reduza a headline para que não seja cortada no feed do Meta.',
      });
    }
  }

  // 3. Primary text too long
  if (primaryText && primaryText.length > 500) {
    issues.push({
      ruleId: 'copy-primary-too-long',
      severity: 'warning',
      title: 'Texto principal muito longo',
      message: `Texto principal com ${primaryText.length} caracteres (máximo recomendado: 500).`,
      suggestion: 'Reduza o texto para manter a atenção do usuário. Os primeiros 125 caracteres são os mais visíveis.',
    });
  }

  // 4. CTA mismatch
  if (ctaType && !PREFERRED_CTA_TYPES.includes(ctaType)) {
    issues.push({
      ruleId: 'copy-cta-mismatch',
      severity: 'info',
      title: 'CTA não recomendado',
      message: `CTA "${ctaType.replace(/_/g, ' ')}" não está entre os recomendados (${PREFERRED_CTA_TYPES.join(', ')}).`,
      suggestion: 'Use WHATSAPP_MESSAGE ou SEND_MESSAGE para campanhas de conversão via mensagem.',
    });
  }

  // 5. Compliance risk — prohibited phrases
  const combined = normalize(`${headline} ${primaryText} ${input.description ?? ''}`);
  for (const phrase of PROHIBITED_PHRASES) {
    if (combined.includes(normalize(phrase))) {
      issues.push({
        ruleId: 'copy-compliance-risk',
        severity: 'error',
        title: 'Frase proibida detectada',
        message: `O texto contém a frase "${phrase}", que pode ser reprovada pelo Meta ou violar regulamentações jurídicas.`,
        suggestion: 'Remova ou reformule a frase para evitar bloqueio ou reprovação do anúncio.',
      });
      break; // report only first match
    }
  }

  // 6. Theme not mentioned
  if (theme && theme.keywords.length > 0 && (headline || primaryText)) {
    const hasThemeMention = theme.keywords.some((kw) => combined.includes(normalize(kw)));
    if (!hasThemeMention) {
      issues.push({
        ruleId: 'copy-theme-not-mentioned',
        severity: 'info',
        title: 'Tema não mencionado no copy',
        message: `Nenhuma palavra-chave do tema "${theme.name}" foi encontrada no texto.`,
        suggestion: `Inclua termos como "${theme.keywords.slice(0, 3).join('", "')}" para melhorar a relevância.`,
      });
    }
  }

  const summary = {
    errors: issues.filter((i) => i.severity === 'error').length,
    warnings: issues.filter((i) => i.severity === 'warning').length,
    info: issues.filter((i) => i.severity === 'info').length,
  };

  const score = Math.max(0, 100 - (summary.errors * 25 + summary.warnings * 10 + summary.info * 3));

  return {
    valid: summary.errors === 0,
    score,
    issues,
    summary,
    theme: theme ? { themeKey: theme.key, themeName: theme.name } : null,
  };
}
