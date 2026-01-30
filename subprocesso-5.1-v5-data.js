const nodeDetails = {
  'Task_G_AbrirPainel': { sla: '10h', tag: 'Painel', desc: 'Abre dashboard unificado de performance.' },
  'Task_G_ChecarSaude': { sla: null, tag: 'Saude', desc: 'Checa saude das contas e gastos.' },
  'Task_G_AnalisarMetricas': { sla: null, tag: 'Metricas', desc: 'Analisa CPL, CPC, CTR, CPM, ROAS.' },
  'Task_G_AnalisarQualidade': { sla: null, tag: 'Qualidade', desc: 'Analisa qualidade do trafego e LP.' },
  'Task_BI_AtualizarDashboards': { sla: null, tag: 'ETL', desc: 'Atualiza dashboards automaticamente.' },
  'Task_BI_ConsolidarLP': { sla: null, tag: 'LP', desc: 'Consolida dados de LP.' },
  'Task_I_DetectarAnomalias': { sla: null, tag: 'IA', desc: 'Detecta anomalias nas metricas.' },
  'Task_I_SugerirOportunidades': { sla: null, tag: 'IA', desc: 'Sugere oportunidades de escala.' },
  'Gateway_Anomalia': { sla: null, tag: 'Decisao', desc: 'Define se ha anomalia ou oportunidade.' },
  'Task_D_RegistrarOK': { sla: null, tag: 'Log', desc: 'Registra monitoramento OK.' },
  'Task_D_Classificar': { sla: null, tag: 'Classificacao', desc: 'Classifica ocorrencia.' },
  'Task_D_RegistrarOcorrencia': { sla: null, tag: 'Log', desc: 'Registra anomalia ou oportunidade.' },
  'Task_D_CriarTarefa': { sla: null, tag: 'Handoff', desc: 'Cria tarefa para 5.2.' }
};

const diagramXML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_51_V5" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_51_V5">
    <bpmn:participant id="Participant_51_V5" name="Monitoramento Diario" processRef="Process_51_V5" />
  </bpmn:collaboration>
  <bpmn:process id="Process_51_V5" isExecutable="false">
    <bpmn:laneSet id="LaneSet_51_V5">
      <bpmn:lane id="Lane_Gestor" name="Gestor de Trafego">
        <bpmn:flowNodeRef>Start_CampanhasAtivas</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_G_AbrirPainel</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_G_ChecarSaude</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_G_AnalisarMetricas</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_G_AnalisarQualidade</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_BI" name="BI / Dashboards &amp; Automacao">
        <bpmn:flowNodeRef>Task_BI_AtualizarDashboards</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_BI_ConsolidarLP</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_IA" name="IA &amp; Alertas">
        <bpmn:flowNodeRef>Task_I_DetectarAnomalias</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_SugerirOportunidades</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Decisao" name="Decisao &amp; Registro">
        <bpmn:flowNodeRef>Gateway_Anomalia</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_D_RegistrarOK</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_SemAcao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_D_Classificar</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_D_RegistrarOcorrencia</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_D_CriarTarefa</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_ComRegistro</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>

    <bpmn:startEvent id="Start_CampanhasAtivas" name="Campanhas Ativas" />
    <bpmn:task id="Task_BI_AtualizarDashboards" name="Atualizar Dashboards" />
    <bpmn:task id="Task_G_AbrirPainel" name="Abrir Painel Diario" />
    <bpmn:task id="Task_G_ChecarSaude" name="Checar Saude das Contas" />
    <bpmn:task id="Task_G_AnalisarMetricas" name="Analisar Metricas Chave" />
    <bpmn:task id="Task_BI_ConsolidarLP" name="Consolidar Dados de LP" />
    <bpmn:task id="Task_G_AnalisarQualidade" name="Analisar Qualidade de Trafego" />
    <bpmn:task id="Task_I_DetectarAnomalias" name="Detectar Anomalias" />
    <bpmn:task id="Task_I_SugerirOportunidades" name="Sugerir Oportunidades" />
    <bpmn:exclusiveGateway id="Gateway_Anomalia" name="Anomalia ou Oportunidade?" />
    <bpmn:task id="Task_D_RegistrarOK" name="Registrar Monitoramento OK" />
    <bpmn:endEvent id="End_SemAcao" name="Fim Sem Acao" />
    <bpmn:task id="Task_D_Classificar" name="Classificar Ocorrencia" />
    <bpmn:task id="Task_D_RegistrarOcorrencia" name="Registrar Anomalia/Oportunidade" />
    <bpmn:task id="Task_D_CriarTarefa" name="Criar Tarefa de Acao" />
    <bpmn:endEvent id="End_ComRegistro" name="Fim Com Registro" />

    <bpmn:sequenceFlow id="F_Start_Atualizar" sourceRef="Start_CampanhasAtivas" targetRef="Task_BI_AtualizarDashboards" />
    <bpmn:sequenceFlow id="F_Atualizar_Abrir" sourceRef="Task_BI_AtualizarDashboards" targetRef="Task_G_AbrirPainel" />
    <bpmn:sequenceFlow id="F_Abrir_Checar" sourceRef="Task_G_AbrirPainel" targetRef="Task_G_ChecarSaude" />
    <bpmn:sequenceFlow id="F_Checar_AnalisarMetricas" sourceRef="Task_G_ChecarSaude" targetRef="Task_G_AnalisarMetricas" />
    <bpmn:sequenceFlow id="F_AnalisarMetricas_ConsolidarLP" sourceRef="Task_G_AnalisarMetricas" targetRef="Task_BI_ConsolidarLP" />
    <bpmn:sequenceFlow id="F_ConsolidarLP_AnalisarQualidade" sourceRef="Task_BI_ConsolidarLP" targetRef="Task_G_AnalisarQualidade" />
    <bpmn:sequenceFlow id="F_AnalisarQualidade_Anomalias" sourceRef="Task_G_AnalisarQualidade" targetRef="Task_I_DetectarAnomalias" />
    <bpmn:sequenceFlow id="F_Anomalias_Oportunidades" sourceRef="Task_I_DetectarAnomalias" targetRef="Task_I_SugerirOportunidades" />
    <bpmn:sequenceFlow id="F_Oportunidades_Gateway" sourceRef="Task_I_SugerirOportunidades" targetRef="Gateway_Anomalia" />

    <bpmn:sequenceFlow id="F_Gateway_No_OK" name="Nao" sourceRef="Gateway_Anomalia" targetRef="Task_D_RegistrarOK" />
    <bpmn:sequenceFlow id="F_OK_End" sourceRef="Task_D_RegistrarOK" targetRef="End_SemAcao" />

    <bpmn:sequenceFlow id="F_Gateway_Yes_Classificar" name="Sim" sourceRef="Gateway_Anomalia" targetRef="Task_D_Classificar" />
    <bpmn:sequenceFlow id="F_Classificar_Registrar" sourceRef="Task_D_Classificar" targetRef="Task_D_RegistrarOcorrencia" />
    <bpmn:sequenceFlow id="F_Registrar_CriarTarefa" sourceRef="Task_D_RegistrarOcorrencia" targetRef="Task_D_CriarTarefa" />
    <bpmn:sequenceFlow id="F_CriarTarefa_End" sourceRef="Task_D_CriarTarefa" targetRef="End_ComRegistro" />
  </bpmn:process>

  <bpmndi:BPMNDiagram id="BPMNDiagram_51_V5">
    <bpmndi:BPMNPlane id="BPMNPlane_51_V5" bpmnElement="Collaboration_51_V5">
      <bpmndi:BPMNShape id="Participant_51_V5_di" bpmnElement="Participant_51_V5" isHorizontal="true"><dc:Bounds x="50" y="20" width="3100" height="650" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Gestor_di" bpmnElement="Lane_Gestor" isHorizontal="true"><dc:Bounds x="80" y="20" width="3070" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_BI_di" bpmnElement="Lane_BI" isHorizontal="true"><dc:Bounds x="80" y="170" width="3070" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_IA_di" bpmnElement="Lane_IA" isHorizontal="true"><dc:Bounds x="80" y="320" width="3070" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Decisao_di" bpmnElement="Lane_Decisao" isHorizontal="true"><dc:Bounds x="80" y="470" width="3070" height="150" /></bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Start_CampanhasAtivas_di" bpmnElement="Start_CampanhasAtivas"><dc:Bounds x="120" y="77" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_BI_AtualizarDashboards_di" bpmnElement="Task_BI_AtualizarDashboards"><dc:Bounds x="220" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_G_AbrirPainel_di" bpmnElement="Task_G_AbrirPainel"><dc:Bounds x="380" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_G_ChecarSaude_di" bpmnElement="Task_G_ChecarSaude"><dc:Bounds x="540" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_G_AnalisarMetricas_di" bpmnElement="Task_G_AnalisarMetricas"><dc:Bounds x="700" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_BI_ConsolidarLP_di" bpmnElement="Task_BI_ConsolidarLP"><dc:Bounds x="860" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_G_AnalisarQualidade_di" bpmnElement="Task_G_AnalisarQualidade"><dc:Bounds x="1020" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_DetectarAnomalias_di" bpmnElement="Task_I_DetectarAnomalias"><dc:Bounds x="1180" y="355" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_SugerirOportunidades_di" bpmnElement="Task_I_SugerirOportunidades"><dc:Bounds x="1340" y="355" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_Anomalia_di" bpmnElement="Gateway_Anomalia" isMarkerVisible="true"><dc:Bounds x="1500" y="520" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_D_RegistrarOK_di" bpmnElement="Task_D_RegistrarOK"><dc:Bounds x="1660" y="505" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_SemAcao_di" bpmnElement="End_SemAcao"><dc:Bounds x="1820" y="527" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_D_Classificar_di" bpmnElement="Task_D_Classificar"><dc:Bounds x="1660" y="505" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_D_RegistrarOcorrencia_di" bpmnElement="Task_D_RegistrarOcorrencia"><dc:Bounds x="1820" y="505" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_D_CriarTarefa_di" bpmnElement="Task_D_CriarTarefa"><dc:Bounds x="1980" y="505" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_ComRegistro_di" bpmnElement="End_ComRegistro"><dc:Bounds x="2140" y="527" width="36" height="36" /></bpmndi:BPMNShape>

      <bpmndi:BPMNEdge id="F_Start_Atualizar_di" bpmnElement="F_Start_Atualizar"><di:waypoint x="138" y="95" /><di:waypoint x="280" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Atualizar_Abrir_di" bpmnElement="F_Atualizar_Abrir"><di:waypoint x="280" y="245" /><di:waypoint x="440" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Abrir_Checar_di" bpmnElement="F_Abrir_Checar"><di:waypoint x="440" y="95" /><di:waypoint x="600" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Checar_AnalisarMetricas_di" bpmnElement="F_Checar_AnalisarMetricas"><di:waypoint x="600" y="95" /><di:waypoint x="760" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_AnalisarMetricas_ConsolidarLP_di" bpmnElement="F_AnalisarMetricas_ConsolidarLP"><di:waypoint x="760" y="95" /><di:waypoint x="920" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_ConsolidarLP_AnalisarQualidade_di" bpmnElement="F_ConsolidarLP_AnalisarQualidade"><di:waypoint x="920" y="245" /><di:waypoint x="1080" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_AnalisarQualidade_Anomalias_di" bpmnElement="F_AnalisarQualidade_Anomalias"><di:waypoint x="1080" y="95" /><di:waypoint x="1240" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Anomalias_Oportunidades_di" bpmnElement="F_Anomalias_Oportunidades"><di:waypoint x="1240" y="395" /><di:waypoint x="1400" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Oportunidades_Gateway_di" bpmnElement="F_Oportunidades_Gateway"><di:waypoint x="1400" y="395" /><di:waypoint x="1525" y="545" /></bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="F_Gateway_No_OK_di" bpmnElement="F_Gateway_No_OK"><di:waypoint x="1525" y="545" /><di:waypoint x="1720" y="545" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_OK_End_di" bpmnElement="F_OK_End"><di:waypoint x="1720" y="545" /><di:waypoint x="1838" y="545" /></bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="F_Gateway_Yes_Classificar_di" bpmnElement="F_Gateway_Yes_Classificar"><di:waypoint x="1525" y="545" /><di:waypoint x="1720" y="545" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Classificar_Registrar_di" bpmnElement="F_Classificar_Registrar"><di:waypoint x="1720" y="545" /><di:waypoint x="1880" y="545" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Registrar_CriarTarefa_di" bpmnElement="F_Registrar_CriarTarefa"><di:waypoint x="1880" y="545" /><di:waypoint x="2040" y="545" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_CriarTarefa_End_di" bpmnElement="F_CriarTarefa_End"><di:waypoint x="2040" y="545" /><di:waypoint x="2158" y="545" /></bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

const phases = [
  { name: 'Coleta & Visao Macro', x: 80, width: 640 },
  { name: 'Analise Detalhada', x: 720, width: 640 },
  { name: 'Decisao & Registro', x: 1360, width: 640 },
  { name: 'Handoff para Acao', x: 2000, width: 1150 }
];

const config = {
  zoom: 0.9,
  storageKey: 'subprocesso-5.1',
  startLabel: 'CAMPANHAS ATIVAS',
  endLabels: {
    End_SemAcao: { text: 'FIM SEM ACAO', className: 'end-label-lost' },
    End_ComRegistro: { text: 'FIM COM REGISTRO', className: 'end-label-success', marker: 'end-success' }
  },
  showDefaultEndLabel: false,
  useEndName: false,
  defaultEndLabelText: 'FIM',
  defaultEndClass: 'end-label-lost'
};

window.v5Data = window.v5Data || {};
window.v5Data['5.1'] = { diagramXML, nodeDetails, phases, ...config };
