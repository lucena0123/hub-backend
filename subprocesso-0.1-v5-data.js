const nodeDetails = {
  'Task_S_DefinirOferta': { sla: 'Trimestral', tag: 'Oferta', desc: 'Define oferta, promessa e diferenciais.' },
  'Task_S_DefinirICP': { sla: 'Mensal', tag: 'ICP', desc: 'Define ICP e nicho-alvo.' },
  'Task_M_DefinirCanais': { sla: 'Mensal', tag: 'Canais', desc: 'Define canais de aquisicao.' },
  'Task_M_ConfigurarFontes': { sla: 'Semanal', tag: 'Fontes', desc: 'Configura fontes de lead e UTMs.' },
  'Task_R_DefinirModeloDados': { sla: 'Onboarding', tag: 'Dados', desc: 'Define modelo de dados do lead.' },
  'Task_R_ConfigurarCRM': { sla: 'Onboarding', tag: 'CRM', desc: 'Configura CRM e pipeline.' },
  'Task_A_ConfigurarIntegracoes': { sla: 'Onboarding', tag: 'Integracoes', desc: 'Configura integracoes e testes.' },
  'Task_I_DefinirRegrasIA': { sla: 'Trimestral', tag: 'IA', desc: 'Define regras de qualificacao IA.' },
  'Task_I_ConfigurarPipelineIA': { sla: null, tag: 'Feedback', desc: 'Configura pipeline IA e feedback.' },
  'Task_J_ValidarTemplate': { sla: 'Onboarding', tag: 'LGPD', desc: 'Valida template de lead e consentimento.' }
};

const diagramXML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_01_V5" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_01_V5">
    <bpmn:participant id="Participant_01_V5" name="Pre-SDR - Dados e Estrategia" processRef="Process_01_V5" />
  </bpmn:collaboration>
  <bpmn:process id="Process_01_V5" isExecutable="false">
    <bpmn:laneSet id="LaneSet_01_V5">
      <bpmn:lane id="Lane_Estrategia" name="Estrategia / Direcao">
        <bpmn:flowNodeRef>Start_PreSDR</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_DefinirOferta</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_DefinirICP</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Marketing" name="Marketing / Trafego">
        <bpmn:flowNodeRef>Task_M_DefinirCanais</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_M_ConfigurarFontes</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_RevOps" name="RevOps / CRM e Dados">
        <bpmn:flowNodeRef>Task_R_DefinirModeloDados</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_R_ConfigurarCRM</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_ConfigurarIntegracoes</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_IA" name="IA e Automacao">
        <bpmn:flowNodeRef>Task_I_DefinirRegrasIA</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_ConfigurarPipelineIA</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Juridico" name="Juridico / DPO">
        <bpmn:flowNodeRef>Task_J_ValidarTemplate</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_LeadsProntos</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>

    <bpmn:startEvent id="Start_PreSDR" name="Inicio Pre-SDR" />
    <bpmn:task id="Task_S_DefinirOferta" name="Definir Oferta e PV" />
    <bpmn:task id="Task_S_DefinirICP" name="Definir ICP e Nicho" />
    <bpmn:task id="Task_M_DefinirCanais" name="Definir Canais de Aquisicao" />
    <bpmn:task id="Task_M_ConfigurarFontes" name="Configurar Fontes de Lead" />
    <bpmn:task id="Task_R_DefinirModeloDados" name="Definir Modelo de Dados do Lead" />
    <bpmn:task id="Task_R_ConfigurarCRM" name="Configurar CRM e Pipeline" />
    <bpmn:task id="Task_A_ConfigurarIntegracoes" name="Configurar Integracoes" />
    <bpmn:task id="Task_I_DefinirRegrasIA" name="Definir Regras de Qualificacao IA" />
    <bpmn:task id="Task_I_ConfigurarPipelineIA" name="Configurar Pipeline IA e Feedback" />
    <bpmn:task id="Task_J_ValidarTemplate" name="Validar Template de Lead" />
    <bpmn:endEvent id="End_LeadsProntos" name="Leads Prontos para SDR" />

    <bpmn:sequenceFlow id="F_Start_Oferta" sourceRef="Start_PreSDR" targetRef="Task_S_DefinirOferta" />
    <bpmn:sequenceFlow id="F_Oferta_ICP" sourceRef="Task_S_DefinirOferta" targetRef="Task_S_DefinirICP" />
    <bpmn:sequenceFlow id="F_ICP_Canais" sourceRef="Task_S_DefinirICP" targetRef="Task_M_DefinirCanais" />
    <bpmn:sequenceFlow id="F_Canais_Fontes" sourceRef="Task_M_DefinirCanais" targetRef="Task_M_ConfigurarFontes" />
    <bpmn:sequenceFlow id="F_Fontes_Modelo" sourceRef="Task_M_ConfigurarFontes" targetRef="Task_R_DefinirModeloDados" />
    <bpmn:sequenceFlow id="F_Modelo_CRM" sourceRef="Task_R_DefinirModeloDados" targetRef="Task_R_ConfigurarCRM" />
    <bpmn:sequenceFlow id="F_CRM_Integracoes" sourceRef="Task_R_ConfigurarCRM" targetRef="Task_A_ConfigurarIntegracoes" />
    <bpmn:sequenceFlow id="F_Integracoes_RegrasIA" sourceRef="Task_A_ConfigurarIntegracoes" targetRef="Task_I_DefinirRegrasIA" />
    <bpmn:sequenceFlow id="F_RegrasIA_Pipeline" sourceRef="Task_I_DefinirRegrasIA" targetRef="Task_I_ConfigurarPipelineIA" />
    <bpmn:sequenceFlow id="F_Pipeline_Validar" sourceRef="Task_I_ConfigurarPipelineIA" targetRef="Task_J_ValidarTemplate" />
    <bpmn:sequenceFlow id="F_Validar_End" sourceRef="Task_J_ValidarTemplate" targetRef="End_LeadsProntos" />
  </bpmn:process>

  <bpmndi:BPMNDiagram id="BPMNDiagram_01_V5">
    <bpmndi:BPMNPlane id="BPMNPlane_01_V5" bpmnElement="Collaboration_01_V5">
      <bpmndi:BPMNShape id="Participant_01_V5_di" bpmnElement="Participant_01_V5" isHorizontal="true"><dc:Bounds x="50" y="20" width="3000" height="750" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Estrategia_di" bpmnElement="Lane_Estrategia" isHorizontal="true"><dc:Bounds x="80" y="20" width="2970" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Marketing_di" bpmnElement="Lane_Marketing" isHorizontal="true"><dc:Bounds x="80" y="170" width="2970" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_RevOps_di" bpmnElement="Lane_RevOps" isHorizontal="true"><dc:Bounds x="80" y="320" width="2970" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_IA_di" bpmnElement="Lane_IA" isHorizontal="true"><dc:Bounds x="80" y="470" width="2970" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Juridico_di" bpmnElement="Lane_Juridico" isHorizontal="true"><dc:Bounds x="80" y="620" width="2970" height="150" /></bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Start_PreSDR_di" bpmnElement="Start_PreSDR"><dc:Bounds x="120" y="77" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_DefinirOferta_di" bpmnElement="Task_S_DefinirOferta"><dc:Bounds x="220" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_DefinirICP_di" bpmnElement="Task_S_DefinirICP"><dc:Bounds x="660" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_M_DefinirCanais_di" bpmnElement="Task_M_DefinirCanais"><dc:Bounds x="1180" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_M_ConfigurarFontes_di" bpmnElement="Task_M_ConfigurarFontes"><dc:Bounds x="1340" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_R_DefinirModeloDados_di" bpmnElement="Task_R_DefinirModeloDados"><dc:Bounds x="1820" y="355" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_R_ConfigurarCRM_di" bpmnElement="Task_R_ConfigurarCRM"><dc:Bounds x="1980" y="355" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_ConfigurarIntegracoes_di" bpmnElement="Task_A_ConfigurarIntegracoes"><dc:Bounds x="2140" y="355" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_DefinirRegrasIA_di" bpmnElement="Task_I_DefinirRegrasIA"><dc:Bounds x="2380" y="505" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_ConfigurarPipelineIA_di" bpmnElement="Task_I_ConfigurarPipelineIA"><dc:Bounds x="2540" y="505" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_J_ValidarTemplate_di" bpmnElement="Task_J_ValidarTemplate"><dc:Bounds x="2700" y="655" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_LeadsProntos_di" bpmnElement="End_LeadsProntos"><dc:Bounds x="2860" y="677" width="36" height="36" /></bpmndi:BPMNShape>

      <bpmndi:BPMNEdge id="F_Start_Oferta_di" bpmnElement="F_Start_Oferta"><di:waypoint x="138" y="95" /><di:waypoint x="280" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Oferta_ICP_di" bpmnElement="F_Oferta_ICP"><di:waypoint x="280" y="95" /><di:waypoint x="720" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_ICP_Canais_di" bpmnElement="F_ICP_Canais"><di:waypoint x="720" y="95" /><di:waypoint x="1240" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Canais_Fontes_di" bpmnElement="F_Canais_Fontes"><di:waypoint x="1240" y="245" /><di:waypoint x="1400" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Fontes_Modelo_di" bpmnElement="F_Fontes_Modelo"><di:waypoint x="1400" y="245" /><di:waypoint x="1880" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Modelo_CRM_di" bpmnElement="F_Modelo_CRM"><di:waypoint x="1880" y="395" /><di:waypoint x="2040" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_CRM_Integracoes_di" bpmnElement="F_CRM_Integracoes"><di:waypoint x="2040" y="395" /><di:waypoint x="2200" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Integracoes_RegrasIA_di" bpmnElement="F_Integracoes_RegrasIA"><di:waypoint x="2200" y="395" /><di:waypoint x="2440" y="545" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_RegrasIA_Pipeline_di" bpmnElement="F_RegrasIA_Pipeline"><di:waypoint x="2440" y="545" /><di:waypoint x="2600" y="545" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Pipeline_Validar_di" bpmnElement="F_Pipeline_Validar"><di:waypoint x="2600" y="545" /><di:waypoint x="2760" y="695" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Validar_End_di" bpmnElement="F_Validar_End"><di:waypoint x="2760" y="695" /><di:waypoint x="2878" y="695" /></bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

const phases = [
  { name: 'Estrategia & Oferta', x: 80, width: 560 },
  { name: 'ICP & Nicho', x: 640, width: 560 },
  { name: 'Canais & Fontes', x: 1200, width: 560 },
  { name: 'Dados & CRM', x: 1760, width: 560 },
  { name: 'IA & Finalizacao', x: 2320, width: 680 }
];

const config = {
  zoom: 0.9,
  storageKey: 'subprocesso-0.1',
  startLabel: 'INICIO PRE-SDR',
  endLabels: {
    End_LeadsProntos: { text: 'LEADS PRONTOS PARA SDR', className: 'end-label-success', marker: 'end-success' }
  },
  showDefaultEndLabel: false,
  useEndName: false,
  defaultEndLabelText: 'FIM',
  defaultEndClass: 'end-label-lost'
};

window.v5Data = window.v5Data || {};
window.v5Data['0.1'] = { diagramXML, nodeDetails, phases, ...config };
