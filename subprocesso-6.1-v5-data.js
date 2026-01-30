const nodeDetails = {
  'Task_C_ConfirmarRecebimento': { sla: 'Imediato', tag: 'Auto', desc: 'Confirma recebimento ao cliente.' },
  'Task_C_PesquisaSatisfacao': { sla: null, tag: 'CSAT', desc: 'Pesquisa de satisfacao.' },
  'Task_A_RegistrarDemanda': { sla: '15m', tag: 'Registro', desc: 'Registra demanda no sistema.' },
  'Task_A_ClassificarDemanda': { sla: '30m', tag: 'Triagem', desc: 'Classifica demanda.' },
  'Task_A_ConsultarBase': { sla: null, tag: 'Base', desc: 'Consulta base de conhecimento.' },
  'Task_A_ResponderImediato': { sla: null, tag: '1º Nivel', desc: 'Resposta imediata.' },
  'Gateway_ResolvidoNivel1': { sla: null, tag: 'Decisao', desc: 'Resolvido no 1º nivel?' },
  'Task_A_EncaminharArea': { sla: null, tag: 'Encaminhar', desc: 'Encaminha area responsavel.' },
  'Task_A_AcompanharResolucao': { sla: null, tag: 'Follow-up', desc: 'Acompanha resolucao.' },
  'Task_A_EnviarResposta': { sla: null, tag: 'Resposta', desc: 'Envia resposta ao cliente.' },
  'Gateway_ClienteSatisfeito': { sla: null, tag: 'Decisao', desc: 'Cliente satisfeito?' },
  'Task_A_ReabrirEscalar': { sla: null, tag: 'Reabertura', desc: 'Reabre ou escala demanda.' },
  'Task_A_FecharDemanda': { sla: null, tag: 'Fechamento', desc: 'Fecha demanda no sistema.' },
  'Task_IA_Classificar': { sla: null, tag: 'IA', desc: 'Classifica e sugere categoria.' },
  'Task_IA_SugerirResposta': { sla: null, tag: 'IA', desc: 'Sugere resposta padrao.' },
  'Task_IA_MonitorarSLA': { sla: null, tag: 'SLA', desc: 'Monitora SLA e alerta.' },
  'Task_IA_AnalisarCSAT': { sla: null, tag: 'Insights', desc: 'Analisa CSAT e gera insights.' },
  'Task_O_DiagnosticarCausa': { sla: null, tag: 'Diagnostico', desc: 'Diagnostica causa tecnica.' },
  'Task_O_ImplementarSolucao': { sla: null, tag: 'Acao', desc: 'Implementa solucao tecnica.' },
  'Task_O_RegistrarCausa': { sla: null, tag: 'Causa', desc: 'Registra causa raiz.' },
  'Task_G_AvaliarEscalado': { sla: null, tag: 'Escalacao', desc: 'Avalia demanda escalada.' },
  'Task_G_DefinirMelhorias': { sla: null, tag: 'Melhoria', desc: 'Define acoes de melhoria.' }
};

const diagramXML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_61_V5" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_61_V5">
    <bpmn:participant id="Participant_61_V5" name="Atendimento ao Cliente" processRef="Process_61_V5" />
  </bpmn:collaboration>
  <bpmn:process id="Process_61_V5" isExecutable="false">
    <bpmn:laneSet id="LaneSet_61_V5">
      <bpmn:lane id="Lane_Cliente" name="Cliente">
        <bpmn:flowNodeRef>Start_Demanda</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_C_ConfirmarRecebimento</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_C_PesquisaSatisfacao</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Atendimento" name="Atendimento 1o Nivel">
        <bpmn:flowNodeRef>Task_A_RegistrarDemanda</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_ClassificarDemanda</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_ConsultarBase</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_ResponderImediato</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_ResolvidoNivel1</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_EncaminharArea</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_AcompanharResolucao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_EnviarResposta</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_ClienteSatisfeito</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_ReabrirEscalar</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_FecharDemanda</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_DemandaResolvida</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_IA" name="IA de Atendimento">
        <bpmn:flowNodeRef>Task_IA_Classificar</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_IA_SugerirResposta</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_IA_MonitorarSLA</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_IA_AnalisarCSAT</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Operacoes" name="Operacoes / Trafego">
        <bpmn:flowNodeRef>Task_O_DiagnosticarCausa</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_O_ImplementarSolucao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_O_RegistrarCausa</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Gestao" name="Gestao / Coordenacao">
        <bpmn:flowNodeRef>Task_G_AvaliarEscalado</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_G_DefinirMelhorias</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>

    <bpmn:startEvent id="Start_Demanda" name="Demanda do Cliente" />
    <bpmn:task id="Task_C_ConfirmarRecebimento" name="Confirmar Recebimento" />
    <bpmn:task id="Task_A_RegistrarDemanda" name="Registrar Demanda no Sistema" />
    <bpmn:task id="Task_IA_Classificar" name="Classificar e Sugerir Categoria" />
    <bpmn:task id="Task_A_ClassificarDemanda" name="Analisar e Classificar Demanda" />
    <bpmn:task id="Task_A_ConsultarBase" name="Consultar Base de Conhecimento" />
    <bpmn:task id="Task_IA_SugerirResposta" name="Sugerir Resposta Padrao" />
    <bpmn:task id="Task_A_ResponderImediato" name="Prover Resposta/Solucao Imediata" />
    <bpmn:exclusiveGateway id="Gateway_ResolvidoNivel1" name="Resolvido no 1o Nivel?" />
    <bpmn:task id="Task_A_EncaminharArea" name="Encaminhar para Area Responsavel" />
    <bpmn:task id="Task_O_DiagnosticarCausa" name="Diagnosticar Causa" />
    <bpmn:task id="Task_O_ImplementarSolucao" name="Implementar Solucao Tecnica" />
    <bpmn:task id="Task_O_RegistrarCausa" name="Registrar Causa Raiz" />
    <bpmn:task id="Task_A_AcompanharResolucao" name="Acompanhar Resolucao" />
    <bpmn:task id="Task_A_EnviarResposta" name="Enviar Resposta ao Cliente" />
    <bpmn:exclusiveGateway id="Gateway_ClienteSatisfeito" name="Cliente Satisfeito?" />
    <bpmn:task id="Task_A_ReabrirEscalar" name="Reabrir Demanda / Escalar" />
    <bpmn:task id="Task_G_AvaliarEscalado" name="Avaliar Demanda Escalada" />
    <bpmn:task id="Task_G_DefinirMelhorias" name="Definir Acoes de Melhoria" />
    <bpmn:task id="Task_A_FecharDemanda" name="Fechar Demanda no Sistema" />
    <bpmn:task id="Task_C_PesquisaSatisfacao" name="Responder Pesquisa de Satisfacao" />
    <bpmn:task id="Task_IA_MonitorarSLA" name="Monitorar SLA e Alertar" />
    <bpmn:task id="Task_IA_AnalisarCSAT" name="Analisar CSAT e Gerar Insights" />
    <bpmn:endEvent id="End_DemandaResolvida" name="Demanda Resolvida" />

    <bpmn:sequenceFlow id="F_Start_Confirmar" sourceRef="Start_Demanda" targetRef="Task_C_ConfirmarRecebimento" />
    <bpmn:sequenceFlow id="F_Confirmar_Registrar" sourceRef="Task_C_ConfirmarRecebimento" targetRef="Task_A_RegistrarDemanda" />
    <bpmn:sequenceFlow id="F_Registrar_IAClassificar" sourceRef="Task_A_RegistrarDemanda" targetRef="Task_IA_Classificar" />
    <bpmn:sequenceFlow id="F_IAClassificar_Classificar" sourceRef="Task_IA_Classificar" targetRef="Task_A_ClassificarDemanda" />
    <bpmn:sequenceFlow id="F_Classificar_Base" sourceRef="Task_A_ClassificarDemanda" targetRef="Task_A_ConsultarBase" />
    <bpmn:sequenceFlow id="F_Base_IAResposta" sourceRef="Task_A_ConsultarBase" targetRef="Task_IA_SugerirResposta" />
    <bpmn:sequenceFlow id="F_IAResposta_Responder" sourceRef="Task_IA_SugerirResposta" targetRef="Task_A_ResponderImediato" />
    <bpmn:sequenceFlow id="F_Responder_GatewayResolvido" sourceRef="Task_A_ResponderImediato" targetRef="Gateway_ResolvidoNivel1" />

    <bpmn:sequenceFlow id="F_GatewayResolvido_Sim_Enviar" name="Sim" sourceRef="Gateway_ResolvidoNivel1" targetRef="Task_A_EnviarResposta" />
    <bpmn:sequenceFlow id="F_GatewayResolvido_Nao_Encaminhar" name="Nao" sourceRef="Gateway_ResolvidoNivel1" targetRef="Task_A_EncaminharArea" />

    <bpmn:sequenceFlow id="F_Encaminhar_Diagnosticar" sourceRef="Task_A_EncaminharArea" targetRef="Task_O_DiagnosticarCausa" />
    <bpmn:sequenceFlow id="F_Diagnosticar_Implementar" sourceRef="Task_O_DiagnosticarCausa" targetRef="Task_O_ImplementarSolucao" />
    <bpmn:sequenceFlow id="F_Implementar_RegistrarCausa" sourceRef="Task_O_ImplementarSolucao" targetRef="Task_O_RegistrarCausa" />
    <bpmn:sequenceFlow id="F_RegistrarCausa_Acompanhar" sourceRef="Task_O_RegistrarCausa" targetRef="Task_A_AcompanharResolucao" />
    <bpmn:sequenceFlow id="F_Acompanhar_Enviar" sourceRef="Task_A_AcompanharResolucao" targetRef="Task_A_EnviarResposta" />

    <bpmn:sequenceFlow id="F_Enviar_GatewaySatisfeito" sourceRef="Task_A_EnviarResposta" targetRef="Gateway_ClienteSatisfeito" />
    <bpmn:sequenceFlow id="F_GatewaySatisfeito_Sim_Fechar" name="Sim" sourceRef="Gateway_ClienteSatisfeito" targetRef="Task_A_FecharDemanda" />
    <bpmn:sequenceFlow id="F_GatewaySatisfeito_Nao_Reabrir" name="Nao" sourceRef="Gateway_ClienteSatisfeito" targetRef="Task_A_ReabrirEscalar" />

    <bpmn:sequenceFlow id="F_Reabrir_Avaliar" sourceRef="Task_A_ReabrirEscalar" targetRef="Task_G_AvaliarEscalado" />
    <bpmn:sequenceFlow id="F_Avaliar_Melhorias" sourceRef="Task_G_AvaliarEscalado" targetRef="Task_G_DefinirMelhorias" />
    <bpmn:sequenceFlow id="F_Melhorias_Enviar" sourceRef="Task_G_DefinirMelhorias" targetRef="Task_A_EnviarResposta" />

    <bpmn:sequenceFlow id="F_Fechar_Pesquisa" sourceRef="Task_A_FecharDemanda" targetRef="Task_C_PesquisaSatisfacao" />
    <bpmn:sequenceFlow id="F_Pesquisa_MonitorarSLA" sourceRef="Task_C_PesquisaSatisfacao" targetRef="Task_IA_MonitorarSLA" />
    <bpmn:sequenceFlow id="F_MonitorarSLA_AnalisarCSAT" sourceRef="Task_IA_MonitorarSLA" targetRef="Task_IA_AnalisarCSAT" />
    <bpmn:sequenceFlow id="F_AnalisarCSAT_End" sourceRef="Task_IA_AnalisarCSAT" targetRef="End_DemandaResolvida" />
  </bpmn:process>

  <bpmndi:BPMNDiagram id="BPMNDiagram_61_V5">
    <bpmndi:BPMNPlane id="BPMNPlane_61_V5" bpmnElement="Collaboration_61_V5">
      <bpmndi:BPMNShape id="Participant_61_V5_di" bpmnElement="Participant_61_V5" isHorizontal="true"><dc:Bounds x="50" y="20" width="3300" height="850" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Cliente_di" bpmnElement="Lane_Cliente" isHorizontal="true"><dc:Bounds x="80" y="20" width="3270" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Atendimento_di" bpmnElement="Lane_Atendimento" isHorizontal="true"><dc:Bounds x="80" y="170" width="3270" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_IA_di" bpmnElement="Lane_IA" isHorizontal="true"><dc:Bounds x="80" y="320" width="3270" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Operacoes_di" bpmnElement="Lane_Operacoes" isHorizontal="true"><dc:Bounds x="80" y="470" width="3270" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Gestao_di" bpmnElement="Lane_Gestao" isHorizontal="true"><dc:Bounds x="80" y="620" width="3270" height="150" /></bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Start_Demanda_di" bpmnElement="Start_Demanda"><dc:Bounds x="120" y="77" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_ConfirmarRecebimento_di" bpmnElement="Task_C_ConfirmarRecebimento"><dc:Bounds x="220" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_RegistrarDemanda_di" bpmnElement="Task_A_RegistrarDemanda"><dc:Bounds x="380" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_IA_Classificar_di" bpmnElement="Task_IA_Classificar"><dc:Bounds x="540" y="355" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_ClassificarDemanda_di" bpmnElement="Task_A_ClassificarDemanda"><dc:Bounds x="700" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_ConsultarBase_di" bpmnElement="Task_A_ConsultarBase"><dc:Bounds x="860" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_IA_SugerirResposta_di" bpmnElement="Task_IA_SugerirResposta"><dc:Bounds x="1020" y="355" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_ResponderImediato_di" bpmnElement="Task_A_ResponderImediato"><dc:Bounds x="1180" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_ResolvidoNivel1_di" bpmnElement="Gateway_ResolvidoNivel1" isMarkerVisible="true"><dc:Bounds x="1340" y="220" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_EncaminharArea_di" bpmnElement="Task_A_EncaminharArea"><dc:Bounds x="1500" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_O_DiagnosticarCausa_di" bpmnElement="Task_O_DiagnosticarCausa"><dc:Bounds x="1660" y="505" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_O_ImplementarSolucao_di" bpmnElement="Task_O_ImplementarSolucao"><dc:Bounds x="1820" y="505" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_O_RegistrarCausa_di" bpmnElement="Task_O_RegistrarCausa"><dc:Bounds x="1980" y="505" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_AcompanharResolucao_di" bpmnElement="Task_A_AcompanharResolucao"><dc:Bounds x="2140" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_EnviarResposta_di" bpmnElement="Task_A_EnviarResposta"><dc:Bounds x="2300" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_ClienteSatisfeito_di" bpmnElement="Gateway_ClienteSatisfeito" isMarkerVisible="true"><dc:Bounds x="2460" y="220" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_ReabrirEscalar_di" bpmnElement="Task_A_ReabrirEscalar"><dc:Bounds x="2620" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_G_AvaliarEscalado_di" bpmnElement="Task_G_AvaliarEscalado"><dc:Bounds x="2780" y="655" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_G_DefinirMelhorias_di" bpmnElement="Task_G_DefinirMelhorias"><dc:Bounds x="2940" y="655" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_FecharDemanda_di" bpmnElement="Task_A_FecharDemanda"><dc:Bounds x="2620" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_PesquisaSatisfacao_di" bpmnElement="Task_C_PesquisaSatisfacao"><dc:Bounds x="2780" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_IA_MonitorarSLA_di" bpmnElement="Task_IA_MonitorarSLA"><dc:Bounds x="2940" y="355" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_IA_AnalisarCSAT_di" bpmnElement="Task_IA_AnalisarCSAT"><dc:Bounds x="3100" y="355" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_DemandaResolvida_di" bpmnElement="End_DemandaResolvida"><dc:Bounds x="3260" y="377" width="36" height="36" /></bpmndi:BPMNShape>

      <bpmndi:BPMNEdge id="F_Start_Confirmar_di" bpmnElement="F_Start_Confirmar"><di:waypoint x="138" y="95" /><di:waypoint x="280" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Confirmar_Registrar_di" bpmnElement="F_Confirmar_Registrar"><di:waypoint x="280" y="95" /><di:waypoint x="440" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Registrar_IAClassificar_di" bpmnElement="F_Registrar_IAClassificar"><di:waypoint x="440" y="245" /><di:waypoint x="600" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_IAClassificar_Classificar_di" bpmnElement="F_IAClassificar_Classificar"><di:waypoint x="600" y="395" /><di:waypoint x="760" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Classificar_Base_di" bpmnElement="F_Classificar_Base"><di:waypoint x="760" y="245" /><di:waypoint x="920" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Base_IAResposta_di" bpmnElement="F_Base_IAResposta"><di:waypoint x="920" y="245" /><di:waypoint x="1080" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_IAResposta_Responder_di" bpmnElement="F_IAResposta_Responder"><di:waypoint x="1080" y="395" /><di:waypoint x="1240" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Responder_GatewayResolvido_di" bpmnElement="F_Responder_GatewayResolvido"><di:waypoint x="1240" y="245" /><di:waypoint x="1365" y="245" /></bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="F_GatewayResolvido_Sim_Enviar_di" bpmnElement="F_GatewayResolvido_Sim_Enviar"><di:waypoint x="1365" y="245" /><di:waypoint x="2360" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_GatewayResolvido_Nao_Encaminhar_di" bpmnElement="F_GatewayResolvido_Nao_Encaminhar"><di:waypoint x="1365" y="245" /><di:waypoint x="1560" y="245" /></bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="F_Encaminhar_Diagnosticar_di" bpmnElement="F_Encaminhar_Diagnosticar"><di:waypoint x="1560" y="245" /><di:waypoint x="1720" y="545" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Diagnosticar_Implementar_di" bpmnElement="F_Diagnosticar_Implementar"><di:waypoint x="1720" y="545" /><di:waypoint x="1880" y="545" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Implementar_RegistrarCausa_di" bpmnElement="F_Implementar_RegistrarCausa"><di:waypoint x="1880" y="545" /><di:waypoint x="2040" y="545" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_RegistrarCausa_Acompanhar_di" bpmnElement="F_RegistrarCausa_Acompanhar"><di:waypoint x="2040" y="545" /><di:waypoint x="2200" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Acompanhar_Enviar_di" bpmnElement="F_Acompanhar_Enviar"><di:waypoint x="2200" y="245" /><di:waypoint x="2360" y="245" /></bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="F_Enviar_GatewaySatisfeito_di" bpmnElement="F_Enviar_GatewaySatisfeito"><di:waypoint x="2360" y="245" /><di:waypoint x="2485" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_GatewaySatisfeito_Sim_Fechar_di" bpmnElement="F_GatewaySatisfeito_Sim_Fechar"><di:waypoint x="2485" y="245" /><di:waypoint x="2680" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_GatewaySatisfeito_Nao_Reabrir_di" bpmnElement="F_GatewaySatisfeito_Nao_Reabrir"><di:waypoint x="2485" y="245" /><di:waypoint x="2680" y="245" /></bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="F_Reabrir_Avaliar_di" bpmnElement="F_Reabrir_Avaliar"><di:waypoint x="2680" y="245" /><di:waypoint x="2840" y="695" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Avaliar_Melhorias_di" bpmnElement="F_Avaliar_Melhorias"><di:waypoint x="2840" y="695" /><di:waypoint x="3000" y="695" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Melhorias_Enviar_di" bpmnElement="F_Melhorias_Enviar"><di:waypoint x="3000" y="695" /><di:waypoint x="2360" y="245" /></bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="F_Fechar_Pesquisa_di" bpmnElement="F_Fechar_Pesquisa"><di:waypoint x="2680" y="245" /><di:waypoint x="2840" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Pesquisa_MonitorarSLA_di" bpmnElement="F_Pesquisa_MonitorarSLA"><di:waypoint x="2840" y="95" /><di:waypoint x="3000" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_MonitorarSLA_AnalisarCSAT_di" bpmnElement="F_MonitorarSLA_AnalisarCSAT"><di:waypoint x="3000" y="395" /><di:waypoint x="3160" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_AnalisarCSAT_End_di" bpmnElement="F_AnalisarCSAT_End"><di:waypoint x="3160" y="395" /><di:waypoint x="3278" y="395" /></bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

const phases = [
  { name: 'Triagem', x: 80, width: 640 },
  { name: 'Processamento', x: 720, width: 640 },
  { name: 'Resolucao', x: 1360, width: 640 },
  { name: 'Pos-atendimento & Aprendizado', x: 2000, width: 1350 }
];

const config = {
  zoom: 0.9,
  storageKey: 'subprocesso-6.1',
  startLabel: 'DEMANDA DO CLIENTE',
  endLabels: {
    End_DemandaResolvida: { text: 'DEMANDA RESOLVIDA', className: 'end-label-success', marker: 'end-success' }
  },
  showDefaultEndLabel: false,
  useEndName: false,
  defaultEndLabelText: 'FIM',
  defaultEndClass: 'end-label-lost'
};

window.v5Data = window.v5Data || {};
window.v5Data['6.1'] = { diagramXML, nodeDetails, phases, ...config };
