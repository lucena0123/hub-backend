const nodeDetails = {
  'Task_S_LevantarOrcamento': { sla: '4h', tag: 'Contexto', desc: 'Confere orcamento mensal e metas financeiras.' },
  'Task_S_AnalisarHistorico': { sla: null, tag: 'Historico', desc: 'Analisa performance historica da conta.' },
  'Task_S_DefinirEnvelope': { sla: null, tag: 'Funil', desc: 'Define envelope de investimento por funil.' },
  'Task_S_AlocarOrcamento': { sla: null, tag: 'Campanhas', desc: 'Distribui orcamento entre campanhas.' },
  'Task_S_DefinirLances': { sla: null, tag: 'Lances', desc: 'Define estrategias de lance por campanha.' },
  'Task_S_EstimarResultados': { sla: null, tag: 'Projecao', desc: 'Estima resultados esperados com base em dados.' },
  'Task_S_ConsolidarPlano': { sla: '48h', tag: 'Plano', desc: 'Consolida plano de orcamento e lances.' },
  'Task_S_AprovarPlano': { sla: null, tag: 'Aprovacao', desc: 'Aprova plano internamente.' },
  'Task_I_LerMetasHistorico': { sla: null, tag: 'Input IA', desc: 'Interpreta metas, historico e orcamento.' },
  'Task_I_SugerirDistribuicaoFunil': { sla: null, tag: 'Funil', desc: 'Sugere distribuicao entre topo, meio e fundo.' },
  'Task_I_SugerirOrcamentoCampanha': { sla: null, tag: 'Campanhas', desc: 'Sugere orcamento por campanha.' },
  'Task_I_SugerirEstrategiaLance': { sla: null, tag: 'Lances', desc: 'Sugere estrategia de lance recomendada.' },
  'Task_I_ProjecoesResultados': { sla: null, tag: 'Projecao', desc: 'Gera projecoes de resultados.' },
  'Task_I_RiscoOrcamento': { sla: null, tag: 'Risco', desc: 'Aponta risco de orcamento insuficiente.' },
  'Task_A_ColetarOrcamento': { sla: null, tag: 'Coleta', desc: 'Coleta dados de orcamento e restricoes.' },
  'Task_A_ImportarPerformance': { sla: null, tag: 'Historico', desc: 'Importa dados de performance.' },
  'Task_A_AtualizarPlanoMidia': { sla: null, tag: 'Plano', desc: 'Atualiza plano de midia oficial.' },
  'Task_A_RegistrarVersaoPlano': { sla: null, tag: 'Versionamento', desc: 'Registra versao do plano.' },
  'Task_C_ReverPlano': { sla: null, tag: 'Apresentacao', desc: 'Cliente revisa plano de orcamento.' },
  'Task_C_AprovarAjustar': { sla: null, tag: 'Cliente', desc: 'Cliente aprova ou ajusta plano.' },
  'Task_R_RevisarRiscos': { sla: null, tag: 'Compliance', desc: 'Revisa riscos e diretrizes.' }
};

const diagramXML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_34_V5" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_34_V5">
    <bpmn:participant id="Participant_34_V5" name="Orcamento e Lances" processRef="Process_34_V5" />
  </bpmn:collaboration>
  <bpmn:process id="Process_34_V5" isExecutable="false">
    <bpmn:laneSet id="LaneSet_34_V5">
      <bpmn:lane id="Lane_Strategy" name="Estrategia / Planejamento">
        <bpmn:flowNodeRef>Start_Rascunhos</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_LevantarOrcamento</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_AnalisarHistorico</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_DefinirEnvelope</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_AlocarOrcamento</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_DefinirLances</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_EstimarResultados</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_ConsolidarPlano</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_AprovarPlano</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_OrcamentoDefinido</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_IA" name="IA &amp; Insights">
        <bpmn:flowNodeRef>Task_I_LerMetasHistorico</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_SugerirDistribuicaoFunil</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_SugerirOrcamentoCampanha</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_SugerirEstrategiaLance</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_ProjecoesResultados</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_RiscoOrcamento</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Auto" name="Automacao / Dados">
        <bpmn:flowNodeRef>Task_A_ColetarOrcamento</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_ImportarPerformance</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_AtualizarPlanoMidia</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_RegistrarVersaoPlano</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Cliente" name="Cliente">
        <bpmn:flowNodeRef>Task_C_ReverPlano</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_C_AprovarAjustar</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Gestao" name="Gestao / Direcao">
        <bpmn:flowNodeRef>Task_R_RevisarRiscos</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_OrcamentoViavel</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_OrcamentoInviavel</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>

    <bpmn:startEvent id="Start_Rascunhos" name="Rascunhos Elaborados" />
    <bpmn:task id="Task_A_ColetarOrcamento" name="Coletar Dados de Orcamento" />
    <bpmn:task id="Task_S_LevantarOrcamento" name="Levantar Orcamento e Metas Financeiras" />
    <bpmn:task id="Task_I_LerMetasHistorico" name="Ler Metas e Historico" />
    <bpmn:task id="Task_A_ImportarPerformance" name="Importar Dados de Performance" />
    <bpmn:task id="Task_S_AnalisarHistorico" name="Analisar Performance Historica" />
    <bpmn:task id="Task_I_SugerirDistribuicaoFunil" name="Sugerir Distribuicao por Funil" />
    <bpmn:task id="Task_S_DefinirEnvelope" name="Definir Envelope por Funil" />
    <bpmn:task id="Task_I_SugerirOrcamentoCampanha" name="Sugerir Orcamento por Campanha" />
    <bpmn:task id="Task_S_AlocarOrcamento" name="Alocar Orcamento por Campanha" />
    <bpmn:task id="Task_I_SugerirEstrategiaLance" name="Sugerir Estrategia de Lance" />
    <bpmn:task id="Task_S_DefinirLances" name="Definir Estrategias de Lance" />
    <bpmn:task id="Task_I_ProjecoesResultados" name="Gerar Projecoes de Resultados" />
    <bpmn:task id="Task_S_EstimarResultados" name="Estimar Resultados Esperados" />
    <bpmn:task id="Task_I_RiscoOrcamento" name="Apontar Risco de Orcamento" />
    <bpmn:task id="Task_S_ConsolidarPlano" name="Consolidar Plano de Orcamento e Lances" />
    <bpmn:task id="Task_C_ReverPlano" name="Rever Plano de Orcamento" />
    <bpmn:task id="Task_C_AprovarAjustar" name="Aprovar ou Ajustar Orcamento" />
    <bpmn:task id="Task_R_RevisarRiscos" name="Revisar Riscos e Diretrizes" />
    <bpmn:exclusiveGateway id="Gateway_OrcamentoViavel" name="Orcamento viavel?" />
    <bpmn:task id="Task_S_AprovarPlano" name="Aprovar Orcamento e Lances" />
    <bpmn:task id="Task_A_AtualizarPlanoMidia" name="Atualizar Plano de Midia" />
    <bpmn:task id="Task_A_RegistrarVersaoPlano" name="Registrar Versao do Plano" />
    <bpmn:endEvent id="End_OrcamentoDefinido" name="Orcamento e Lances Definidos" />
    <bpmn:endEvent id="End_OrcamentoInviavel" name="Fim Orcamento Inviavel" />

    <bpmn:sequenceFlow id="F_Start_Coletar" sourceRef="Start_Rascunhos" targetRef="Task_A_ColetarOrcamento" />
    <bpmn:sequenceFlow id="F_Coletar_Levantar" sourceRef="Task_A_ColetarOrcamento" targetRef="Task_S_LevantarOrcamento" />
    <bpmn:sequenceFlow id="F_Levantar_LerIA" sourceRef="Task_S_LevantarOrcamento" targetRef="Task_I_LerMetasHistorico" />
    <bpmn:sequenceFlow id="F_LerIA_Importar" sourceRef="Task_I_LerMetasHistorico" targetRef="Task_A_ImportarPerformance" />
    <bpmn:sequenceFlow id="F_Importar_Analisar" sourceRef="Task_A_ImportarPerformance" targetRef="Task_S_AnalisarHistorico" />
    <bpmn:sequenceFlow id="F_Analisar_SugerirFunil" sourceRef="Task_S_AnalisarHistorico" targetRef="Task_I_SugerirDistribuicaoFunil" />
    <bpmn:sequenceFlow id="F_SugerirFunil_DefinirEnvelope" sourceRef="Task_I_SugerirDistribuicaoFunil" targetRef="Task_S_DefinirEnvelope" />
    <bpmn:sequenceFlow id="F_DefinirEnvelope_SugerirCampanha" sourceRef="Task_S_DefinirEnvelope" targetRef="Task_I_SugerirOrcamentoCampanha" />
    <bpmn:sequenceFlow id="F_SugerirCampanha_Alocar" sourceRef="Task_I_SugerirOrcamentoCampanha" targetRef="Task_S_AlocarOrcamento" />
    <bpmn:sequenceFlow id="F_Alocar_SugerirLance" sourceRef="Task_S_AlocarOrcamento" targetRef="Task_I_SugerirEstrategiaLance" />
    <bpmn:sequenceFlow id="F_SugerirLance_DefinirLances" sourceRef="Task_I_SugerirEstrategiaLance" targetRef="Task_S_DefinirLances" />
    <bpmn:sequenceFlow id="F_DefinirLances_Projecoes" sourceRef="Task_S_DefinirLances" targetRef="Task_I_ProjecoesResultados" />
    <bpmn:sequenceFlow id="F_Projecoes_Estimar" sourceRef="Task_I_ProjecoesResultados" targetRef="Task_S_EstimarResultados" />
    <bpmn:sequenceFlow id="F_Estimar_Risco" sourceRef="Task_S_EstimarResultados" targetRef="Task_I_RiscoOrcamento" />
    <bpmn:sequenceFlow id="F_Risco_Consolidar" sourceRef="Task_I_RiscoOrcamento" targetRef="Task_S_ConsolidarPlano" />
    <bpmn:sequenceFlow id="F_Consolidar_Rever" sourceRef="Task_S_ConsolidarPlano" targetRef="Task_C_ReverPlano" />
    <bpmn:sequenceFlow id="F_Rever_AprovarAjustar" sourceRef="Task_C_ReverPlano" targetRef="Task_C_AprovarAjustar" />
    <bpmn:sequenceFlow id="F_AprovarAjustar_RevisarRiscos" sourceRef="Task_C_AprovarAjustar" targetRef="Task_R_RevisarRiscos" />
    <bpmn:sequenceFlow id="F_RevisarRiscos_Gateway" sourceRef="Task_R_RevisarRiscos" targetRef="Gateway_OrcamentoViavel" />
    <bpmn:sequenceFlow id="F_Gateway_Yes_Aprovar" name="Sim" sourceRef="Gateway_OrcamentoViavel" targetRef="Task_S_AprovarPlano" />
    <bpmn:sequenceFlow id="F_Gateway_No_Inviavel" name="Nao" sourceRef="Gateway_OrcamentoViavel" targetRef="End_OrcamentoInviavel" />
    <bpmn:sequenceFlow id="F_Aprovar_Atualizar" sourceRef="Task_S_AprovarPlano" targetRef="Task_A_AtualizarPlanoMidia" />
    <bpmn:sequenceFlow id="F_Atualizar_Registrar" sourceRef="Task_A_AtualizarPlanoMidia" targetRef="Task_A_RegistrarVersaoPlano" />
    <bpmn:sequenceFlow id="F_Registrar_End" sourceRef="Task_A_RegistrarVersaoPlano" targetRef="End_OrcamentoDefinido" />
  </bpmn:process>

  <bpmndi:BPMNDiagram id="BPMNDiagram_34_V5">
    <bpmndi:BPMNPlane id="BPMNPlane_34_V5" bpmnElement="Collaboration_34_V5">
      <bpmndi:BPMNShape id="Participant_34_V5_di" bpmnElement="Participant_34_V5" isHorizontal="true"><dc:Bounds x="50" y="20" width="4030" height="750" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Strategy_di" bpmnElement="Lane_Strategy" isHorizontal="true"><dc:Bounds x="80" y="20" width="4000" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_IA_di" bpmnElement="Lane_IA" isHorizontal="true"><dc:Bounds x="80" y="170" width="4000" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Auto_di" bpmnElement="Lane_Auto" isHorizontal="true"><dc:Bounds x="80" y="320" width="4000" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Cliente_di" bpmnElement="Lane_Cliente" isHorizontal="true"><dc:Bounds x="80" y="470" width="4000" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Gestao_di" bpmnElement="Lane_Gestao" isHorizontal="true"><dc:Bounds x="80" y="620" width="4000" height="150" /></bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Start_Rascunhos_di" bpmnElement="Start_Rascunhos"><dc:Bounds x="120" y="77" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_ColetarOrcamento_di" bpmnElement="Task_A_ColetarOrcamento"><dc:Bounds x="220" y="355" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_LevantarOrcamento_di" bpmnElement="Task_S_LevantarOrcamento"><dc:Bounds x="380" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_LerMetasHistorico_di" bpmnElement="Task_I_LerMetasHistorico"><dc:Bounds x="540" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_ImportarPerformance_di" bpmnElement="Task_A_ImportarPerformance"><dc:Bounds x="700" y="355" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_AnalisarHistorico_di" bpmnElement="Task_S_AnalisarHistorico"><dc:Bounds x="860" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_SugerirDistribuicaoFunil_di" bpmnElement="Task_I_SugerirDistribuicaoFunil"><dc:Bounds x="1020" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_DefinirEnvelope_di" bpmnElement="Task_S_DefinirEnvelope"><dc:Bounds x="1180" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_SugerirOrcamentoCampanha_di" bpmnElement="Task_I_SugerirOrcamentoCampanha"><dc:Bounds x="1340" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_AlocarOrcamento_di" bpmnElement="Task_S_AlocarOrcamento"><dc:Bounds x="1500" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_SugerirEstrategiaLance_di" bpmnElement="Task_I_SugerirEstrategiaLance"><dc:Bounds x="1660" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_DefinirLances_di" bpmnElement="Task_S_DefinirLances"><dc:Bounds x="1820" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_ProjecoesResultados_di" bpmnElement="Task_I_ProjecoesResultados"><dc:Bounds x="1980" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_EstimarResultados_di" bpmnElement="Task_S_EstimarResultados"><dc:Bounds x="2140" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_RiscoOrcamento_di" bpmnElement="Task_I_RiscoOrcamento"><dc:Bounds x="2300" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_ConsolidarPlano_di" bpmnElement="Task_S_ConsolidarPlano"><dc:Bounds x="2460" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_ReverPlano_di" bpmnElement="Task_C_ReverPlano"><dc:Bounds x="2620" y="505" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_AprovarAjustar_di" bpmnElement="Task_C_AprovarAjustar"><dc:Bounds x="2780" y="505" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_R_RevisarRiscos_di" bpmnElement="Task_R_RevisarRiscos"><dc:Bounds x="2940" y="655" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_OrcamentoViavel_di" bpmnElement="Gateway_OrcamentoViavel" isMarkerVisible="true"><dc:Bounds x="3100" y="670" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_AprovarPlano_di" bpmnElement="Task_S_AprovarPlano"><dc:Bounds x="3260" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_AtualizarPlanoMidia_di" bpmnElement="Task_A_AtualizarPlanoMidia"><dc:Bounds x="3420" y="355" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_RegistrarVersaoPlano_di" bpmnElement="Task_A_RegistrarVersaoPlano"><dc:Bounds x="3580" y="355" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_OrcamentoDefinido_di" bpmnElement="End_OrcamentoDefinido"><dc:Bounds x="3740" y="77" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_OrcamentoInviavel_di" bpmnElement="End_OrcamentoInviavel"><dc:Bounds x="3260" y="677" width="36" height="36" /></bpmndi:BPMNShape>

      <bpmndi:BPMNEdge id="F_Start_Coletar_di" bpmnElement="F_Start_Coletar"><di:waypoint x="138" y="95" /><di:waypoint x="280" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Coletar_Levantar_di" bpmnElement="F_Coletar_Levantar"><di:waypoint x="280" y="395" /><di:waypoint x="440" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Levantar_LerIA_di" bpmnElement="F_Levantar_LerIA"><di:waypoint x="440" y="95" /><di:waypoint x="600" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_LerIA_Importar_di" bpmnElement="F_LerIA_Importar"><di:waypoint x="600" y="245" /><di:waypoint x="760" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Importar_Analisar_di" bpmnElement="F_Importar_Analisar"><di:waypoint x="760" y="395" /><di:waypoint x="920" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Analisar_SugerirFunil_di" bpmnElement="F_Analisar_SugerirFunil"><di:waypoint x="920" y="95" /><di:waypoint x="1080" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_SugerirFunil_DefinirEnvelope_di" bpmnElement="F_SugerirFunil_DefinirEnvelope"><di:waypoint x="1080" y="245" /><di:waypoint x="1240" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_DefinirEnvelope_SugerirCampanha_di" bpmnElement="F_DefinirEnvelope_SugerirCampanha"><di:waypoint x="1240" y="95" /><di:waypoint x="1400" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_SugerirCampanha_Alocar_di" bpmnElement="F_SugerirCampanha_Alocar"><di:waypoint x="1400" y="245" /><di:waypoint x="1560" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Alocar_SugerirLance_di" bpmnElement="F_Alocar_SugerirLance"><di:waypoint x="1560" y="95" /><di:waypoint x="1720" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_SugerirLance_DefinirLances_di" bpmnElement="F_SugerirLance_DefinirLances"><di:waypoint x="1720" y="245" /><di:waypoint x="1880" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_DefinirLances_Projecoes_di" bpmnElement="F_DefinirLances_Projecoes"><di:waypoint x="1880" y="95" /><di:waypoint x="2040" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Projecoes_Estimar_di" bpmnElement="F_Projecoes_Estimar"><di:waypoint x="2040" y="245" /><di:waypoint x="2200" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Estimar_Risco_di" bpmnElement="F_Estimar_Risco"><di:waypoint x="2200" y="95" /><di:waypoint x="2360" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Risco_Consolidar_di" bpmnElement="F_Risco_Consolidar"><di:waypoint x="2360" y="245" /><di:waypoint x="2520" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Consolidar_Rever_di" bpmnElement="F_Consolidar_Rever"><di:waypoint x="2520" y="95" /><di:waypoint x="2680" y="545" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Rever_AprovarAjustar_di" bpmnElement="F_Rever_AprovarAjustar"><di:waypoint x="2680" y="545" /><di:waypoint x="2840" y="545" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_AprovarAjustar_RevisarRiscos_di" bpmnElement="F_AprovarAjustar_RevisarRiscos"><di:waypoint x="2840" y="545" /><di:waypoint x="3000" y="695" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_RevisarRiscos_Gateway_di" bpmnElement="F_RevisarRiscos_Gateway"><di:waypoint x="3000" y="695" /><di:waypoint x="3125" y="695" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Gateway_Yes_Aprovar_di" bpmnElement="F_Gateway_Yes_Aprovar"><di:waypoint x="3125" y="695" /><di:waypoint x="3320" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Gateway_No_Inviavel_di" bpmnElement="F_Gateway_No_Inviavel"><di:waypoint x="3125" y="695" /><di:waypoint x="3278" y="695" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Aprovar_Atualizar_di" bpmnElement="F_Aprovar_Atualizar"><di:waypoint x="3320" y="95" /><di:waypoint x="3480" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Atualizar_Registrar_di" bpmnElement="F_Atualizar_Registrar"><di:waypoint x="3480" y="395" /><di:waypoint x="3640" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Registrar_End_di" bpmnElement="F_Registrar_End"><di:waypoint x="3640" y="395" /><di:waypoint x="3758" y="95" /></bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

const phases = [
  { name: 'Entrada', x: 80, width: 520 },
  { name: 'Analise de Orcamento', x: 600, width: 640 },
  { name: 'Alocacao por Funil/Campanha', x: 1240, width: 640 },
  { name: 'Estrategias de Lance', x: 1880, width: 640 },
  { name: 'Governanca & Riscos', x: 2520, width: 640 },
  { name: 'Saida', x: 3160, width: 920 }
];

const config = {
  zoom: 0.85,
  storageKey: 'subprocesso-3.4',
  startLabel: 'RASCUNHOS ELABORADOS',
  endLabels: {
    End_OrcamentoDefinido: { text: 'ORCAMENTO E LANCES DEFINIDOS', className: 'end-label-success', marker: 'end-success' },
    End_OrcamentoInviavel: { text: 'ORCAMENTO INVIAVEL', className: 'end-label-lost' }
  },
  showDefaultEndLabel: false,
  useEndName: false,
  defaultEndLabelText: 'FIM',
  defaultEndClass: 'end-label-lost'
};

window.v5Data = window.v5Data || {};
window.v5Data['3.4'] = { diagramXML, nodeDetails, phases, ...config };
