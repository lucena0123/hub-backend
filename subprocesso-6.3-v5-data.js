const nodeDetails = {
  'Task_C_SolicitarAlinhamento': { sla: null, tag: 'Gatilho', desc: 'Cliente solicita reuniao de alinhamento.' },
  'Task_CS_RegistrarNecessidade': { sla: '4h', tag: 'Registro', desc: 'Registra necessidade no CRM.' },
  'Task_I_DetectarProativo': { sla: null, tag: 'IA', desc: 'Detecta necessidade proativa.' },
  'Task_CS_QualificarMotivo': { sla: null, tag: 'Qualificar', desc: 'Define motivo e urgencia.' },
  'Task_CS_DefinirObjetivo': { sla: null, tag: 'Meta', desc: 'Define objetivo do alinhamento.' },
  'Task_I_SugerirPauta': { sla: null, tag: 'Pauta', desc: 'Sugere pauta da reuniao.' },
  'Task_CS_AgendarReuniao': { sla: '48h', tag: 'Agenda', desc: 'Agenda reuniao com cliente e time.' },
  'Task_A_EnviarConvite': { sla: null, tag: 'Auto', desc: 'Envia convite e materiais.' },
  'Task_C_ReceberConvite': { sla: null, tag: 'Convite', desc: 'Cliente recebe convite e pauta.' },
  'Task_O_PrepararInsumos': { sla: null, tag: 'Insumos', desc: 'Prepara insumos tecnicos.' },
  'Task_CS_ConduzirReuniao': { sla: null, tag: 'Facilitar', desc: 'Conduz reuniao de alinhamento.' },
  'Task_C_ParticiparReuniao': { sla: null, tag: 'Reuniao', desc: 'Cliente participa do alinhamento.' },
  'Task_CS_RegistrarDecisoes': { sla: null, tag: 'Registro', desc: 'Registra decisoes e proximos passos.' },
  'Task_O_AvaliarImpacto': { sla: null, tag: 'Impacto', desc: 'Avalia impacto nas operacoes.' },
  'Task_I_GerarAta': { sla: null, tag: 'Ata IA', desc: 'Gera rascunho da ata.' },
  'Task_A_EnviarAta': { sla: null, tag: 'Ata', desc: 'Envia ata e follow-up.' },
  'Task_C_ValidarAta': { sla: null, tag: 'Confirmacao', desc: 'Cliente valida ata e proximos passos.' },
  'Task_A_GerarTarefas': { sla: null, tag: 'Tarefas', desc: 'Gera tarefas operacionais.' },
  'Task_G_AvaliarRisco': { sla: null, tag: 'Risco', desc: 'Avalia contas em risco.' },
  'Task_G_AtualizarPlano': { sla: null, tag: 'Plano', desc: 'Atualiza plano estrategico.' }
};

const diagramXML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_63_V5" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_63_V5">
    <bpmn:participant id="Participant_63_V5" name="Reunioes de Alinhamento" processRef="Process_63_V5" />
  </bpmn:collaboration>
  <bpmn:process id="Process_63_V5" isExecutable="false">
    <bpmn:laneSet id="LaneSet_63_V5">
      <bpmn:lane id="Lane_Cliente" name="Cliente">
        <bpmn:flowNodeRef>Start_Necessidade</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_C_SolicitarAlinhamento</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_C_ReceberConvite</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_C_ParticiparReuniao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_C_ValidarAta</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_CS" name="Atendimento / CS">
        <bpmn:flowNodeRef>Task_CS_RegistrarNecessidade</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_QualificarMotivo</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_DefinirObjetivo</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_AgendarReuniao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_EnviarConvite</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_ConduzirReuniao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_RegistrarDecisoes</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_EnviarAta</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_AlinhamentoConcluido</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Operacoes" name="Operacoes / Trafego">
        <bpmn:flowNodeRef>Task_O_PrepararInsumos</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_O_AvaliarImpacto</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_GerarTarefas</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_IA" name="IA &amp; Automacao">
        <bpmn:flowNodeRef>Task_I_DetectarProativo</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_SugerirPauta</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_GerarAta</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Gestao" name="Gestao / Planejamento">
        <bpmn:flowNodeRef>Task_G_AvaliarRisco</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_G_AtualizarPlano</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>

    <bpmn:startEvent id="Start_Necessidade" name="Necessidade de Alinhamento" />
    <bpmn:task id="Task_C_SolicitarAlinhamento" name="Solicitar Reuniao de Alinhamento" />
    <bpmn:task id="Task_CS_RegistrarNecessidade" name="Registrar Necessidade de Alinhamento" />
    <bpmn:task id="Task_I_DetectarProativo" name="Detectar Necessidade Proativa" />
    <bpmn:task id="Task_CS_QualificarMotivo" name="Qualificar Motivo e Urgencia" />
    <bpmn:task id="Task_CS_DefinirObjetivo" name="Definir Objetivo do Alinhamento" />
    <bpmn:task id="Task_I_SugerirPauta" name="Sugerir Pauta da Reuniao" />
    <bpmn:task id="Task_CS_AgendarReuniao" name="Agendar Reuniao de Alinhamento" />
    <bpmn:task id="Task_A_EnviarConvite" name="Enviar Convite e Materiais" />
    <bpmn:task id="Task_C_ReceberConvite" name="Receber Convite e Pauta" />
    <bpmn:task id="Task_O_PrepararInsumos" name="Preparar Insumos Tecnicos" />
    <bpmn:task id="Task_CS_ConduzirReuniao" name="Conduzir Reuniao de Alinhamento" />
    <bpmn:task id="Task_C_ParticiparReuniao" name="Participar do Alinhamento" />
    <bpmn:task id="Task_CS_RegistrarDecisoes" name="Registrar Decisoes e Proximos Passos" />
    <bpmn:task id="Task_O_AvaliarImpacto" name="Avaliar Impacto nas Operacoes" />
    <bpmn:task id="Task_I_GerarAta" name="Gerar Rascunho de Ata" />
    <bpmn:task id="Task_A_EnviarAta" name="Enviar Ata e Follow-up" />
    <bpmn:task id="Task_C_ValidarAta" name="Validar Ata e Proximos Passos" />
    <bpmn:task id="Task_A_GerarTarefas" name="Gerar Tarefas no ClickUp" />
    <bpmn:task id="Task_G_AvaliarRisco" name="Avaliar Contas em Risco" />
    <bpmn:task id="Task_G_AtualizarPlano" name="Atualizar Plano Estrategico" />
    <bpmn:endEvent id="End_AlinhamentoConcluido" name="Alinhamento Concluido" />

    <bpmn:sequenceFlow id="F_Start_Solicitar" sourceRef="Start_Necessidade" targetRef="Task_C_SolicitarAlinhamento" />
    <bpmn:sequenceFlow id="F_Solicitar_Registrar" sourceRef="Task_C_SolicitarAlinhamento" targetRef="Task_CS_RegistrarNecessidade" />
    <bpmn:sequenceFlow id="F_Registrar_IA" sourceRef="Task_CS_RegistrarNecessidade" targetRef="Task_I_DetectarProativo" />
    <bpmn:sequenceFlow id="F_IA_Qualificar" sourceRef="Task_I_DetectarProativo" targetRef="Task_CS_QualificarMotivo" />
    <bpmn:sequenceFlow id="F_Qualificar_Definir" sourceRef="Task_CS_QualificarMotivo" targetRef="Task_CS_DefinirObjetivo" />
    <bpmn:sequenceFlow id="F_Definir_Pauta" sourceRef="Task_CS_DefinirObjetivo" targetRef="Task_I_SugerirPauta" />
    <bpmn:sequenceFlow id="F_Pauta_Agendar" sourceRef="Task_I_SugerirPauta" targetRef="Task_CS_AgendarReuniao" />
    <bpmn:sequenceFlow id="F_Agendar_EnviarConvite" sourceRef="Task_CS_AgendarReuniao" targetRef="Task_A_EnviarConvite" />
    <bpmn:sequenceFlow id="F_EnviarConvite_Receber" sourceRef="Task_A_EnviarConvite" targetRef="Task_C_ReceberConvite" />
    <bpmn:sequenceFlow id="F_Receber_Insumos" sourceRef="Task_C_ReceberConvite" targetRef="Task_O_PrepararInsumos" />
    <bpmn:sequenceFlow id="F_Insumos_Conduzir" sourceRef="Task_O_PrepararInsumos" targetRef="Task_CS_ConduzirReuniao" />
    <bpmn:sequenceFlow id="F_Conduzir_Participar" sourceRef="Task_CS_ConduzirReuniao" targetRef="Task_C_ParticiparReuniao" />
    <bpmn:sequenceFlow id="F_Participar_Registrar" sourceRef="Task_C_ParticiparReuniao" targetRef="Task_CS_RegistrarDecisoes" />
    <bpmn:sequenceFlow id="F_Registrar_AvaliarImpacto" sourceRef="Task_CS_RegistrarDecisoes" targetRef="Task_O_AvaliarImpacto" />
    <bpmn:sequenceFlow id="F_AvaliarImpacto_GerarAta" sourceRef="Task_O_AvaliarImpacto" targetRef="Task_I_GerarAta" />
    <bpmn:sequenceFlow id="F_GerarAta_EnviarAta" sourceRef="Task_I_GerarAta" targetRef="Task_A_EnviarAta" />
    <bpmn:sequenceFlow id="F_EnviarAta_Validar" sourceRef="Task_A_EnviarAta" targetRef="Task_C_ValidarAta" />
    <bpmn:sequenceFlow id="F_Validar_Tarefas" sourceRef="Task_C_ValidarAta" targetRef="Task_A_GerarTarefas" />
    <bpmn:sequenceFlow id="F_Tarefas_AvaliarRisco" sourceRef="Task_A_GerarTarefas" targetRef="Task_G_AvaliarRisco" />
    <bpmn:sequenceFlow id="F_AvaliarRisco_AtualizarPlano" sourceRef="Task_G_AvaliarRisco" targetRef="Task_G_AtualizarPlano" />
    <bpmn:sequenceFlow id="F_AtualizarPlano_End" sourceRef="Task_G_AtualizarPlano" targetRef="End_AlinhamentoConcluido" />
  </bpmn:process>

  <bpmndi:BPMNDiagram id="BPMNDiagram_63_V5">
    <bpmndi:BPMNPlane id="BPMNPlane_63_V5" bpmnElement="Collaboration_63_V5">
      <bpmndi:BPMNShape id="Participant_63_V5_di" bpmnElement="Participant_63_V5" isHorizontal="true"><dc:Bounds x="50" y="20" width="3300" height="850" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Cliente_di" bpmnElement="Lane_Cliente" isHorizontal="true"><dc:Bounds x="80" y="20" width="3270" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_CS_di" bpmnElement="Lane_CS" isHorizontal="true"><dc:Bounds x="80" y="170" width="3270" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_IA_di" bpmnElement="Lane_IA" isHorizontal="true"><dc:Bounds x="80" y="320" width="3270" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Operacoes_di" bpmnElement="Lane_Operacoes" isHorizontal="true"><dc:Bounds x="80" y="470" width="3270" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Gestao_di" bpmnElement="Lane_Gestao" isHorizontal="true"><dc:Bounds x="80" y="620" width="3270" height="150" /></bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Start_Necessidade_di" bpmnElement="Start_Necessidade"><dc:Bounds x="120" y="77" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_SolicitarAlinhamento_di" bpmnElement="Task_C_SolicitarAlinhamento"><dc:Bounds x="220" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_RegistrarNecessidade_di" bpmnElement="Task_CS_RegistrarNecessidade"><dc:Bounds x="360" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_DetectarProativo_di" bpmnElement="Task_I_DetectarProativo"><dc:Bounds x="500" y="355" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_QualificarMotivo_di" bpmnElement="Task_CS_QualificarMotivo"><dc:Bounds x="640" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_DefinirObjetivo_di" bpmnElement="Task_CS_DefinirObjetivo"><dc:Bounds x="780" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_SugerirPauta_di" bpmnElement="Task_I_SugerirPauta"><dc:Bounds x="920" y="355" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_AgendarReuniao_di" bpmnElement="Task_CS_AgendarReuniao"><dc:Bounds x="1060" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_EnviarConvite_di" bpmnElement="Task_A_EnviarConvite"><dc:Bounds x="1200" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_ReceberConvite_di" bpmnElement="Task_C_ReceberConvite"><dc:Bounds x="1340" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_O_PrepararInsumos_di" bpmnElement="Task_O_PrepararInsumos"><dc:Bounds x="1480" y="505" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_ConduzirReuniao_di" bpmnElement="Task_CS_ConduzirReuniao"><dc:Bounds x="1620" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_ParticiparReuniao_di" bpmnElement="Task_C_ParticiparReuniao"><dc:Bounds x="1760" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_RegistrarDecisoes_di" bpmnElement="Task_CS_RegistrarDecisoes"><dc:Bounds x="1900" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_O_AvaliarImpacto_di" bpmnElement="Task_O_AvaliarImpacto"><dc:Bounds x="2040" y="505" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_GerarAta_di" bpmnElement="Task_I_GerarAta"><dc:Bounds x="2180" y="355" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_EnviarAta_di" bpmnElement="Task_A_EnviarAta"><dc:Bounds x="2320" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_ValidarAta_di" bpmnElement="Task_C_ValidarAta"><dc:Bounds x="2460" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_GerarTarefas_di" bpmnElement="Task_A_GerarTarefas"><dc:Bounds x="2600" y="505" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_G_AvaliarRisco_di" bpmnElement="Task_G_AvaliarRisco"><dc:Bounds x="2740" y="655" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_G_AtualizarPlano_di" bpmnElement="Task_G_AtualizarPlano"><dc:Bounds x="2880" y="655" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_AlinhamentoConcluido_di" bpmnElement="End_AlinhamentoConcluido"><dc:Bounds x="3020" y="227" width="36" height="36" /></bpmndi:BPMNShape>

      <bpmndi:BPMNEdge id="F_Start_Solicitar_di" bpmnElement="F_Start_Solicitar"><di:waypoint x="138" y="95" /><di:waypoint x="280" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Solicitar_Registrar_di" bpmnElement="F_Solicitar_Registrar"><di:waypoint x="280" y="95" /><di:waypoint x="420" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Registrar_IA_di" bpmnElement="F_Registrar_IA"><di:waypoint x="420" y="245" /><di:waypoint x="560" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_IA_Qualificar_di" bpmnElement="F_IA_Qualificar"><di:waypoint x="560" y="395" /><di:waypoint x="700" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Qualificar_Definir_di" bpmnElement="F_Qualificar_Definir"><di:waypoint x="700" y="245" /><di:waypoint x="840" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Definir_Pauta_di" bpmnElement="F_Definir_Pauta"><di:waypoint x="840" y="245" /><di:waypoint x="980" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Pauta_Agendar_di" bpmnElement="F_Pauta_Agendar"><di:waypoint x="980" y="395" /><di:waypoint x="1120" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Agendar_EnviarConvite_di" bpmnElement="F_Agendar_EnviarConvite"><di:waypoint x="1120" y="245" /><di:waypoint x="1260" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_EnviarConvite_Receber_di" bpmnElement="F_EnviarConvite_Receber"><di:waypoint x="1260" y="245" /><di:waypoint x="1400" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Receber_Insumos_di" bpmnElement="F_Receber_Insumos"><di:waypoint x="1400" y="95" /><di:waypoint x="1540" y="545" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Insumos_Conduzir_di" bpmnElement="F_Insumos_Conduzir"><di:waypoint x="1540" y="545" /><di:waypoint x="1680" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Conduzir_Participar_di" bpmnElement="F_Conduzir_Participar"><di:waypoint x="1680" y="245" /><di:waypoint x="1820" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Participar_Registrar_di" bpmnElement="F_Participar_Registrar"><di:waypoint x="1820" y="95" /><di:waypoint x="1960" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Registrar_AvaliarImpacto_di" bpmnElement="F_Registrar_AvaliarImpacto"><di:waypoint x="1960" y="245" /><di:waypoint x="2100" y="545" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_AvaliarImpacto_GerarAta_di" bpmnElement="F_AvaliarImpacto_GerarAta"><di:waypoint x="2100" y="545" /><di:waypoint x="2240" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_GerarAta_EnviarAta_di" bpmnElement="F_GerarAta_EnviarAta"><di:waypoint x="2240" y="395" /><di:waypoint x="2380" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_EnviarAta_Validar_di" bpmnElement="F_EnviarAta_Validar"><di:waypoint x="2380" y="245" /><di:waypoint x="2520" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Validar_Tarefas_di" bpmnElement="F_Validar_Tarefas"><di:waypoint x="2520" y="95" /><di:waypoint x="2660" y="545" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Tarefas_AvaliarRisco_di" bpmnElement="F_Tarefas_AvaliarRisco"><di:waypoint x="2660" y="545" /><di:waypoint x="2800" y="695" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_AvaliarRisco_AtualizarPlano_di" bpmnElement="F_AvaliarRisco_AtualizarPlano"><di:waypoint x="2800" y="695" /><di:waypoint x="2940" y="695" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_AtualizarPlano_End_di" bpmnElement="F_AtualizarPlano_End"><di:waypoint x="2940" y="695" /><di:waypoint x="3038" y="245" /></bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

const phases = [
  { name: 'Deteccao & Qualificacao', x: 80, width: 900 },
  { name: 'Preparacao & Agendamento', x: 980, width: 540 },
  { name: 'Reuniao de Alinhamento', x: 1520, width: 700 },
  { name: 'Ata, Acompanhamento & Encerramento', x: 2220, width: 1080 }
];

const config = {
  zoom: 0.9,
  storageKey: 'subprocesso-6.3',
  startLabel: 'NECESSIDADE DE ALINHAMENTO',
  endLabels: {
    End_AlinhamentoConcluido: { text: 'ALINHAMENTO CONCLUIDO', className: 'end-label-success', marker: 'end-success' }
  },
  showDefaultEndLabel: false,
  useEndName: false,
  defaultEndLabelText: 'FIM',
  defaultEndClass: 'end-label-lost'
};

window.v5Data = window.v5Data || {};
window.v5Data['6.3'] = { diagramXML, nodeDetails, phases, ...config };
