import { describe, expect, it } from 'vitest';
import { EvolutionApiService } from '../evolution-api-service';
import { GoogleApiService } from '../google-api-service';

describe('Dispatch template resolvers', () => {
  it('throws explicit error for missing WhatsApp template', () => {
    const evolution = new EvolutionApiService('https://example.com', 'instance', 'key');
    expect(() => evolution.resolveTemplate('wa_inexistente', { nome: 'Lead' })).toThrow(/template not found/i);
  });

  it('throws explicit error for missing Gmail template', () => {
    const google = new GoogleApiService('client', 'secret', 'refresh', 'primary', 'contato@lucena.com');
    expect(() => google.resolveGmailTemplate('gm_inexistente', { nome: 'Lead' })).toThrow(/template not found/i);
  });

  it('renders scheduling link template without quick-confirm claim', () => {
    const evolution = new EvolutionApiService('https://example.com', 'instance', 'key');
    const text = evolution.resolveTemplate('wa_briefing_recebido_agendamento_link_v1', {
      nome: 'Ana',
      escritorio: 'Escritório Exemplo',
      link_calendario: 'https://agenda.local/link',
    });

    expect(text).toContain('Escolha o melhor dia e horário');
    expect(text).toContain('https://agenda.local/link');
    expect(text.toLowerCase()).not.toContain('1 clique');
  });

  it('renders gmail link template without quick-confirm claim', () => {
    const google = new GoogleApiService('client', 'secret', 'refresh', 'primary', 'contato@lucena.com');
    const rendered = google.resolveGmailTemplate('gm_briefing_recebido_agendamento_link_v1', {
      nome: 'Ana',
      escritorio: 'Escritório Exemplo',
      link_calendario: 'https://agenda.local/link',
    });

    expect(rendered.subject).toContain('Briefing recebido');
    expect(rendered.html).toContain('https://agenda.local/link');
    expect(rendered.html.toLowerCase()).not.toContain('1 clique');
  });
});
