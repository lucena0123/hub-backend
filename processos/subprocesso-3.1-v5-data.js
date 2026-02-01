const nodeDetails = {
  'Task_S_LevantarTermos': { sla: '4h', tag: 'Pesquisa', desc: 'Define termos semente com base em oferta, dores e variacoes.' },
  'Task_S_DefinirEstrategia': { sla: null, tag: 'Estrategia', desc: 'Define intencao, funil e proporcao de termos.' },
  'Task_S_RevisarLista': { sla: null, tag: 'Curadoria', desc: 'Remove termos irrelevantes da lista expandida.' },
  'Task_S_ValidarNegativas': { sla: null, tag: 'Refino', desc: 'Valida cauda longa e lista de negativas.' },
  'Task_S_Clusterizar': { sla: null, tag: 'Clusters', desc: 'Organiza palavras por intencao e funil.' },
  'Task_S_AprovarLista': { sla: '48h', tag: 'Aprovacao', desc: 'Aprova lista final de palavras-chave.' },
  'Task_I_GerarTermos': { sla: null, tag: 'Semente', desc: 'IA gera termos semente com base no nicho.' },
  'Task_I_ExpandirCaudaLonga': { sla: null, tag: 'Expansao', desc: 'IA expande lista com cauda longa e variacoes.' },
  'Task_I_ClassificarIntencao': { sla: null, tag: 'Intencao', desc: 'Classifica termos por intencao e funil.' },
  'Task_I_SugerirNegativas': { sla: null, tag: 'Negativas', desc: 'Sugere palavras negativas relevantes.' },
  'Task_I_SugerirClusters': { sla: null, tag: 'Clusters', desc: 'Sugere clusters tematicos para grupos de anuncios.' },
  'Task_I_AlertasRisco': { sla: null, tag: 'Riscos', desc: 'Aponta termos sensiveis ou com risco de politica.' },
  'Task_A_ColetarVolume': { sla: null, tag: 'Metricas', desc: 'Coleta volume, CPC e competicao nas ferramentas.' },
  'Task_A_ConsolidarLista': { sla: null, tag: 'Base', desc: 'Consolida lista em planilha ou Notion.' },
  'Task_A_CriarVisoes': { sla: null, tag: 'Visoes', desc: 'Cria visoes por cluster e intencao.' },
  'Task_A_CompartilharLista': { sla: null, tag: 'Compartilhar', desc: 'Compartilha lista final com o time.' },
  'Task_C_RevisarTermos': { sla: null, tag: 'Revisao', desc: 'Cliente revisa termos sensiveis quando necessario.' },
  'Task_C_EndossarIntencao': { sla: null, tag: 'Aprovacao', desc: 'Cliente endossa estrategia de intencao.' },
  'Task_R_RevisarCobertura': { sla: null, tag: 'Cobertura', desc: 'Revisa cobertura de mercado e termos principais.' },
  'Task_R_ValidarPoliticas': { sla: null, tag: 'Politicas', desc: 'Valida riscos de politicas das plataformas.' }
};

const diagramXML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_31_V5" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_31_V5">
    <bpmn:participant id="Participant_31_V5" name="Pesquisa de Palavras-chave" processRef="Process_31_V5" />
  </bpmn:collaboration>
  <bpmn:process id="Process_31_V5" isExecutable="false">
    <bpmn:laneSet id="LaneSet_31_V5">
      <bpmn:lane id="Lane_Strategy" name="Estrategia / Planejamento">
        <bpmn:flowNodeRef>Start_Metas</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_LevantarTermos</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_DefinirEstrategia</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_RevisarLista</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_ValidarNegativas</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_Clusterizar</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_AprovarLista</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_Success</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_IA" name="IA & Insights">
        <bpmn:flowNodeRef>Task_I_GerarTermos</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_ExpandirCaudaLonga</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_ClassificarIntencao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_SugerirNegativas</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_SugerirClusters</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_AlertasRisco</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Auto" name="Automacao / Ferramentas">
        <bpmn:flowNodeRef>Task_A_ColetarVolume</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_ConsolidarLista</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_CriarVisoes</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_CompartilharLista</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Cliente" name="Cliente">
        <bpmn:flowNodeRef>Task_C_RevisarTermos</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_C_EndossarIntencao</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Gestao" name="Gestao / Direcao">
        <bpmn:flowNodeRef>Gateway_VolumeSuficiente</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_PoucoVolume</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_R_RevisarCobertura</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_R_ValidarPoliticas</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>

    <bpmn:startEvent id="Start_Metas" name="Metas Definidas">
      <bpmn:outgoing>F_Start_Levantar</bpmn:outgoing>
    </bpmn:startEvent>

    <bpmn:task id="Task_S_LevantarTermos" name="1. Levantar Termos Semente">
      <bpmn:incoming>F_Start_Levantar</bpmn:incoming>
      <bpmn:outgoing>F_Levantar_GerarIA</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_I_GerarTermos" name="Gerar Termos Semente (IA)">
      <bpmn:incoming>F_Levantar_GerarIA</bpmn:incoming>
      <bpmn:outgoing>F_GerarIA_Definir</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_S_DefinirEstrategia" name="2. Definir Estrategia de Intencao">
      <bpmn:incoming>F_GerarIA_Definir</bpmn:incoming>
      <bpmn:outgoing>F_Definir_ExpandirIA</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_I_ExpandirCaudaLonga" name="Expandir Lista com Cauda Longa">
      <bpmn:incoming>F_Definir_ExpandirIA</bpmn:incoming>
      <bpmn:outgoing>F_ExpandirIA_Coletar</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_A_ColetarVolume" name="Coletar Volume, CPC e Competicao">
      <bpmn:incoming>F_ExpandirIA_Coletar</bpmn:incoming>
      <bpmn:outgoing>F_Coletar_Gateway</bpmn:outgoing>
    </bpmn:task>

    <bpmn:exclusiveGateway id="Gateway_VolumeSuficiente" name="Volume suficiente?">
      <bpmn:incoming>F_Coletar_Gateway</bpmn:incoming>
      <bpmn:outgoing>F_Gateway_Yes_Revisar</bpmn:outgoing>
      <bpmn:outgoing>F_Gateway_No_PoucoVolume</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <bpmn:endEvent id="End_PoucoVolume" name="Fim Mercado com Pouco Volume">
      <bpmn:incoming>F_Gateway_No_PoucoVolume</bpmn:incoming>
    </bpmn:endEvent>

    <bpmn:task id="Task_S_RevisarLista" name="3. Revisar Lista Expandida">
      <bpmn:incoming>F_Gateway_Yes_Revisar</bpmn:incoming>
      <bpmn:outgoing>F_Revisar_ClassificarIA</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_I_ClassificarIntencao" name="Classificar Intencao e Funil">
      <bpmn:incoming>F_Revisar_ClassificarIA</bpmn:incoming>
      <bpmn:outgoing>F_Classificar_SugerirNeg</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_I_SugerirNegativas" name="Sugerir Palavras Negativas">
      <bpmn:incoming>F_Classificar_SugerirNeg</bpmn:incoming>
      <bpmn:outgoing>F_SugerirNeg_Validar</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_S_ValidarNegativas" name="4. Validar Cauda Longa e Negativas">
      <bpmn:incoming>F_SugerirNeg_Validar</bpmn:incoming>
      <bpmn:outgoing>F_Validar_RevisarCliente</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_C_RevisarTermos" name="Revisar Termos Sensiveis">
      <bpmn:incoming>F_Validar_RevisarCliente</bpmn:incoming>
      <bpmn:outgoing>F_RevisarCliente_Endossar</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_C_EndossarIntencao" name="Endossar Estrategia de Intencao">
      <bpmn:incoming>F_RevisarCliente_Endossar</bpmn:incoming>
      <bpmn:outgoing>F_Endossar_Clusters</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_I_SugerirClusters" name="Sugerir Clusters Tematicos">
      <bpmn:incoming>F_Endossar_Clusters</bpmn:incoming>
      <bpmn:outgoing>F_SugerirClusters_Clusterizar</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_S_Clusterizar" name="5. Clusterizar por Intencao">
      <bpmn:incoming>F_SugerirClusters_Clusterizar</bpmn:incoming>
      <bpmn:outgoing>F_Clusterizar_Consolidar</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_A_ConsolidarLista" name="Consolidar Lista em Planilha">
      <bpmn:incoming>F_Clusterizar_Consolidar</bpmn:incoming>
      <bpmn:outgoing>F_Consolidar_Visoes</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_A_CriarVisoes" name="Criar Visoes por Cluster">
      <bpmn:incoming>F_Consolidar_Visoes</bpmn:incoming>
      <bpmn:outgoing>F_Visoes_RevisarCobertura</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_R_RevisarCobertura" name="Revisar Cobertura de Mercado">
      <bpmn:incoming>F_Visoes_RevisarCobertura</bpmn:incoming>
      <bpmn:outgoing>F_RevisarCobertura_AlertasRisco</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_I_AlertasRisco" name="Apontar Termos de Risco">
      <bpmn:incoming>F_RevisarCobertura_AlertasRisco</bpmn:incoming>
      <bpmn:outgoing>F_AlertasRisco_ValidarPoliticas</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_R_ValidarPoliticas" name="Validar Riscos de Politica">
      <bpmn:incoming>F_AlertasRisco_ValidarPoliticas</bpmn:incoming>
      <bpmn:outgoing>F_ValidarPoliticas_Aprovar</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_S_AprovarLista" name="6. Aprovar Lista Final">
      <bpmn:incoming>F_ValidarPoliticas_Aprovar</bpmn:incoming>
      <bpmn:outgoing>F_Aprovar_Compartilhar</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_A_CompartilharLista" name="Compartilhar Lista com Time">
      <bpmn:incoming>F_Aprovar_Compartilhar</bpmn:incoming>
      <bpmn:outgoing>F_Compartilhar_End</bpmn:outgoing>
    </bpmn:task>

    <bpmn:endEvent id="End_Success" name="Lista Finalizada">
      <bpmn:incoming>F_Compartilhar_End</bpmn:incoming>
    </bpmn:endEvent>

    <bpmn:sequenceFlow id="F_Start_Levantar" sourceRef="Start_Metas" targetRef="Task_S_LevantarTermos" />
    <bpmn:sequenceFlow id="F_Levantar_GerarIA" sourceRef="Task_S_LevantarTermos" targetRef="Task_I_GerarTermos" />
    <bpmn:sequenceFlow id="F_GerarIA_Definir" sourceRef="Task_I_GerarTermos" targetRef="Task_S_DefinirEstrategia" />
    <bpmn:sequenceFlow id="F_Definir_ExpandirIA" sourceRef="Task_S_DefinirEstrategia" targetRef="Task_I_ExpandirCaudaLonga" />
    <bpmn:sequenceFlow id="F_ExpandirIA_Coletar" sourceRef="Task_I_ExpandirCaudaLonga" targetRef="Task_A_ColetarVolume" />
    <bpmn:sequenceFlow id="F_Coletar_Gateway" sourceRef="Task_A_ColetarVolume" targetRef="Gateway_VolumeSuficiente" />
    <bpmn:sequenceFlow id="F_Gateway_Yes_Revisar" name="Sim" sourceRef="Gateway_VolumeSuficiente" targetRef="Task_S_RevisarLista" />
    <bpmn:sequenceFlow id="F_Gateway_No_PoucoVolume" name="Nao" sourceRef="Gateway_VolumeSuficiente" targetRef="End_PoucoVolume" />
    <bpmn:sequenceFlow id="F_Revisar_ClassificarIA" sourceRef="Task_S_RevisarLista" targetRef="Task_I_ClassificarIntencao" />
    <bpmn:sequenceFlow id="F_Classificar_SugerirNeg" sourceRef="Task_I_ClassificarIntencao" targetRef="Task_I_SugerirNegativas" />
    <bpmn:sequenceFlow id="F_SugerirNeg_Validar" sourceRef="Task_I_SugerirNegativas" targetRef="Task_S_ValidarNegativas" />
    <bpmn:sequenceFlow id="F_Validar_RevisarCliente" sourceRef="Task_S_ValidarNegativas" targetRef="Task_C_RevisarTermos" />
    <bpmn:sequenceFlow id="F_RevisarCliente_Endossar" sourceRef="Task_C_RevisarTermos" targetRef="Task_C_EndossarIntencao" />
    <bpmn:sequenceFlow id="F_Endossar_Clusters" sourceRef="Task_C_EndossarIntencao" targetRef="Task_I_SugerirClusters" />
    <bpmn:sequenceFlow id="F_SugerirClusters_Clusterizar" sourceRef="Task_I_SugerirClusters" targetRef="Task_S_Clusterizar" />
    <bpmn:sequenceFlow id="F_Clusterizar_Consolidar" sourceRef="Task_S_Clusterizar" targetRef="Task_A_ConsolidarLista" />
    <bpmn:sequenceFlow id="F_Consolidar_Visoes" sourceRef="Task_A_ConsolidarLista" targetRef="Task_A_CriarVisoes" />
    <bpmn:sequenceFlow id="F_Visoes_RevisarCobertura" sourceRef="Task_A_CriarVisoes" targetRef="Task_R_RevisarCobertura" />
    <bpmn:sequenceFlow id="F_RevisarCobertura_AlertasRisco" sourceRef="Task_R_RevisarCobertura" targetRef="Task_I_AlertasRisco" />
    <bpmn:sequenceFlow id="F_AlertasRisco_ValidarPoliticas" sourceRef="Task_I_AlertasRisco" targetRef="Task_R_ValidarPoliticas" />
    <bpmn:sequenceFlow id="F_ValidarPoliticas_Aprovar" sourceRef="Task_R_ValidarPoliticas" targetRef="Task_S_AprovarLista" />
    <bpmn:sequenceFlow id="F_Aprovar_Compartilhar" sourceRef="Task_S_AprovarLista" targetRef="Task_A_CompartilharLista" />
    <bpmn:sequenceFlow id="F_Compartilhar_End" sourceRef="Task_A_CompartilharLista" targetRef="End_Success" />
  </bpmn:process>

  <bpmndi:BPMNDiagram id="BPMNDiagram_31_V5">
    <bpmndi:BPMNPlane id="BPMNPlane_31_V5" bpmnElement="Collaboration_31_V5">
      <bpmndi:BPMNShape id="Participant_31_V5_di" bpmnElement="Participant_31_V5" isHorizontal="true">
        <dc:Bounds x="50" y="20" width="4000" height="750" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Strategy_di" bpmnElement="Lane_Strategy" isHorizontal="true">
        <dc:Bounds x="80" y="20" width="3970" height="150" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_IA_di" bpmnElement="Lane_IA" isHorizontal="true">
        <dc:Bounds x="80" y="170" width="3970" height="150" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Auto_di" bpmnElement="Lane_Auto" isHorizontal="true">
        <dc:Bounds x="80" y="320" width="3970" height="150" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Cliente_di" bpmnElement="Lane_Cliente" isHorizontal="true">
        <dc:Bounds x="80" y="470" width="3970" height="150" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Gestao_di" bpmnElement="Lane_Gestao" isHorizontal="true">
        <dc:Bounds x="80" y="620" width="3970" height="150" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Start_Metas_di" bpmnElement="Start_Metas">
        <dc:Bounds x="120" y="77" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_LevantarTermos_di" bpmnElement="Task_S_LevantarTermos">
        <dc:Bounds x="220" y="55" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_GerarTermos_di" bpmnElement="Task_I_GerarTermos">
        <dc:Bounds x="380" y="205" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_DefinirEstrategia_di" bpmnElement="Task_S_DefinirEstrategia">
        <dc:Bounds x="540" y="55" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_ExpandirCaudaLonga_di" bpmnElement="Task_I_ExpandirCaudaLonga">
        <dc:Bounds x="700" y="205" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_ColetarVolume_di" bpmnElement="Task_A_ColetarVolume">
        <dc:Bounds x="860" y="355" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_VolumeSuficiente_di" bpmnElement="Gateway_VolumeSuficiente" isMarkerVisible="true">
        <dc:Bounds x="1020" y="670" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_PoucoVolume_di" bpmnElement="End_PoucoVolume">
        <dc:Bounds x="1180" y="677" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_RevisarLista_di" bpmnElement="Task_S_RevisarLista">
        <dc:Bounds x="1180" y="55" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_ClassificarIntencao_di" bpmnElement="Task_I_ClassificarIntencao">
        <dc:Bounds x="1340" y="205" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_SugerirNegativas_di" bpmnElement="Task_I_SugerirNegativas">
        <dc:Bounds x="1500" y="205" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_ValidarNegativas_di" bpmnElement="Task_S_ValidarNegativas">
        <dc:Bounds x="1660" y="55" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_RevisarTermos_di" bpmnElement="Task_C_RevisarTermos">
        <dc:Bounds x="1820" y="505" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_EndossarIntencao_di" bpmnElement="Task_C_EndossarIntencao">
        <dc:Bounds x="1980" y="505" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_SugerirClusters_di" bpmnElement="Task_I_SugerirClusters">
        <dc:Bounds x="2140" y="205" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_Clusterizar_di" bpmnElement="Task_S_Clusterizar">
        <dc:Bounds x="2300" y="55" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_ConsolidarLista_di" bpmnElement="Task_A_ConsolidarLista">
        <dc:Bounds x="2460" y="355" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_CriarVisoes_di" bpmnElement="Task_A_CriarVisoes">
        <dc:Bounds x="2620" y="355" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_R_RevisarCobertura_di" bpmnElement="Task_R_RevisarCobertura">
        <dc:Bounds x="2780" y="655" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_AlertasRisco_di" bpmnElement="Task_I_AlertasRisco">
        <dc:Bounds x="2940" y="205" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_R_ValidarPoliticas_di" bpmnElement="Task_R_ValidarPoliticas">
        <dc:Bounds x="3100" y="655" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_AprovarLista_di" bpmnElement="Task_S_AprovarLista">
        <dc:Bounds x="3260" y="55" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_CompartilharLista_di" bpmnElement="Task_A_CompartilharLista">
        <dc:Bounds x="3420" y="355" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_Success_di" bpmnElement="End_Success">
        <dc:Bounds x="3600" y="77" width="36" height="36" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNEdge id="F_Start_Levantar_di" bpmnElement="F_Start_Levantar">
        <di:waypoint x="138" y="95" />
        <di:waypoint x="280" y="95" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Levantar_GerarIA_di" bpmnElement="F_Levantar_GerarIA">
        <di:waypoint x="280" y="95" />
        <di:waypoint x="440" y="245" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_GerarIA_Definir_di" bpmnElement="F_GerarIA_Definir">
        <di:waypoint x="440" y="245" />
        <di:waypoint x="600" y="95" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Definir_ExpandirIA_di" bpmnElement="F_Definir_ExpandirIA">
        <di:waypoint x="600" y="95" />
        <di:waypoint x="760" y="245" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_ExpandirIA_Coletar_di" bpmnElement="F_ExpandirIA_Coletar">
        <di:waypoint x="760" y="245" />
        <di:waypoint x="920" y="395" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Coletar_Gateway_di" bpmnElement="F_Coletar_Gateway">
        <di:waypoint x="920" y="395" />
        <di:waypoint x="1045" y="695" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Gateway_Yes_Revisar_di" bpmnElement="F_Gateway_Yes_Revisar">
        <di:waypoint x="1045" y="695" />
        <di:waypoint x="1240" y="95" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Gateway_No_PoucoVolume_di" bpmnElement="F_Gateway_No_PoucoVolume">
        <di:waypoint x="1045" y="695" />
        <di:waypoint x="1198" y="695" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Revisar_ClassificarIA_di" bpmnElement="F_Revisar_ClassificarIA">
        <di:waypoint x="1240" y="95" />
        <di:waypoint x="1400" y="245" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Classificar_SugerirNeg_di" bpmnElement="F_Classificar_SugerirNeg">
        <di:waypoint x="1400" y="245" />
        <di:waypoint x="1560" y="245" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_SugerirNeg_Validar_di" bpmnElement="F_SugerirNeg_Validar">
        <di:waypoint x="1560" y="245" />
        <di:waypoint x="1720" y="95" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Validar_RevisarCliente_di" bpmnElement="F_Validar_RevisarCliente">
        <di:waypoint x="1720" y="95" />
        <di:waypoint x="1880" y="545" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_RevisarCliente_Endossar_di" bpmnElement="F_RevisarCliente_Endossar">
        <di:waypoint x="1880" y="545" />
        <di:waypoint x="2040" y="545" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Endossar_Clusters_di" bpmnElement="F_Endossar_Clusters">
        <di:waypoint x="2040" y="545" />
        <di:waypoint x="2200" y="245" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_SugerirClusters_Clusterizar_di" bpmnElement="F_SugerirClusters_Clusterizar">
        <di:waypoint x="2200" y="245" />
        <di:waypoint x="2360" y="95" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Clusterizar_Consolidar_di" bpmnElement="F_Clusterizar_Consolidar">
        <di:waypoint x="2360" y="95" />
        <di:waypoint x="2520" y="395" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Consolidar_Visoes_di" bpmnElement="F_Consolidar_Visoes">
        <di:waypoint x="2520" y="395" />
        <di:waypoint x="2680" y="395" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Visoes_RevisarCobertura_di" bpmnElement="F_Visoes_RevisarCobertura">
        <di:waypoint x="2680" y="395" />
        <di:waypoint x="2840" y="695" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_RevisarCobertura_AlertasRisco_di" bpmnElement="F_RevisarCobertura_AlertasRisco">
        <di:waypoint x="2840" y="695" />
        <di:waypoint x="3000" y="245" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_AlertasRisco_ValidarPoliticas_di" bpmnElement="F_AlertasRisco_ValidarPoliticas">
        <di:waypoint x="3000" y="245" />
        <di:waypoint x="3160" y="695" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_ValidarPoliticas_Aprovar_di" bpmnElement="F_ValidarPoliticas_Aprovar">
        <di:waypoint x="3160" y="695" />
        <di:waypoint x="3320" y="95" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Aprovar_Compartilhar_di" bpmnElement="F_Aprovar_Compartilhar">
        <di:waypoint x="3320" y="95" />
        <di:waypoint x="3480" y="395" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Compartilhar_End_di" bpmnElement="F_Compartilhar_End">
        <di:waypoint x="3480" y="395" />
        <di:waypoint x="3618" y="95" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

const phases = [
  { name: 'Entrada', x: 80, width: 520 },
  { name: 'Pesquisa', x: 600, width: 640 },
  { name: 'Expansao', x: 1240, width: 640 },
  { name: 'Refinamento', x: 1880, width: 640 },
  { name: 'Clusterizacao', x: 2520, width: 640 },
  { name: 'Saida', x: 3160, width: 780 }
];

const config = {
  zoom: 0.85,
  storageKey: 'subprocesso-3.1',
  startLabel: 'METAS DEFINIDAS',
  endLabels: {
    End_Success: { text: 'LISTA FINALIZADA', className: 'end-label-success', marker: 'end-success' },
    End_PoucoVolume: { text: 'MERCADO COM POUCO VOLUME', className: 'end-label-lost' }
  },
  showDefaultEndLabel: false,
  useEndName: false,
  defaultEndLabelText: 'FIM',
  defaultEndClass: 'end-label-lost'
};

window.v5Data = window.v5Data || {};
window.v5Data['3.1'] = { diagramXML, nodeDetails, phases, ...config };
