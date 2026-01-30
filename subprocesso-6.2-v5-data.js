const nodeDetails = {
  'Task_BI_ConsolidarDados': { sla: null, tag: 'BI', desc: 'Consolida KPIs multicanais para o periodo.' },
  'Task_A_AtualizarDashboards': { sla: null, tag: 'Dash', desc: 'Atualiza dashboards com os dados finais.' },
  'Task_CS_ValidarDados': { sla: '24h', tag: 'Dados', desc: 'Valida consistencia do relatorio.' },
  'Task_I_GerarHighlights': { sla: null, tag: 'IA', desc: 'Gera highlights e alertas automaticamente.' },
  'Task_CS_PrepararApresentacao': { sla: null, tag: 'Story', desc: 'Prepara apresentacao com narrativa e KPIs.' },
  'Task_I_SugerirStory': { sla: null, tag: 'IA', desc: 'Sugere storytelling da apresentacao.' },
  'Task_I_GerarResumoExec': { sla: null, tag: 'Exec', desc: 'Gera resumo executivo automatico.' },
  'Task_CS_RevisaoQA': { sla: '24h', tag: 'QA', desc: 'Revisao interna dos dados e narrativa.' },
  'Task_CS_EnviarResumo': { sla: null, tag: 'Previa', desc: 'Envia resumo executivo opcional.' },
  'Task_CS_AgendarReuniao': { sla: '48h', tag: 'Agenda', desc: 'Agenda reuniao de apresentacao.' },
  'Task_A_EnviarConvite': { sla: null, tag: 'Auto', desc: 'Envia convite com link e material.' },
  'Task_C_ReceberConvite': { sla: null, tag: 'Convite', desc: 'Cliente recebe convite e pauta.' },
  'Task_CS_RealizarReuniao': { sla: null, tag: 'Apresentar', desc: 'Conduz reuniao de resultados.' },
  'Task_C_ParticiparReuniao': { sla: null, tag: 'Reuniao', desc: 'Cliente participa da apresentacao.' },
  'Task_CS_RegistrarDecisoes': { sla: null, tag: 'Registro', desc: 'Registra decisoes e pendencias.' },
  'Task_G_ConsolidarAprendizados': { sla: null, tag: 'Learn', desc: 'Consolida aprendizados do ciclo.' },
  'Task_G_RascunhoPlano': { sla: null, tag: 'Next', desc: 'Gera rascunho de plano de acao.' },
  'Task_CS_ColetarFeedback': { sla: null, tag: 'CSAT', desc: 'Coleta feedback do cliente.' },
  'Task_C_ResponderFeedback': { sla: null, tag: 'Feedback', desc: 'Cliente responde pesquisa e comentarios.' },
  'Task_I_AnalisarSentimento': { sla: null, tag: 'Sentimento', desc: 'Analisa humor e risco do cliente.' },
  'Task_A_ArquivarRelatorio': { sla: null, tag: 'Arquivar', desc: 'Arquiva relatorio e apresentacao.' }
};

const diagramXML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_62_V5" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_62_V5">
    <bpmn:participant id="Participant_62_V5" name="Apresentacao de Resultados" processRef="Process_62_V5" />
  </bpmn:collaboration>
  <bpmn:process id="Process_62_V5" isExecutable="false">
    <bpmn:laneSet id="LaneSet_62_V5">
      <bpmn:lane id="Lane_Cliente" name="Cliente">
        <bpmn:flowNodeRef>Start_Relatorio</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_C_ReceberConvite</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_C_ParticiparReuniao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_C_ResponderFeedback</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_CS" name="Atendimento / CS">
        <bpmn:flowNodeRef>Task_CS_ValidarDados</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_PrepararApresentacao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_RevisaoQA</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_EnviarResumo</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_AgendarReuniao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_EnviarConvite</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_RealizarReuniao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_RegistrarDecisoes</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_ColetarFeedback</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_ResultadosApresentados</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_IA" name="IA &amp; Insights">
        <bpmn:flowNodeRef>Task_I_GerarHighlights</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_SugerirStory</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_GerarResumoExec</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_AnalisarSentimento</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_BI" name="Operacoes / BI">
        <bpmn:flowNodeRef>Task_BI_ConsolidarDados</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_AtualizarDashboards</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_ArquivarRelatorio</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Gestao" name="Gestao / Planejamento">
        <bpmn:flowNodeRef>Task_G_ConsolidarAprendizados</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_G_RascunhoPlano</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>

    <bpmn:startEvent id="Start_Relatorio" name="Relatorio Gerado" />
    <bpmn:task id="Task_BI_ConsolidarDados" name="Consolidar Dados Multicanais" />
    <bpmn:task id="Task_A_AtualizarDashboards" name="Atualizar Dashboards" />
    <bpmn:task id="Task_CS_ValidarDados" name="Validar Dados do Relatorio" />
    <bpmn:task id="Task_I_GerarHighlights" name="Gerar Highlights e Alertas" />
    <bpmn:task id="Task_CS_PrepararApresentacao" name="Preparar Apresentacao de Resultados" />
    <bpmn:task id="Task_I_SugerirStory" name="Sugerir Storytelling da Apresentacao" />
    <bpmn:task id="Task_I_GerarResumoExec" name="Gerar Resumo Executivo" />
    <bpmn:task id="Task_CS_RevisaoQA" name="Revisao Interna (QA)" />
    <bpmn:task id="Task_CS_EnviarResumo" name="Enviar Resumo Executivo (Opc.)" />
    <bpmn:task id="Task_CS_AgendarReuniao" name="Agendar Reuniao de Apresentacao" />
    <bpmn:task id="Task_A_EnviarConvite" name="Enviar Convite e Material" />
    <bpmn:task id="Task_C_ReceberConvite" name="Receber Convite e Pauta" />
    <bpmn:task id="Task_CS_RealizarReuniao" name="Realizar Reuniao de Apresentacao" />
    <bpmn:task id="Task_C_ParticiparReuniao" name="Participar da Apresentacao" />
    <bpmn:task id="Task_CS_RegistrarDecisoes" name="Registrar Decisoes e Pendencias" />
    <bpmn:task id="Task_G_ConsolidarAprendizados" name="Consolidar Aprendizados" />
    <bpmn:task id="Task_G_RascunhoPlano" name="Gerar Rascunho de Plano de Acao" />
    <bpmn:task id="Task_CS_ColetarFeedback" name="Coletar Feedback do Cliente" />
    <bpmn:task id="Task_C_ResponderFeedback" name="Responder Pesquisa e Comentarios" />
    <bpmn:task id="Task_I_AnalisarSentimento" name="Analisar Sentimento e Risco" />
    <bpmn:task id="Task_A_ArquivarRelatorio" name="Arquivar Relatorio e Apresentacao" />
    <bpmn:endEvent id="End_ResultadosApresentados" name="Resultados Apresentados" />

    <bpmn:sequenceFlow id="F_Start_BIConsolidar" sourceRef="Start_Relatorio" targetRef="Task_BI_ConsolidarDados" />
    <bpmn:sequenceFlow id="F_BIConsolidar_Atualizar" sourceRef="Task_BI_ConsolidarDados" targetRef="Task_A_AtualizarDashboards" />
    <bpmn:sequenceFlow id="F_Atualizar_Validar" sourceRef="Task_A_AtualizarDashboards" targetRef="Task_CS_ValidarDados" />
    <bpmn:sequenceFlow id="F_Validar_Highlights" sourceRef="Task_CS_ValidarDados" targetRef="Task_I_GerarHighlights" />
    <bpmn:sequenceFlow id="F_Highlights_Preparar" sourceRef="Task_I_GerarHighlights" targetRef="Task_CS_PrepararApresentacao" />
    <bpmn:sequenceFlow id="F_Preparar_Story" sourceRef="Task_CS_PrepararApresentacao" targetRef="Task_I_SugerirStory" />
    <bpmn:sequenceFlow id="F_Story_Resumo" sourceRef="Task_I_SugerirStory" targetRef="Task_I_GerarResumoExec" />
    <bpmn:sequenceFlow id="F_Resumo_QA" sourceRef="Task_I_GerarResumoExec" targetRef="Task_CS_RevisaoQA" />
    <bpmn:sequenceFlow id="F_QA_EnviarResumo" sourceRef="Task_CS_RevisaoQA" targetRef="Task_CS_EnviarResumo" />
    <bpmn:sequenceFlow id="F_EnviarResumo_Agendar" sourceRef="Task_CS_EnviarResumo" targetRef="Task_CS_AgendarReuniao" />
    <bpmn:sequenceFlow id="F_Agendar_EnviarConvite" sourceRef="Task_CS_AgendarReuniao" targetRef="Task_A_EnviarConvite" />
    <bpmn:sequenceFlow id="F_EnviarConvite_ReceberConvite" sourceRef="Task_A_EnviarConvite" targetRef="Task_C_ReceberConvite" />
    <bpmn:sequenceFlow id="F_ReceberConvite_Realizar" sourceRef="Task_C_ReceberConvite" targetRef="Task_CS_RealizarReuniao" />
    <bpmn:sequenceFlow id="F_Realizar_Participar" sourceRef="Task_CS_RealizarReuniao" targetRef="Task_C_ParticiparReuniao" />
    <bpmn:sequenceFlow id="F_Participar_Registrar" sourceRef="Task_C_ParticiparReuniao" targetRef="Task_CS_RegistrarDecisoes" />
    <bpmn:sequenceFlow id="F_Registrar_Consolidar" sourceRef="Task_CS_RegistrarDecisoes" targetRef="Task_G_ConsolidarAprendizados" />
    <bpmn:sequenceFlow id="F_Consolidar_Rascunho" sourceRef="Task_G_ConsolidarAprendizados" targetRef="Task_G_RascunhoPlano" />
    <bpmn:sequenceFlow id="F_Rascunho_Coletar" sourceRef="Task_G_RascunhoPlano" targetRef="Task_CS_ColetarFeedback" />
    <bpmn:sequenceFlow id="F_Coletar_Responder" sourceRef="Task_CS_ColetarFeedback" targetRef="Task_C_ResponderFeedback" />
    <bpmn:sequenceFlow id="F_Responder_Sentimento" sourceRef="Task_C_ResponderFeedback" targetRef="Task_I_AnalisarSentimento" />
    <bpmn:sequenceFlow id="F_Sentimento_Arquivar" sourceRef="Task_I_AnalisarSentimento" targetRef="Task_A_ArquivarRelatorio" />
    <bpmn:sequenceFlow id="F_Arquivar_End" sourceRef="Task_A_ArquivarRelatorio" targetRef="End_ResultadosApresentados" />
  </bpmn:process>

  <bpmndi:BPMNDiagram id="BPMNDiagram_62_V5">
    <bpmndi:BPMNPlane id="BPMNPlane_62_V5" bpmnElement="Collaboration_62_V5">
      <bpmndi:BPMNShape id="Participant_62_V5_di" bpmnElement="Participant_62_V5" isHorizontal="true"><dc:Bounds x="50" y="20" width="3300" height="850" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Cliente_di" bpmnElement="Lane_Cliente" isHorizontal="true"><dc:Bounds x="80" y="20" width="3270" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_CS_di" bpmnElement="Lane_CS" isHorizontal="true"><dc:Bounds x="80" y="170" width="3270" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_IA_di" bpmnElement="Lane_IA" isHorizontal="true"><dc:Bounds x="80" y="320" width="3270" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_BI_di" bpmnElement="Lane_BI" isHorizontal="true"><dc:Bounds x="80" y="470" width="3270" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Gestao_di" bpmnElement="Lane_Gestao" isHorizontal="true"><dc:Bounds x="80" y="620" width="3270" height="150" /></bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Start_Relatorio_di" bpmnElement="Start_Relatorio"><dc:Bounds x="120" y="77" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_BI_ConsolidarDados_di" bpmnElement="Task_BI_ConsolidarDados"><dc:Bounds x="220" y="505" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_AtualizarDashboards_di" bpmnElement="Task_A_AtualizarDashboards"><dc:Bounds x="360" y="505" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_ValidarDados_di" bpmnElement="Task_CS_ValidarDados"><dc:Bounds x="500" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_GerarHighlights_di" bpmnElement="Task_I_GerarHighlights"><dc:Bounds x="640" y="355" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_PrepararApresentacao_di" bpmnElement="Task_CS_PrepararApresentacao"><dc:Bounds x="780" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_SugerirStory_di" bpmnElement="Task_I_SugerirStory"><dc:Bounds x="920" y="355" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_GerarResumoExec_di" bpmnElement="Task_I_GerarResumoExec"><dc:Bounds x="1060" y="355" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_RevisaoQA_di" bpmnElement="Task_CS_RevisaoQA"><dc:Bounds x="1200" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_EnviarResumo_di" bpmnElement="Task_CS_EnviarResumo"><dc:Bounds x="1340" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_AgendarReuniao_di" bpmnElement="Task_CS_AgendarReuniao"><dc:Bounds x="1480" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_EnviarConvite_di" bpmnElement="Task_A_EnviarConvite"><dc:Bounds x="1620" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_ReceberConvite_di" bpmnElement="Task_C_ReceberConvite"><dc:Bounds x="1760" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_RealizarReuniao_di" bpmnElement="Task_CS_RealizarReuniao"><dc:Bounds x="1900" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_ParticiparReuniao_di" bpmnElement="Task_C_ParticiparReuniao"><dc:Bounds x="2040" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_RegistrarDecisoes_di" bpmnElement="Task_CS_RegistrarDecisoes"><dc:Bounds x="2180" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_G_ConsolidarAprendizados_di" bpmnElement="Task_G_ConsolidarAprendizados"><dc:Bounds x="2320" y="655" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_G_RascunhoPlano_di" bpmnElement="Task_G_RascunhoPlano"><dc:Bounds x="2460" y="655" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_ColetarFeedback_di" bpmnElement="Task_CS_ColetarFeedback"><dc:Bounds x="2600" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_ResponderFeedback_di" bpmnElement="Task_C_ResponderFeedback"><dc:Bounds x="2740" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_AnalisarSentimento_di" bpmnElement="Task_I_AnalisarSentimento"><dc:Bounds x="2880" y="355" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_ArquivarRelatorio_di" bpmnElement="Task_A_ArquivarRelatorio"><dc:Bounds x="3020" y="505" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_ResultadosApresentados_di" bpmnElement="End_ResultadosApresentados"><dc:Bounds x="3160" y="227" width="36" height="36" /></bpmndi:BPMNShape>

      <bpmndi:BPMNEdge id="F_Start_BIConsolidar_di" bpmnElement="F_Start_BIConsolidar"><di:waypoint x="138" y="95" /><di:waypoint x="280" y="545" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_BIConsolidar_Atualizar_di" bpmnElement="F_BIConsolidar_Atualizar"><di:waypoint x="280" y="545" /><di:waypoint x="420" y="545" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Atualizar_Validar_di" bpmnElement="F_Atualizar_Validar"><di:waypoint x="420" y="545" /><di:waypoint x="560" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Validar_Highlights_di" bpmnElement="F_Validar_Highlights"><di:waypoint x="560" y="245" /><di:waypoint x="700" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Highlights_Preparar_di" bpmnElement="F_Highlights_Preparar"><di:waypoint x="700" y="395" /><di:waypoint x="840" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Preparar_Story_di" bpmnElement="F_Preparar_Story"><di:waypoint x="840" y="245" /><di:waypoint x="980" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Story_Resumo_di" bpmnElement="F_Story_Resumo"><di:waypoint x="980" y="395" /><di:waypoint x="1120" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Resumo_QA_di" bpmnElement="F_Resumo_QA"><di:waypoint x="1120" y="395" /><di:waypoint x="1260" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_QA_EnviarResumo_di" bpmnElement="F_QA_EnviarResumo"><di:waypoint x="1260" y="245" /><di:waypoint x="1400" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_EnviarResumo_Agendar_di" bpmnElement="F_EnviarResumo_Agendar"><di:waypoint x="1400" y="245" /><di:waypoint x="1540" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Agendar_EnviarConvite_di" bpmnElement="F_Agendar_EnviarConvite"><di:waypoint x="1540" y="245" /><di:waypoint x="1680" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_EnviarConvite_ReceberConvite_di" bpmnElement="F_EnviarConvite_ReceberConvite"><di:waypoint x="1680" y="245" /><di:waypoint x="1820" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_ReceberConvite_Realizar_di" bpmnElement="F_ReceberConvite_Realizar"><di:waypoint x="1820" y="95" /><di:waypoint x="1960" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Realizar_Participar_di" bpmnElement="F_Realizar_Participar"><di:waypoint x="1960" y="245" /><di:waypoint x="2100" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Participar_Registrar_di" bpmnElement="F_Participar_Registrar"><di:waypoint x="2100" y="95" /><di:waypoint x="2240" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Registrar_Consolidar_di" bpmnElement="F_Registrar_Consolidar"><di:waypoint x="2240" y="245" /><di:waypoint x="2380" y="695" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Consolidar_Rascunho_di" bpmnElement="F_Consolidar_Rascunho"><di:waypoint x="2380" y="695" /><di:waypoint x="2520" y="695" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Rascunho_Coletar_di" bpmnElement="F_Rascunho_Coletar"><di:waypoint x="2520" y="695" /><di:waypoint x="2660" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Coletar_Responder_di" bpmnElement="F_Coletar_Responder"><di:waypoint x="2660" y="245" /><di:waypoint x="2800" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Responder_Sentimento_di" bpmnElement="F_Responder_Sentimento"><di:waypoint x="2800" y="95" /><di:waypoint x="2940" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Sentimento_Arquivar_di" bpmnElement="F_Sentimento_Arquivar"><di:waypoint x="2940" y="395" /><di:waypoint x="3080" y="545" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Arquivar_End_di" bpmnElement="F_Arquivar_End"><di:waypoint x="3080" y="545" /><di:waypoint x="3178" y="245" /></bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

const phases = [
  { name: 'Preparacao', x: 80, width: 1240 },
  { name: 'Agendamento & Logistica', x: 1320, width: 560 },
  { name: 'Reuniao & Storytelling', x: 1880, width: 700 },
  { name: 'Feedback & Proximos Passos', x: 2580, width: 770 }
];

const config = {
  zoom: 0.9,
  storageKey: 'subprocesso-6.2',
  startLabel: 'RELATORIO GERADO',
  endLabels: {
    End_ResultadosApresentados: { text: 'RESULTADOS APRESENTADOS', className: 'end-label-success', marker: 'end-success' }
  },
  showDefaultEndLabel: false,
  useEndName: false,
  defaultEndLabelText: 'FIM',
  defaultEndClass: 'end-label-lost'
};

window.v5Data = window.v5Data || {};
window.v5Data['6.2'] = { diagramXML, nodeDetails, phases, ...config };
