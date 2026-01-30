const nodeDetails = {
  'Task_S_RevisarPersonas': { sla: '4h', tag: 'Contexto', desc: 'Revisita personas, jornada, dores e metas.' },
  'Task_S_DefinirObjetivos': { sla: null, tag: 'Objetivos', desc: 'Define objetivos de comunicacao por campanha.' },
  'Task_S_MapearMensagens': { sla: null, tag: 'Mensagens', desc: 'Mapeia mensagens por persona e funil.' },
  'Task_S_DefinirGanchos': { sla: null, tag: 'Hooks', desc: 'Define ganchos emocionais e racionais.' },
  'Task_S_EstruturarMatriz': { sla: null, tag: 'Matriz', desc: 'Organiza temas em matriz funil x persona x objetivo.' },
  'Task_S_SelecionarIdeias': { sla: null, tag: 'Prioridade', desc: 'Seleciona ideias prioritarias.' },
  'Task_S_ElaborarRascunhos': { sla: '48h', tag: 'Rascunhos', desc: 'Elabora rascunhos de copy.' },
  'Task_S_RevisaoEstrategica': { sla: null, tag: 'Revisao', desc: 'Revisao estrategica dos rascunhos.' },
  'Task_S_AprovarEstrategia': { sla: null, tag: 'Aprovacao', desc: 'Aprova estrategia e rascunhos.' },
  'Task_I_LerPersonas': { sla: null, tag: 'Input IA', desc: 'IA interpreta personas e metas.' },
  'Task_I_SugerirMensagens': { sla: null, tag: 'Mensagens', desc: 'Sugere mensagens-chave por persona e funil.' },
  'Task_I_GerarGanchos': { sla: null, tag: 'Hooks', desc: 'Gera ganchos e headlines.' },
  'Task_I_Brainstorming': { sla: null, tag: 'Ideias', desc: 'Brainstorming criativo assistido.' },
  'Task_I_EsbocosCopy': { sla: null, tag: 'Drafts', desc: 'Gera esbocos de copy.' },
  'Task_I_ChecagemTom': { sla: null, tag: 'Review', desc: 'Ajusta tom e aponta riscos.' },
  'Task_A_CarregarHistorico': { sla: null, tag: 'Historico', desc: 'Carrega criativos com boa performance.' },
  'Task_A_CriarBoard': { sla: null, tag: 'Board', desc: 'Cria board de ideias de conteudo.' },
  'Task_A_VincularIdeias': { sla: null, tag: 'Vinculos', desc: 'Vincula ideias a campanhas.' },
  'Task_A_RegistrarRascunhos': { sla: null, tag: 'Repositorio', desc: 'Registra rascunhos aprovados.' },
  'Task_A_CompartilharEstrategia': { sla: null, tag: 'Entrega', desc: 'Compartilha estrategia com squad criativo.' },
  'Task_C_RevisarComunicacao': { sla: null, tag: 'Revisao', desc: 'Cliente revisa linhas de comunicacao.' },
  'Task_C_EndossarEstrategia': { sla: null, tag: 'Endosso', desc: 'Cliente endossa estrategia opcionalmente.' },
  'Task_R_RevisarAlinhamento': { sla: null, tag: 'Coerencia', desc: 'Revisa alinhamento estrategico.' }
};

const diagramXML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_33_V5" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_33_V5">
    <bpmn:participant id="Participant_33_V5" name="Estrategia de Conteudo" processRef="Process_33_V5" />
  </bpmn:collaboration>
  <bpmn:process id="Process_33_V5" isExecutable="false">
    <bpmn:laneSet id="LaneSet_33_V5">
      <bpmn:lane id="Lane_Strategy" name="Estrategia / Planejamento">
        <bpmn:flowNodeRef>Start_Personas</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_RevisarPersonas</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_DefinirObjetivos</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_MapearMensagens</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_DefinirGanchos</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_EstruturarMatriz</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_SelecionarIdeias</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_ElaborarRascunhos</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_RevisaoEstrategica</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_AprovarEstrategia</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_Success</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_IA" name="IA & Insights">
        <bpmn:flowNodeRef>Task_I_LerPersonas</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_SugerirMensagens</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_GerarGanchos</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_Brainstorming</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_EsbocosCopy</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_ChecagemTom</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Auto" name="Automacao / Repositorio">
        <bpmn:flowNodeRef>Task_A_CarregarHistorico</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_CriarBoard</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_VincularIdeias</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_RegistrarRascunhos</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_CompartilharEstrategia</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Cliente" name="Cliente">
        <bpmn:flowNodeRef>Task_C_RevisarComunicacao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_C_EndossarEstrategia</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Gestao" name="Gestao / Direcao">
        <bpmn:flowNodeRef>Task_R_RevisarAlinhamento</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_EstrategiaAprovada</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_EstrategiaReprovada</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>

    <bpmn:startEvent id="Start_Personas" name="Personas Definidas">
      <bpmn:outgoing>F_Start_Revisar</bpmn:outgoing>
    </bpmn:startEvent>

    <bpmn:task id="Task_S_RevisarPersonas" name="1. Revisar Personas e Jornada">
      <bpmn:incoming>F_Start_Revisar</bpmn:incoming>
      <bpmn:outgoing>F_Revisar_LerIA</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_I_LerPersonas" name="Ler Personas e Metas">
      <bpmn:incoming>F_Revisar_LerIA</bpmn:incoming>
      <bpmn:outgoing>F_LerIA_DefinirObjetivos</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_S_DefinirObjetivos" name="2. Definir Objetivos de Comunicacao">
      <bpmn:incoming>F_LerIA_DefinirObjetivos</bpmn:incoming>
      <bpmn:outgoing>F_Definir_SugerirMensagens</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_I_SugerirMensagens" name="Sugerir Mensagens-chave (IA)">
      <bpmn:incoming>F_Definir_SugerirMensagens</bpmn:incoming>
      <bpmn:outgoing>F_SugerirMensagens_Mapear</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_S_MapearMensagens" name="3. Mapear Mensagens-chave">
      <bpmn:incoming>F_SugerirMensagens_Mapear</bpmn:incoming>
      <bpmn:outgoing>F_Mapear_GerarGanchos</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_I_GerarGanchos" name="Gerar Ganchos e Headlines">
      <bpmn:incoming>F_Mapear_GerarGanchos</bpmn:incoming>
      <bpmn:outgoing>F_GerarGanchos_DefinirGanchos</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_S_DefinirGanchos" name="4. Definir Ganchos e Angulos">
      <bpmn:incoming>F_GerarGanchos_DefinirGanchos</bpmn:incoming>
      <bpmn:outgoing>F_DefinirGanchos_CarregarHistorico</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_A_CarregarHistorico" name="Carregar Criativos com Boa Performance">
      <bpmn:incoming>F_DefinirGanchos_CarregarHistorico</bpmn:incoming>
      <bpmn:outgoing>F_CarregarHistorico_Brainstorming</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_I_Brainstorming" name="Brainstorming Criativo Assistido">
      <bpmn:incoming>F_CarregarHistorico_Brainstorming</bpmn:incoming>
      <bpmn:outgoing>F_Brainstorming_Estruturar</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_S_EstruturarMatriz" name="5. Estruturar Matriz de Conteudo">
      <bpmn:incoming>F_Brainstorming_Estruturar</bpmn:incoming>
      <bpmn:outgoing>F_Estruturar_CriarBoard</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_A_CriarBoard" name="Criar Board de Ideias">
      <bpmn:incoming>F_Estruturar_CriarBoard</bpmn:incoming>
      <bpmn:outgoing>F_CriarBoard_Selecionar</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_S_SelecionarIdeias" name="6. Selecionar Ideias Prioritarias">
      <bpmn:incoming>F_CriarBoard_Selecionar</bpmn:incoming>
      <bpmn:outgoing>F_Selecionar_Vincular</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_A_VincularIdeias" name="Vincular Ideias a Campanhas">
      <bpmn:incoming>F_Selecionar_Vincular</bpmn:incoming>
      <bpmn:outgoing>F_Vincular_Esbocos</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_I_EsbocosCopy" name="Gerar Esbocos de Copy">
      <bpmn:incoming>F_Vincular_Esbocos</bpmn:incoming>
      <bpmn:outgoing>F_Esbocos_Elaborar</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_S_ElaborarRascunhos" name="7. Elaborar Rascunhos de Copy">
      <bpmn:incoming>F_Esbocos_Elaborar</bpmn:incoming>
      <bpmn:outgoing>F_Elaborar_Checagem</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_I_ChecagemTom" name="Ajustar Tom de Voz">
      <bpmn:incoming>F_Elaborar_Checagem</bpmn:incoming>
      <bpmn:outgoing>F_Checagem_Revisao</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_S_RevisaoEstrategica" name="8. Revisao Estrategica">
      <bpmn:incoming>F_Checagem_Revisao</bpmn:incoming>
      <bpmn:outgoing>F_Revisao_RevisarComunicacao</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_C_RevisarComunicacao" name="Revisar Linhas de Comunicacao">
      <bpmn:incoming>F_Revisao_RevisarComunicacao</bpmn:incoming>
      <bpmn:outgoing>F_RevisarComunicacao_Endossar</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_C_EndossarEstrategia" name="Endossar Estrategia">
      <bpmn:incoming>F_RevisarComunicacao_Endossar</bpmn:incoming>
      <bpmn:outgoing>F_Endossar_RevisarAlinhamento</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_R_RevisarAlinhamento" name="Revisar Alinhamento Estrategico">
      <bpmn:incoming>F_Endossar_RevisarAlinhamento</bpmn:incoming>
      <bpmn:outgoing>F_RevisarAlinhamento_Gateway</bpmn:outgoing>
    </bpmn:task>

    <bpmn:exclusiveGateway id="Gateway_EstrategiaAprovada" name="Estrategia aprovada?">
      <bpmn:incoming>F_RevisarAlinhamento_Gateway</bpmn:incoming>
      <bpmn:outgoing>F_Gateway_Yes_Aprovar</bpmn:outgoing>
      <bpmn:outgoing>F_Gateway_No_Reprovada</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <bpmn:endEvent id="End_EstrategiaReprovada" name="Fim Estrategia Reprovada">
      <bpmn:incoming>F_Gateway_No_Reprovada</bpmn:incoming>
    </bpmn:endEvent>

    <bpmn:task id="Task_S_AprovarEstrategia" name="9. Aprovar Estrategia e Rascunhos">
      <bpmn:incoming>F_Gateway_Yes_Aprovar</bpmn:incoming>
      <bpmn:outgoing>F_Aprovar_Registrar</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_A_RegistrarRascunhos" name="Registrar Rascunhos Aprovados">
      <bpmn:incoming>F_Aprovar_Registrar</bpmn:incoming>
      <bpmn:outgoing>F_Registrar_Compartilhar</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_A_CompartilharEstrategia" name="Compartilhar Estrategia com Squad Criativo">
      <bpmn:incoming>F_Registrar_Compartilhar</bpmn:incoming>
      <bpmn:outgoing>F_Compartilhar_End</bpmn:outgoing>
    </bpmn:task>

    <bpmn:endEvent id="End_Success" name="Rascunhos Elaborados">
      <bpmn:incoming>F_Compartilhar_End</bpmn:incoming>
    </bpmn:endEvent>

    <bpmn:sequenceFlow id="F_Start_Revisar" sourceRef="Start_Personas" targetRef="Task_S_RevisarPersonas" />
    <bpmn:sequenceFlow id="F_Revisar_LerIA" sourceRef="Task_S_RevisarPersonas" targetRef="Task_I_LerPersonas" />
    <bpmn:sequenceFlow id="F_LerIA_DefinirObjetivos" sourceRef="Task_I_LerPersonas" targetRef="Task_S_DefinirObjetivos" />
    <bpmn:sequenceFlow id="F_Definir_SugerirMensagens" sourceRef="Task_S_DefinirObjetivos" targetRef="Task_I_SugerirMensagens" />
    <bpmn:sequenceFlow id="F_SugerirMensagens_Mapear" sourceRef="Task_I_SugerirMensagens" targetRef="Task_S_MapearMensagens" />
    <bpmn:sequenceFlow id="F_Mapear_GerarGanchos" sourceRef="Task_S_MapearMensagens" targetRef="Task_I_GerarGanchos" />
    <bpmn:sequenceFlow id="F_GerarGanchos_DefinirGanchos" sourceRef="Task_I_GerarGanchos" targetRef="Task_S_DefinirGanchos" />
    <bpmn:sequenceFlow id="F_DefinirGanchos_CarregarHistorico" sourceRef="Task_S_DefinirGanchos" targetRef="Task_A_CarregarHistorico" />
    <bpmn:sequenceFlow id="F_CarregarHistorico_Brainstorming" sourceRef="Task_A_CarregarHistorico" targetRef="Task_I_Brainstorming" />
    <bpmn:sequenceFlow id="F_Brainstorming_Estruturar" sourceRef="Task_I_Brainstorming" targetRef="Task_S_EstruturarMatriz" />
    <bpmn:sequenceFlow id="F_Estruturar_CriarBoard" sourceRef="Task_S_EstruturarMatriz" targetRef="Task_A_CriarBoard" />
    <bpmn:sequenceFlow id="F_CriarBoard_Selecionar" sourceRef="Task_A_CriarBoard" targetRef="Task_S_SelecionarIdeias" />
    <bpmn:sequenceFlow id="F_Selecionar_Vincular" sourceRef="Task_S_SelecionarIdeias" targetRef="Task_A_VincularIdeias" />
    <bpmn:sequenceFlow id="F_Vincular_Esbocos" sourceRef="Task_A_VincularIdeias" targetRef="Task_I_EsbocosCopy" />
    <bpmn:sequenceFlow id="F_Esbocos_Elaborar" sourceRef="Task_I_EsbocosCopy" targetRef="Task_S_ElaborarRascunhos" />
    <bpmn:sequenceFlow id="F_Elaborar_Checagem" sourceRef="Task_S_ElaborarRascunhos" targetRef="Task_I_ChecagemTom" />
    <bpmn:sequenceFlow id="F_Checagem_Revisao" sourceRef="Task_I_ChecagemTom" targetRef="Task_S_RevisaoEstrategica" />
    <bpmn:sequenceFlow id="F_Revisao_RevisarComunicacao" sourceRef="Task_S_RevisaoEstrategica" targetRef="Task_C_RevisarComunicacao" />
    <bpmn:sequenceFlow id="F_RevisarComunicacao_Endossar" sourceRef="Task_C_RevisarComunicacao" targetRef="Task_C_EndossarEstrategia" />
    <bpmn:sequenceFlow id="F_Endossar_RevisarAlinhamento" sourceRef="Task_C_EndossarEstrategia" targetRef="Task_R_RevisarAlinhamento" />
    <bpmn:sequenceFlow id="F_RevisarAlinhamento_Gateway" sourceRef="Task_R_RevisarAlinhamento" targetRef="Gateway_EstrategiaAprovada" />
    <bpmn:sequenceFlow id="F_Gateway_Yes_Aprovar" name="Sim" sourceRef="Gateway_EstrategiaAprovada" targetRef="Task_S_AprovarEstrategia" />
    <bpmn:sequenceFlow id="F_Gateway_No_Reprovada" name="Nao" sourceRef="Gateway_EstrategiaAprovada" targetRef="End_EstrategiaReprovada" />
    <bpmn:sequenceFlow id="F_Aprovar_Registrar" sourceRef="Task_S_AprovarEstrategia" targetRef="Task_A_RegistrarRascunhos" />
    <bpmn:sequenceFlow id="F_Registrar_Compartilhar" sourceRef="Task_A_RegistrarRascunhos" targetRef="Task_A_CompartilharEstrategia" />
    <bpmn:sequenceFlow id="F_Compartilhar_End" sourceRef="Task_A_CompartilharEstrategia" targetRef="End_Success" />
  </bpmn:process>

  <bpmndi:BPMNDiagram id="BPMNDiagram_33_V5">
    <bpmndi:BPMNPlane id="BPMNPlane_33_V5" bpmnElement="Collaboration_33_V5">
      <bpmndi:BPMNShape id="Participant_33_V5_di" bpmnElement="Participant_33_V5" isHorizontal="true"><dc:Bounds x="50" y="20" width="4300" height="750" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Strategy_di" bpmnElement="Lane_Strategy" isHorizontal="true"><dc:Bounds x="80" y="20" width="4270" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_IA_di" bpmnElement="Lane_IA" isHorizontal="true"><dc:Bounds x="80" y="170" width="4270" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Auto_di" bpmnElement="Lane_Auto" isHorizontal="true"><dc:Bounds x="80" y="320" width="4270" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Cliente_di" bpmnElement="Lane_Cliente" isHorizontal="true"><dc:Bounds x="80" y="470" width="4270" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Gestao_di" bpmnElement="Lane_Gestao" isHorizontal="true"><dc:Bounds x="80" y="620" width="4270" height="150" /></bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Start_Personas_di" bpmnElement="Start_Personas"><dc:Bounds x="120" y="77" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_RevisarPersonas_di" bpmnElement="Task_S_RevisarPersonas"><dc:Bounds x="220" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_LerPersonas_di" bpmnElement="Task_I_LerPersonas"><dc:Bounds x="380" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_DefinirObjetivos_di" bpmnElement="Task_S_DefinirObjetivos"><dc:Bounds x="540" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_SugerirMensagens_di" bpmnElement="Task_I_SugerirMensagens"><dc:Bounds x="700" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_MapearMensagens_di" bpmnElement="Task_S_MapearMensagens"><dc:Bounds x="860" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_GerarGanchos_di" bpmnElement="Task_I_GerarGanchos"><dc:Bounds x="1020" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_DefinirGanchos_di" bpmnElement="Task_S_DefinirGanchos"><dc:Bounds x="1180" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_CarregarHistorico_di" bpmnElement="Task_A_CarregarHistorico"><dc:Bounds x="1340" y="355" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_Brainstorming_di" bpmnElement="Task_I_Brainstorming"><dc:Bounds x="1500" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_EstruturarMatriz_di" bpmnElement="Task_S_EstruturarMatriz"><dc:Bounds x="1660" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_CriarBoard_di" bpmnElement="Task_A_CriarBoard"><dc:Bounds x="1820" y="355" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_SelecionarIdeias_di" bpmnElement="Task_S_SelecionarIdeias"><dc:Bounds x="1980" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_VincularIdeias_di" bpmnElement="Task_A_VincularIdeias"><dc:Bounds x="2140" y="355" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_EsbocosCopy_di" bpmnElement="Task_I_EsbocosCopy"><dc:Bounds x="2300" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_ElaborarRascunhos_di" bpmnElement="Task_S_ElaborarRascunhos"><dc:Bounds x="2460" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_ChecagemTom_di" bpmnElement="Task_I_ChecagemTom"><dc:Bounds x="2620" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_RevisaoEstrategica_di" bpmnElement="Task_S_RevisaoEstrategica"><dc:Bounds x="2780" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_RevisarComunicacao_di" bpmnElement="Task_C_RevisarComunicacao"><dc:Bounds x="2940" y="505" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_EndossarEstrategia_di" bpmnElement="Task_C_EndossarEstrategia"><dc:Bounds x="3100" y="505" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_R_RevisarAlinhamento_di" bpmnElement="Task_R_RevisarAlinhamento"><dc:Bounds x="3260" y="655" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_EstrategiaAprovada_di" bpmnElement="Gateway_EstrategiaAprovada" isMarkerVisible="true"><dc:Bounds x="3420" y="670" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_EstrategiaReprovada_di" bpmnElement="End_EstrategiaReprovada"><dc:Bounds x="3580" y="677" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_AprovarEstrategia_di" bpmnElement="Task_S_AprovarEstrategia"><dc:Bounds x="3600" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_RegistrarRascunhos_di" bpmnElement="Task_A_RegistrarRascunhos"><dc:Bounds x="3760" y="355" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_CompartilharEstrategia_di" bpmnElement="Task_A_CompartilharEstrategia"><dc:Bounds x="3920" y="355" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_Success_di" bpmnElement="End_Success"><dc:Bounds x="4080" y="77" width="36" height="36" /></bpmndi:BPMNShape>

      <bpmndi:BPMNEdge id="F_Start_Revisar_di" bpmnElement="F_Start_Revisar"><di:waypoint x="138" y="95" /><di:waypoint x="280" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Revisar_LerIA_di" bpmnElement="F_Revisar_LerIA"><di:waypoint x="280" y="95" /><di:waypoint x="440" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_LerIA_DefinirObjetivos_di" bpmnElement="F_LerIA_DefinirObjetivos"><di:waypoint x="440" y="245" /><di:waypoint x="600" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Definir_SugerirMensagens_di" bpmnElement="F_Definir_SugerirMensagens"><di:waypoint x="600" y="95" /><di:waypoint x="760" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_SugerirMensagens_Mapear_di" bpmnElement="F_SugerirMensagens_Mapear"><di:waypoint x="760" y="245" /><di:waypoint x="920" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Mapear_GerarGanchos_di" bpmnElement="F_Mapear_GerarGanchos"><di:waypoint x="920" y="95" /><di:waypoint x="1080" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_GerarGanchos_DefinirGanchos_di" bpmnElement="F_GerarGanchos_DefinirGanchos"><di:waypoint x="1080" y="245" /><di:waypoint x="1240" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_DefinirGanchos_CarregarHistorico_di" bpmnElement="F_DefinirGanchos_CarregarHistorico"><di:waypoint x="1240" y="95" /><di:waypoint x="1400" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_CarregarHistorico_Brainstorming_di" bpmnElement="F_CarregarHistorico_Brainstorming"><di:waypoint x="1400" y="395" /><di:waypoint x="1560" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Brainstorming_Estruturar_di" bpmnElement="F_Brainstorming_Estruturar"><di:waypoint x="1560" y="245" /><di:waypoint x="1720" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Estruturar_CriarBoard_di" bpmnElement="F_Estruturar_CriarBoard"><di:waypoint x="1720" y="95" /><di:waypoint x="1880" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_CriarBoard_Selecionar_di" bpmnElement="F_CriarBoard_Selecionar"><di:waypoint x="1880" y="395" /><di:waypoint x="2040" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Selecionar_Vincular_di" bpmnElement="F_Selecionar_Vincular"><di:waypoint x="2040" y="95" /><di:waypoint x="2200" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Vincular_Esbocos_di" bpmnElement="F_Vincular_Esbocos"><di:waypoint x="2200" y="395" /><di:waypoint x="2360" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Esbocos_Elaborar_di" bpmnElement="F_Esbocos_Elaborar"><di:waypoint x="2360" y="245" /><di:waypoint x="2520" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Elaborar_Checagem_di" bpmnElement="F_Elaborar_Checagem"><di:waypoint x="2520" y="95" /><di:waypoint x="2680" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Checagem_Revisao_di" bpmnElement="F_Checagem_Revisao"><di:waypoint x="2680" y="245" /><di:waypoint x="2840" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Revisao_RevisarComunicacao_di" bpmnElement="F_Revisao_RevisarComunicacao"><di:waypoint x="2840" y="95" /><di:waypoint x="3000" y="545" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_RevisarComunicacao_Endossar_di" bpmnElement="F_RevisarComunicacao_Endossar"><di:waypoint x="3000" y="545" /><di:waypoint x="3160" y="545" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Endossar_RevisarAlinhamento_di" bpmnElement="F_Endossar_RevisarAlinhamento"><di:waypoint x="3160" y="545" /><di:waypoint x="3320" y="695" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_RevisarAlinhamento_Gateway_di" bpmnElement="F_RevisarAlinhamento_Gateway"><di:waypoint x="3320" y="695" /><di:waypoint x="3445" y="695" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Gateway_Yes_Aprovar_di" bpmnElement="F_Gateway_Yes_Aprovar"><di:waypoint x="3445" y="695" /><di:waypoint x="3660" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Gateway_No_Reprovada_di" bpmnElement="F_Gateway_No_Reprovada"><di:waypoint x="3445" y="695" /><di:waypoint x="3598" y="695" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Aprovar_Registrar_di" bpmnElement="F_Aprovar_Registrar"><di:waypoint x="3660" y="95" /><di:waypoint x="3820" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Registrar_Compartilhar_di" bpmnElement="F_Registrar_Compartilhar"><di:waypoint x="3820" y="395" /><di:waypoint x="3980" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Compartilhar_End_di" bpmnElement="F_Compartilhar_End"><di:waypoint x="3980" y="395" /><di:waypoint x="4098" y="95" /></bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

const phases = [
  { name: 'Entrada', x: 80, width: 520 },
  { name: 'Mensagens-Chave', x: 600, width: 640 },
  { name: 'Ideacao Criativa', x: 1240, width: 640 },
  { name: 'Rascunhos de Conteudo', x: 1880, width: 640 },
  { name: 'Validacao & Governanca', x: 2520, width: 640 },
  { name: 'Saida', x: 3160, width: 980 }
];

const config = {
  zoom: 0.85,
  storageKey: 'subprocesso-3.3',
  startLabel: 'PERSONAS DEFINIDAS',
  endLabels: {
    End_Success: { text: 'RASCUNHOS ELABORADOS', className: 'end-label-success', marker: 'end-success' },
    End_EstrategiaReprovada: { text: 'ESTRATEGIA REPROVADA', className: 'end-label-lost' }
  },
  showDefaultEndLabel: false,
  useEndName: false,
  defaultEndLabelText: 'FIM',
  defaultEndClass: 'end-label-lost'
};

window.v5Data = window.v5Data || {};
window.v5Data['3.3'] = { diagramXML, nodeDetails, phases, ...config };
