# Arquitetura do Sistema de Fluxos BPMN - Hierarquia v5

## Visão Geral

Sistema completo de automação de vendas e marketing B2B estruturado em 8 níveis hierárquicos (0 a 7), desde a geração de leads até a otimização contínua, gestão de relacionamento com cliente e gestão financeira do ciclo de vida.

## Estrutura Hierárquica

```
0.1 (Raiz)
│
├── 1.1 → 1.2 → 1.3 (Funil de Vendas)
│         │
│         └── 2.1 (Onboarding)
│              │
│              ├── 2.2 (Análise)
│              └── 2.3 (KPIs)
│                   │
│                   ├── 3.1 (Keywords)
│                   ├── 3.2 (Audiência)
│                   ├── 3.3 (Conteúdo)
│                   └── 3.4 (Budget)
│                        │
│                        ├── 4.1 (Anúncios)
│                        ├── 4.2 (Campanha)
│                        └── 4.3 (Landing Page)
│                             │
│                             └── 5.1 (Monitoramento) ⟲
│                                  │
│                                  ├── 5.2 (Otimização) ⟲
│                                  └── 5.3 (Testes A/B) ⟲
│
├── 6.x (Customer Success - Paralelo a todos os níveis)
│   ├── 6.1 (Atendimento) ⟲ - Suporte reativo
│   ├── 6.2 (Apresentação) → Após ciclos 5.x
│   ├── 6.3 (Alinhamento) ⟲ - Proativo ou sob demanda
│   └── 6.4 (Offboarding) → Cancelamento
│
└── 7.x (Gestão Financeira - Paralelo a todos os níveis)
    ├── 7.1 (Faturamento) ⟲ - Ciclo mensal
    ├── 7.2 (Renovação) ⟲ - D-60 antes vencimento
    └── 7.3 (Expansão) ⟲ - Oportunidades proativas
```

**Nota:**
- Processos 5.x operam em **loop contínuo** (⟲) para otimização permanente
- Processos 6.x operam **em paralelo** a todos os níveis para gestão de relacionamento
- Processos 7.x operam **em paralelo** gerenciando o ciclo de vida financeiro do cliente

---

## NÍVEL 0: PROCESSO PRINCIPAL

### 0.1 - Pre-SDR: Dados e Estratégia
**Arquivo:** `subprocesso-0.1-v5-data.js`
**Função:** Processo raiz que estabelece a fundação estratégica

#### Lanes (5):
- Estratégia / Direção
- Marketing / Tráfego
- RevOps / CRM e Dados
- IA e Automação
- Jurídico / DPO

#### Fases (5):
1. Estratégia & Oferta
2. ICP & Nicho
3. Canais & Fontes
4. Dados & CRM
5. IA & Finalização

#### Tasks Principais (11):
- Definir Oferta e Proposta de Valor
- Definir ICP e Nicho
- Definir Canais de Aquisição
- Configurar Fontes de Lead
- Definir Modelo de Dados do Lead
- Configurar CRM e Pipeline
- Configurar Integrações
- Definir Regras de Qualificação IA
- Configurar Pipeline IA e Feedback
- Validar Template de Lead

#### Saída:
→ **"Leads Prontos para SDR"** conecta a **1.1**

---

## NÍVEL 1: FUNIL DE VENDAS

### 1.1 - Prospecção SDR
**Arquivo:** `subprocesso-1.1-v5-data.js`
**Entrada:** Leads qualificados do processo 0.1

#### Lanes (4):
- SDR
- Automação
- IA
- Cliente / Nurturing

#### Fases (6):
1. Recebimento e Qualificação
2. Pesquisa e Enriquecimento
3. Cadência e Contato
4. Follow-up e Nutrição
5. Agendamento
6. Confirmação e Handoff

#### Tasks Principais (14):
- Receber Lead Qualificado
- Verificar Fit (IA)
- Pesquisar Empresa e Contexto
- Enriquecer Dados (IA)
- Iniciar Cadência Multicanal
- Personalizar Contato
- Rastrear Resposta
- Analisar Engajamento (IA)
- Seguir Cadência Automática
- Ajustar Mensagens
- Propor Reunião de Diagnóstico
- Confirmar Agenda
- Enviar Convite e Material
- Transferir para Executivo de Vendas

#### Saída:
→ **"Reunião Agendada"** conecta a **1.2**

---

### 1.2 - Apresentação e Vendas
**Arquivo:** `subprocesso-1.2-v5-data.js`
**Entrada:** Reunião agendada do processo 1.1

#### Lanes (5):
- Executivo Vendas
- Automação / CRM
- IA Assistente
- Cliente / Decisor
- Feedback / Nurturing

#### Fases (7):
1. Preparação e Pesquisa
2. Reunião de Diagnóstico
3. Análise e Proposta
4. Apresentação da Proposta
5. Follow-up e Ajustes
6. Envio e Confirmação
7. Handoff para Fechamento

#### Tasks Principais (21):
- Receber Handoff do SDR
- Preparar Pesquisa Avançada
- Gerar Insight IA
- Confirmar Reunião
- Conduzir Discovery
- Mapear Dor e Fit
- Confirmar Interesse
- Analisar Dados da Reunião
- Calcular Ticket IA
- Estruturar Proposta
- Revisar e Ajustar
- Agendar Apresentação
- Apresentar Proposta
- Responder Objeções
- Negociar Escopo
- Validar Orçamento
- Ajustar Proposta Final
- Enviar Proposta Formal
- Capturar Feedback
- Priorizar Follow-up
- Transferir para Closing

#### Saída:
→ **"Proposta Enviada"** conecta a **1.3**

---

### 1.3 - Fechamento
**Arquivo:** `subprocesso-1.3-v5-data.js`
**Entrada:** Proposta enviada do processo 1.2

#### Lanes (5):
- Executivo Vendas
- Financeiro / Contrato
- IA Assistente
- Cliente / Decisor
- CS / Onboarding

#### Fases (7):
1. Recebimento e Análise
2. Negociação e Ajustes
3. Aprovação Interna
4. Elaboração de Contrato
5. Revisão e Assinatura
6. Confirmação e Registro
7. Handoff para Onboarding

#### Tasks Principais (22):
- Receber Proposta Aceita
- Analisar Histórico e Fit
- Agendar Negociação
- Negociar Condições
- Ajustar Escopo ou Valores
- Validar Orçamento Final
- Solicitar Aprovação Interna
- Gerar Contrato
- Revisar Cláusulas
- Enviar para Cliente
- Cliente Revisa Contrato
- Cliente Solicita Ajustes (opcional)
- Revisar e Reenviar
- Cliente Aprova Contrato
- Assinar Contrato
- Registrar no CRM
- Confirmar Pagamento
- Enviar Boas-Vindas
- Criar Pasta do Cliente
- Preparar Briefing Inicial
- Agendar Kickoff
- Transferir para Onboarding

#### Saída:
→ **"Contrato Fechado"** conecta a **2.1**

---

## NÍVEL 2: ONBOARDING E PLANEJAMENTO ESTRATÉGICO

### 2.1 - Onboarding
**Arquivo:** `subprocesso-2.1-v5-data.js`
**Entrada:** Contrato fechado do processo 1.3

#### Lanes (6):
- CS / Onboarding
- Cliente / Responsáveis
- Técnico / Setup
- IA / Automação
- Financeiro / Admin
- Escalation / Gestão

#### Fases (7):
1. Recebimento e Kickoff
2. Coleta de Briefing
3. Setup de Acessos
4. QA Técnica
5. Validação e Aprovação
6. Handoff para Operação
7. Monitoramento Inicial

#### Tasks Principais (22):
- Receber Handoff de Closing
- Validar Dados e Contrato
- Agendar Kickoff
- Conduzir Reunião de Kickoff
- Enviar Checklist de Onboarding
- Coletar Briefing Completo
- Validar Briefing (IA)
- Solicitar Acessos e Credenciais
- Configurar Acessos
- Testar Integrações
- Detectar Riscos (IA)
- Escalar Bloqueios
- Revisar Setup
- Enviar para Aprovação do Cliente
- Cliente Aprova Setup
- Registrar Aprovação
- Preparar Handoff Operacional
- Transferir para Operação
- Monitorar Primeiros 30 Dias
- Capturar Feedback Inicial
- Identificar Risco de Churn
- Planejar Ações de Retenção

#### Saída:
→ **"Cliente Operacional"** conecta aos processos paralelos **2.2** e **2.3**

---

### 2.2 - Análise de Mercado e Concorrência
**Arquivo:** `subprocesso-2.2-v5-data.js`
**Entrada:** Cliente operacional do processo 2.1

#### Lanes (5):
- Estratégia / Analista
- IA / Pesquisa
- Cliente / Stakeholder
- Dados / Insights
- Gestão / Aprovação

#### Fases (7):
1. Recebimento e Scoping
2. Pesquisa de Mercado
3. Análise Competitiva
4. Geração de Insights
5. Formulação de Estratégia
6. Validação e Aprovação
7. Entrega e Documentação

#### Tasks Principais (22):
- Receber Solicitação de Análise
- Definir Escopo e Objetivos
- Coletar Dados de Mercado
- Pesquisar Tendências (IA)
- Identificar Concorrentes
- Analisar Posicionamento Competitivo
- Mapear Diferenciais e Gaps
- Extrair Dados Competitivos
- Clusterizar Insights (IA)
- Gerar Relatório Preliminar
- Validar com Cliente
- Capturar Feedback
- Formular Hipóteses Estratégicas
- Simular Cenários
- Propor Recomendações
- Revisar com Gestão
- Enviar para Aprovação do Cliente
- Cliente Aprova Estratégia
- Documentar Decisões
- Compartilhar com Time
- Arquivar Documentação
- Transferir para Planejamento de KPIs

#### Saída:
→ **"Estratégia Aprovada"** conecta a **2.3**

---

### 2.3 - Definição de Metas e KPIs
**Arquivo:** `subprocesso-2.3-v5-data.js`
**Entrada:** Estratégia aprovada do processo 2.2

#### Lanes (5):
- Estratégia / Planejamento
- IA / Simulação
- Cliente / Aprovação
- Dados / Tracking
- Gestão / Governança

#### Fases (7):
1. Recebimento e Contextualização
2. Definição de Objetivos
3. Cálculo de KPIs
4. Simulação de Cenários
5. Validação com Cliente
6. Aprovação e Documentação
7. Setup de Monitoramento

#### Tasks Principais (23):
- Receber Estratégia Aprovada
- Contextualizar Objetivos de Negócio
- Definir Metas Primárias
- Definir Metas Secundárias
- Calcular KPIs Esperados (IA)
- Validar Viabilidade
- Simular Cenários Otimista/Pessimista
- Gerar Projeções
- Apresentar Metas ao Cliente
- Cliente Revisa Metas
- Cliente Solicita Ajustes (opcional)
- Revisar e Recalcular
- Cliente Aprova Metas
- Documentar Acordo de Metas
- Configurar Dashboard
- Definir Alertas e Thresholds
- Configurar Relatórios Automáticos
- Validar Tracking
- Compartilhar com Time
- Agendar Revisão de Progresso
- Arquivar Documentação
- Registrar Governança
- Transferir para Planejamento de Campanha

#### Saída:
→ **"Metas Definidas"** conecta aos processos paralelos **3.1, 3.2, 3.3, 3.4**

---

## NÍVEL 3: PLANEJAMENTO DE CAMPANHA

### 3.1 - Pesquisa de Palavras-Chave
**Arquivo:** `subprocesso-3.1-v5-data.js`
**Entrada:** Metas definidas do processo 2.3

#### Lanes (5):
- Estratégia / SEO-SEM
- IA / Expansão
- Cliente / Validação
- Compliance / Risco
- Dados / Análise

#### Fases (7):
1. Briefing e Contexto
2. Pesquisa Seed
3. Expansão e Geração
4. Análise e Priorização
5. Validação de Compliance
6. Aprovação do Cliente
7. Entrega e Documentação

#### Tasks Principais (22):
- Receber Briefing e Metas
- Coletar Keywords Seed do Cliente
- Pesquisar Keywords Base
- Expandir com IA
- Gerar Variações Long-tail
- Calcular Métricas (Volume, CPC, Dificuldade)
- Clusterizar por Intenção
- Priorizar por Fit e Potencial
- Validar Compliance e Riscos
- Revisar Termos Sensíveis
- Apresentar Lista ao Cliente
- Cliente Revisa Keywords
- Cliente Solicita Ajustes (opcional)
- Refinar Lista
- Cliente Aprova Keywords
- Documentar Aprovação
- Gerar Relatório Final
- Compartilhar com Time
- Arquivar Documentação
- Configurar Tracking
- Agendar Revisão Periódica
- Transferir para Próxima Fase

#### Saída:
→ **"Keywords Aprovadas"** conecta a **3.2, 3.3, 3.4**

---

### 3.2 - Definição de Público-Alvo
**Arquivo:** `subprocesso-3.2-v5-data.js`
**Entrada:** Keywords aprovadas do processo 3.1

#### Lanes (5):
- Estratégia / Persona
- IA / Análise
- Cliente / Validação
- Dados / CRM
- Creative / Brand Voice

#### Fases (7):
1. Coleta de Dados
2. Análise de Padrões
3. Criação de Personas
4. Segmentação Avançada
5. Definição de Voice & Tone
6. Validação do Cliente
7. Documentação e Entrega

#### Tasks Principais (23):
- Receber Keywords e Contexto
- Coletar Dados de CRM
- Analisar Base Atual
- Identificar Padrões (IA)
- Criar Personas Primárias
- Criar Personas Secundárias
- Definir Jobs-to-be-Done
- Mapear Jornada do Cliente
- Segmentar por Comportamento
- Calcular Tamanho de Audiência
- Definir Tom e Voz da Marca
- Criar Guia de Linguagem
- Validar Alinhamento de Brand
- Apresentar Personas ao Cliente
- Cliente Revisa Personas
- Cliente Solicita Ajustes (opcional)
- Refinar Personas
- Cliente Aprova Personas
- Documentar Aprovação
- Gerar Guia de Audiência
- Compartilhar com Time Creative
- Arquivar Documentação
- Transferir para Estratégia de Conteúdo

#### Saída:
→ **"Personas Aprovadas"** conecta a **3.3, 3.4**

---

### 3.3 - Estratégia de Conteúdo
**Arquivo:** `subprocesso-3.3-v5-data.js`
**Entrada:** Personas aprovadas do processo 3.2

#### Lanes (5):
- Estratégia / Content
- IA / Ideação
- Cliente / Feedback
- Creative / Produção
- QA / Brand

#### Fases (8):
1. Briefing de Conteúdo
2. Mapeamento de Mensagens
3. Ideação Criativa
4. Desenvolvimento de Copies
5. Revisão de Qualidade
6. Validação do Cliente
7. Aprovação Final
8. Preparação para Produção

#### Tasks Principais (24):
- Receber Personas e Keywords
- Consolidar Briefing de Conteúdo
- Mapear Mensagens-Chave
- Definir Hierarquia de Mensagens
- Brainstorm com IA
- Gerar Ideias de Ângulos
- Selecionar Melhores Conceitos
- Escrever Headlines
- Escrever Body Copies
- Escrever CTAs
- Revisar Tom e Voz
- Validar Compliance
- Revisar Gramática e Clareza
- Gerar Variações A/B
- Apresentar ao Cliente
- Cliente Revisa Copies
- Cliente Solicita Ajustes (opcional)
- Refinar Copies
- Cliente Aprova Copies
- Documentar Aprovação
- Preparar Assets para Produção
- Gerar Briefing Creative
- Compartilhar com Time de Produção
- Transferir para Criação de Anúncios

#### Saída:
→ **"Conteúdo Aprovado"** conecta a **4.1**

---

### 3.4 - Orçamento e Lances
**Arquivo:** `subprocesso-3.4-v5-data.js`
**Entrada:** Keywords e personas aprovadas dos processos 3.1 e 3.2

#### Lanes (5):
- Estratégia / Mídia
- IA / Simulação
- Cliente / Aprovação
- Financeiro / Budget
- Dados / Projeção

#### Fases (7):
1. Coleta de Parâmetros
2. Distribuição de Budget
3. Estratégia de Lances
4. Simulação e Projeções
5. Análise de Risco
6. Validação do Cliente
7. Documentação e Entrega

#### Tasks Principais (22):
- Receber Metas e Keywords
- Definir Budget Total
- Alocar por Canal
- Alocar por Campanha
- Definir Estratégia de Bid
- Calcular CPCs Esperados
- Estimar Cliques e Conversões
- Simular Cenários (IA)
- Gerar Projeções de ROI
- Validar Viabilidade Financeira
- Identificar Riscos de Budget
- Propor Mitigações
- Apresentar ao Cliente
- Cliente Revisa Budget
- Cliente Solicita Ajustes (opcional)
- Revisar Alocação
- Cliente Aprova Budget
- Documentar Aprovação
- Gerar Plano de Budget
- Configurar Limites de Gasto
- Compartilhar com Time
- Transferir para Configuração de Campanha

#### Saída:
→ **"Budget Aprovado"** conecta a **4.2**

---

## NÍVEL 4: EXECUÇÃO

### 4.1 - Criação de Anúncios
**Arquivo:** `subprocesso-4.1-v5-data.js`
**Entrada:** Conteúdo aprovado do processo 3.3

#### Lanes (6):
- Produção Criativa
- Copywriting
- IA / Assistente
- QA / Compliance
- Automação / Specs
- Gestão / Aprovação

#### Fases (7):
1. Briefing e Planejamento
2. Criação Visual
3. Redação de Copy
4. Revisão e QA
5. Validação Interna
6. Aprovação do Cliente
7. Preparação para Veiculação

#### Tasks Principais (21):
- Receber Briefing Creative
- Validar Specs Técnicas
- Criar Layouts Visuais
- Gerar Variações (IA)
- Adaptar para Formatos
- Escrever Headlines Finais
- Escrever Descriptions
- Inserir CTAs
- Revisar Alinhamento de Brand
- Validar Compliance
- Testar Legibilidade
- Revisar Internamente
- Gerar Mockups
- Apresentar ao Cliente
- Cliente Revisa Anúncios
- Cliente Solicita Ajustes (opcional)
- Refinar Criativos
- Cliente Aprova Anúncios
- Documentar Aprovação
- Exportar Assets Finais
- Transferir para Configuração

#### Saída:
→ **"Anúncios Prontos"** conecta a **4.2**

---

### 4.2 - Configuração de Campanha
**Arquivo:** `subprocesso-4.2-v5-data.js`
**Entrada:** Anúncios prontos (4.1) e budget aprovado (3.4)

#### Lanes (5):
- Mídia / Setup
- Técnico / Tracking
- IA / QA
- Cliente / Validação
- Gestão / Governança

#### Fases (7):
1. Setup Inicial
2. Estruturação de Campanha
3. Upload de Anúncios
4. Configuração de Tracking
5. QA Técnica
6. Validação do Cliente
7. Ativação e Monitoramento

#### Tasks Principais (22):
- Receber Anúncios e Budget
- Acessar Plataformas de Mídia
- Criar Estrutura de Campanha
- Configurar Segmentação
- Configurar Lances
- Fazer Upload de Anúncios
- Configurar UTMs
- Configurar Pixels de Conversão
- Configurar GTM/GA4
- Testar Tracking
- Validar Links e Landing Pages
- Executar QA Técnica (IA)
- Revisar Configurações
- Gerar Preview para Cliente
- Cliente Valida Setup
- Cliente Solicita Ajustes (opcional)
- Corrigir Configurações
- Cliente Aprova Campanha
- Documentar Aprovação
- Ativar Campanha
- Configurar Alertas
- Transferir para Monitoramento

#### Saída:
→ **"Campanha Ativa"** → Final do fluxo ou loop de otimização

---

### 4.3 - Criação de Landing Page
**Arquivo:** `subprocesso-4.3-v5-data.js`
**Entrada:** Conteúdo aprovado (3.3) - Processo paralelo a 4.1

#### Lanes (5):
- Tráfego / Estratégia
- UX / Copy
- UI / Implementação
- QA / Métricas
- IA / Automação

#### Fases (7):
1. Diagnóstico (Gateway)
2. Estratégia e Wireframe
3. Copywriting e Conteúdo
4. Design e Implementação
5. QA e Testes
6. Validação do Cliente
7. Publicação

#### Tasks Principais (20):
- Receber Solicitação de LP
- **Gateway:** LP Nova ou Otimização?
  - **Branch A - LP Nova:**
    - Definir Objetivos e Estrutura
    - Criar Wireframe
    - Escrever Copy da LP
    - Criar Design Visual
    - Implementar HTML/CSS/JS
  - **Branch B - Otimização:**
    - Analisar LP Atual
    - Identificar Pontos de Melhoria (IA)
    - Propor Ajustes
    - Implementar Otimizações
- Configurar Formulários
- Integrar com CRM
- Configurar Tracking
- Testar Responsividade
- Executar QA Completo
- Validar Métricas
- Apresentar ao Cliente
- Cliente Aprova LP
- Publicar Landing Page
- Configurar Monitoramento
- Transferir para Campanha

#### Saída:
→ **"Landing Page Ativa"** → Integra com **4.2**

---

## NÍVEL 5: OTIMIZAÇÃO E MONITORAMENTO CONTÍNUO

### 5.1 - Monitoramento Diário
**Arquivo:** `subprocesso-5.1-v5-data.js`
**Entrada:** Campanhas ativas do processo 4.2 (loop contínuo)

#### Lanes (4):
- Gestor de Tráfego
- BI / Dashboards & Automação
- IA & Alertas
- Decisão & Registro

#### Fases (4):
1. Coleta & Visão Macro
2. Análise Detalhada
3. Decisão & Registro
4. Handoff para Ação

#### Tasks Principais (14):
- Atualizar Dashboards
- Abrir Painel Diário
- Checar Saúde das Contas
- Analisar Métricas Chave (CPL, CPC, CTR, CPM, ROAS)
- Consolidar Dados de LP
- Analisar Qualidade de Tráfego
- Detectar Anomalias (IA)
- Sugerir Oportunidades (IA)
- **Gateway:** Anomalia ou Oportunidade?
  - **Não:** Registrar Monitoramento OK → Fim Sem Ação
  - **Sim:** Classificar Ocorrência → Registrar → Criar Tarefa

#### Saídas:
→ **"Fim Sem Ação"** (tudo OK, retorna ao loop)
→ **"Fim Com Registro"** conecta a **5.2** ou **5.3**

---

### 5.2 - Otimização de Lances e Orçamento
**Arquivo:** `subprocesso-5.2-v5-data.js`
**Entrada:** Anomalia/Oportunidade detectada no processo 5.1

#### Lanes (4):
- Gestor de Tráfego
- IA de Otimização
- Plataformas (Meta/Google)
- BI / Dashboards

#### Fases (4):
1. Análise da Ocorrência
2. Decisão
3. Execução
4. Validação & Registro

#### Tasks Principais (12):
- Revisar Ocorrência
- Análise Detalhada
- IA Sugerir Otimização
- Escolher Estratégia
- Ajustar Lances
- Redistribuir Orçamento
- Aplicar Ajustes nas Campanhas
- Escala Automatizada
- Gravar Antes/Depois
- Registrar Otimização
- Definir Reavaliação

#### Saída:
→ **"Lances e Orçamento Otimizados"** retorna a **5.1** (loop de monitoramento)

---

### 5.3 - Testes A/B
**Arquivo:** `subprocesso-5.3-v5-data.js`
**Entrada:** Oportunidade de Teste A/B (de 5.1 ou iniciado proativamente)

#### Lanes (3):
- Gestor de Tráfego
- IA & Estatística
- Plataformas & BI

#### Fases (4):
1. Planejamento
2. Configuração & Execução
3. Análise
4. Implementação & Aprendizado

#### Tasks Principais (20):
- Validar Necessidade do Teste
- Checar Testes em Andamento (Governança)
- Criar Hipótese Estruturada
- Estimar Amostra e Duração (IA)
- Definir Amostra e Duração
- Criar Variações do Teste
- Aplicar Setup do Teste
- Validar Configuração Técnica
- Monitorar Desempenho do Teste
- Monitorar e Alertar (IA)
- Calcular Significância (Estatística)
- **Gateway:** Teste Significativo?
  - **Não:** Continuar Monitoramento (loop)
  - **Sim:** Implementar Variação Vencedora
- Consolidar Dados do Teste
- Documentar Aprendizados
- Registrar na Biblioteca de Testes
- Sugerir Próximos Testes (IA)
- Arquivar Teste e Relatórios

#### Saída:
→ **"Testes A/B Concluídos e Otimizados"** retorna a **5.1** (loop de monitoramento)

---

## NÍVEL 6: CUSTOMER SUCCESS E RELACIONAMENTO

### 6.1 - Atendimento ao Cliente
**Arquivo:** `subprocesso-6.1-v5-data.js`
**Entrada:** Demanda do Cliente (reativo - pode ocorrer a qualquer momento)

#### Lanes (5):
- Cliente
- Atendimento 1º Nível
- IA de Atendimento
- Operações / Tráfego
- Gestão / Coordenação

#### Fases (4):
1. Triagem
2. Processamento
3. Resolução
4. Pós-atendimento & Aprendizado

#### Tasks Principais (23):
- Confirmar Recebimento
- Registrar Demanda no Sistema
- Classificar e Sugerir Categoria (IA)
- Analisar e Classificar Demanda
- Consultar Base de Conhecimento
- Sugerir Resposta Padrão (IA)
- Prover Resposta/Solução Imediata
- **Gateway:** Resolvido no 1º Nível?
  - **Sim:** Enviar Resposta ao Cliente
  - **Não:** Encaminhar para Área Responsável → Diagnosticar Causa → Implementar Solução
- Registrar Causa Raiz
- Acompanhar Resolução
- **Gateway:** Cliente Satisfeito?
  - **Sim:** Fechar Demanda
  - **Não:** Reabrir/Escalar → Avaliar → Definir Melhorias
- Pesquisa de Satisfação (CSAT)
- Monitorar SLA e Alertar (IA)
- Analisar CSAT e Gerar Insights (IA)

#### Saídas:
→ **"Demanda Resolvida"** (ciclo completo de suporte)

---

### 6.2 - Apresentação de Resultados
**Arquivo:** `subprocesso-6.2-v5-data.js`
**Entrada:** Relatório gerado após ciclos de otimização (5.x)

#### Lanes (5):
- Cliente
- Atendimento / CS
- IA & Insights
- Operações / BI
- Gestão / Planejamento

#### Fases (4):
1. Preparação
2. Agendamento & Logística
3. Reunião & Storytelling
4. Feedback & Próximos Passos

#### Tasks Principais (22):
- Consolidar Dados Multicanais
- Atualizar Dashboards
- Validar Dados do Relatório
- Gerar Highlights e Alertas (IA)
- Preparar Apresentação de Resultados
- Sugerir Storytelling da Apresentação (IA)
- Gerar Resumo Executivo (IA)
- Revisão Interna (QA)
- Enviar Resumo Executivo (Opcional)
- Agendar Reunião de Apresentação
- Enviar Convite e Material
- Cliente Recebe Convite
- Realizar Reunião de Apresentação
- Cliente Participa da Apresentação
- Registrar Decisões e Pendências
- Consolidar Aprendizados
- Gerar Rascunho de Plano de Ação
- Coletar Feedback do Cliente
- Cliente Responde Pesquisa
- Analisar Sentimento e Risco (IA)
- Arquivar Relatório e Apresentação

#### Saída:
→ **"Resultados Apresentados"** (ciclo de prestação de contas)

---

### 6.3 - Reuniões de Alinhamento
**Arquivo:** `subprocesso-6.3-v5-data.js`
**Entrada:** Necessidade de Alinhamento (proativa ou solicitada pelo cliente)

#### Lanes (5):
- Cliente
- Atendimento / CS
- IA & Automação
- Operações / Tráfego
- Gestão / Planejamento

#### Fases (4):
1. Detecção & Qualificação
2. Preparação & Agendamento
3. Reunião de Alinhamento
4. Ata, Acompanhamento & Encerramento

#### Tasks Principais (21):
- Cliente Solicita Reunião de Alinhamento
- Registrar Necessidade de Alinhamento
- Detectar Necessidade Proativa (IA)
- Qualificar Motivo e Urgência
- Definir Objetivo do Alinhamento
- Sugerir Pauta da Reunião (IA)
- Agendar Reunião de Alinhamento
- Enviar Convite e Materiais
- Cliente Recebe Convite
- Preparar Insumos Técnicos
- Conduzir Reunião de Alinhamento
- Cliente Participa do Alinhamento
- Registrar Decisões e Próximos Passos
- Avaliar Impacto nas Operações
- Gerar Rascunho de Ata (IA)
- Enviar Ata e Follow-up
- Cliente Valida Ata
- Gerar Tarefas no ClickUp
- Avaliar Contas em Risco
- Atualizar Plano Estratégico

#### Saída:
→ **"Alinhamento Concluído"** (ciclo estratégico)

---

### 6.4 - Offboarding e Encerramento
**Arquivo:** `subprocesso-6.4-v5-data.js`
**Entrada:** Solicitação de Cancelamento ou Não Renovação

#### Lanes (6):
- Cliente
- CS / Retention
- Operações / Tráfego
- Financeiro / Cobrança
- Compliance / Legal
- IA / Automação

#### Fases (5):
1. Detecção & Tentativa de Retenção
2. Aprovação & Planejamento
3. Desativação Controlada
4. Backup & Handoff de Dados
5. Encerramento & Aprendizado

#### Tasks Principais (38):
**FASE 1 - Detecção & Retenção (7 tasks + Gateway):**
- Cliente Solicita Cancelamento
- IA Detecta Risco de Churn (Proativo)
- CS Registra Motivo do Cancelamento
- IA Analisa Histórico e Sentimento
- CS Qualifica Motivo (Preço, Resultado, Atendimento)
- CS Propõe Contra-Oferta
- **Gateway:** Cliente Aceita Retenção?
  - **SIM:** Registra Retenção → Fim (sucesso)
  - **NÃO:** Prossegue para Fase 2

**FASE 2 - Aprovação & Planejamento (7 tasks + Gateway):**
- Financeiro Valida Pendências
- **Gateway:** Há Inadimplência?
- Compliance Valida Obrigações Contratuais (LGPD)
- Operações Mapeia Campanhas Ativas
- IA Gera Plano de Desativação
- CS Agenda Reunião de Encerramento
- Cliente Valida Plano de Desativação

**FASE 3 - Desativação Controlada (7 tasks):**
- Operações Pausa Testes A/B (5.3)
- Operações Pausa Otimizações (5.2)
- Operações Reduz Budget Gradualmente
- IA Monitora Impacto da Redução
- Operações Desativa Campanhas (4.2)
- Operações Desativa Landing Pages (4.3)
- Operações Registra Métricas Finais

**FASE 4 - Backup & Handoff (7 tasks + Gateway):**
- BI Exporta Todos os Relatórios
- BI Gera Backup Completo de Dados
- Compliance Valida LGPD (Direito ao Esquecimento)
- **Gateway:** Cliente Quer Dados?
- Operações Remove Acessos do Cliente
- Operações Desconecta Integrações
- IA Remove Dados Sensíveis (conforme LGPD)

**FASE 5 - Encerramento & Aprendizado (10 tasks):**
- Financeiro Emite Nota de Encerramento
- Financeiro Processa Reembolso (se aplicável)
- CS Conduz Reunião de Exit Interview
- Cliente Responde Pesquisa de Saída
- IA Analisa Motivos de Churn
- CS Consolida Aprendizados
- CS Atualiza Playbook de Retenção
- CS Registra Cliente em "Win-Back List"
- Financeiro Arquiva Documentação
- FIM: Offboarding Concluído

#### SLAs:
- Detecção de risco: **24h**
- Tentativa de retenção: **48h**
- Desativação controlada: **5-7 dias**
- Backup de dados: **24h**
- Encerramento completo: **14 dias**

#### Saídas:
→ **"Retenção Bem-Sucedida"** (cliente permanece)
→ **"Offboarding Concluído"** (processo de encerramento finalizado)

---

## NÍVEL 7: GESTÃO COMERCIAL E FINANCEIRA

### 7.1 - Faturamento e Cobrança
**Arquivo:** `subprocesso-7.1-v5-data.js`
**Entrada:** Ciclo de Faturamento (mensal/trimestral)

#### Lanes (6):
- Cliente
- Financeiro / Cobrança
- IA / Previsão
- CS / Relacionamento
- Gestão / Aprovação
- Operações / Tráfego

#### Fases (5):
1. Faturamento
2. Monitoramento & Pagamento
3. Cobrança Amigável (D+3)
4. Cobrança Formal (D+10)
5. Suspensão (D+30)

#### Tasks Principais (35):
**Ciclo de Faturamento:**
- IA Prevê Receita do Mês
- Financeiro Valida Serviços Prestados
- Financeiro Calcula Valores de Faturamento
- Financeiro Gera Fatura e NF
- Automação Envia Fatura ao Cliente
- Cliente Recebe Fatura
- IA Monitora Prazo de Pagamento

**Gateway Principal:** Pago no Prazo?
- **SIM:** Registra Pagamento → Concilia → Analisa Padrão → Fim
- **NÃO:** Cobrança Nível 1 (Amigável)

**Cobrança Nível 1 - Amigável (D+3):**
- IA Alerta sobre Atraso
- CS Analisa Histórico de Pagamentos
- CS Contato Amigável
- Cliente Responde sobre o Atraso
- **Gateway:** Pagou após Contato?

**Cobrança Nível 2 - Formal (D+10):**
- Financeiro Gera Notificação Formal
- Gestão Aprova Cobrança Formal
- Automação Envia Notificação Formal
- CS Acompanha Cobrança
- **Gateway:** Pagou após Formal?

**Cobrança Nível 3 - Suspensão (D+30):**
- Gestão Avalia Suspensão
- Financeiro Calcula Multa e Juros
- CS Notifica Suspensão Iminente
- **Gateway:** Pagou antes Suspensão?
  - **NÃO:** Operações Suspende Serviços → Aciona Jurídico

#### SLAs:
- Geração de fatura: **D-5**
- Cobrança amigável: **D+3**
- Cobrança formal: **D+10**
- Suspensão de serviço: **D+30**

#### Saídas:
→ **"Pagamento Recebido"** (ciclo completo)
→ **"Conta Suspensa"** (inadimplência crítica)

---

### 7.2 - Renovação de Contratos
**Arquivo:** `subprocesso-7.2-v5-data.js`
**Entrada:** D-60 antes do vencimento do contrato

#### Lanes (5):
- Cliente
- CS / Renovação
- IA / Análise
- Financeiro / Proposta
- Gestão / Aprovação

#### Fases (5):
1. Detecção & Análise (D-60)
2. Preparação de Proposta (D-50)
3. Apresentação & Reunião (D-45)
4. Negociação (D-30)
5. Fechamento ou Offboarding (D-7)

#### Tasks Principais (37):
**Detecção e Análise:**
- IA Detecta Contrato Próximo ao Vencimento (D-60)
- IA Analisa Saúde da Conta (CSAT, Resultados, Engagement)
- CS Revisa Histórico de Relacionamento
- IA Gera Insights
- **Gateway:** Conta Saudável?
  - **SIM:** Proposta Padrão
  - **NÃO:** Proposta com Incentivo/Desconto

**Preparação de Proposta:**
- Financeiro Calcula Renovação (Padrão ou com Incentivo)
- CS Prepara Proposta
- IA Gera Apresentação
- CS Revisa Proposta

**Apresentação:**
- CS Agenda Reunião de Renovação
- Automação Envia Proposta
- CS Apresenta Proposta
- Cliente Avalia Proposta
- **Gateway:** Cliente Aceita?

**Negociação (se necessário):**
- Cliente Solicita Ajustes
- CS Registra Objeções
- Financeiro Revisa Valores
- Gestão Aprova Ajustes
- CS Apresenta Contraproposta
- **Gateway:** Aceita Contraproposta?
  - **SIM:** Renovação
  - **NÃO:** Tentativa Final de Retenção → **Aciona 6.4**

**Renovação Aceita:**
- Financeiro Gera Novo Contrato
- Cliente Assina Contrato
- Financeiro Registra Renovação
- Automação Atualiza Sistemas
- CS Celebra Renovação

#### SLAs:
- Detecção: **D-60**
- Primeira apresentação: **D-45**
- Negociação: **D-30 a D-15**
- Fechamento: **D-7**

#### Saídas:
→ **"Renovação Concluída"** (contrato renovado)
→ **"Offboarding Acionado"** (não renovação → 6.4)

---

### 7.3 - Expansão (Upsell/Cross-sell)
**Arquivo:** `subprocesso-7.3-v5-data.js`
**Entrada:** Oportunidade detectada (proativa ou reativa)

#### Lanes (4):
- Cliente
- CS / Growth
- IA / Identificação
- Financeiro / Proposta

#### Fases (5):
1. Detecção & Qualificação
2. Preparação de Proposta
3. Apresentação Comercial
4. Avaliação & Decisão
5. Expansão ou Follow-up Futuro

#### Tasks Principais (28):
**Detecção de Oportunidade:**
- IA Detecta Oportunidade de Expansão:
  - Budget esgotado consistentemente (5.1)
  - ROAS acima de threshold >300% (6.2)
  - Cliente solicita novos canais (6.3)
  - Competidor lança campanha agressiva
- IA Analisa Gatilhos
- CS Qualifica Oportunidade
- IA Calcula Potencial (ROI/Receita)
- CS Avalia Capacidade Operacional

**Preparação:**
- Financeiro Calcula Investimento Necessário
- CS Prepara Proposta de Expansão
- IA Gera Projeção de Resultados
- CS Revisa Proposta

**Apresentação:**
- CS Agenda Reunião Comercial
- Automação Envia Material Preparatório
- CS Apresenta Proposta de Expansão
- Cliente Participa da Reunião

**Avaliação:**
- Cliente Avalia Proposta
- CS Acompanha Decisão
- CS Esclarece Dúvidas
- **Gateway:** Cliente Aceita?

**Expansão Aceita (SIM):**
- Financeiro Gera Aditivo Contratual
- Cliente Assina Aditivo
- Financeiro Registra Expansão
- Automação Atualiza Sistemas
- **CS Aciona Re-onboarding Parcial (→ 2.1)**
- IA Analisa Taxa de Expansão
- CS Celebra Expansão

**Expansão Recusada (NÃO):**
- CS Registra Motivo da Recusa
- IA Analisa Padrões de Objeções
- CS Define Follow-up Futuro
- Automação Agenda Retomada Automática
- CS Atualiza Pipeline

#### Gatilhos de Oportunidade:
- Budget esgotado consistentemente
- ROAS acima de threshold (ex: >300%)
- Cliente pergunta sobre novos canais
- Competidor lança campanha agressiva

#### Saídas:
→ **"Expansão Concluída"** (novo escopo → re-onboarding parcial em 2.1)
→ **"Oportunidade Registrada"** (follow-up futuro agendado)

---

## CONEXÕES E DEPENDÊNCIAS

### Fluxo Linear Principal (Sequencial):
```
0.1 → 1.1 → 1.2 → 1.3 → 2.1 → 2.2 → 2.3
```

### Fluxo de Planejamento (Paralelo após 2.3):
```
2.3 → [3.1, 3.2, 3.3, 3.4]
```
- Todos os processos 3.x podem iniciar em paralelo
- 3.1 (Keywords) alimenta 3.2, 3.3 e 3.4
- 3.2 (Audiência) alimenta 3.3 e 3.4
- 3.3 (Conteúdo) alimenta 4.1 e 4.3
- 3.4 (Budget) alimenta 4.2

### Fluxo de Execução (Paralelo e Convergente):
```
3.3 → [4.1, 4.3]
3.4 → 4.2
4.1 + 4.3 → 4.2 → Campanha Ativa
```

### Fluxo de Otimização Contínua (Loop):
```
4.2 → 5.1 (Monitoramento Diário) ⟲
      │
      ├─→ 5.2 (Otimização de Lances) → 5.1 ⟲
      │
      └─→ 5.3 (Testes A/B) → 5.1 ⟲
```
- 5.1 roda diariamente em loop contínuo
- Detecta anomalias/oportunidades e dispara 5.2 ou 5.3
- 5.2 e 5.3 retornam para 5.1 após conclusão
- Ciclo de melhoria contínua

### Fluxo de Customer Success (Paralelo):
```
6.1 (Atendimento) ⟲ - Opera em paralelo a todos os níveis
     Entrada: Demanda do Cliente (reativa)
     Saída: Demanda Resolvida

5.x → 6.2 (Apresentação) - Após ciclos de otimização
      Entrada: Relatório gerado
      Saída: Resultados Apresentados

6.3 (Alinhamento) ⟲ - Opera em paralelo a todos os níveis
     Entrada: Necessidade proativa ou solicitada
     Saída: Alinhamento Concluído

7.2 (Não Renovação) → 6.4 (Offboarding) - Cancelamento ou Churn
     Entrada: Solicitação de cancelamento
     Saída: Retenção Bem-Sucedida ou Offboarding Concluído
```
- 6.1 atende demandas reativas a qualquer momento
- 6.2 apresenta resultados periodicamente
- 6.3 mantém alinhamento estratégico contínuo
- 6.4 gerencia cancelamentos com tentativa de retenção

### Fluxo de Gestão Financeira (Paralelo):
```
7.1 (Faturamento e Cobrança) ⟲ - Ciclo mensal
     Entrada: Ciclo de faturamento (mensal/trimestral)
     Gatilhos: D+3 (Amigável), D+10 (Formal), D+30 (Suspensão)
     Saída: Pagamento Recebido ou Conta Suspensa

7.2 (Renovação de Contratos) ⟲ - Ciclo de renovação
     Entrada: D-60 antes do vencimento
     Gatilhos: D-60 (Análise), D-45 (Apresentação), D-30 (Negociação), D-7 (Fechamento)
     Saída: Renovação Concluída ou → 6.4 (Offboarding)

7.3 (Expansão - Upsell/Cross-sell) ⟲ - Oportunidades proativas
     Entrada: Oportunidades detectadas pela IA (Budget esgotado, ROAS >300%, Novos canais)
     Saída: Expansão Concluída (→ 2.1 Re-onboarding Parcial) ou Follow-up Futuro
```
- 7.1 gerencia ciclo de faturamento e cobrança com 3 níveis de escalação
- 7.2 gerencia renovações contratuais 60 dias antes do vencimento
- 7.3 identifica e capitaliza oportunidades de crescimento (upsell/cross-sell)

---

## DADOS COMPARTILHADOS ENTRE PROCESSOS

### De 0.1 para 1.1:
- ICP definido
- Modelo de dados do lead
- Regras de qualificação IA
- Pipeline configurado

### De 1.1 para 1.2:
- Lead qualificado
- Histórico de cadência
- Dados de engajamento
- Contexto da empresa

### De 1.2 para 1.3:
- Proposta estruturada
- Histórico de objeções
- Ticket calculado
- Fit validado

### De 1.3 para 2.1:
- Contrato assinado
- Briefing inicial
- Dados de pagamento
- Escopo acordado

### De 2.1 para 2.2 e 2.3:
- Cliente operacional
- Acessos configurados
- Briefing completo
- Integrações ativas

### De 2.2 para 2.3:
- Análise de mercado
- Posicionamento competitivo
- Estratégia validada
- Insights de mercado

### De 2.3 para 3.x:
- Metas e KPIs
- Dashboard configurado
- Thresholds definidos
- Objetivos de negócio

### De 3.1 para 3.2, 3.3, 3.4:
- Lista de keywords
- Métricas de volume e CPC
- Clusters de intenção
- Priorização

### De 3.2 para 3.3, 3.4:
- Personas definidas
- Segmentação
- Jornada mapeada
- Voice & tone

### De 3.3 para 4.1, 4.3:
- Mensagens-chave
- Headlines e copies
- Briefing creative
- Variações A/B

### De 3.4 para 4.2:
- Budget total
- Alocação por canal
- Estratégia de lances
- Limites de gasto

### De 4.1 para 4.2:
- Criativos finais
- Especificações técnicas
- Variações de anúncios
- Assets exportados

### De 4.3 para 4.2:
- URL da Landing Page
- Configuração de tracking
- Formulários integrados
- LP validada

### De 4.2 para 5.1:
- Campanhas ativas
- Estrutura de campanha
- Métricas baseline
- Configuração de tracking

### De 5.1 para 5.2:
- Anomalia/Oportunidade detectada
- Contexto da ocorrência
- Métricas atuais
- Histórico de performance

### De 5.1 para 5.3:
- Oportunidade de teste identificada
- Elemento a ser testado
- Contexto e baseline
- Objetivo do teste

### De 5.2 para 5.1:
- Otimizações aplicadas
- Novos lances e budget
- Histórico antes/depois
- Data de reavaliação

### De 5.3 para 5.1:
- Teste concluído
- Variação vencedora implementada
- Aprendizados documentados
- Sugestões de próximos testes

### De 7.2 para 6.4:
- Contrato não renovado
- Histórico de relacionamento
- Motivo da não renovação
- Dados do cliente

### De 6.4 para Win-Back:
- Motivo do churn
- Aprendizados consolidados
- Cliente em "Win-Back List"
- Timeline para retomada

### De 7.1 (Inadimplência) para 6.4:
- Histórico de inadimplência
- Suspensão de serviços
- Pendências financeiras
- Tentativas de cobrança

### De 7.3 para 2.1:
- Aditivo contratual assinado
- Novo escopo de serviços
- Budget adicional aprovado
- Re-onboarding parcial necessário

### Dados de 7.1 (Faturamento):
- Faturas geradas e enviadas
- Status de pagamento
- Histórico de inadimplência
- Projeção de receita (IA)

### Dados de 7.2 (Renovação):
- Data de vencimento do contrato
- Saúde da conta (CSAT, ROAS)
- Proposta de renovação
- Status da negociação

### Dados de 7.3 (Expansão):
- Oportunidades detectadas (IA)
- Gatilhos de expansão
- ROI projetado
- Propostas enviadas

---

## PONTOS DE INTEGRAÇÃO

### Sistemas Externos:
- **CRM:** Integrado em 0.1, 1.1, 1.2, 1.3, 2.1, 3.2, 4.2, 6.1, 6.3, 7.2, 7.3
- **IA/Automação:** Presente em todos os níveis (0-7)
- **Plataformas de Mídia:** 4.2, 5.2 (Google Ads, Meta Ads, LinkedIn Ads)
- **Analytics:** 4.2, 4.3, 5.1 (GA4, GTM, Pixels)
- **Dashboards BI:** 5.1, 5.2, 5.3, 6.2, 7.1 (Looker, Power BI, etc.)
- **Ferramentas de SEO:** 3.1 (pesquisa de keywords)
- **Ferramentas de Design:** 4.1, 4.3 (Figma, Canva, etc.)
- **Ferramentas de Estatística:** 5.3 (cálculo de significância A/B)
- **Sistema de Faturamento:** 7.1 (geração de NF, boletos, cobrança)
- **Sistema Financeiro/ERP:** 7.1, 7.2, 7.3 (conciliação, receita, contratos)
- **Sistema de E-mail/Notificações:** 6.1, 6.2, 6.3, 7.1, 7.2 (comunicação com cliente)
- **Compliance/LGPD:** 6.4 (gestão de dados, direito ao esquecimento)

### Aprovações de Cliente:
- Pontos de validação em todos os processos de nível 2, 3 e 4
- Gateways de decisão para ajustes ou aprovação
- Loops de feedback estruturados

### Governança:
- SLAs definidos por task
- Tags para categorização
- Fases para organização visual
- Monitoramento contínuo em todos os níveis

---

## CARACTERÍSTICAS TÉCNICAS

### Estrutura de Dados (Comum a todos os arquivos):
```javascript
const nodeDetails = {
  'Task_ID': {
    sla: 'Período',
    tag: 'Categoria',
    desc: 'Descrição da tarefa'
  }
};

const diagramXML = `<?xml version="1.0"...>`;

const phases = [
  { name: 'Nome da Fase', x: posição_x, width: largura }
];

const config = {
  zoom: nivel_zoom,
  storageKey: 'identificador',
  startLabel: 'Label Inicial',
  endLabels: { ... },
  ...
};

window.v5Data['X.Y'] = { diagramXML, nodeDetails, phases, ...config };
```

### SLAs Comuns:
- **Onboarding:** Setup inicial, configurações críticas
- **Semanal:** Operações recorrentes, ajustes táticos
- **Mensal:** Revisões, otimizações, planejamento
- **Trimestral:** Estratégia, análises profundas
- **null:** Processos contínuos sem prazo fixo

### Tags por Categoria:
- **Estratégia:** Oferta, ICP, Posicionamento
- **Operacional:** CRM, Dados, Integrações
- **IA:** Qualificação, Insights, Automação
- **Creative:** Copy, Design, Produção
- **Compliance:** Validação, Riscos, LGPD
- **Cliente:** Aprovação, Feedback, Validação

---

## PRÓXIMOS PASSOS PARA IMPLEMENTAÇÃO

1. **Sistema de Navegação:** Criar interface que permita navegar entre os níveis hierárquicos
2. **Visualização Integrada:** Dashboard que mostre o status de todos os subprocessos
3. **Gestão de Transições:** Sistema que gerencie o handoff entre processos
4. **Tracking de Dados:** Garantir que os dados fluam corretamente entre os níveis
5. **Aprovações:** Implementar workflow de aprovações do cliente
6. **Monitoramento:** Dashboard de KPIs e SLAs por processo
7. **Alertas:** Sistema de notificações para gargalos e bloqueios

---

## RESUMO EXECUTIVO

**Total de Subprocessos:** 24
**Níveis Hierárquicos:** 8 (0 a 7)
**Total de Tasks:** ~558 tasks mapeadas
**Lanes Únicas:** 40+ papéis diferentes
**Pontos de Aprovação de Cliente:** ~50 validações
**Integrações IA:** Presente em todos os níveis
**Gateways de Decisão:** 20+ pontos de decisão automatizada
**Loops de Otimização:** 9 ciclos contínuos (5.1, 5.2, 5.3, 6.1, 6.3, 7.1, 7.2, 7.3)

Este sistema representa um **ecossistema completo de Revenue Operations** desde a geração de leads até a otimização contínua, **gestão proativa de relacionamento** e **gestão financeira do ciclo de vida do cliente**, com governança, automação, IA e ciclos de melhoria integrados em todas as etapas.

### Diferencial do Nível 5:
O nível 5 transforma o sistema de **implementação** para **operação contínua**, garantindo:
- Monitoramento diário automatizado
- Detecção proativa de anomalias e oportunidades
- Otimização tática de lances e budget
- Testes A/B estruturados e estatisticamente válidos
- Biblioteca de aprendizados e melhores práticas
- Loop infinito de melhoria contínua

### Diferencial do Nível 6:
O nível 6 adiciona a camada de **Customer Success** ao sistema, garantindo:
- Suporte reativo com IA e escalação inteligente
- Apresentação estruturada de resultados com storytelling IA
- Alinhamento estratégico proativo com detecção de riscos
- Análise de sentimento e saúde da conta
- CSAT e NPS integrados ao ciclo operacional
- Atas automatizadas e follow-up estruturado
- **Offboarding estruturado** com tentativas de retenção e compliance LGPD

### Diferencial do Nível 7:
O nível 7 adiciona a camada de **Gestão Financeira** ao sistema, garantindo:
- **Faturamento e Cobrança (7.1):** Ciclo mensal com 3 níveis de cobrança escalada (Amigável D+3, Formal D+10, Suspensão D+30)
- **Renovação de Contratos (7.2):** Gestão proativa iniciando D-60 antes do vencimento com análise de saúde da conta
- **Expansão (7.3):** Identificação automatizada de oportunidades de upsell/cross-sell via IA (budget esgotado, ROAS >300%, novos canais)
- Previsão de receita com IA
- Gestão de inadimplência com escalação automática
- Maximização de LTV (Lifetime Value) através de renovações e expansões
- Redução de churn com tentativas estruturadas de retenção
