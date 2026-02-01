# Arquitetura do Sistema - Hierarquia BPMN v5

Sistema de automacao B2B com 24 subprocessos em 8 niveis (0-7), 558 tasks, 40+ lanes e 20+ gateways de decisao.

## Estrutura Hierarquica

```
0.1 (Raiz)
|
+-- 1.1 -> 1.2 -> 1.3 (Funil de Vendas)
|         |
|         +-- 2.1 (Onboarding)
|              |
|              +-- 2.2 (Analise)
|              +-- 2.3 (KPIs)
|                   |
|                   +-- 3.1 (Keywords)
|                   +-- 3.2 (Audiencia)
|                   +-- 3.3 (Conteudo)
|                   +-- 3.4 (Budget)
|                        |
|                        +-- 4.1 (Anuncios)
|                        +-- 4.2 (Campanha)
|                        +-- 4.3 (Landing Page)
|                             |
|                             +-- 5.1 (Monitoramento) loop
|                                  |
|                                  +-- 5.2 (Otimizacao) loop
|                                  +-- 5.3 (Testes A/B) loop
|
+-- 6.x (Customer Success - Paralelo)
|   +-- 6.1 (Atendimento) loop
|   +-- 6.2 (Apresentacao) -> Apos ciclos 5.x
|   +-- 6.3 (Alinhamento) loop
|   +-- 6.4 (Offboarding) -> Cancelamento
|
+-- 7.x (Gestao Financeira - Paralelo)
    +-- 7.1 (Faturamento) loop mensal
    +-- 7.2 (Renovacao) loop D-60
    +-- 7.3 (Expansao) loop oportunidades
```

## Matriz de Dependencias

| Processo | Depende de | Alimenta | Tipo |
|----------|-----------|----------|------|
| 0.1 | - (inicio) | 1.1 | Sequencial |
| 1.1 | 0.1 | 1.2 | Sequencial |
| 1.2 | 1.1 | 1.3 | Sequencial |
| 1.3 | 1.2 | 2.1 | Sequencial |
| 2.1 | 1.3 | 2.2, 2.3 | Fork |
| 2.2 | 2.1 | 2.3 | Sequencial |
| 2.3 | 2.1, 2.2 | 3.1, 3.2, 3.3, 3.4 | Fork |
| 3.1 | 2.3 | 3.2, 3.3, 3.4 | Paralelo com alimentacao |
| 3.2 | 2.3, 3.1 | 3.3, 3.4 | Paralelo com alimentacao |
| 3.3 | 2.3, 3.1, 3.2 | 4.1, 4.3 | Fork |
| 3.4 | 2.3, 3.1, 3.2 | 4.2 | Sequencial |
| 4.1 | 3.3 | 4.2 | Join |
| 4.2 | 3.4, 4.1, 4.3 | 5.1 | Join -> Loop |
| 4.3 | 3.3 | 4.2 | Join |
| 5.1 | 4.2 (loop) | 5.2, 5.3, ou 5.1 | Loop com fork |
| 5.2 | 5.1 | 5.1 | Loop retorno |
| 5.3 | 5.1 | 5.1 | Loop retorno |
| 6.1 | Qualquer nivel | - | Paralelo reativo |
| 6.2 | 5.x (ciclos) | - | Periodico |
| 6.3 | Qualquer nivel | - | Paralelo proativo |
| 6.4 | Cancelamento | - | Sequencial |
| 7.1 | Ciclo mensal | 6.4 (se suspensao) | Loop faturamento |
| 7.2 | D-60 vencimento | Renovacao ou 6.4 | Loop renovacao |
| 7.3 | Oportunidade IA | 2.1 (parcial) | Paralelo proativo |

## Padroes de Fluxo

1. **Sequencial** (0.1->1.1->1.2->1.3->2.1->2.2->2.3): Um processo so inicia apos conclusao do anterior
2. **Fork** (2.1->[2.2,2.3] ou 2.3->[3.1,3.2,3.3,3.4]): Um processo alimenta multiplos paralelos
3. **Alimentacao Cruzada** (3.1->3.2->3.3): Paralelos que se alimentam mutuamente
4. **Join** ([4.1,4.3]->4.2): Multiplos convergem para um unico
5. **Loop Continuo** (5.1<->5.2/5.3): Ciclo infinito de monitoramento/otimizacao
6. **Paralelo CS** (6.x): Independentes, operam em paralelo a todos os niveis
7. **Paralelo Financeiro** (7.x): Ciclos mensais, renovacao D-60, expansao proativa

## Gargalos Criticos

| Ponto | Risco | Mitigacao |
|-------|-------|-----------|
| 1.3->2.1 | Dados incompletos no handoff | Checklist automatico |
| 2.3->3.x | Desalinhamento entre paralelos | Dashboard centralizado |
| [4.1,4.3]->4.2 | Atrasos em cascata | Tracking tempo real |
| 5.1 loop | Fadiga de alertas | IA filtra anomalias relevantes |
| 5.3 | Interferencia entre testes | Governanca de testes |

---

## NIVEL 0: PROCESSO PRINCIPAL

### 0.1 - Pre-SDR: Dados e Estrategia
**Arquivo:** `subprocesso-0.1-v5-data.js`

**Lanes (5):** Estrategia/Direcao, Marketing/Trafego, RevOps/CRM, IA/Automacao, Juridico/DPO

**Fases (5):** Estrategia & Oferta -> ICP & Nicho -> Canais & Fontes -> Dados & CRM -> IA & Finalizacao

**Tasks (11):** Definir Oferta, Definir ICP, Definir Canais, Configurar Fontes de Lead, Definir Modelo de Dados, Configurar CRM e Pipeline, Configurar Integracoes, Definir Regras de Qualificacao IA, Configurar Pipeline IA, Validar Template de Lead

**Saida:** "Leads Prontos para SDR" -> 1.1

---

## NIVEL 1: FUNIL DE VENDAS

### 1.1 - Prospeccao SDR
**Arquivo:** `subprocesso-1.1-v5-data.js` | **Entrada:** Leads qualificados de 0.1

**Lanes (4):** SDR, Automacao, IA, Cliente/Nurturing
**Fases (6):** Recebimento -> Pesquisa -> Cadencia -> Follow-up -> Agendamento -> Confirmacao
**Tasks (14):** Receber Lead, Verificar Fit (IA), Pesquisar Empresa, Enriquecer Dados (IA), Iniciar Cadencia Multicanal, Personalizar Contato, Rastrear Resposta, Analisar Engajamento (IA), Cadencia Automatica, Ajustar Mensagens, Propor Reuniao, Confirmar Agenda, Enviar Convite, Transferir para Executivo

**Saida:** "Reuniao Agendada" -> 1.2

### 1.2 - Apresentacao e Vendas
**Arquivo:** `subprocesso-1.2-v5-data.js` | **Entrada:** Reuniao agendada de 1.1

**Lanes (5):** Executivo Vendas, Automacao/CRM, IA Assistente, Cliente/Decisor, Feedback/Nurturing
**Fases (7):** Preparacao -> Reuniao Discovery -> Analise/Proposta -> Apresentacao -> Follow-up -> Envio -> Handoff
**Tasks (21):** Receber Handoff SDR, Preparar Pesquisa, Gerar Insight IA, Conduzir Discovery, Mapear Dor e Fit, Estruturar Proposta, Apresentar Proposta, Responder Objecoes, Negociar Escopo, Enviar Proposta Formal, Transferir para Closing

**Saida:** "Proposta Enviada" -> 1.3

### 1.3 - Fechamento
**Arquivo:** `subprocesso-1.3-v5-data.js` | **Entrada:** Proposta enviada de 1.2

**Lanes (5):** Executivo Vendas, Financeiro/Contrato, IA, Cliente/Decisor, CS/Onboarding
**Fases (7):** Recebimento -> Negociacao -> Aprovacao Interna -> Contrato -> Revisao/Assinatura -> Confirmacao -> Handoff
**Tasks (22):** Receber Proposta Aceita, Negociar Condicoes, Gerar Contrato, Revisar Clausulas, Cliente Aprova, Assinar Contrato, Registrar CRM, Confirmar Pagamento, Criar Pasta do Cliente, Agendar Kickoff, Transferir para Onboarding

**Saida:** "Contrato Fechado" -> 2.1

---

## NIVEL 2: ONBOARDING E PLANEJAMENTO ESTRATEGICO

### 2.1 - Onboarding
**Arquivo:** `subprocesso-2.1-v5-data.js` | **Entrada:** Contrato fechado de 1.3

**Lanes (6):** CS/Onboarding, Cliente, Tecnico/Setup, IA/Automacao, Financeiro/Admin, Escalation
**Fases (7):** Recebimento/Kickoff -> Briefing -> Setup Acessos -> QA Tecnica -> Validacao -> Handoff -> Monitoramento Inicial
**Tasks (22):** Receber Handoff, Validar Contrato, Kickoff, Coletar Briefing, Validar Briefing (IA), Configurar Acessos, Testar Integracoes, Detectar Riscos (IA), Escalar Bloqueios, Aprovar Setup, Transferir para Operacao, Monitorar Primeiros 30 Dias, Identificar Risco de Churn

**Saida:** "Cliente Operacional" -> 2.2 e 2.3

### 2.2 - Analise de Mercado e Concorrencia
**Arquivo:** `subprocesso-2.2-v5-data.js` | **Entrada:** Cliente operacional de 2.1

**Lanes (5):** Estrategia/Analista, IA/Pesquisa, Cliente, Dados/Insights, Gestao
**Fases (7):** Scoping -> Pesquisa Mercado -> Analise Competitiva -> Insights -> Estrategia -> Validacao -> Documentacao
**Tasks (22):** Definir Escopo, Coletar Dados, Pesquisar Tendencias (IA), Analisar Posicionamento, Mapear Diferenciais, Clusterizar Insights (IA), Gerar Relatorio, Validar com Cliente, Formular Hipoteses, Simular Cenarios, Documentar Decisoes

**Saida:** "Estrategia Aprovada" -> 2.3

### 2.3 - Definicao de Metas e KPIs
**Arquivo:** `subprocesso-2.3-v5-data.js` | **Entrada:** Estrategia aprovada de 2.2

**Lanes (5):** Estrategia/Planejamento, IA/Simulacao, Cliente/Aprovacao, Dados/Tracking, Gestao
**Fases (7):** Contextualizacao -> Objetivos -> Calculo KPIs -> Simulacao -> Validacao -> Aprovacao -> Setup Monitoramento
**Tasks (23):** Receber Estrategia, Definir Metas Primarias/Secundarias, Calcular KPIs (IA), Simular Cenarios, Apresentar Metas, Cliente Aprova, Configurar Dashboard, Definir Alertas e Thresholds, Configurar Relatorios Automaticos

**Saida:** "Metas Definidas" -> 3.1, 3.2, 3.3, 3.4

---

## NIVEL 3: PLANEJAMENTO DE CAMPANHA

### 3.1 - Pesquisa de Palavras-Chave
**Arquivo:** `subprocesso-3.1-v5-data.js` | **Entrada:** Metas de 2.3

**Lanes (5):** Estrategia/SEO-SEM, IA/Expansao, Cliente, Compliance, Dados
**Tasks (22):** Pesquisa Keywords Base, Expandir com IA, Gerar Long-tail, Calcular Metricas (Volume, CPC), Clusterizar por Intencao, Priorizar por Fit, Validar Compliance, Cliente Aprova

**Saida:** "Keywords Aprovadas" -> 3.2, 3.3, 3.4

### 3.2 - Definicao de Publico-Alvo
**Arquivo:** `subprocesso-3.2-v5-data.js` | **Entrada:** Keywords de 3.1

**Lanes (5):** Estrategia/Persona, IA/Analise, Cliente, Dados/CRM, Creative/Brand
**Tasks (23):** Coletar Dados CRM, Identificar Padroes (IA), Criar Personas, Definir Jobs-to-be-Done, Mapear Jornada, Segmentar por Comportamento, Definir Tom e Voz, Criar Guia de Linguagem, Cliente Aprova

**Saida:** "Personas Aprovadas" -> 3.3, 3.4

### 3.3 - Estrategia de Conteudo
**Arquivo:** `subprocesso-3.3-v5-data.js` | **Entrada:** Personas de 3.2

**Lanes (5):** Estrategia/Content, IA/Ideacao, Cliente, Creative, QA/Brand
**Tasks (24):** Mapear Mensagens-Chave, Brainstorm com IA, Escrever Headlines/Body/CTAs, Revisar Tom e Voz, Validar Compliance, Gerar Variacoes A/B, Cliente Aprova, Preparar Assets para Producao

**Saida:** "Conteudo Aprovado" -> 4.1, 4.3

### 3.4 - Orcamento e Lances
**Arquivo:** `subprocesso-3.4-v5-data.js` | **Entrada:** Keywords e personas de 3.1, 3.2

**Lanes (5):** Estrategia/Midia, IA/Simulacao, Cliente, Financeiro, Dados
**Tasks (22):** Definir Budget Total, Alocar por Canal/Campanha, Definir Estrategia Bid, Calcular CPCs, Simular Cenarios (IA), Gerar Projecoes ROI, Identificar Riscos, Cliente Aprova, Configurar Limites de Gasto

**Saida:** "Budget Aprovado" -> 4.2

---

## NIVEL 4: EXECUCAO

### 4.1 - Criacao de Anuncios
**Arquivo:** `subprocesso-4.1-v5-data.js` | **Entrada:** Conteudo de 3.3

**Lanes (6):** Producao Criativa, Copywriting, IA, QA/Compliance, Automacao/Specs, Gestao
**Tasks (21):** Criar Layouts Visuais, Gerar Variacoes (IA), Adaptar Formatos, Escrever Headlines/Descriptions Finais, Revisar Brand, Validar Compliance, Cliente Aprova, Exportar Assets

**Saida:** "Anuncios Prontos" -> 4.2

### 4.2 - Configuracao de Campanha
**Arquivo:** `subprocesso-4.2-v5-data.js` | **Entrada:** Anuncios (4.1) + Budget (3.4) + LP (4.3)

**Lanes (5):** Midia/Setup, Tecnico/Tracking, IA/QA, Cliente, Gestao
**Tasks (22):** Criar Estrutura Campanha, Configurar Segmentacao, Configurar Lances, Upload Anuncios, Configurar UTMs/Pixels/GTM/GA4, Testar Tracking, Validar Links, QA Tecnica (IA), Cliente Aprova, Ativar Campanha, Configurar Alertas

**Saida:** "Campanha Ativa" -> 5.1

### 4.3 - Criacao de Landing Page
**Arquivo:** `subprocesso-4.3-v5-data.js` | **Entrada:** Conteudo de 3.3 (paralelo a 4.1)

**Lanes (5):** Trafego/Estrategia, UX/Copy, UI/Implementacao, QA/Metricas, IA
**Tasks (20):** Gateway LP Nova/Otimizacao, Wireframe, Copy LP, Design Visual, Implementar, Configurar Formularios, Integrar CRM, Configurar Tracking, Testar Responsividade, QA Completo, Cliente Aprova, Publicar

**Saida:** "Landing Page Ativa" -> 4.2

---

## NIVEL 5: OTIMIZACAO CONTINUA (LOOP)

### 5.1 - Monitoramento Diario
**Arquivo:** `subprocesso-5.1-v5-data.js` | **Entrada:** Campanhas ativas de 4.2 (loop continuo)

**Lanes (4):** Gestor Trafego, BI/Dashboards, IA/Alertas, Decisao/Registro
**Fases (4):** Coleta & Visao Macro -> Analise Detalhada -> Decisao & Registro -> Handoff
**Tasks (14):** Atualizar Dashboards, Checar Saude Contas, Analisar Metricas (CPL, CPC, CTR, CPM, ROAS), Consolidar Dados LP, Analisar Qualidade Trafego, Detectar Anomalias (IA), Sugerir Oportunidades (IA), Gateway: Anomalia? Sim->5.2/5.3, Nao->Loop

**Saidas:** "Fim Sem Acao" (loop) | "Fim Com Registro" -> 5.2 ou 5.3

### 5.2 - Otimizacao de Lances e Orcamento
**Arquivo:** `subprocesso-5.2-v5-data.js` | **Entrada:** Anomalia de 5.1

**Lanes (4):** Gestor Trafego, IA de Otimizacao, Plataformas, BI
**Tasks (12):** Revisar Ocorrencia, Analise Detalhada, IA Sugerir Otimizacao, Escolher Estrategia, Ajustar Lances, Redistribuir Orcamento, Aplicar Ajustes, Escala Automatizada, Gravar Antes/Depois, Registrar, Definir Reavaliacao

**Saida:** "Otimizado" -> 5.1 (loop)

### 5.3 - Testes A/B
**Arquivo:** `subprocesso-5.3-v5-data.js` | **Entrada:** Oportunidade de teste

**Lanes (3):** Gestor Trafego, IA/Estatistica, Plataformas/BI
**Tasks (20):** Validar Necessidade, Checar Governanca, Criar Hipotese, Estimar Amostra (IA), Criar Variacoes, Aplicar Setup, Monitorar, Calcular Significancia, Gateway: Significativo? Sim->Implementar Vencedora, Nao->Continuar, Documentar Aprendizados, Sugerir Proximos (IA)

**Saida:** "Teste Concluido" -> 5.1 (loop)

---

## NIVEL 6: CUSTOMER SUCCESS (PARALELO)

### 6.1 - Atendimento ao Cliente
**Arquivo:** `subprocesso-6.1-v5-data.js` | **Entrada:** Demanda do cliente (reativa, qualquer momento)

**Lanes (5):** Cliente, Atendimento 1o Nivel, IA, Operacoes/Trafego, Gestao
**Tasks (23):** Confirmar Recebimento, Registrar Demanda, Classificar (IA), Consultar Base Conhecimento, Sugerir Resposta (IA), Gateway: Resolvido 1o Nivel? Sim->Enviar, Nao->Escalar->Diagnosticar->Implementar. Gateway: Satisfeito? Sim->Fechar, Nao->Reabrir/Escalar. Pesquisa CSAT, Monitorar SLA (IA)

**Saida:** "Demanda Resolvida"

### 6.2 - Apresentacao de Resultados
**Arquivo:** `subprocesso-6.2-v5-data.js` | **Entrada:** Relatorio apos ciclos 5.x

**Lanes (5):** Cliente, CS, IA/Insights, BI, Gestao
**Tasks (22):** Consolidar Dados, Atualizar Dashboards, Validar Dados, Gerar Highlights (IA), Preparar Apresentacao, Storytelling (IA), Resumo Executivo (IA), Revisao Interna, Agendar Reuniao, Realizar Apresentacao, Registrar Decisoes, Consolidar Aprendizados, Coletar Feedback, Analisar Sentimento (IA)

**Saida:** "Resultados Apresentados"

### 6.3 - Reunioes de Alinhamento
**Arquivo:** `subprocesso-6.3-v5-data.js` | **Entrada:** Necessidade proativa ou solicitada

**Lanes (5):** Cliente, CS, IA, Operacoes, Gestao
**Tasks (21):** Registrar Necessidade, Detectar Necessidade Proativa (IA), Qualificar Urgencia, Sugerir Pauta (IA), Agendar Reuniao, Preparar Insumos, Conduzir Reuniao, Registrar Decisoes, Gerar Ata (IA), Enviar Follow-up, Gerar Tarefas ClickUp, Avaliar Contas em Risco

**Saida:** "Alinhamento Concluido"

### 6.4 - Offboarding e Encerramento
**Arquivo:** `subprocesso-6.4-v5-data.js` | **Entrada:** Cancelamento ou nao renovacao

**Lanes (6):** Cliente, CS/Retention, Operacoes, Financeiro, Compliance/Legal, IA

**Fases e Tasks (38):**
- **Fase 1 - Deteccao & Retencao (7+gateway):** Registrar Motivo, IA Analisa Historico, Qualificar Motivo, Propor Contra-Oferta. Gateway: Aceita? Sim->Retencao, Nao->Fase 2
- **Fase 2 - Aprovacao & Planejamento (7+gateway):** Validar Pendencias, Compliance LGPD, Mapear Campanhas, IA Plano Desativacao, Reuniao Encerramento
- **Fase 3 - Desativacao Controlada (7):** Pausar Testes, Pausar Otimizacoes, Reduzir Budget, Monitorar Impacto, Desativar Campanhas/LPs, Metricas Finais
- **Fase 4 - Backup & Handoff (7+gateway):** Exportar Relatorios, Backup Dados, LGPD Direito Esquecimento, Remover Acessos, Desconectar Integracoes
- **Fase 5 - Encerramento (10):** Nota Encerramento, Reembolso, Exit Interview, Pesquisa Saida, IA Analisa Churn, Consolidar Aprendizados, Atualizar Playbook, Win-Back List

**SLAs:** Deteccao 24h, Retencao 48h, Desativacao 5-7d, Backup 24h, Encerramento completo 14d

**Saidas:** "Retencao Bem-Sucedida" | "Offboarding Concluido"

---

## NIVEL 7: GESTAO FINANCEIRA (PARALELO)

### 7.1 - Faturamento e Cobranca
**Arquivo:** `subprocesso-7.1-v5-data.js` | **Entrada:** Ciclo mensal/trimestral

**Lanes (6):** Cliente, Financeiro, IA/Previsao, CS, Gestao, Operacoes

**Tasks (35):**
- **Faturamento:** IA Preve Receita, Validar Servicos, Calcular Valores, Gerar Fatura/NF, Enviar ao Cliente, Monitorar Prazo
- **Gateway: Pago no Prazo?** Sim->Registrar->Conciliar->Fim. Nao->Cobranca
- **Cobranca N1 Amigavel (D+3):** IA Alerta, CS Analisa Historico, Contato Amigavel
- **Cobranca N2 Formal (D+10):** Notificacao Formal, Gestao Aprova, Acompanhar
- **Cobranca N3 Suspensao (D+30):** Avaliar Suspensao, Calcular Multa, Notificar, Suspender Servicos, Acionar Juridico

**SLAs:** Fatura D-5, Amigavel D+3, Formal D+10, Suspensao D+30

**Saidas:** "Pagamento Recebido" | "Conta Suspensa"

### 7.2 - Renovacao de Contratos
**Arquivo:** `subprocesso-7.2-v5-data.js` | **Entrada:** D-60 antes vencimento

**Lanes (5):** Cliente, CS/Renovacao, IA/Analise, Financeiro, Gestao

**Tasks (37):**
- **Deteccao (D-60):** IA Detecta Vencimento, Analisa Saude (CSAT, Resultados), CS Revisa Historico. Gateway: Saudavel? Sim->Proposta Padrao, Nao->Proposta com Incentivo
- **Preparacao (D-50):** Calcular Renovacao, Preparar Proposta, IA Gera Apresentacao
- **Apresentacao (D-45):** Agendar Reuniao, Apresentar, Cliente Avalia. Gateway: Aceita?
- **Negociacao (D-30):** Registrar Objecoes, Revisar Valores, Contraproposta. Gateway: Aceita? Sim->Renovar, Nao->6.4
- **Renovacao:** Gerar Contrato, Assinar, Registrar, Atualizar Sistemas

**SLAs:** Deteccao D-60, Apresentacao D-45, Negociacao D-30/D-15, Fechamento D-7

**Saidas:** "Renovacao Concluida" | "Offboarding Acionado" -> 6.4

### 7.3 - Expansao (Upsell/Cross-sell)
**Arquivo:** `subprocesso-7.3-v5-data.js` | **Entrada:** Oportunidade detectada

**Lanes (4):** Cliente, CS/Growth, IA/Identificacao, Financeiro

**Tasks (28):**
- **Deteccao:** IA Detecta Oportunidade (Budget esgotado, ROAS >300%, Novo canal, Competidor agressivo), CS Qualifica, IA Calcula ROI
- **Preparacao:** Calcular Investimento, Preparar Proposta, IA Projecao Resultados
- **Apresentacao:** Agendar Reuniao, Apresentar Proposta
- **Gateway: Aceita?**
  - **Sim:** Gerar Aditivo, Assinar, Registrar, Acionar Re-onboarding Parcial (->2.1)
  - **Nao:** Registrar Motivo, IA Analisa Objecoes, Agendar Retomada Futura

**Saidas:** "Expansao Concluida" (-> 2.1 re-onboarding) | "Oportunidade Registrada" (follow-up)

---

## Dados Compartilhados entre Processos

| De -> Para | Dados |
|-----------|-------|
| 0.1 -> 1.1 | ICP, modelo de dados lead, regras qualificacao IA, pipeline |
| 1.1 -> 1.2 | Lead qualificado, historico cadencia, engajamento, contexto empresa |
| 1.2 -> 1.3 | Proposta, objecoes, ticket calculado, fit validado |
| 1.3 -> 2.1 | Contrato, briefing, dados pagamento, escopo |
| 2.1 -> 2.2/2.3 | Cliente operacional, acessos, briefing, integracoes |
| 2.2 -> 2.3 | Analise mercado, posicionamento, estrategia, insights |
| 2.3 -> 3.x | Metas, KPIs, dashboard, thresholds, objetivos |
| 3.1 -> 3.2/3.3/3.4 | Keywords, metricas volume/CPC, clusters intencao |
| 3.2 -> 3.3/3.4 | Personas, segmentacao, jornada, voice & tone |
| 3.3 -> 4.1/4.3 | Mensagens-chave, headlines, copies, briefing creative |
| 3.4 -> 4.2 | Budget total, alocacao canal, estrategia lances, limites |
| 4.1 -> 4.2 | Criativos finais, specs, variacoes, assets |
| 4.3 -> 4.2 | URL LP, tracking, formularios, LP validada |
| 4.2 -> 5.1 | Campanhas ativas, estrutura, metricas baseline, tracking |
| 5.1 <-> 5.2 | Anomalia/contexto/metricas <-> Otimizacoes/historico antes-depois |
| 5.1 <-> 5.3 | Oportunidade teste/baseline <-> Teste concluido/aprendizados |
| 7.2 -> 6.4 | Contrato nao renovado, historico, motivo |
| 7.3 -> 2.1 | Aditivo contratual, novo escopo, budget adicional |
| 7.1 -> 6.4 | Inadimplencia, suspensao, pendencias financeiras |

## Integracoes Externas

| Sistema | Processos |
|---------|-----------|
| CRM | 0.1, 1.1, 1.2, 1.3, 2.1, 3.2, 4.2, 6.1, 6.3, 7.2, 7.3 |
| IA/Automacao | Todos os niveis (0-7) |
| Plataformas Midia | 4.2, 5.2 (Google Ads, Meta Ads, LinkedIn) |
| Analytics | 4.2, 4.3, 5.1 (GA4, GTM, Pixels) |
| Dashboards BI | 5.1, 5.2, 5.3, 6.2, 7.1 |
| Faturamento/ERP | 7.1, 7.2, 7.3 |
| Compliance/LGPD | 6.4 |

## Estrutura de Dados BPMN (window.v5Data)

Cada processo registra em `window.v5Data['X.Y']`:
```javascript
{
  diagramXML,    // Definicao BPMN completa
  nodeDetails,   // Tasks com SLA, tag, descricao
  phases,        // Fases visuais { name, x, width }
  zoom,          // Nivel de zoom
  storageKey,    // Identificador unico
  startLabel,    // Label evento inicial
  endLabels,     // Labels eventos finais
}
```

Chaves: `0.1`, `1.1`-`1.3`, `2.1`-`2.3`, `3.1`-`3.4`, `4.1`-`4.3`, `5.1`-`5.3`, `6.1`-`6.4`, `7.1`-`7.3`
