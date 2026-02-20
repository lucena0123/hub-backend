const nodeDetails = {
  'Task_G_RevisarOcorrencia': { sla: null, tag: 'Analise', desc: 'Revisar contexto e ocorrencia.' },
  'Task_G_AnaliseDetalhada': { sla: null, tag: 'Deep Dive', desc: 'Analise detalhada de performance.' },
  'Task_I_SugerirOtimizacao': { sla: null, tag: 'IA', desc: 'Sugere otimizacoes de lance e budget.' },
  'Task_G_EscolherEstrategia': { sla: '2h/24h', tag: 'Decisao', desc: 'Escolhe estrategia de otimizacao.' },
  'Task_G_AjustarLances': { sla: null, tag: 'Lance', desc: 'Ajusta lances incrementalmente.' },
  'Task_G_RedistribuirOrcamento': { sla: null, tag: 'Budget', desc: 'Redistribui orcamento.' },
  'Task_P_AplicarAjustes': { sla: null, tag: 'Aplicar', desc: 'Aplica ajustes nas plataformas.' },
  'Task_I_EscalaAutomatizada': { sla: null, tag: 'Auto', desc: 'Escala automatizada por regras.' },
  'Task_G_RegistrarOtimizacao': { sla: null, tag: 'Log', desc: 'Registra otimizacao.' },
  'Task_G_DefinirReavaliacao': { sla: null, tag: 'Follow-up', desc: 'Define reavaliacao.' },
  'Task_BI_GravarHistorico': { sla: null, tag: 'Historico', desc: 'Grava antes/depois.' }
};

const diagramXML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_52_V5" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_52_V5">
    <bpmn:participant id="Participant_52_V5" name="Otimizacao de Lances e Orcamento" processRef="Process_52_V5" />
  </bpmn:collaboration>
  <bpmn:process id="Process_52_V5" isExecutable="false">
    <bpmn:laneSet id="LaneSet_52_V5">
      <bpmn:lane id="Lane_Gestor" name="Gestor de Trafego">
        <bpmn:flowNodeRef>Start_Anomalia</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_G_RevisarOcorrencia</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_G_AnaliseDetalhada</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_G_EscolherEstrategia</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_G_AjustarLances</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_G_RedistribuirOrcamento</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_G_RegistrarOtimizacao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_G_DefinirReavaliacao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_OtimizacaoConcluida</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_IA" name="IA de Otimizacao">
        <bpmn:flowNodeRef>Task_I_SugerirOtimizacao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_EscalaAutomatizada</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Plataformas" name="Plataformas (Meta/Google)">
        <bpmn:flowNodeRef>Task_P_AplicarAjustes</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_BI" name="BI / Dashboards">
        <bpmn:flowNodeRef>Task_BI_GravarHistorico</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>

    <bpmn:startEvent id="Start_Anomalia" name="Anomalia/Oportunidade" />
    <bpmn:task id="Task_G_RevisarOcorrencia" name="Revisar Ocorrencia" />
    <bpmn:task id="Task_G_AnaliseDetalhada" name="Analise Detalhada" />
    <bpmn:task id="Task_I_SugerirOtimizacao" name="IA Sugerir Otimizacao" />
    <bpmn:task id="Task_G_EscolherEstrategia" name="Escolher Estrategia" />
    <bpmn:task id="Task_G_AjustarLances" name="Ajustar Lances" />
    <bpmn:task id="Task_G_RedistribuirOrcamento" name="Redistribuir Orcamento" />
    <bpmn:task id="Task_P_AplicarAjustes" name="Aplicar Ajustes nas Campanhas" />
    <bpmn:task id="Task_I_EscalaAutomatizada" name="Escala Automatizada" />
    <bpmn:task id="Task_BI_GravarHistorico" name="Gravar Antes/Depois" />
    <bpmn:task id="Task_G_RegistrarOtimizacao" name="Registrar Otimizacao" />
    <bpmn:task id="Task_G_DefinirReavaliacao" name="Definir Reavaliacao" />
    <bpmn:endEvent id="End_OtimizacaoConcluida" name="Lances e Orcamento Otimizados" />

    <bpmn:sequenceFlow id="F_Start_Revisar" sourceRef="Start_Anomalia" targetRef="Task_G_RevisarOcorrencia" />
    <bpmn:sequenceFlow id="F_Revisar_Analise" sourceRef="Task_G_RevisarOcorrencia" targetRef="Task_G_AnaliseDetalhada" />
    <bpmn:sequenceFlow id="F_Analise_IA" sourceRef="Task_G_AnaliseDetalhada" targetRef="Task_I_SugerirOtimizacao" />
    <bpmn:sequenceFlow id="F_IA_Estrategia" sourceRef="Task_I_SugerirOtimizacao" targetRef="Task_G_EscolherEstrategia" />
    <bpmn:sequenceFlow id="F_Estrategia_Lances" sourceRef="Task_G_EscolherEstrategia" targetRef="Task_G_AjustarLances" />
    <bpmn:sequenceFlow id="F_Lances_Budget" sourceRef="Task_G_AjustarLances" targetRef="Task_G_RedistribuirOrcamento" />
    <bpmn:sequenceFlow id="F_Budget_Aplicar" sourceRef="Task_G_RedistribuirOrcamento" targetRef="Task_P_AplicarAjustes" />
    <bpmn:sequenceFlow id="F_Aplicar_Escala" sourceRef="Task_P_AplicarAjustes" targetRef="Task_I_EscalaAutomatizada" />
    <bpmn:sequenceFlow id="F_Escala_Historico" sourceRef="Task_I_EscalaAutomatizada" targetRef="Task_BI_GravarHistorico" />
    <bpmn:sequenceFlow id="F_Historico_Registrar" sourceRef="Task_BI_GravarHistorico" targetRef="Task_G_RegistrarOtimizacao" />
    <bpmn:sequenceFlow id="F_Registrar_Reavaliacao" sourceRef="Task_G_RegistrarOtimizacao" targetRef="Task_G_DefinirReavaliacao" />
    <bpmn:sequenceFlow id="F_Reavaliacao_End" sourceRef="Task_G_DefinirReavaliacao" targetRef="End_OtimizacaoConcluida" />
  </bpmn:process>

  <bpmndi:BPMNDiagram id="BPMNDiagram_52_V5">
    <bpmndi:BPMNPlane id="BPMNPlane_52_V5" bpmnElement="Collaboration_52_V5">
      <bpmndi:BPMNShape id="Participant_52_V5_di" bpmnElement="Participant_52_V5" isHorizontal="true"><dc:Bounds x="50" y="20" width="3000" height="650" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Gestor_di" bpmnElement="Lane_Gestor" isHorizontal="true"><dc:Bounds x="80" y="20" width="2970" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_IA_di" bpmnElement="Lane_IA" isHorizontal="true"><dc:Bounds x="80" y="170" width="2970" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Plataformas_di" bpmnElement="Lane_Plataformas" isHorizontal="true"><dc:Bounds x="80" y="320" width="2970" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_BI_di" bpmnElement="Lane_BI" isHorizontal="true"><dc:Bounds x="80" y="470" width="2970" height="150" /></bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Start_Anomalia_di" bpmnElement="Start_Anomalia"><dc:Bounds x="120" y="77" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_G_RevisarOcorrencia_di" bpmnElement="Task_G_RevisarOcorrencia"><dc:Bounds x="220" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_G_AnaliseDetalhada_di" bpmnElement="Task_G_AnaliseDetalhada"><dc:Bounds x="380" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_SugerirOtimizacao_di" bpmnElement="Task_I_SugerirOtimizacao"><dc:Bounds x="540" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_G_EscolherEstrategia_di" bpmnElement="Task_G_EscolherEstrategia"><dc:Bounds x="700" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_G_AjustarLances_di" bpmnElement="Task_G_AjustarLances"><dc:Bounds x="860" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_G_RedistribuirOrcamento_di" bpmnElement="Task_G_RedistribuirOrcamento"><dc:Bounds x="1020" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_P_AplicarAjustes_di" bpmnElement="Task_P_AplicarAjustes"><dc:Bounds x="1180" y="355" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_EscalaAutomatizada_di" bpmnElement="Task_I_EscalaAutomatizada"><dc:Bounds x="1340" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_BI_GravarHistorico_di" bpmnElement="Task_BI_GravarHistorico"><dc:Bounds x="1500" y="505" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_G_RegistrarOtimizacao_di" bpmnElement="Task_G_RegistrarOtimizacao"><dc:Bounds x="1660" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_G_DefinirReavaliacao_di" bpmnElement="Task_G_DefinirReavaliacao"><dc:Bounds x="1820" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_OtimizacaoConcluida_di" bpmnElement="End_OtimizacaoConcluida"><dc:Bounds x="1980" y="77" width="36" height="36" /></bpmndi:BPMNShape>

      <bpmndi:BPMNEdge id="F_Start_Revisar_di" bpmnElement="F_Start_Revisar"><di:waypoint x="138" y="95" /><di:waypoint x="280" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Revisar_Analise_di" bpmnElement="F_Revisar_Analise"><di:waypoint x="280" y="95" /><di:waypoint x="440" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Analise_IA_di" bpmnElement="F_Analise_IA"><di:waypoint x="440" y="95" /><di:waypoint x="600" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_IA_Estrategia_di" bpmnElement="F_IA_Estrategia"><di:waypoint x="600" y="245" /><di:waypoint x="760" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Estrategia_Lances_di" bpmnElement="F_Estrategia_Lances"><di:waypoint x="760" y="95" /><di:waypoint x="920" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Lances_Budget_di" bpmnElement="F_Lances_Budget"><di:waypoint x="920" y="95" /><di:waypoint x="1080" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Budget_Aplicar_di" bpmnElement="F_Budget_Aplicar"><di:waypoint x="1080" y="95" /><di:waypoint x="1240" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Aplicar_Escala_di" bpmnElement="F_Aplicar_Escala"><di:waypoint x="1240" y="395" /><di:waypoint x="1400" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Escala_Historico_di" bpmnElement="F_Escala_Historico"><di:waypoint x="1400" y="245" /><di:waypoint x="1560" y="545" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Historico_Registrar_di" bpmnElement="F_Historico_Registrar"><di:waypoint x="1560" y="545" /><di:waypoint x="1720" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Registrar_Reavaliacao_di" bpmnElement="F_Registrar_Reavaliacao"><di:waypoint x="1720" y="95" /><di:waypoint x="1880" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Reavaliacao_End_di" bpmnElement="F_Reavaliacao_End"><di:waypoint x="1880" y="95" /><di:waypoint x="1998" y="95" /></bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

const phases = [
  { name: 'Analise da Ocorrencia', x: 80, width: 640 },
  { name: 'Decisao', x: 720, width: 640 },
  { name: 'Execucao', x: 1360, width: 640 },
  { name: 'Validacao & Registro', x: 2000, width: 1050 }
];

const config = {
  zoom: 0.9,
  storageKey: 'subprocesso-5.2',
  startLabel: 'ANOMALIA / OPORTUNIDADE',
  endLabels: {
    End_OtimizacaoConcluida: { text: 'LANCES E ORCAMENTO OTIMIZADOS', className: 'end-label-success', marker: 'end-success' }
  },
  showDefaultEndLabel: false,
  useEndName: false,
  defaultEndLabelText: 'FIM',
  defaultEndClass: 'end-label-lost'
};

window.v5Data = window.v5Data || {};
window.v5Data['5.2'] = { diagramXML, nodeDetails, phases, ...config };
