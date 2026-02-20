const nodeDetails = {
  'Task_G_ValidarNecessidade': { sla: null, tag: 'Validacao', desc: 'Valida necessidade do teste.' },
  'Task_G_ChecarGovernanca': { sla: null, tag: 'Governanca', desc: 'Checa testes em andamento.' },
  'Task_G_CriarHipotese': { sla: null, tag: 'Hipotese', desc: 'Cria hipotese estruturada.' },
  'Task_G_DefinirAmostra': { sla: null, tag: 'Planejamento', desc: 'Define amostra e duracao.' },
  'Task_G_CriarVariacoes': { sla: null, tag: 'Variacoes', desc: 'Cria variacoes A/B.' },
  'Task_G_ChecklistTecnico': { sla: null, tag: 'Checklist', desc: 'Valida configuracao tecnica.' },
  'Task_G_MonitorarTeste': { sla: 'Diario', tag: 'Monitorar', desc: 'Monitora desempenho do teste.' },
  'Gateway_Significativo': { sla: null, tag: 'Decisao', desc: 'Teste significativo?' },
  'Task_G_ContinuarMonitoramento': { sla: null, tag: 'Loop', desc: 'Continua monitoramento.' },
  'Task_G_ImplementarVencedor': { sla: null, tag: 'Vencedor', desc: 'Implementa variacao vencedora.' },
  'Task_G_DocumentarAprendizados': { sla: null, tag: 'Aprendizado', desc: 'Documenta aprendizados.' },
  'Task_G_RegistrarBiblioteca': { sla: null, tag: 'Biblioteca', desc: 'Registra na biblioteca de testes.' },
  'Task_I_EstimarAmostra': { sla: null, tag: 'IA', desc: 'Estima amostra e duracao.' },
  'Task_I_MonitorarAlertar': { sla: null, tag: 'IA', desc: 'Monitora e alerta.' },
  'Task_I_CalcularSignificancia': { sla: null, tag: 'Estatistica', desc: 'Calcula significancia.' },
  'Task_I_SugerirProximos': { sla: null, tag: 'IA', desc: 'Sugere proximos testes.' },
  'Task_P_AplicarSetup': { sla: null, tag: 'Aplicar', desc: 'Aplica setup do teste.' },
  'Task_BI_ConsolidarDados': { sla: null, tag: 'BI', desc: 'Consolida dados do teste.' },
  'Task_BI_ArquivarTeste': { sla: null, tag: 'Arquivar', desc: 'Arquiva teste e relatorios.' }
};

const diagramXML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_53_V5" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_53_V5">
    <bpmn:participant id="Participant_53_V5" name="Testes A/B" processRef="Process_53_V5" />
  </bpmn:collaboration>
  <bpmn:process id="Process_53_V5" isExecutable="false">
    <bpmn:laneSet id="LaneSet_53_V5">
      <bpmn:lane id="Lane_Gestor" name="Gestor de Trafego">
        <bpmn:flowNodeRef>Start_Oportunidade</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_G_ValidarNecessidade</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_G_ChecarGovernanca</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_G_CriarHipotese</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_G_DefinirAmostra</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_G_CriarVariacoes</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_G_ChecklistTecnico</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_G_MonitorarTeste</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_Significativo</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_G_ContinuarMonitoramento</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_G_ImplementarVencedor</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_G_DocumentarAprendizados</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_G_RegistrarBiblioteca</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_TestesConcluidos</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_IA" name="IA &amp; Estatistica">
        <bpmn:flowNodeRef>Task_I_EstimarAmostra</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_MonitorarAlertar</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_CalcularSignificancia</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_SugerirProximos</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Plataformas" name="Plataformas &amp; BI">
        <bpmn:flowNodeRef>Task_P_AplicarSetup</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_BI_ConsolidarDados</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_BI_ArquivarTeste</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>

    <bpmn:startEvent id="Start_Oportunidade" name="Oportunidade de Teste A/B" />
    <bpmn:task id="Task_G_ValidarNecessidade" name="Validar Necessidade do Teste" />
    <bpmn:task id="Task_G_ChecarGovernanca" name="Checar Testes em Andamento" />
    <bpmn:task id="Task_G_CriarHipotese" name="Criar Hipotese Estruturada" />
    <bpmn:task id="Task_I_EstimarAmostra" name="Estimar Amostra e Duracao" />
    <bpmn:task id="Task_G_DefinirAmostra" name="Definir Amostra e Duracao" />
    <bpmn:task id="Task_G_CriarVariacoes" name="Criar Variacoes do Teste" />
    <bpmn:task id="Task_P_AplicarSetup" name="Aplicar Setup do Teste" />
    <bpmn:task id="Task_G_ChecklistTecnico" name="Validar Configuracao Tecnica" />
    <bpmn:task id="Task_G_MonitorarTeste" name="Monitorar Desempenho do Teste" />
    <bpmn:task id="Task_I_MonitorarAlertar" name="Monitorar e Alertar" />
    <bpmn:task id="Task_I_CalcularSignificancia" name="Calcular Significancia" />
    <bpmn:exclusiveGateway id="Gateway_Significativo" name="Teste Significativo?" />
    <bpmn:task id="Task_G_ContinuarMonitoramento" name="Continuar Monitoramento" />
    <bpmn:task id="Task_G_ImplementarVencedor" name="Implementar Variacao Vencedora" />
    <bpmn:task id="Task_BI_ConsolidarDados" name="Consolidar Dados do Teste" />
    <bpmn:task id="Task_G_DocumentarAprendizados" name="Documentar Aprendizados" />
    <bpmn:task id="Task_G_RegistrarBiblioteca" name="Registrar na Biblioteca de Testes" />
    <bpmn:task id="Task_I_SugerirProximos" name="Sugerir Proximos Testes" />
    <bpmn:task id="Task_BI_ArquivarTeste" name="Arquivar Teste e Relatorios" />
    <bpmn:endEvent id="End_TestesConcluidos" name="Testes A/B Concluidos e Otimizados" />

    <bpmn:sequenceFlow id="F_Start_Validar" sourceRef="Start_Oportunidade" targetRef="Task_G_ValidarNecessidade" />
    <bpmn:sequenceFlow id="F_Validar_Governanca" sourceRef="Task_G_ValidarNecessidade" targetRef="Task_G_ChecarGovernanca" />
    <bpmn:sequenceFlow id="F_Governanca_Hipotese" sourceRef="Task_G_ChecarGovernanca" targetRef="Task_G_CriarHipotese" />
    <bpmn:sequenceFlow id="F_Hipotese_Estimar" sourceRef="Task_G_CriarHipotese" targetRef="Task_I_EstimarAmostra" />
    <bpmn:sequenceFlow id="F_Estimar_Definir" sourceRef="Task_I_EstimarAmostra" targetRef="Task_G_DefinirAmostra" />
    <bpmn:sequenceFlow id="F_Definir_Variacoes" sourceRef="Task_G_DefinirAmostra" targetRef="Task_G_CriarVariacoes" />
    <bpmn:sequenceFlow id="F_Variacoes_Aplicar" sourceRef="Task_G_CriarVariacoes" targetRef="Task_P_AplicarSetup" />
    <bpmn:sequenceFlow id="F_Aplicar_Checklist" sourceRef="Task_P_AplicarSetup" targetRef="Task_G_ChecklistTecnico" />
    <bpmn:sequenceFlow id="F_Checklist_Monitorar" sourceRef="Task_G_ChecklistTecnico" targetRef="Task_G_MonitorarTeste" />
    <bpmn:sequenceFlow id="F_Monitorar_IA" sourceRef="Task_G_MonitorarTeste" targetRef="Task_I_MonitorarAlertar" />
    <bpmn:sequenceFlow id="F_IA_Significancia" sourceRef="Task_I_MonitorarAlertar" targetRef="Task_I_CalcularSignificancia" />
    <bpmn:sequenceFlow id="F_Significancia_Gateway" sourceRef="Task_I_CalcularSignificancia" targetRef="Gateway_Significativo" />

    <bpmn:sequenceFlow id="F_Gateway_Nao_Continuar" name="Nao" sourceRef="Gateway_Significativo" targetRef="Task_G_ContinuarMonitoramento" />
    <bpmn:sequenceFlow id="F_Continuar_Monitorar" sourceRef="Task_G_ContinuarMonitoramento" targetRef="Task_G_MonitorarTeste" />

    <bpmn:sequenceFlow id="F_Gateway_Sim_Implementar" name="Sim" sourceRef="Gateway_Significativo" targetRef="Task_G_ImplementarVencedor" />
    <bpmn:sequenceFlow id="F_Implementar_Consolidar" sourceRef="Task_G_ImplementarVencedor" targetRef="Task_BI_ConsolidarDados" />
    <bpmn:sequenceFlow id="F_Consolidar_Documentar" sourceRef="Task_BI_ConsolidarDados" targetRef="Task_G_DocumentarAprendizados" />
    <bpmn:sequenceFlow id="F_Documentar_Biblioteca" sourceRef="Task_G_DocumentarAprendizados" targetRef="Task_G_RegistrarBiblioteca" />
    <bpmn:sequenceFlow id="F_Biblioteca_SugerirProximos" sourceRef="Task_G_RegistrarBiblioteca" targetRef="Task_I_SugerirProximos" />
    <bpmn:sequenceFlow id="F_Sugerir_Arquivar" sourceRef="Task_I_SugerirProximos" targetRef="Task_BI_ArquivarTeste" />
    <bpmn:sequenceFlow id="F_Arquivar_End" sourceRef="Task_BI_ArquivarTeste" targetRef="End_TestesConcluidos" />
  </bpmn:process>

  <bpmndi:BPMNDiagram id="BPMNDiagram_53_V5">
    <bpmndi:BPMNPlane id="BPMNPlane_53_V5" bpmnElement="Collaboration_53_V5">
      <bpmndi:BPMNShape id="Participant_53_V5_di" bpmnElement="Participant_53_V5" isHorizontal="true"><dc:Bounds x="50" y="20" width="3200" height="600" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Gestor_di" bpmnElement="Lane_Gestor" isHorizontal="true"><dc:Bounds x="80" y="20" width="3170" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_IA_di" bpmnElement="Lane_IA" isHorizontal="true"><dc:Bounds x="80" y="170" width="3170" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Plataformas_di" bpmnElement="Lane_Plataformas" isHorizontal="true"><dc:Bounds x="80" y="320" width="3170" height="150" /></bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Start_Oportunidade_di" bpmnElement="Start_Oportunidade"><dc:Bounds x="120" y="77" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_G_ValidarNecessidade_di" bpmnElement="Task_G_ValidarNecessidade"><dc:Bounds x="220" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_G_ChecarGovernanca_di" bpmnElement="Task_G_ChecarGovernanca"><dc:Bounds x="380" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_G_CriarHipotese_di" bpmnElement="Task_G_CriarHipotese"><dc:Bounds x="540" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_EstimarAmostra_di" bpmnElement="Task_I_EstimarAmostra"><dc:Bounds x="700" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_G_DefinirAmostra_di" bpmnElement="Task_G_DefinirAmostra"><dc:Bounds x="860" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_G_CriarVariacoes_di" bpmnElement="Task_G_CriarVariacoes"><dc:Bounds x="1020" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_P_AplicarSetup_di" bpmnElement="Task_P_AplicarSetup"><dc:Bounds x="1180" y="355" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_G_ChecklistTecnico_di" bpmnElement="Task_G_ChecklistTecnico"><dc:Bounds x="1340" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_G_MonitorarTeste_di" bpmnElement="Task_G_MonitorarTeste"><dc:Bounds x="1500" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_MonitorarAlertar_di" bpmnElement="Task_I_MonitorarAlertar"><dc:Bounds x="1660" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_CalcularSignificancia_di" bpmnElement="Task_I_CalcularSignificancia"><dc:Bounds x="1820" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_Significativo_di" bpmnElement="Gateway_Significativo" isMarkerVisible="true"><dc:Bounds x="1980" y="70" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_G_ContinuarMonitoramento_di" bpmnElement="Task_G_ContinuarMonitoramento"><dc:Bounds x="2140" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_G_ImplementarVencedor_di" bpmnElement="Task_G_ImplementarVencedor"><dc:Bounds x="2140" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_BI_ConsolidarDados_di" bpmnElement="Task_BI_ConsolidarDados"><dc:Bounds x="2300" y="355" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_G_DocumentarAprendizados_di" bpmnElement="Task_G_DocumentarAprendizados"><dc:Bounds x="2460" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_G_RegistrarBiblioteca_di" bpmnElement="Task_G_RegistrarBiblioteca"><dc:Bounds x="2620" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_SugerirProximos_di" bpmnElement="Task_I_SugerirProximos"><dc:Bounds x="2780" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_BI_ArquivarTeste_di" bpmnElement="Task_BI_ArquivarTeste"><dc:Bounds x="2940" y="355" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_TestesConcluidos_di" bpmnElement="End_TestesConcluidos"><dc:Bounds x="3100" y="77" width="36" height="36" /></bpmndi:BPMNShape>

      <bpmndi:BPMNEdge id="F_Start_Validar_di" bpmnElement="F_Start_Validar"><di:waypoint x="138" y="95" /><di:waypoint x="280" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Validar_Governanca_di" bpmnElement="F_Validar_Governanca"><di:waypoint x="280" y="95" /><di:waypoint x="440" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Governanca_Hipotese_di" bpmnElement="F_Governanca_Hipotese"><di:waypoint x="440" y="95" /><di:waypoint x="600" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Hipotese_Estimar_di" bpmnElement="F_Hipotese_Estimar"><di:waypoint x="600" y="95" /><di:waypoint x="760" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Estimar_Definir_di" bpmnElement="F_Estimar_Definir"><di:waypoint x="760" y="245" /><di:waypoint x="920" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Definir_Variacoes_di" bpmnElement="F_Definir_Variacoes"><di:waypoint x="920" y="95" /><di:waypoint x="1080" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Variacoes_Aplicar_di" bpmnElement="F_Variacoes_Aplicar"><di:waypoint x="1080" y="95" /><di:waypoint x="1240" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Aplicar_Checklist_di" bpmnElement="F_Aplicar_Checklist"><di:waypoint x="1240" y="395" /><di:waypoint x="1400" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Checklist_Monitorar_di" bpmnElement="F_Checklist_Monitorar"><di:waypoint x="1400" y="95" /><di:waypoint x="1560" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Monitorar_IA_di" bpmnElement="F_Monitorar_IA"><di:waypoint x="1560" y="95" /><di:waypoint x="1720" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_IA_Significancia_di" bpmnElement="F_IA_Significancia"><di:waypoint x="1720" y="245" /><di:waypoint x="1880" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Significancia_Gateway_di" bpmnElement="F_Significancia_Gateway"><di:waypoint x="1880" y="245" /><di:waypoint x="2005" y="95" /></bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="F_Gateway_Nao_Continuar_di" bpmnElement="F_Gateway_Nao_Continuar"><di:waypoint x="2005" y="95" /><di:waypoint x="2200" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Continuar_Monitorar_di" bpmnElement="F_Continuar_Monitorar"><di:waypoint x="2200" y="95" /><di:waypoint x="1560" y="95" /></bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="F_Gateway_Sim_Implementar_di" bpmnElement="F_Gateway_Sim_Implementar"><di:waypoint x="2005" y="95" /><di:waypoint x="2200" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Implementar_Consolidar_di" bpmnElement="F_Implementar_Consolidar"><di:waypoint x="2200" y="95" /><di:waypoint x="2360" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Consolidar_Documentar_di" bpmnElement="F_Consolidar_Documentar"><di:waypoint x="2360" y="395" /><di:waypoint x="2520" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Documentar_Biblioteca_di" bpmnElement="F_Documentar_Biblioteca"><di:waypoint x="2520" y="95" /><di:waypoint x="2680" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Biblioteca_Sugerir_di" bpmnElement="F_Biblioteca_Sugerir"><di:waypoint x="2680" y="95" /><di:waypoint x="2840" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Sugerir_Arquivar_di" bpmnElement="F_Sugerir_Arquivar"><di:waypoint x="2840" y="245" /><di:waypoint x="3000" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Arquivar_End_di" bpmnElement="F_Arquivar_End"><di:waypoint x="3000" y="395" /><di:waypoint x="3118" y="95" /></bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

const phases = [
  { name: 'Planejamento', x: 80, width: 640 },
  { name: 'Configuracao & Execucao', x: 720, width: 640 },
  { name: 'Analise', x: 1360, width: 640 },
  { name: 'Implementacao & Aprendizado', x: 2000, width: 1250 }
];

const config = {
  zoom: 0.9,
  storageKey: 'subprocesso-5.3',
  startLabel: 'OPORTUNIDADE DE TESTE A/B',
  endLabels: {
    End_TestesConcluidos: { text: 'TESTES A/B CONCLUIDOS', className: 'end-label-success', marker: 'end-success' }
  },
  showDefaultEndLabel: false,
  useEndName: false,
  defaultEndLabelText: 'FIM',
  defaultEndClass: 'end-label-lost'
};

window.v5Data = window.v5Data || {};
window.v5Data['5.3'] = { diagramXML, nodeDetails, phases, ...config };
