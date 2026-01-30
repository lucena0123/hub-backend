const nodeDetails = {
      'Task_S_Revisa': { sla: '2h antes', tag: 'Revisão', desc: "Revisa CRM, históricos, ICP, objeções prováveis, contexto jurídico/comercial, urgência e sinais de intenção." },
      'Task_S_Objetivo': { sla: '1h antes', tag: 'Planejamento', desc: "Define se a reunião será mais diagnóstica, demonstrativa, de alinhamento ou fechamento preliminar." },
      'Task_S_Conduz': { sla: '30-60 min', tag: 'Reunião', desc: "Roteiro estruturado: abertura, quebra de gelo, diagnóstico, entendimento da dor, explicação do método, demonstração, proposta preliminar e próximos passos." },
      'Task_S_Resume': { sla: '1h após', tag: 'Resumo', desc: "Valida o rascunho produzido pela IA com: dores, contexto, prazos, expectativas, objeções e próximos passos acordados." },
      'Task_S_Proposta': { sla: '24h após', tag: 'Pós-Reunião', desc: "Usa minuta sugerida pela IA e templates padrões para gerar proposta clara, alinhada ao caso e pronta para o Subprocesso 1.3." },
      'Task_S_NoShow': { sla: 'Imediato', tag: 'Controle', desc: "Executa protocolo de no-show (ligação, WhatsApp) e tenta reagendamento imediato ou retorno ao fluxo 1.1." },
      'Task_A_Sincro': { sla: 'Instantâneo', tag: 'Agenda', desc: "Gera ou atualiza evento de calendário, anexando link da call e dados do lead. Atualiza status da oportunidade no CRM." },
      'Task_A_Lembrete': { sla: '24h/1h antes', tag: 'Lembrete', desc: "Envio automático de lembretes para cliente e executivo (24h e 1h antes), com link e objetivo da reunião." },
      'Task_A_CRM': { sla: 'Imediato', tag: 'CRM', desc: "O resumo da reunião é gravado no CRM com campos estruturados (dor, urgência, fit, objeções, próximos passos)." },
      'Task_A_Fluxo': { sla: 'Automático', tag: 'Roteamento', desc: "Com base na decisão (sim / não / em avaliação), envia o lead para: proposta, follow-up pós-reunião, nurturing ou perda justificada." },
      'Task_A_KPIs': { sla: 'Diário', tag: 'Dashboards', desc: "Atualiza taxa de comparecimento, taxa reunião→proposta, tempo médio de proposta e motivos de perda." },
      'Task_I_ResumoLead': { sla: 'Real-time', tag: 'Pré-Reunião', desc: "Gera um resumo do lead com negócio, dor principal, ICP, histórico e probabilidade de fechamento." },
      'Task_I_Pauta': { sla: 'Real-time', tag: 'Roteiro', desc: "Sugere roteiro, perguntas-chave, casos de prova e storytelling adaptado ao nicho do cliente." },
      'Task_I_Notes': { sla: 'Real-time', tag: 'Live Notes', desc: "Captura pontos importantes, objeções, decisões e sinais de interesse durante a reunião." },
      'Task_I_ResumoReu': { sla: 'Real-time', tag: 'Rascunho', desc: "Gera um rascunho do resumo da reunião para o executivo revisar e validar." },
      'Task_I_Interesse': { sla: 'Real-time', tag: 'Score', desc: "Analisa sinais verbais e comportamentais para estimar o grau de interesse e a probabilidade de fechamento." },
      'Task_I_Minuta': { sla: 'Real-time', tag: 'Proposta IA', desc: "Com base no resumo, a IA sugere uma minuta de proposta com escopo, entregáveis e planos." },
      'Task_C_Participa': { sla: null, tag: 'Participação', desc: "Cliente participa da reunião, apresenta contexto, tira dúvidas e avalia se a proposta faz sentido." },
      'Task_C_Decide': { sla: null, tag: 'Decisão', desc: "Confirma se deseja receber a proposta detalhada para avançar para o fechamento." },
      'Task_E_Feedback': { sla: '24h após', tag: 'Feedback', desc: "Registra motivo de não avançar (preço, prazo, momento) e decide se entra em follow-up ou perda." }
    };

const diagramXML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_12" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_12">
    <bpmn:participant id="Participant_12" name="Apresentação e Vendas SDR Nível 5" processRef="Process_12" />
  </bpmn:collaboration>
  <bpmn:process id="Process_12" isExecutable="false">
    <bpmn:laneSet id="LaneSet_12">
      <bpmn:lane id="Lane_Exec" name="Executivo Vendas">
        <bpmn:flowNodeRef>StartEvent_1</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_Revisa</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_Qualifica</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_Objetivo</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_Show</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_NoShow</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_Conduz</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_Resume</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_Interesse</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_Proposta</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_Success</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_NoShow</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Auto" name="Automação / CRM">
        <bpmn:flowNodeRef>Task_A_Sincro</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_Lembrete</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Event_Wait_NoShow</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_CRM</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_Fluxo</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_KPIs</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_IA" name="IA (Assistente)">
        <bpmn:flowNodeRef>Task_I_ResumoLead</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_Pauta</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_Notes</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_ResumoReu</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_Interesse</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_Minuta</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Cliente" name="Cliente / Decisor">
        <bpmn:flowNodeRef>Task_C_Participa</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_C_Decide</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Nurt" name="Feedback / Nurturing">
        <bpmn:flowNodeRef>Task_E_Feedback</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_Disqualificado</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>

    <bpmn:startEvent id="StartEvent_1">
      <bpmn:outgoing>F_StartToAuto</bpmn:outgoing>
    </bpmn:startEvent>

    <!-- Phase 1: Discovery & Discovery Support -->
    <bpmn:task id="Task_A_Sincro" name="Sincronizar Reunião">
      <bpmn:incoming>F_StartToAuto</bpmn:incoming>
      <bpmn:outgoing>F_AutoToIA_1</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_I_ResumoLead" name="Resumo Automático do Lead">
      <bpmn:incoming>F_AutoToIA_1</bpmn:incoming>
      <bpmn:outgoing>F_IAToExec_1</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_S_Revisa" name="1. Revisar Lead">
      <bpmn:incoming>F_IAToExec_1</bpmn:incoming>
      <bpmn:outgoing>F_ExecToQualify</bpmn:outgoing>
    </bpmn:task>
    <bpmn:exclusiveGateway id="Gateway_Qualifica" name="ICP OK?">
      <bpmn:incoming>F_ExecToQualify</bpmn:incoming>
      <bpmn:outgoing>F_QualifyYes</bpmn:outgoing>
      <bpmn:outgoing>F_QualifyNo</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <!-- Phase 2: Preparation Support -->
    <bpmn:task id="Task_A_Lembrete" name="Enviar Lembretes">
      <bpmn:incoming>F_QualifyYes</bpmn:incoming>
      <bpmn:outgoing>F_AutoToIA_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_I_Pauta" name="Sugerir Pauta &amp; Argumentos">
      <bpmn:incoming>F_AutoToIA_2</bpmn:incoming>
      <bpmn:outgoing>F_IAToExec_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_S_Objetivo" name="2. Definir Objetivo da Reunião">
      <bpmn:incoming>F_IAToExec_2</bpmn:incoming>
      <bpmn:outgoing>F_GatewayShow</bpmn:outgoing>
    </bpmn:task>

    <bpmn:exclusiveGateway id="Gateway_Show" name="Compareceu?">
      <bpmn:incoming>F_GatewayShow</bpmn:incoming>
      <bpmn:outgoing>F_ShowYes</bpmn:outgoing>
      <bpmn:outgoing>F_NoShow</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <bpmn:intermediateCatchEvent id="Event_Wait_NoShow" name="Aguardar 24h">
      <bpmn:incoming>F_NoShow</bpmn:incoming>
      <bpmn:outgoing>F_NoShow_Wait</bpmn:outgoing>
      <bpmn:timerEventDefinition />
    </bpmn:intermediateCatchEvent>

    <bpmn:task id="Task_S_NoShow" name="Tratar No-show">
      <bpmn:incoming>F_NoShow_Wait</bpmn:incoming>
      <bpmn:outgoing>F_EndNoShow</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="End_NoShow" name="Fim No-show">
      <bpmn:incoming>F_EndNoShow</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:endEvent id="End_Disqualificado" name="Desqualificado">
      <bpmn:incoming>F_QualifyNo</bpmn:incoming>
    </bpmn:endEvent>

    <!-- Phase 3: The Meeting -->
    <bpmn:task id="Task_C_Participa" name="Participar da Reunião">
      <bpmn:incoming>F_ShowYes</bpmn:incoming>
      <bpmn:outgoing>F_ClientToIA_1</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_I_Notes" name="Capturar Notas &amp; Objeções">
      <bpmn:incoming>F_ClientToIA_1</bpmn:incoming>
      <bpmn:outgoing>F_IAToExec_3</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_S_Conduz" name="3. Conduzir Reunião">
      <bpmn:incoming>F_IAToExec_3</bpmn:incoming>
      <bpmn:outgoing>F_ExecToIA_1</bpmn:outgoing>
    </bpmn:task>

    <!-- Phase 4: Post-Meeting -->
    <bpmn:task id="Task_I_ResumoReu" name="Gerar Resumo da Reunião">
      <bpmn:incoming>F_ExecToIA_1</bpmn:incoming>
      <bpmn:outgoing>F_IAToExec_4</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_S_Resume" name="4. Registrar Resumo da Reunião">
      <bpmn:incoming>F_IAToExec_4</bpmn:incoming>
      <bpmn:outgoing>F_ExecToAuto_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_A_CRM" name="Registrar no CRM">
      <bpmn:incoming>F_ExecToAuto_2</bpmn:incoming>
      <bpmn:outgoing>F_AutoToClient_1</bpmn:outgoing>
    </bpmn:task>

    <!-- Phase 5: Decision Logic -->
    <bpmn:task id="Task_C_Decide" name="Confirmar Interesse">
      <bpmn:incoming>F_AutoToClient_1</bpmn:incoming>
      <bpmn:outgoing>F_ClientToIA_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_I_Interesse" name="Classificar Grau de Interesse">
      <bpmn:incoming>F_ClientToIA_2</bpmn:incoming>
      <bpmn:outgoing>F_IAToExec_5</bpmn:outgoing>
    </bpmn:task>
    <bpmn:exclusiveGateway id="Gateway_Interesse" name="Interesse?">
      <bpmn:incoming>F_IAToExec_5</bpmn:incoming>
      <bpmn:outgoing>F_Yes</bpmn:outgoing>
      <bpmn:outgoing>F_No</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <bpmn:task id="Task_S_Proposta" name="5. Elaborar Proposta">
      <bpmn:incoming>F_Yes</bpmn:incoming>
      <bpmn:outgoing>F_PropostaToAuto</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_I_Minuta" name="Gerar Minuta de Proposta">
      <!-- IA Support for Proposta -->
      <bpmn:incoming>F_PropostaToAuto</bpmn:incoming>
      <bpmn:outgoing>F_IAToAuto_KPI</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_E_Feedback" name="6. Registrar Feedback Estruturado">
      <bpmn:incoming>F_No</bpmn:incoming>
      <bpmn:outgoing>F_FeedbackToAuto</bpmn:outgoing>
    </bpmn:task>

    <!-- Phase 6: Finalization -->
    <bpmn:task id="Task_A_Fluxo" name="Encaminhar Fluxo">
      <bpmn:incoming>F_IAToAuto_KPI</bpmn:incoming>
      <bpmn:incoming>F_FeedbackToAuto</bpmn:incoming>
      <bpmn:outgoing>F_FluxoToKPI</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_A_KPIs" name="Atualizar KPIs &amp; Dashboards">
      <bpmn:incoming>F_FluxoToKPI</bpmn:incoming>
      <bpmn:outgoing>F_KPIToEnd</bpmn:outgoing>
    </bpmn:task>
    
    <bpmn:endEvent id="End_Success" name="Proposta Pronta">
      <bpmn:incoming>F_KPIToEnd</bpmn:incoming>
    </bpmn:endEvent>

    <!-- Connection flows -->
    <bpmn:sequenceFlow id="F_StartToAuto" sourceRef="StartEvent_1" targetRef="Task_A_Sincro" />
    <bpmn:sequenceFlow id="F_AutoToIA_1" sourceRef="Task_A_Sincro" targetRef="Task_I_ResumoLead" />
    <bpmn:sequenceFlow id="F_IAToExec_1" sourceRef="Task_I_ResumoLead" targetRef="Task_S_Revisa" />
    <bpmn:sequenceFlow id="F_ExecToQualify" sourceRef="Task_S_Revisa" targetRef="Gateway_Qualifica" />
    <bpmn:sequenceFlow id="F_QualifyYes" name="Sim" sourceRef="Gateway_Qualifica" targetRef="Task_A_Lembrete" />
    <bpmn:sequenceFlow id="F_QualifyNo" name="Não" sourceRef="Gateway_Qualifica" targetRef="End_Disqualificado" />
    <bpmn:sequenceFlow id="F_AutoToIA_2" sourceRef="Task_A_Lembrete" targetRef="Task_I_Pauta" />
    <bpmn:sequenceFlow id="F_IAToExec_2" sourceRef="Task_I_Pauta" targetRef="Task_S_Objetivo" />
    <bpmn:sequenceFlow id="F_GatewayShow" sourceRef="Task_S_Objetivo" targetRef="Gateway_Show" />
    <bpmn:sequenceFlow id="F_ShowYes" name="Sim" sourceRef="Gateway_Show" targetRef="Task_C_Participa" />
    <bpmn:sequenceFlow id="F_NoShow" name="Não" sourceRef="Gateway_Show" targetRef="Event_Wait_NoShow" />
    <bpmn:sequenceFlow id="F_NoShow_Wait" sourceRef="Event_Wait_NoShow" targetRef="Task_S_NoShow" />
    <bpmn:sequenceFlow id="F_EndNoShow" sourceRef="Task_S_NoShow" targetRef="End_NoShow" />
    <bpmn:sequenceFlow id="F_ClientToIA_1" sourceRef="Task_C_Participa" targetRef="Task_I_Notes" />
    <bpmn:sequenceFlow id="F_IAToExec_3" sourceRef="Task_I_Notes" targetRef="Task_S_Conduz" />
    <bpmn:sequenceFlow id="F_ExecToIA_1" sourceRef="Task_S_Conduz" targetRef="Task_I_ResumoReu" />
    <bpmn:sequenceFlow id="F_IAToExec_4" sourceRef="Task_I_ResumoReu" targetRef="Task_S_Resume" />
    <bpmn:sequenceFlow id="F_ExecToAuto_2" sourceRef="Task_S_Resume" targetRef="Task_A_CRM" />
    <bpmn:sequenceFlow id="F_AutoToClient_1" sourceRef="Task_A_CRM" targetRef="Task_C_Decide" />
    <bpmn:sequenceFlow id="F_ClientToIA_2" sourceRef="Task_C_Decide" targetRef="Task_I_Interesse" />
    <bpmn:sequenceFlow id="F_IAToExec_5" sourceRef="Task_I_Interesse" targetRef="Gateway_Interesse" />
    <bpmn:sequenceFlow id="F_Yes" name="Sim" sourceRef="Gateway_Interesse" targetRef="Task_S_Proposta" />
    <bpmn:sequenceFlow id="F_No" name="Não" sourceRef="Gateway_Interesse" targetRef="Task_E_Feedback" />
    <bpmn:sequenceFlow id="F_PropostaToAuto" sourceRef="Task_S_Proposta" targetRef="Task_I_Minuta" />
    <bpmn:sequenceFlow id="F_IAToAuto_KPI" sourceRef="Task_I_Minuta" targetRef="Task_A_Fluxo" />
    <bpmn:sequenceFlow id="F_FeedbackToAuto" sourceRef="Task_E_Feedback" targetRef="Task_A_Fluxo" />
    <bpmn:sequenceFlow id="F_FluxoToKPI" sourceRef="Task_A_Fluxo" targetRef="Task_A_KPIs" />
    <bpmn:sequenceFlow id="F_KPIToEnd" sourceRef="Task_A_KPIs" targetRef="End_Success" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Collaboration_12">
      <bpmndi:BPMNShape id="Participant_12_di" bpmnElement="Participant_12" isHorizontal="true"><dc:Bounds x="50" y="20" width="4000" height="780" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Exec_di" bpmnElement="Lane_Exec" isHorizontal="true"><dc:Bounds x="80" y="20" width="3970" height="180" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Auto_di" bpmnElement="Lane_Auto" isHorizontal="true"><dc:Bounds x="80" y="200" width="3970" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_IA_di" bpmnElement="Lane_IA" isHorizontal="true"><dc:Bounds x="80" y="350" width="3970" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Cliente_di" bpmnElement="Lane_Cliente" isHorizontal="true"><dc:Bounds x="80" y="500" width="3970" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Nurt_di" bpmnElement="Lane_Nurt" isHorizontal="true"><dc:Bounds x="80" y="650" width="3970" height="150" /></bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1"><dc:Bounds x="130" y="92" width="36" height="36" /></bpmndi:BPMNShape>
      
      <!-- Sequence Step 1: Sync (Auto) -->
      <bpmndi:BPMNShape id="Task_A_Sincro_di" bpmnElement="Task_A_Sincro"><dc:Bounds x="250" y="235" width="100" height="80" /></bpmndi:BPMNShape>
      <!-- Sequence Step 2: Resume (IA) -->
      <bpmndi:BPMNShape id="Task_I_ResumoLead_di" bpmnElement="Task_I_ResumoLead"><dc:Bounds x="430" y="385" width="100" height="80" /></bpmndi:BPMNShape>
      <!-- Sequence Step 3: Revisa (Exec) -->
      <bpmndi:BPMNShape id="Task_S_Revisa_di" bpmnElement="Task_S_Revisa"><dc:Bounds x="610" y="70" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_Qualifica_di" bpmnElement="Gateway_Qualifica" isMarkerVisible="true"><dc:Bounds x="740" y="85" width="50" height="50" /></bpmndi:BPMNShape>
      <!-- Sequence Step 4: Lembrete (Auto) -->
      <bpmndi:BPMNShape id="Task_A_Lembrete_di" bpmnElement="Task_A_Lembrete"><dc:Bounds x="790" y="235" width="100" height="80" /></bpmndi:BPMNShape>
      <!-- Sequence Step 5: Pauta (IA) -->
      <bpmndi:BPMNShape id="Task_I_Pauta_di" bpmnElement="Task_I_Pauta"><dc:Bounds x="970" y="385" width="100" height="80" /></bpmndi:BPMNShape>
      <!-- Sequence Step 6: Objetivo (Exec) -->
      <bpmndi:BPMNShape id="Task_S_Objetivo_di" bpmnElement="Task_S_Objetivo"><dc:Bounds x="1150" y="70" width="100" height="80" /></bpmndi:BPMNShape>

      <!-- Step 7: Gateway Show -->
      <bpmndi:BPMNShape id="Gateway_Show_di" bpmnElement="Gateway_Show" isMarkerVisible="true"><dc:Bounds x="1330" y="85" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Event_Wait_NoShow_di" bpmnElement="Event_Wait_NoShow"><dc:Bounds x="1170" y="235" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_NoShow_di" bpmnElement="Task_S_NoShow"><dc:Bounds x="1225" y="225" width="100" height="60" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_NoShow_di" bpmnElement="End_NoShow"><dc:Bounds x="1340" y="235" width="36" height="36" /></bpmndi:BPMNShape>
      
      <!-- Step 8: Client Participa -->
      <bpmndi:BPMNShape id="Task_C_Participa_di" bpmnElement="Task_C_Participa"><dc:Bounds x="1530" y="535" width="100" height="80" /></bpmndi:BPMNShape>
      <!-- Step 9: Notes (IA) -->
      <bpmndi:BPMNShape id="Task_I_Notes_di" bpmnElement="Task_I_Notes"><dc:Bounds x="1710" y="385" width="100" height="80" /></bpmndi:BPMNShape>
      <!-- Step 10: Conduz (Exec) -->
      <bpmndi:BPMNShape id="Task_S_Conduz_di" bpmnElement="Task_S_Conduz"><dc:Bounds x="1890" y="70" width="100" height="80" /></bpmndi:BPMNShape>
      <!-- Step 11: Resumo Reu (IA) -->
      <bpmndi:BPMNShape id="Task_I_ResumoReu_di" bpmnElement="Task_I_ResumoReu"><dc:Bounds x="2070" y="385" width="100" height="80" /></bpmndi:BPMNShape>
      <!-- Step 12: Resume Man (Exec) -->
      <bpmndi:BPMNShape id="Task_S_Resume_di" bpmnElement="Task_S_Resume"><dc:Bounds x="2250" y="70" width="100" height="80" /></bpmndi:BPMNShape>
      <!-- Step 13: CRM (Auto) -->
      <bpmndi:BPMNShape id="Task_A_CRM_di" bpmnElement="Task_A_CRM"><dc:Bounds x="2430" y="235" width="100" height="80" /></bpmndi:BPMNShape>
      <!-- Step 14: Decide (Client) -->
      <bpmndi:BPMNShape id="Task_C_Decide_di" bpmnElement="Task_C_Decide"><dc:Bounds x="2610" y="535" width="100" height="80" /></bpmndi:BPMNShape>
      <!-- Step 15: Scoring (IA) -->
      <bpmndi:BPMNShape id="Task_I_Interesse_di" bpmnElement="Task_I_Interesse"><dc:Bounds x="2790" y="385" width="100" height="80" /></bpmndi:BPMNShape>
      
      <!-- Step 16: Gateway Interesse -->
      <bpmndi:BPMNShape id="Gateway_Interesse_di" bpmnElement="Gateway_Interesse" isMarkerVisible="true"><dc:Bounds x="2970" y="85" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_E_Feedback_di" bpmnElement="Task_E_Feedback"><dc:Bounds x="3150" y="685" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_Proposta_di" bpmnElement="Task_S_Proposta"><dc:Bounds x="3150" y="70" width="100" height="80" /></bpmndi:BPMNShape>
      <!-- Step 17: Minuta (IA) -->
      <bpmndi:BPMNShape id="Task_I_Minuta_di" bpmnElement="Task_I_Minuta"><dc:Bounds x="3330" y="385" width="100" height="80" /></bpmndi:BPMNShape>
      
      <!-- Step 18: Fluxo & KPI (Auto) -->
      <bpmndi:BPMNShape id="Task_A_Fluxo_di" bpmnElement="Task_A_Fluxo"><dc:Bounds x="3510" y="235" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_KPIs_di" bpmnElement="Task_A_KPIs"><dc:Bounds x="3690" y="235" width="100" height="80" /></bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="End_Success_di" bpmnElement="End_Success"><dc:Bounds x="3900" y="92" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_Disqualificado_di" bpmnElement="End_Disqualificado"><dc:Bounds x="682" y="707" width="36" height="36" /></bpmndi:BPMNShape>

      <!-- Connection flows (Snake Logic - Recalculated for Horizontal Progression) -->
      <bpmndi:BPMNEdge id="F_StartToAuto_di" bpmnElement="F_StartToAuto">

        <di:waypoint x="148" y="128" />

        <di:waypoint x="148" y="182" />

        <di:waypoint x="300" y="182" />

        <di:waypoint x="300" y="235" />

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_AutoToIA_1_di" bpmnElement="F_AutoToIA_1">

        <di:waypoint x="350" y="275" />

        <di:waypoint x="390" y="275" />

        <di:waypoint x="390" y="425" />

        <di:waypoint x="430" y="425" />

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_IAToExec_1_di" bpmnElement="F_IAToExec_1">

        <di:waypoint x="480" y="385" />

        <di:waypoint x="480" y="268" />

        <di:waypoint x="660" y="268" />

        <di:waypoint x="660" y="150" />

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_ExecToQualify_di" bpmnElement="F_ExecToQualify">

        <di:waypoint x="710" y="110" />

        <di:waypoint x="740" y="110" />

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_QualifyYes_di" bpmnElement="F_QualifyYes">

        <di:waypoint x="765" y="135" />

        <di:waypoint x="765" y="185" />

        <di:waypoint x="840" y="185" />

        <di:waypoint x="840" y="235" />

        <bpmndi:BPMNLabel><dc:Bounds x="855" y="140" width="20" height="14" /></bpmndi:BPMNLabel>

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_QualifyNo_di" bpmnElement="F_QualifyNo">

        <di:waypoint x="765" y="135" />

        <di:waypoint x="765" y="421" />

        <di:waypoint x="700" y="421" />

        <di:waypoint x="700" y="707" />

        <bpmndi:BPMNLabel><dc:Bounds x="728" y="145" width="21" height="14" /></bpmndi:BPMNLabel>

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_AutoToIA_2_di" bpmnElement="F_AutoToIA_2">

        <di:waypoint x="890" y="275" />

        <di:waypoint x="930" y="275" />

        <di:waypoint x="930" y="425" />

        <di:waypoint x="970" y="425" />

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_IAToExec_2_di" bpmnElement="F_IAToExec_2">

        <di:waypoint x="1020" y="385" />

        <di:waypoint x="1020" y="230" />

        <di:waypoint x="1200" y="230" />

        <di:waypoint x="1200" y="150" />

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_GatewayShow_di" bpmnElement="F_GatewayShow">

        <di:waypoint x="1250" y="110" />

        <di:waypoint x="1330" y="110" />

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_ShowYes_di" bpmnElement="F_ShowYes">

        <di:waypoint x="1355" y="135" />

        <di:waypoint x="1355" y="215" />

        <di:waypoint x="1580" y="215" />

        <di:waypoint x="1580" y="535" />

        <bpmndi:BPMNLabel><dc:Bounds x="1400" y="90" width="20" height="14" /></bpmndi:BPMNLabel>

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_NoShow_di" bpmnElement="F_NoShow">

        <di:waypoint x="1330" y="110" />

        <di:waypoint x="1268" y="110" />

        <di:waypoint x="1268" y="253" />

        <di:waypoint x="1206" y="253" />

        <bpmndi:BPMNLabel><dc:Bounds x="1360" y="155" width="21" height="14" /></bpmndi:BPMNLabel>

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_NoShow_Wait_di" bpmnElement="F_NoShow_Wait">

        <di:waypoint x="1206" y="253" />

        <di:waypoint x="1216" y="253" />

        <di:waypoint x="1216" y="255" />

        <di:waypoint x="1225" y="255" />

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_EndNoShow_di" bpmnElement="F_EndNoShow">

        <di:waypoint x="1325" y="255" />

        <di:waypoint x="1332" y="255" />

        <di:waypoint x="1332" y="253" />

        <di:waypoint x="1340" y="253" />

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_ClientToIA_1_di" bpmnElement="F_ClientToIA_1">

        <di:waypoint x="1630" y="575" />

        <di:waypoint x="1670" y="575" />

        <di:waypoint x="1670" y="425" />

        <di:waypoint x="1710" y="425" />

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_IAToExec_3_di" bpmnElement="F_IAToExec_3">

        <di:waypoint x="1760" y="385" />

        <di:waypoint x="1760" y="268" />

        <di:waypoint x="1940" y="268" />

        <di:waypoint x="1940" y="150" />

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_ExecToIA_1_di" bpmnElement="F_ExecToIA_1">

        <di:waypoint x="1940" y="150" />

        <di:waypoint x="1940" y="268" />

        <di:waypoint x="2120" y="268" />

        <di:waypoint x="2120" y="385" />

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_IAToExec_4_di" bpmnElement="F_IAToExec_4">

        <di:waypoint x="2120" y="385" />

        <di:waypoint x="2120" y="268" />

        <di:waypoint x="2300" y="268" />

        <di:waypoint x="2300" y="150" />

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_ExecToAuto_2_di" bpmnElement="F_ExecToAuto_2">

        <di:waypoint x="2350" y="110" />

        <di:waypoint x="2390" y="110" />

        <di:waypoint x="2390" y="275" />

        <di:waypoint x="2430" y="275" />

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_AutoToClient_1_di" bpmnElement="F_AutoToClient_1">

        <di:waypoint x="2480" y="315" />

        <di:waypoint x="2480" y="425" />

        <di:waypoint x="2660" y="425" />

        <di:waypoint x="2660" y="535" />

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_ClientToIA_2_di" bpmnElement="F_ClientToIA_2">

        <di:waypoint x="2710" y="575" />

        <di:waypoint x="2750" y="575" />

        <di:waypoint x="2750" y="425" />

        <di:waypoint x="2790" y="425" />

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_IAToExec_5_di" bpmnElement="F_IAToExec_5">

        <di:waypoint x="2840" y="385" />

        <di:waypoint x="2840" y="260" />

        <di:waypoint x="2995" y="260" />

        <di:waypoint x="2995" y="135" />

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Yes_di" bpmnElement="F_Yes">

        <di:waypoint x="3020" y="110" />

        <di:waypoint x="3150" y="110" />

        <bpmndi:BPMNLabel><dc:Bounds x="3060" y="90" width="20" height="14" /></bpmndi:BPMNLabel>

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_No_di" bpmnElement="F_No">

        <di:waypoint x="2995" y="135" />

        <di:waypoint x="2995" y="410" />

        <di:waypoint x="3200" y="410" />

        <di:waypoint x="3200" y="685" />

        <bpmndi:BPMNLabel><dc:Bounds x="3000" y="155" width="21" height="14" /></bpmndi:BPMNLabel>

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_PropostaToAuto_di" bpmnElement="F_PropostaToAuto">

        <di:waypoint x="3200" y="150" />

        <di:waypoint x="3200" y="268" />

        <di:waypoint x="3380" y="268" />

        <di:waypoint x="3380" y="385" />

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_IAToAuto_KPI_di" bpmnElement="F_IAToAuto_KPI">

        <di:waypoint x="3430" y="425" />

        <di:waypoint x="3470" y="425" />

        <di:waypoint x="3470" y="275" />

        <di:waypoint x="3510" y="275" />

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_FeedbackToAuto_di" bpmnElement="F_FeedbackToAuto">

        <di:waypoint x="3200" y="685" />

        <di:waypoint x="3200" y="500" />

        <di:waypoint x="3560" y="500" />

        <di:waypoint x="3560" y="315" />

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_FluxoToKPI_di" bpmnElement="F_FluxoToKPI">

        <di:waypoint x="3610" y="275" />

        <di:waypoint x="3690" y="275" />

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_KPIToEnd_di" bpmnElement="F_KPIToEnd">

        <di:waypoint x="3790" y="275" />

        <di:waypoint x="3845" y="275" />

        <di:waypoint x="3845" y="110" />

        <di:waypoint x="3900" y="110" />

      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

const phases = [
      { name: 'Preparação', x: 80, width: 1220 },
      { name: 'Reunião', x: 1300, width: 1050 },
      { name: 'Pós-Reunião', x: 2350, width: 200 },
      { name: 'Decisão', x: 2550, width: 500 },
      { name: 'Formalização', x: 3050, width: 950 }
    ];

const config = {
zoom: 0.9,
      storageKey: 'subprocesso-1.2',
      startLabel: 'REUNIÃO AGENDADA',
      endLabels: {
        End_Success: { text: 'PROPOSTA ELABORADA', className: 'end-label-success', marker: 'end-success' }
      },
      showDefaultEndLabel: true,
      useEndName: true,
      defaultEndLabelText: 'FIM',
      defaultEndClass: 'end-label-lost'
};

window.v5Data = window.v5Data || {};
window.v5Data['1.2'] = { diagramXML, nodeDetails, phases, ...config };
