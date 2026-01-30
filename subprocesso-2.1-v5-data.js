const nodeDetails = {
  'Task_S_EnviarBriefing': {
    sla: '30 min',
    tag: 'Briefing',
    desc: 'Envio do briefing padrao por e-mail/WhatsApp com contexto, video explicativo e prazo de resposta.'
  },
  'Task_A_DispararBriefing': {
    sla: 'Imediato',
    tag: 'Automacao',
    desc: 'Sistema dispara automaticamente e-mail/WhatsApp com link do briefing.'
  },
  'Task_I_GuiarBriefing': {
    sla: 'Tempo real',
    tag: 'UX Briefing',
    desc: 'IA orienta o preenchimento com exemplos e explicacoes simples.'
  },
  'Task_A_FollowupBriefing': {
    sla: '7 dias',
    tag: 'Follow-up',
    desc: 'Sequencia automatica de lembretes quando o briefing nao e preenchido.'
  },
  'Task_A_EscalarBriefing': {
    sla: null,
    tag: 'Escalacao',
    desc: 'Escala o caso para gerente devido a falta de briefing.'
  },
  'Task_R_RiscoSemBriefing': {
    sla: null,
    tag: 'Risco',
    desc: 'Avalia risco alto quando briefing nao chega mesmo apos follow-up.'
  },
  'Task_C_PreencherBriefing': {
    sla: null,
    tag: 'Cliente',
    desc: 'Cliente preenche o briefing com dados do negocio, objetivos e restricoes.'
  },
  'Task_I_AnalisarQualidade': {
    sla: 'Tempo real',
    tag: 'Analise',
    desc: 'IA verifica inconsistencias, campos vazios e aderencia ao ICP.'
  },
  'Task_S_AnalisarBriefing': {
    sla: '24h',
    tag: 'Revisao',
    desc: 'Equipe revisa completude, clareza e metas informadas no briefing.'
  },
  'Task_I_ApontarCampos': {
    sla: 'Tempo real',
    tag: 'Sugestoes',
    desc: 'Lista pontos fracos e campos faltantes para solicitar complemento.'
  },
  'Task_A_SolicitarComplementos': {
    sla: null,
    tag: 'Complementos',
    desc: 'Automacao solicita complementos com base na analise da IA.'
  },
  'Task_C_EnviarComplementos': {
    sla: null,
    tag: 'Cliente',
    desc: 'Cliente envia complementos solicitados.'
  },
  'Task_S_AgendarKickoff': {
    sla: '24h',
    tag: 'Kick-off',
    desc: 'Agendar reuniao de kick-off com participantes e canal definidos.'
  },
  'Task_I_RoteiroKickoff': {
    sla: null,
    tag: 'Kick-off IA',
    desc: 'IA sugere roteiro e perguntas-chave para a reuniao.'
  },
  'Task_S_RealizarKickoff': {
    sla: '5 dias',
    tag: 'Kick-off',
    desc: 'Reuniao para validar briefing, alinhar expectativas e metas.'
  },
  'Task_C_ParticiparKickoff': {
    sla: null,
    tag: 'Cliente',
    desc: 'Cliente participa da reuniao de kick-off.'
  },
  'Task_S_SolicitarAcessos': {
    sla: '2h',
    tag: 'Acessos',
    desc: 'Solicitar acessos a BM, paginas, Instagram, pixel, WhatsApp, CRM e site.'
  },
  'Task_A_FollowupAcessos': {
    sla: '10 dias',
    tag: 'Follow-up',
    desc: 'Sequencia automatica de lembretes para concessao de acessos.'
  },
  'Task_A_EscalarAcessos': {
    sla: null,
    tag: 'Escalacao',
    desc: 'Escala para gerente quando acessos nao sao concedidos.'
  },
  'Task_R_RiscoSemAcessos': {
    sla: null,
    tag: 'Risco',
    desc: 'Avalia impacto e possibilidade de pausa por falta de acessos.'
  },
  'Task_C_ConcederAcessos': {
    sla: null,
    tag: 'Cliente',
    desc: 'Cliente concede acessos solicitados.'
  },
  'Task_I_ValidarConfig': {
    sla: null,
    tag: 'QA IA',
    desc: 'IA valida configuracoes tecnicas, eventos e integracoes.'
  },
  'Task_S_ChecklistAcessos': {
    sla: '24h',
    tag: 'QA Digital',
    desc: 'Checklist de acessos e ambiente para garantir funcionamento.'
  },
  'Task_S_OrganizarTestar': {
    sla: '24h',
    tag: 'Operacao',
    desc: 'Organiza pastas e realiza testes de eventos, tags e rastreamento.'
  },
  'Task_A_AtualizarStatus': {
    sla: null,
    tag: 'CRM',
    desc: 'Atualiza status do onboarding no CRM.'
  },
  'Task_A_AtualizarKPIs': {
    sla: null,
    tag: 'KPIs',
    desc: 'Atualiza indicadores: tempo medio, atrasos e pendencias.'
  },
  'Task_I_CalcularScore': {
    sla: null,
    tag: 'Score',
    desc: 'Calcula score de onboarding para priorizacao.'
  }
};

const diagramXML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_21_V5" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_21_V5">
    <bpmn:participant id="Participant_21_V5" name="Onboarding Nivel 5" processRef="Process_21_V5" />
  </bpmn:collaboration>
  <bpmn:process id="Process_21_V5" isExecutable="false">
    <bpmn:laneSet id="LaneSet_21_V5">
      <bpmn:lane id="Lane_Onboarding" name="Onboarding / Operacao">
        <bpmn:flowNodeRef>Start_Cliente</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_EnviarBriefing</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_BriefingPreenchido</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_AnalisarBriefing</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_BriefingCompleto</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_AgendarKickoff</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_RealizarKickoff</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_SolicitarAcessos</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_AcessosConcedidos</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_ChecklistAcessos</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_OrganizarTestar</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_Success</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Auto" name="Automacao / CRM">
        <bpmn:flowNodeRef>Task_A_DispararBriefing</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_FollowupBriefing</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_FollowupBriefing</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_EscalarBriefing</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_SolicitarComplementos</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_FollowupAcessos</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_FollowupAcessos</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_EscalarAcessos</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_AtualizarStatus</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_AtualizarKPIs</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_IA" name="IA (Assistente)">
        <bpmn:flowNodeRef>Task_I_GuiarBriefing</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_AnalisarQualidade</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_ApontarCampos</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_RoteiroKickoff</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_ValidarConfig</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_CalcularScore</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Cliente" name="Cliente">
        <bpmn:flowNodeRef>Task_C_PreencherBriefing</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_C_EnviarComplementos</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_C_ParticiparKickoff</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_C_ConcederAcessos</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Risco" name="Gestao / Risco">
        <bpmn:flowNodeRef>Task_R_RiscoSemBriefing</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_R_RiscoSemAcessos</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_SemCondicoes</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>

    <bpmn:startEvent id="Start_Cliente" name="Cliente Adquirido">
      <bpmn:outgoing>F_Start_Enviar</bpmn:outgoing>
    </bpmn:startEvent>

    <bpmn:task id="Task_S_EnviarBriefing" name="1. Enviar Briefing">
      <bpmn:incoming>F_Start_Enviar</bpmn:incoming>
      <bpmn:outgoing>F_Enviar_Disparar</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_A_DispararBriefing" name="Disparar Briefing">
      <bpmn:incoming>F_Enviar_Disparar</bpmn:incoming>
      <bpmn:outgoing>F_Disparar_Guiar</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_I_GuiarBriefing" name="Guiar Preenchimento">
      <bpmn:incoming>F_Disparar_Guiar</bpmn:incoming>
      <bpmn:outgoing>F_Guiar_BriefingGate</bpmn:outgoing>
    </bpmn:task>

    <bpmn:exclusiveGateway id="Gateway_BriefingPreenchido" name="Preenchido no prazo?">
      <bpmn:incoming>F_Guiar_BriefingGate</bpmn:incoming>
      <bpmn:outgoing>F_Briefing_Yes</bpmn:outgoing>
      <bpmn:outgoing>F_Briefing_No</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <bpmn:task id="Task_A_FollowupBriefing" name="Follow-up Briefing">
      <bpmn:incoming>F_Briefing_No</bpmn:incoming>
      <bpmn:outgoing>F_FollowupBriefing_Gate</bpmn:outgoing>
    </bpmn:task>

    <bpmn:exclusiveGateway id="Gateway_FollowupBriefing" name="Apos follow-up?">
      <bpmn:incoming>F_FollowupBriefing_Gate</bpmn:incoming>
      <bpmn:outgoing>F_FollowupBriefing_Yes</bpmn:outgoing>
      <bpmn:outgoing>F_FollowupBriefing_No</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <bpmn:task id="Task_A_EscalarBriefing" name="Escalar p/ Gerente">
      <bpmn:incoming>F_FollowupBriefing_No</bpmn:incoming>
      <bpmn:outgoing>F_EscalarBriefing_Risco</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_R_RiscoSemBriefing" name="Avaliar Risco (Sem Briefing)">
      <bpmn:incoming>F_EscalarBriefing_Risco</bpmn:incoming>
      <bpmn:outgoing>F_RiscoBriefing_End</bpmn:outgoing>
    </bpmn:task>

    <bpmn:endEvent id="End_SemCondicoes" name="Fim (Sem Condicoes)">
      <bpmn:incoming>F_RiscoBriefing_End</bpmn:incoming>
      <bpmn:incoming>F_RiscoAcessos_End</bpmn:incoming>
    </bpmn:endEvent>

    <bpmn:task id="Task_C_PreencherBriefing" name="Preencher Briefing">
      <bpmn:incoming>F_Briefing_Yes</bpmn:incoming>
      <bpmn:incoming>F_FollowupBriefing_Yes</bpmn:incoming>
      <bpmn:outgoing>F_Preencher_AnalisarIA</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_I_AnalisarQualidade" name="Analisar Qualidade">
      <bpmn:incoming>F_Preencher_AnalisarIA</bpmn:incoming>
      <bpmn:outgoing>F_AnalisarIA_AnaliseOnb</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_S_AnalisarBriefing" name="2. Analisar Briefing">
      <bpmn:incoming>F_AnalisarIA_AnaliseOnb</bpmn:incoming>
      <bpmn:incoming>F_ClienteComp_Reanalisar</bpmn:incoming>
      <bpmn:outgoing>F_AnaliseOnb_BriefingCompletoGate</bpmn:outgoing>
    </bpmn:task>

    <bpmn:exclusiveGateway id="Gateway_BriefingCompleto" name="Briefing completo?">
      <bpmn:incoming>F_AnaliseOnb_BriefingCompletoGate</bpmn:incoming>
      <bpmn:outgoing>F_BriefingCompleto_Yes</bpmn:outgoing>
      <bpmn:outgoing>F_BriefingCompleto_No</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <bpmn:task id="Task_I_ApontarCampos" name="Apontar Campos">
      <bpmn:incoming>F_BriefingCompleto_No</bpmn:incoming>
      <bpmn:outgoing>F_ApontarCampos_SolicitarComp</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_A_SolicitarComplementos" name="Solicitar Complementos">
      <bpmn:incoming>F_ApontarCampos_SolicitarComp</bpmn:incoming>
      <bpmn:outgoing>F_SolicitarComp_ClienteComp</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_C_EnviarComplementos" name="Enviar Complementos">
      <bpmn:incoming>F_SolicitarComp_ClienteComp</bpmn:incoming>
      <bpmn:outgoing>F_ClienteComp_Reanalisar</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_S_AgendarKickoff" name="3. Agendar Kick-off">
      <bpmn:incoming>F_BriefingCompleto_Yes</bpmn:incoming>
      <bpmn:outgoing>F_AgendarKickoff_Roteiro</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_I_RoteiroKickoff" name="Roteiro da Reuniao">
      <bpmn:incoming>F_AgendarKickoff_Roteiro</bpmn:incoming>
      <bpmn:outgoing>F_Roteiro_Kickoff</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_S_RealizarKickoff" name="4. Realizar Kick-off">
      <bpmn:incoming>F_Roteiro_Kickoff</bpmn:incoming>
      <bpmn:outgoing>F_Kickoff_Cliente</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_C_ParticiparKickoff" name="Participar Kick-off">
      <bpmn:incoming>F_Kickoff_Cliente</bpmn:incoming>
      <bpmn:outgoing>F_Cliente_Kickoff_SolicitarAcessos</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_S_SolicitarAcessos" name="5. Solicitar Acessos">
      <bpmn:incoming>F_Cliente_Kickoff_SolicitarAcessos</bpmn:incoming>
      <bpmn:outgoing>F_SolicitarAcessos_Gateway</bpmn:outgoing>
    </bpmn:task>

    <bpmn:exclusiveGateway id="Gateway_AcessosConcedidos" name="Acessos no prazo?">
      <bpmn:incoming>F_SolicitarAcessos_Gateway</bpmn:incoming>
      <bpmn:outgoing>F_Acessos_Yes</bpmn:outgoing>
      <bpmn:outgoing>F_Acessos_No</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <bpmn:task id="Task_A_FollowupAcessos" name="Follow-up Acessos">
      <bpmn:incoming>F_Acessos_No</bpmn:incoming>
      <bpmn:outgoing>F_FollowupAcessos_Gate</bpmn:outgoing>
    </bpmn:task>

    <bpmn:exclusiveGateway id="Gateway_FollowupAcessos" name="Apos follow-up?">
      <bpmn:incoming>F_FollowupAcessos_Gate</bpmn:incoming>
      <bpmn:outgoing>F_FollowupAcessos_Yes</bpmn:outgoing>
      <bpmn:outgoing>F_FollowupAcessos_No</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <bpmn:task id="Task_A_EscalarAcessos" name="Escalar p/ Gerente">
      <bpmn:incoming>F_FollowupAcessos_No</bpmn:incoming>
      <bpmn:outgoing>F_EscalarAcessos_Risco</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_R_RiscoSemAcessos" name="Avaliar Risco (Sem Acessos)">
      <bpmn:incoming>F_EscalarAcessos_Risco</bpmn:incoming>
      <bpmn:outgoing>F_RiscoAcessos_End</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_C_ConcederAcessos" name="Conceder Acessos">
      <bpmn:incoming>F_Acessos_Yes</bpmn:incoming>
      <bpmn:incoming>F_FollowupAcessos_Yes</bpmn:incoming>
      <bpmn:outgoing>F_ConcederAcessos_Validar</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_I_ValidarConfig" name="Validar Configuracao">
      <bpmn:incoming>F_ConcederAcessos_Validar</bpmn:incoming>
      <bpmn:outgoing>F_Validar_Checklist</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_S_ChecklistAcessos" name="6. Checklist Acessos">
      <bpmn:incoming>F_Validar_Checklist</bpmn:incoming>
      <bpmn:outgoing>F_Checklist_Organizar</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_S_OrganizarTestar" name="7. Organizar e Testar">
      <bpmn:incoming>F_Checklist_Organizar</bpmn:incoming>
      <bpmn:outgoing>F_Organizar_AtualizarStatus</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_A_AtualizarStatus" name="Atualizar Status">
      <bpmn:incoming>F_Organizar_AtualizarStatus</bpmn:incoming>
      <bpmn:outgoing>F_AtualizarStatus_KPIs</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_A_AtualizarKPIs" name="Atualizar KPIs">
      <bpmn:incoming>F_AtualizarStatus_KPIs</bpmn:incoming>
      <bpmn:outgoing>F_KPIs_Score</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_I_CalcularScore" name="Calcular Score">
      <bpmn:incoming>F_KPIs_Score</bpmn:incoming>
      <bpmn:outgoing>F_Score_EndSuccess</bpmn:outgoing>
    </bpmn:task>

    <bpmn:endEvent id="End_Success" name="Informacoes Completas">
      <bpmn:incoming>F_Score_EndSuccess</bpmn:incoming>
    </bpmn:endEvent>

    <bpmn:sequenceFlow id="F_Start_Enviar" sourceRef="Start_Cliente" targetRef="Task_S_EnviarBriefing" />
    <bpmn:sequenceFlow id="F_Enviar_Disparar" sourceRef="Task_S_EnviarBriefing" targetRef="Task_A_DispararBriefing" />
    <bpmn:sequenceFlow id="F_Disparar_Guiar" sourceRef="Task_A_DispararBriefing" targetRef="Task_I_GuiarBriefing" />
    <bpmn:sequenceFlow id="F_Guiar_BriefingGate" sourceRef="Task_I_GuiarBriefing" targetRef="Gateway_BriefingPreenchido" />

    <bpmn:sequenceFlow id="F_Briefing_Yes" name="Sim" sourceRef="Gateway_BriefingPreenchido" targetRef="Task_C_PreencherBriefing" />
    <bpmn:sequenceFlow id="F_Briefing_No" name="Nao" sourceRef="Gateway_BriefingPreenchido" targetRef="Task_A_FollowupBriefing" />

    <bpmn:sequenceFlow id="F_FollowupBriefing_Gate" sourceRef="Task_A_FollowupBriefing" targetRef="Gateway_FollowupBriefing" />
    <bpmn:sequenceFlow id="F_FollowupBriefing_Yes" name="Sim" sourceRef="Gateway_FollowupBriefing" targetRef="Task_C_PreencherBriefing" />
    <bpmn:sequenceFlow id="F_FollowupBriefing_No" name="Nao" sourceRef="Gateway_FollowupBriefing" targetRef="Task_A_EscalarBriefing" />
    <bpmn:sequenceFlow id="F_EscalarBriefing_Risco" sourceRef="Task_A_EscalarBriefing" targetRef="Task_R_RiscoSemBriefing" />
    <bpmn:sequenceFlow id="F_RiscoBriefing_End" sourceRef="Task_R_RiscoSemBriefing" targetRef="End_SemCondicoes" />

    <bpmn:sequenceFlow id="F_Preencher_AnalisarIA" sourceRef="Task_C_PreencherBriefing" targetRef="Task_I_AnalisarQualidade" />
    <bpmn:sequenceFlow id="F_AnalisarIA_AnaliseOnb" sourceRef="Task_I_AnalisarQualidade" targetRef="Task_S_AnalisarBriefing" />
    <bpmn:sequenceFlow id="F_AnaliseOnb_BriefingCompletoGate" sourceRef="Task_S_AnalisarBriefing" targetRef="Gateway_BriefingCompleto" />

    <bpmn:sequenceFlow id="F_BriefingCompleto_Yes" name="Sim" sourceRef="Gateway_BriefingCompleto" targetRef="Task_S_AgendarKickoff" />
    <bpmn:sequenceFlow id="F_BriefingCompleto_No" name="Nao" sourceRef="Gateway_BriefingCompleto" targetRef="Task_I_ApontarCampos" />

    <bpmn:sequenceFlow id="F_ApontarCampos_SolicitarComp" sourceRef="Task_I_ApontarCampos" targetRef="Task_A_SolicitarComplementos" />
    <bpmn:sequenceFlow id="F_SolicitarComp_ClienteComp" sourceRef="Task_A_SolicitarComplementos" targetRef="Task_C_EnviarComplementos" />
    <bpmn:sequenceFlow id="F_ClienteComp_Reanalisar" sourceRef="Task_C_EnviarComplementos" targetRef="Task_S_AnalisarBriefing" />

    <bpmn:sequenceFlow id="F_AgendarKickoff_Roteiro" sourceRef="Task_S_AgendarKickoff" targetRef="Task_I_RoteiroKickoff" />
    <bpmn:sequenceFlow id="F_Roteiro_Kickoff" sourceRef="Task_I_RoteiroKickoff" targetRef="Task_S_RealizarKickoff" />
    <bpmn:sequenceFlow id="F_Kickoff_Cliente" sourceRef="Task_S_RealizarKickoff" targetRef="Task_C_ParticiparKickoff" />
    <bpmn:sequenceFlow id="F_Cliente_Kickoff_SolicitarAcessos" sourceRef="Task_C_ParticiparKickoff" targetRef="Task_S_SolicitarAcessos" />
    <bpmn:sequenceFlow id="F_SolicitarAcessos_Gateway" sourceRef="Task_S_SolicitarAcessos" targetRef="Gateway_AcessosConcedidos" />

    <bpmn:sequenceFlow id="F_Acessos_Yes" name="Sim" sourceRef="Gateway_AcessosConcedidos" targetRef="Task_C_ConcederAcessos" />
    <bpmn:sequenceFlow id="F_Acessos_No" name="Nao" sourceRef="Gateway_AcessosConcedidos" targetRef="Task_A_FollowupAcessos" />

    <bpmn:sequenceFlow id="F_FollowupAcessos_Gate" sourceRef="Task_A_FollowupAcessos" targetRef="Gateway_FollowupAcessos" />
    <bpmn:sequenceFlow id="F_FollowupAcessos_Yes" name="Sim" sourceRef="Gateway_FollowupAcessos" targetRef="Task_C_ConcederAcessos" />
    <bpmn:sequenceFlow id="F_FollowupAcessos_No" name="Nao" sourceRef="Gateway_FollowupAcessos" targetRef="Task_A_EscalarAcessos" />
    <bpmn:sequenceFlow id="F_EscalarAcessos_Risco" sourceRef="Task_A_EscalarAcessos" targetRef="Task_R_RiscoSemAcessos" />
    <bpmn:sequenceFlow id="F_RiscoAcessos_End" sourceRef="Task_R_RiscoSemAcessos" targetRef="End_SemCondicoes" />

    <bpmn:sequenceFlow id="F_ConcederAcessos_Validar" sourceRef="Task_C_ConcederAcessos" targetRef="Task_I_ValidarConfig" />
    <bpmn:sequenceFlow id="F_Validar_Checklist" sourceRef="Task_I_ValidarConfig" targetRef="Task_S_ChecklistAcessos" />
    <bpmn:sequenceFlow id="F_Checklist_Organizar" sourceRef="Task_S_ChecklistAcessos" targetRef="Task_S_OrganizarTestar" />
    <bpmn:sequenceFlow id="F_Organizar_AtualizarStatus" sourceRef="Task_S_OrganizarTestar" targetRef="Task_A_AtualizarStatus" />
    <bpmn:sequenceFlow id="F_AtualizarStatus_KPIs" sourceRef="Task_A_AtualizarStatus" targetRef="Task_A_AtualizarKPIs" />
    <bpmn:sequenceFlow id="F_KPIs_Score" sourceRef="Task_A_AtualizarKPIs" targetRef="Task_I_CalcularScore" />
    <bpmn:sequenceFlow id="F_Score_EndSuccess" sourceRef="Task_I_CalcularScore" targetRef="End_Success" />
  </bpmn:process>

  <bpmndi:BPMNDiagram id="BPMNDiagram_21_V5">
    <bpmndi:BPMNPlane id="BPMNPlane_21_V5" bpmnElement="Collaboration_21_V5">
      <bpmndi:BPMNShape id="Participant_21_V5_di" bpmnElement="Participant_21_V5" isHorizontal="true">
        <dc:Bounds x="50" y="20" width="4000" height="750" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Onboarding_di" bpmnElement="Lane_Onboarding" isHorizontal="true">
        <dc:Bounds x="80" y="20" width="3970" height="150" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Auto_di" bpmnElement="Lane_Auto" isHorizontal="true">
        <dc:Bounds x="80" y="170" width="3970" height="150" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_IA_di" bpmnElement="Lane_IA" isHorizontal="true">
        <dc:Bounds x="80" y="320" width="3970" height="150" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Cliente_di" bpmnElement="Lane_Cliente" isHorizontal="true">
        <dc:Bounds x="80" y="470" width="3970" height="150" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Risco_di" bpmnElement="Lane_Risco" isHorizontal="true">
        <dc:Bounds x="80" y="620" width="3970" height="150" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Start_Cliente_di" bpmnElement="Start_Cliente">
        <dc:Bounds x="120" y="77" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_EnviarBriefing_di" bpmnElement="Task_S_EnviarBriefing">
        <dc:Bounds x="220" y="55" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_DispararBriefing_di" bpmnElement="Task_A_DispararBriefing">
        <dc:Bounds x="380" y="205" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_GuiarBriefing_di" bpmnElement="Task_I_GuiarBriefing">
        <dc:Bounds x="540" y="355" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_BriefingPreenchido_di" bpmnElement="Gateway_BriefingPreenchido" isMarkerVisible="true">
        <dc:Bounds x="660" y="70" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_FollowupBriefing_di" bpmnElement="Task_A_FollowupBriefing">
        <dc:Bounds x="700" y="205" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_FollowupBriefing_di" bpmnElement="Gateway_FollowupBriefing" isMarkerVisible="true">
        <dc:Bounds x="860" y="220" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_EscalarBriefing_di" bpmnElement="Task_A_EscalarBriefing">
        <dc:Bounds x="1040" y="205" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_R_RiscoSemBriefing_di" bpmnElement="Task_R_RiscoSemBriefing">
        <dc:Bounds x="1220" y="655" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_SemCondicoes_di" bpmnElement="End_SemCondicoes">
        <dc:Bounds x="3600" y="677" width="36" height="36" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Task_C_PreencherBriefing_di" bpmnElement="Task_C_PreencherBriefing">
        <dc:Bounds x="740" y="505" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_AnalisarQualidade_di" bpmnElement="Task_I_AnalisarQualidade">
        <dc:Bounds x="900" y="355" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_AnalisarBriefing_di" bpmnElement="Task_S_AnalisarBriefing">
        <dc:Bounds x="1060" y="55" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_BriefingCompleto_di" bpmnElement="Gateway_BriefingCompleto" isMarkerVisible="true">
        <dc:Bounds x="1220" y="70" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_ApontarCampos_di" bpmnElement="Task_I_ApontarCampos">
        <dc:Bounds x="1180" y="355" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_SolicitarComplementos_di" bpmnElement="Task_A_SolicitarComplementos">
        <dc:Bounds x="1300" y="205" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_EnviarComplementos_di" bpmnElement="Task_C_EnviarComplementos">
        <dc:Bounds x="1440" y="505" width="100" height="80" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Task_S_AgendarKickoff_di" bpmnElement="Task_S_AgendarKickoff">
        <dc:Bounds x="1380" y="55" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_RoteiroKickoff_di" bpmnElement="Task_I_RoteiroKickoff">
        <dc:Bounds x="1540" y="355" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_RealizarKickoff_di" bpmnElement="Task_S_RealizarKickoff">
        <dc:Bounds x="1700" y="55" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_ParticiparKickoff_di" bpmnElement="Task_C_ParticiparKickoff">
        <dc:Bounds x="1860" y="505" width="100" height="80" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Task_S_SolicitarAcessos_di" bpmnElement="Task_S_SolicitarAcessos">
        <dc:Bounds x="1980" y="55" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_AcessosConcedidos_di" bpmnElement="Gateway_AcessosConcedidos" isMarkerVisible="true">
        <dc:Bounds x="2140" y="70" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_FollowupAcessos_di" bpmnElement="Task_A_FollowupAcessos">
        <dc:Bounds x="2140" y="205" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_FollowupAcessos_di" bpmnElement="Gateway_FollowupAcessos" isMarkerVisible="true">
        <dc:Bounds x="2300" y="220" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_EscalarAcessos_di" bpmnElement="Task_A_EscalarAcessos">
        <dc:Bounds x="2460" y="205" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_R_RiscoSemAcessos_di" bpmnElement="Task_R_RiscoSemAcessos">
        <dc:Bounds x="2520" y="655" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_ConcederAcessos_di" bpmnElement="Task_C_ConcederAcessos">
        <dc:Bounds x="2300" y="505" width="100" height="80" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Task_I_ValidarConfig_di" bpmnElement="Task_I_ValidarConfig">
        <dc:Bounds x="2580" y="355" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_ChecklistAcessos_di" bpmnElement="Task_S_ChecklistAcessos">
        <dc:Bounds x="2740" y="55" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_OrganizarTestar_di" bpmnElement="Task_S_OrganizarTestar">
        <dc:Bounds x="2900" y="55" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_AtualizarStatus_di" bpmnElement="Task_A_AtualizarStatus">
        <dc:Bounds x="3060" y="205" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_AtualizarKPIs_di" bpmnElement="Task_A_AtualizarKPIs">
        <dc:Bounds x="3220" y="205" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_CalcularScore_di" bpmnElement="Task_I_CalcularScore">
        <dc:Bounds x="3320" y="355" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_Success_di" bpmnElement="End_Success">
        <dc:Bounds x="3600" y="77" width="36" height="36" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNEdge id="F_Start_Enviar_di" bpmnElement="F_Start_Enviar">
        <di:waypoint x="138" y="95" />
        <di:waypoint x="270" y="95" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Enviar_Disparar_di" bpmnElement="F_Enviar_Disparar">
        <di:waypoint x="270" y="95" />
        <di:waypoint x="430" y="245" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Disparar_Guiar_di" bpmnElement="F_Disparar_Guiar">
        <di:waypoint x="430" y="245" />
        <di:waypoint x="590" y="395" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Guiar_BriefingGate_di" bpmnElement="F_Guiar_BriefingGate">
        <di:waypoint x="590" y="395" />
        <di:waypoint x="685" y="95" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="F_Briefing_Yes_di" bpmnElement="F_Briefing_Yes">
        <di:waypoint x="685" y="95" />
        <di:waypoint x="790" y="545" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Briefing_No_di" bpmnElement="F_Briefing_No">
        <di:waypoint x="685" y="95" />
        <di:waypoint x="750" y="245" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="F_FollowupBriefing_Gate_di" bpmnElement="F_FollowupBriefing_Gate">
        <di:waypoint x="750" y="245" />
        <di:waypoint x="885" y="245" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_FollowupBriefing_Yes_di" bpmnElement="F_FollowupBriefing_Yes">
        <di:waypoint x="885" y="245" />
        <di:waypoint x="790" y="545" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_FollowupBriefing_No_di" bpmnElement="F_FollowupBriefing_No">
        <di:waypoint x="885" y="245" />
        <di:waypoint x="1090" y="245" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_EscalarBriefing_Risco_di" bpmnElement="F_EscalarBriefing_Risco">
        <di:waypoint x="1090" y="245" />
        <di:waypoint x="1270" y="695" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_RiscoBriefing_End_di" bpmnElement="F_RiscoBriefing_End">
        <di:waypoint x="1270" y="695" />
        <di:waypoint x="3618" y="695" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="F_Preencher_AnalisarIA_di" bpmnElement="F_Preencher_AnalisarIA">
        <di:waypoint x="790" y="545" />
        <di:waypoint x="950" y="395" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_AnalisarIA_AnaliseOnb_di" bpmnElement="F_AnalisarIA_AnaliseOnb">
        <di:waypoint x="950" y="395" />
        <di:waypoint x="1110" y="95" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_AnaliseOnb_BriefingCompletoGate_di" bpmnElement="F_AnaliseOnb_BriefingCompletoGate">
        <di:waypoint x="1110" y="95" />
        <di:waypoint x="1245" y="95" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="F_BriefingCompleto_Yes_di" bpmnElement="F_BriefingCompleto_Yes">
        <di:waypoint x="1245" y="95" />
        <di:waypoint x="1430" y="95" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_BriefingCompleto_No_di" bpmnElement="F_BriefingCompleto_No">
        <di:waypoint x="1245" y="95" />
        <di:waypoint x="1230" y="395" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="F_ApontarCampos_SolicitarComp_di" bpmnElement="F_ApontarCampos_SolicitarComp">
        <di:waypoint x="1230" y="395" />
        <di:waypoint x="1350" y="245" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_SolicitarComp_ClienteComp_di" bpmnElement="F_SolicitarComp_ClienteComp">
        <di:waypoint x="1350" y="245" />
        <di:waypoint x="1490" y="545" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_ClienteComp_Reanalisar_di" bpmnElement="F_ClienteComp_Reanalisar">
        <di:waypoint x="1490" y="545" />
        <di:waypoint x="1110" y="95" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="F_AgendarKickoff_Roteiro_di" bpmnElement="F_AgendarKickoff_Roteiro">
        <di:waypoint x="1430" y="95" />
        <di:waypoint x="1590" y="395" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Roteiro_Kickoff_di" bpmnElement="F_Roteiro_Kickoff">
        <di:waypoint x="1590" y="395" />
        <di:waypoint x="1750" y="95" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Kickoff_Cliente_di" bpmnElement="F_Kickoff_Cliente">
        <di:waypoint x="1750" y="95" />
        <di:waypoint x="1910" y="545" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Cliente_Kickoff_SolicitarAcessos_di" bpmnElement="F_Cliente_Kickoff_SolicitarAcessos">
        <di:waypoint x="1910" y="545" />
        <di:waypoint x="2030" y="95" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_SolicitarAcessos_Gateway_di" bpmnElement="F_SolicitarAcessos_Gateway">
        <di:waypoint x="2030" y="95" />
        <di:waypoint x="2165" y="95" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="F_Acessos_Yes_di" bpmnElement="F_Acessos_Yes">
        <di:waypoint x="2165" y="95" />
        <di:waypoint x="2350" y="545" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Acessos_No_di" bpmnElement="F_Acessos_No">
        <di:waypoint x="2165" y="95" />
        <di:waypoint x="2190" y="245" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="F_FollowupAcessos_Gate_di" bpmnElement="F_FollowupAcessos_Gate">
        <di:waypoint x="2190" y="245" />
        <di:waypoint x="2325" y="245" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_FollowupAcessos_Yes_di" bpmnElement="F_FollowupAcessos_Yes">
        <di:waypoint x="2325" y="245" />
        <di:waypoint x="2350" y="545" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_FollowupAcessos_No_di" bpmnElement="F_FollowupAcessos_No">
        <di:waypoint x="2325" y="245" />
        <di:waypoint x="2510" y="245" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_EscalarAcessos_Risco_di" bpmnElement="F_EscalarAcessos_Risco">
        <di:waypoint x="2510" y="245" />
        <di:waypoint x="2570" y="695" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_RiscoAcessos_End_di" bpmnElement="F_RiscoAcessos_End">
        <di:waypoint x="2570" y="695" />
        <di:waypoint x="3618" y="695" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="F_ConcederAcessos_Validar_di" bpmnElement="F_ConcederAcessos_Validar">
        <di:waypoint x="2350" y="545" />
        <di:waypoint x="2630" y="395" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Validar_Checklist_di" bpmnElement="F_Validar_Checklist">
        <di:waypoint x="2630" y="395" />
        <di:waypoint x="2790" y="95" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Checklist_Organizar_di" bpmnElement="F_Checklist_Organizar">
        <di:waypoint x="2790" y="95" />
        <di:waypoint x="2950" y="95" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Organizar_AtualizarStatus_di" bpmnElement="F_Organizar_AtualizarStatus">
        <di:waypoint x="2950" y="95" />
        <di:waypoint x="3110" y="245" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_AtualizarStatus_KPIs_di" bpmnElement="F_AtualizarStatus_KPIs">
        <di:waypoint x="3110" y="245" />
        <di:waypoint x="3270" y="245" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_KPIs_Score_di" bpmnElement="F_KPIs_Score">
        <di:waypoint x="3270" y="245" />
        <di:waypoint x="3370" y="395" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Score_EndSuccess_di" bpmnElement="F_Score_EndSuccess">
        <di:waypoint x="3370" y="395" />
        <di:waypoint x="3618" y="95" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

const phases = [
  { name: 'Briefing', x: 80, width: 620 },
  { name: 'Analise do Briefing', x: 700, width: 620 },
  { name: 'Kick-off', x: 1320, width: 600 },
  { name: 'Acessos', x: 1920, width: 600 },
  { name: 'QA Digital', x: 2520, width: 650 },
  { name: 'Saida', x: 3170, width: 800 }
];

const config = {
  zoom: 0.85,
  storageKey: 'subprocesso-2.1',
  startLabel: 'CLIENTE ADQUIRIDO',
  endLabels: {
    End_Success: { text: 'INFORMACOES COMPLETAS', className: 'end-label-success', marker: 'end-success' },
    End_SemCondicoes: { text: 'SEM CONDICOES', className: 'end-label-lost' }
  },
  showDefaultEndLabel: false,
  useEndName: false,
  defaultEndLabelText: 'FIM',
  defaultEndClass: 'end-label-lost'
};

window.v5Data = window.v5Data || {};
window.v5Data['2.1'] = { diagramXML, nodeDetails, phases, ...config };
