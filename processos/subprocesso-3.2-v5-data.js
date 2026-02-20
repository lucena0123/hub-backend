const nodeDetails = {
  'Task_S_RevisarMetas': { sla: '4h', tag: 'Contexto', desc: 'Revisa metas, mercado e keywords para contexto de publico.' },
  'Task_S_AnalisarDados': { sla: null, tag: 'Dados', desc: 'Analisa base de clientes, leads e reunioes.' },
  'Task_S_MapearDor': { sla: null, tag: 'Psicografia', desc: 'Mapeia dores, desejos e objecoes principais.' },
  'Task_S_DesenharJornada': { sla: null, tag: 'Jornada', desc: 'Desenha jornada do cliente e pontos de contato.' },
  'Task_S_CriarPersonaPrincipal': { sla: null, tag: 'Persona', desc: 'Cria persona compradora principal.' },
  'Task_S_CriarPersonasComplementares': { sla: null, tag: 'Personas+', desc: 'Cria personas secundarias e anti-persona.' },
  'Task_S_ConsolidarGuia': { sla: '72h', tag: 'Documento', desc: 'Consolida guia de personas com detalhes e implicacoes.' },
  'Task_S_AprovarPersonas': { sla: null, tag: 'Aprovacao', desc: 'Aprova personas para campanhas.' },
  'Task_I_ClusterLinguagem': { sla: null, tag: 'Linguagem', desc: 'Clusteriza linguagem e intencao nas keywords.' },
  'Task_I_PadroesClientes': { sla: null, tag: 'Padroes', desc: 'Extrai padroes de clientes reais e motivos de compra.' },
  'Task_I_MapaDor': { sla: null, tag: 'Mapa', desc: 'Gera mapa de dores, desejos e objecoes.' },
  'Task_I_RascunhosPersonas': { sla: null, tag: 'Draft', desc: 'Cria rascunhos de personas com IA.' },
  'Task_I_VoiceTone': { sla: null, tag: 'Voz', desc: 'Define voice & tone por persona.' },
  'Task_I_SumarioExecutivo': { sla: null, tag: 'Sumario', desc: 'Gera sumario executivo para time e cliente.' },
  'Task_A_IntegrarCRM': { sla: null, tag: 'Coleta', desc: 'Integra dados de CRM e formularios.' },
  'Task_A_NormalizarDados': { sla: null, tag: 'Limpeza', desc: 'Normaliza e anonimiza dados sensiveis.' },
  'Task_A_AtualizarBase': { sla: null, tag: 'Base', desc: 'Atualiza base de personas em Notion/Docs.' },
  'Task_A_CompartilharGuia': { sla: null, tag: 'Compartilhar', desc: 'Compartilha guia com planejamento e criativos.' },
  'Task_C_ContribuirInsights': { sla: null, tag: 'Input', desc: 'Cliente contribui com insights de campo.' },
  'Task_C_RevisarPersonas': { sla: null, tag: 'Revisao', desc: 'Cliente revisa personas apresentadas.' },
  'Task_C_EndossarGuia': { sla: null, tag: 'Endosso', desc: 'Cliente endossa guia de personas.' },
  'Task_R_RevisarCoerencia': { sla: null, tag: 'Coerencia', desc: 'Revisa coerencia estrategica das personas.' }
};

const diagramXML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_32_V5" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_32_V5">
    <bpmn:participant id="Participant_32_V5" name="Definicao de Publico-Alvo" processRef="Process_32_V5" />
  </bpmn:collaboration>
  <bpmn:process id="Process_32_V5" isExecutable="false">
    <bpmn:laneSet id="LaneSet_32_V5">
      <bpmn:lane id="Lane_Strategy" name="Estrategia / Planejamento">
        <bpmn:flowNodeRef>Start_Keywords</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_RevisarMetas</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_AnalisarDados</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_MapearDor</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_DesenharJornada</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_CriarPersonaPrincipal</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_CriarPersonasComplementares</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_ConsolidarGuia</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_AprovarPersonas</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_Success</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_IA" name="IA & Insights">
        <bpmn:flowNodeRef>Task_I_ClusterLinguagem</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_PadroesClientes</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_MapaDor</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_RascunhosPersonas</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_VoiceTone</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_SumarioExecutivo</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Auto" name="Automacao / Dados">
        <bpmn:flowNodeRef>Task_A_IntegrarCRM</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_NormalizarDados</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_AtualizarBase</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_CompartilharGuia</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Cliente" name="Cliente">
        <bpmn:flowNodeRef>Task_C_ContribuirInsights</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_C_RevisarPersonas</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_C_EndossarGuia</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Gestao" name="Gestao / Direcao">
        <bpmn:flowNodeRef>Task_R_RevisarCoerencia</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_PersonasViaveis</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_PersonasInviaveis</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>

    <bpmn:startEvent id="Start_Keywords" name="Keywords Definidas">
      <bpmn:outgoing>F_Start_Revisar</bpmn:outgoing>
    </bpmn:startEvent>

    <bpmn:task id="Task_S_RevisarMetas" name="1. Revisar Metas, Mercado e Keywords">
      <bpmn:incoming>F_Start_Revisar</bpmn:incoming>
      <bpmn:outgoing>F_Revisar_IntegrarCRM</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_A_IntegrarCRM" name="Integrar Dados de CRM">
      <bpmn:incoming>F_Revisar_IntegrarCRM</bpmn:incoming>
      <bpmn:outgoing>F_Integrar_Normalizar</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_A_NormalizarDados" name="Normalizar Dados">
      <bpmn:incoming>F_Integrar_Normalizar</bpmn:incoming>
      <bpmn:outgoing>F_Normalizar_PadroesIA</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_I_PadroesClientes" name="Extrair Padroes de Clientes Reais">
      <bpmn:incoming>F_Normalizar_PadroesIA</bpmn:incoming>
      <bpmn:outgoing>F_Padroes_AnalisarDados</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_S_AnalisarDados" name="2. Analisar Dados de Clientes e Leads">
      <bpmn:incoming>F_Padroes_AnalisarDados</bpmn:incoming>
      <bpmn:outgoing>F_Analisar_ClusterLinguagem</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_I_ClusterLinguagem" name="Clusterizar Linguagem e Intencao">
      <bpmn:incoming>F_Analisar_ClusterLinguagem</bpmn:incoming>
      <bpmn:outgoing>F_ClusterLinguagem_MapaDor</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_I_MapaDor" name="Gerar Mapa de Dor e Desejos">
      <bpmn:incoming>F_ClusterLinguagem_MapaDor</bpmn:incoming>
      <bpmn:outgoing>F_MapaDor_MapearDor</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_S_MapearDor" name="3. Mapear Dor, Desejos e Objecoes">
      <bpmn:incoming>F_MapaDor_MapearDor</bpmn:incoming>
      <bpmn:outgoing>F_Mapear_Jornada</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_S_DesenharJornada" name="4. Desenhar Jornada do Cliente">
      <bpmn:incoming>F_Mapear_Jornada</bpmn:incoming>
      <bpmn:outgoing>F_Jornada_Contribuir</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_C_ContribuirInsights" name="Contribuir com Insights">
      <bpmn:incoming>F_Jornada_Contribuir</bpmn:incoming>
      <bpmn:outgoing>F_Contribuir_Rascunhos</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_I_RascunhosPersonas" name="Criar Rascunhos de Personas">
      <bpmn:incoming>F_Contribuir_Rascunhos</bpmn:incoming>
      <bpmn:outgoing>F_Rascunhos_PersonaPrincipal</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_S_CriarPersonaPrincipal" name="5. Criar Persona Principal">
      <bpmn:incoming>F_Rascunhos_PersonaPrincipal</bpmn:incoming>
      <bpmn:outgoing>F_PersonaPrincipal_PersonasComp</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_S_CriarPersonasComplementares" name="6. Criar Personas Complementares">
      <bpmn:incoming>F_PersonaPrincipal_PersonasComp</bpmn:incoming>
      <bpmn:outgoing>F_PersonasComp_VoiceTone</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_I_VoiceTone" name="Definir Voice e Tone">
      <bpmn:incoming>F_PersonasComp_VoiceTone</bpmn:incoming>
      <bpmn:outgoing>F_VoiceTone_Sumario</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_I_SumarioExecutivo" name="Gerar Sumario Executivo">
      <bpmn:incoming>F_VoiceTone_Sumario</bpmn:incoming>
      <bpmn:outgoing>F_Sumario_Consolidar</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_S_ConsolidarGuia" name="7. Consolidar Guia de Personas">
      <bpmn:incoming>F_Sumario_Consolidar</bpmn:incoming>
      <bpmn:outgoing>F_Consolidar_AtualizarBase</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_A_AtualizarBase" name="Atualizar Base de Personas">
      <bpmn:incoming>F_Consolidar_AtualizarBase</bpmn:incoming>
      <bpmn:outgoing>F_AtualizarBase_RevisarPersonas</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_C_RevisarPersonas" name="Revisar Personas">
      <bpmn:incoming>F_AtualizarBase_RevisarPersonas</bpmn:incoming>
      <bpmn:outgoing>F_RevisarPersonas_RevisarCoerencia</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_R_RevisarCoerencia" name="Revisar Coerencia Estrategica">
      <bpmn:incoming>F_RevisarPersonas_RevisarCoerencia</bpmn:incoming>
      <bpmn:outgoing>F_RevisarCoerencia_Gateway</bpmn:outgoing>
    </bpmn:task>

    <bpmn:exclusiveGateway id="Gateway_PersonasViaveis" name="Personas viaveis?">
      <bpmn:incoming>F_RevisarCoerencia_Gateway</bpmn:incoming>
      <bpmn:outgoing>F_Gateway_Yes_Aprovar</bpmn:outgoing>
      <bpmn:outgoing>F_Gateway_No_Inviaveis</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <bpmn:endEvent id="End_PersonasInviaveis" name="Fim Personas Inviaveis">
      <bpmn:incoming>F_Gateway_No_Inviaveis</bpmn:incoming>
    </bpmn:endEvent>

    <bpmn:task id="Task_S_AprovarPersonas" name="8. Aprovar Personas">
      <bpmn:incoming>F_Gateway_Yes_Aprovar</bpmn:incoming>
      <bpmn:outgoing>F_Aprovar_Compartilhar</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_A_CompartilharGuia" name="Compartilhar Guia">
      <bpmn:incoming>F_Aprovar_Compartilhar</bpmn:incoming>
      <bpmn:outgoing>F_Compartilhar_Endossar</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_C_EndossarGuia" name="Endossar Guia de Personas">
      <bpmn:incoming>F_Compartilhar_Endossar</bpmn:incoming>
      <bpmn:outgoing>F_Endossar_End</bpmn:outgoing>
    </bpmn:task>

    <bpmn:endEvent id="End_Success" name="Personas Definidas">
      <bpmn:incoming>F_Endossar_End</bpmn:incoming>
    </bpmn:endEvent>

    <bpmn:sequenceFlow id="F_Start_Revisar" sourceRef="Start_Keywords" targetRef="Task_S_RevisarMetas" />
    <bpmn:sequenceFlow id="F_Revisar_IntegrarCRM" sourceRef="Task_S_RevisarMetas" targetRef="Task_A_IntegrarCRM" />
    <bpmn:sequenceFlow id="F_Integrar_Normalizar" sourceRef="Task_A_IntegrarCRM" targetRef="Task_A_NormalizarDados" />
    <bpmn:sequenceFlow id="F_Normalizar_PadroesIA" sourceRef="Task_A_NormalizarDados" targetRef="Task_I_PadroesClientes" />
    <bpmn:sequenceFlow id="F_Padroes_AnalisarDados" sourceRef="Task_I_PadroesClientes" targetRef="Task_S_AnalisarDados" />
    <bpmn:sequenceFlow id="F_Analisar_ClusterLinguagem" sourceRef="Task_S_AnalisarDados" targetRef="Task_I_ClusterLinguagem" />
    <bpmn:sequenceFlow id="F_ClusterLinguagem_MapaDor" sourceRef="Task_I_ClusterLinguagem" targetRef="Task_I_MapaDor" />
    <bpmn:sequenceFlow id="F_MapaDor_MapearDor" sourceRef="Task_I_MapaDor" targetRef="Task_S_MapearDor" />
    <bpmn:sequenceFlow id="F_Mapear_Jornada" sourceRef="Task_S_MapearDor" targetRef="Task_S_DesenharJornada" />
    <bpmn:sequenceFlow id="F_Jornada_Contribuir" sourceRef="Task_S_DesenharJornada" targetRef="Task_C_ContribuirInsights" />
    <bpmn:sequenceFlow id="F_Contribuir_Rascunhos" sourceRef="Task_C_ContribuirInsights" targetRef="Task_I_RascunhosPersonas" />
    <bpmn:sequenceFlow id="F_Rascunhos_PersonaPrincipal" sourceRef="Task_I_RascunhosPersonas" targetRef="Task_S_CriarPersonaPrincipal" />
    <bpmn:sequenceFlow id="F_PersonaPrincipal_PersonasComp" sourceRef="Task_S_CriarPersonaPrincipal" targetRef="Task_S_CriarPersonasComplementares" />
    <bpmn:sequenceFlow id="F_PersonasComp_VoiceTone" sourceRef="Task_S_CriarPersonasComplementares" targetRef="Task_I_VoiceTone" />
    <bpmn:sequenceFlow id="F_VoiceTone_Sumario" sourceRef="Task_I_VoiceTone" targetRef="Task_I_SumarioExecutivo" />
    <bpmn:sequenceFlow id="F_Sumario_Consolidar" sourceRef="Task_I_SumarioExecutivo" targetRef="Task_S_ConsolidarGuia" />
    <bpmn:sequenceFlow id="F_Consolidar_AtualizarBase" sourceRef="Task_S_ConsolidarGuia" targetRef="Task_A_AtualizarBase" />
    <bpmn:sequenceFlow id="F_AtualizarBase_RevisarPersonas" sourceRef="Task_A_AtualizarBase" targetRef="Task_C_RevisarPersonas" />
    <bpmn:sequenceFlow id="F_RevisarPersonas_RevisarCoerencia" sourceRef="Task_C_RevisarPersonas" targetRef="Task_R_RevisarCoerencia" />
    <bpmn:sequenceFlow id="F_RevisarCoerencia_Gateway" sourceRef="Task_R_RevisarCoerencia" targetRef="Gateway_PersonasViaveis" />
    <bpmn:sequenceFlow id="F_Gateway_Yes_Aprovar" name="Sim" sourceRef="Gateway_PersonasViaveis" targetRef="Task_S_AprovarPersonas" />
    <bpmn:sequenceFlow id="F_Gateway_No_Inviaveis" name="Nao" sourceRef="Gateway_PersonasViaveis" targetRef="End_PersonasInviaveis" />
    <bpmn:sequenceFlow id="F_Aprovar_Compartilhar" sourceRef="Task_S_AprovarPersonas" targetRef="Task_A_CompartilharGuia" />
    <bpmn:sequenceFlow id="F_Compartilhar_Endossar" sourceRef="Task_A_CompartilharGuia" targetRef="Task_C_EndossarGuia" />
    <bpmn:sequenceFlow id="F_Endossar_End" sourceRef="Task_C_EndossarGuia" targetRef="End_Success" />
  </bpmn:process>

  <bpmndi:BPMNDiagram id="BPMNDiagram_32_V5">
    <bpmndi:BPMNPlane id="BPMNPlane_32_V5" bpmnElement="Collaboration_32_V5">
      <bpmndi:BPMNShape id="Participant_32_V5_di" bpmnElement="Participant_32_V5" isHorizontal="true"><dc:Bounds x="50" y="20" width="4200" height="750" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Strategy_di" bpmnElement="Lane_Strategy" isHorizontal="true"><dc:Bounds x="80" y="20" width="4170" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_IA_di" bpmnElement="Lane_IA" isHorizontal="true"><dc:Bounds x="80" y="170" width="4170" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Auto_di" bpmnElement="Lane_Auto" isHorizontal="true"><dc:Bounds x="80" y="320" width="4170" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Cliente_di" bpmnElement="Lane_Cliente" isHorizontal="true"><dc:Bounds x="80" y="470" width="4170" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Gestao_di" bpmnElement="Lane_Gestao" isHorizontal="true"><dc:Bounds x="80" y="620" width="4170" height="150" /></bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Start_Keywords_di" bpmnElement="Start_Keywords"><dc:Bounds x="120" y="77" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_RevisarMetas_di" bpmnElement="Task_S_RevisarMetas"><dc:Bounds x="220" y="55" width="130" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_IntegrarCRM_di" bpmnElement="Task_A_IntegrarCRM"><dc:Bounds x="380" y="355" width="130" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_NormalizarDados_di" bpmnElement="Task_A_NormalizarDados"><dc:Bounds x="540" y="355" width="130" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_PadroesClientes_di" bpmnElement="Task_I_PadroesClientes"><dc:Bounds x="700" y="205" width="130" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_AnalisarDados_di" bpmnElement="Task_S_AnalisarDados"><dc:Bounds x="860" y="55" width="130" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_ClusterLinguagem_di" bpmnElement="Task_I_ClusterLinguagem"><dc:Bounds x="1020" y="205" width="130" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_MapaDor_di" bpmnElement="Task_I_MapaDor"><dc:Bounds x="1180" y="205" width="130" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_MapearDor_di" bpmnElement="Task_S_MapearDor"><dc:Bounds x="1340" y="55" width="130" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_DesenharJornada_di" bpmnElement="Task_S_DesenharJornada"><dc:Bounds x="1500" y="55" width="130" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_ContribuirInsights_di" bpmnElement="Task_C_ContribuirInsights"><dc:Bounds x="1660" y="505" width="130" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_RascunhosPersonas_di" bpmnElement="Task_I_RascunhosPersonas"><dc:Bounds x="1820" y="205" width="130" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_CriarPersonaPrincipal_di" bpmnElement="Task_S_CriarPersonaPrincipal"><dc:Bounds x="1980" y="55" width="130" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_CriarPersonasComplementares_di" bpmnElement="Task_S_CriarPersonasComplementares"><dc:Bounds x="2140" y="55" width="130" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_VoiceTone_di" bpmnElement="Task_I_VoiceTone"><dc:Bounds x="2300" y="205" width="130" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_SumarioExecutivo_di" bpmnElement="Task_I_SumarioExecutivo"><dc:Bounds x="2460" y="205" width="130" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_ConsolidarGuia_di" bpmnElement="Task_S_ConsolidarGuia"><dc:Bounds x="2620" y="55" width="130" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_AtualizarBase_di" bpmnElement="Task_A_AtualizarBase"><dc:Bounds x="2780" y="355" width="130" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_RevisarPersonas_di" bpmnElement="Task_C_RevisarPersonas"><dc:Bounds x="2940" y="505" width="130" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_R_RevisarCoerencia_di" bpmnElement="Task_R_RevisarCoerencia"><dc:Bounds x="3100" y="655" width="130" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_PersonasViaveis_di" bpmnElement="Gateway_PersonasViaveis" isMarkerVisible="true"><dc:Bounds x="3260" y="670" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_PersonasInviaveis_di" bpmnElement="End_PersonasInviaveis"><dc:Bounds x="3420" y="677" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_AprovarPersonas_di" bpmnElement="Task_S_AprovarPersonas"><dc:Bounds x="3420" y="55" width="130" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_CompartilharGuia_di" bpmnElement="Task_A_CompartilharGuia"><dc:Bounds x="3580" y="355" width="130" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_EndossarGuia_di" bpmnElement="Task_C_EndossarGuia"><dc:Bounds x="3740" y="505" width="130" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_Success_di" bpmnElement="End_Success"><dc:Bounds x="3900" y="77" width="36" height="36" /></bpmndi:BPMNShape>

      <bpmndi:BPMNEdge id="F_Start_Revisar_di" bpmnElement="F_Start_Revisar"><di:waypoint x="138" y="95" /><di:waypoint x="285" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Revisar_IntegrarCRM_di" bpmnElement="F_Revisar_IntegrarCRM"><di:waypoint x="285" y="95" /><di:waypoint x="445" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Integrar_Normalizar_di" bpmnElement="F_Integrar_Normalizar"><di:waypoint x="445" y="395" /><di:waypoint x="605" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Normalizar_PadroesIA_di" bpmnElement="F_Normalizar_PadroesIA"><di:waypoint x="605" y="395" /><di:waypoint x="765" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Padroes_AnalisarDados_di" bpmnElement="F_Padroes_AnalisarDados"><di:waypoint x="765" y="245" /><di:waypoint x="925" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Analisar_ClusterLinguagem_di" bpmnElement="F_Analisar_ClusterLinguagem"><di:waypoint x="925" y="95" /><di:waypoint x="1085" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_ClusterLinguagem_MapaDor_di" bpmnElement="F_ClusterLinguagem_MapaDor"><di:waypoint x="1085" y="245" /><di:waypoint x="1245" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_MapaDor_MapearDor_di" bpmnElement="F_MapaDor_MapearDor"><di:waypoint x="1245" y="245" /><di:waypoint x="1405" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Mapear_Jornada_di" bpmnElement="F_Mapear_Jornada"><di:waypoint x="1405" y="95" /><di:waypoint x="1565" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Jornada_Contribuir_di" bpmnElement="F_Jornada_Contribuir"><di:waypoint x="1565" y="95" /><di:waypoint x="1725" y="545" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Contribuir_Rascunhos_di" bpmnElement="F_Contribuir_Rascunhos"><di:waypoint x="1725" y="545" /><di:waypoint x="1885" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Rascunhos_PersonaPrincipal_di" bpmnElement="F_Rascunhos_PersonaPrincipal"><di:waypoint x="1885" y="245" /><di:waypoint x="2045" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_PersonaPrincipal_PersonasComp_di" bpmnElement="F_PersonaPrincipal_PersonasComp"><di:waypoint x="2045" y="95" /><di:waypoint x="2205" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_PersonasComp_VoiceTone_di" bpmnElement="F_PersonasComp_VoiceTone"><di:waypoint x="2205" y="95" /><di:waypoint x="2365" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_VoiceTone_Sumario_di" bpmnElement="F_VoiceTone_Sumario"><di:waypoint x="2365" y="245" /><di:waypoint x="2525" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Sumario_Consolidar_di" bpmnElement="F_Sumario_Consolidar"><di:waypoint x="2525" y="245" /><di:waypoint x="2685" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Consolidar_AtualizarBase_di" bpmnElement="F_Consolidar_AtualizarBase"><di:waypoint x="2685" y="95" /><di:waypoint x="2845" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_AtualizarBase_RevisarPersonas_di" bpmnElement="F_AtualizarBase_RevisarPersonas"><di:waypoint x="2845" y="395" /><di:waypoint x="3005" y="545" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_RevisarPersonas_RevisarCoerencia_di" bpmnElement="F_RevisarPersonas_RevisarCoerencia"><di:waypoint x="3005" y="545" /><di:waypoint x="3165" y="695" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_RevisarCoerencia_Gateway_di" bpmnElement="F_RevisarCoerencia_Gateway"><di:waypoint x="3165" y="695" /><di:waypoint x="3285" y="695" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Gateway_No_Inviaveis_di" bpmnElement="F_Gateway_No_Inviaveis"><di:waypoint x="3285" y="695" /><di:waypoint x="3438" y="695" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Gateway_Yes_Aprovar_di" bpmnElement="F_Gateway_Yes_Aprovar"><di:waypoint x="3285" y="695" /><di:waypoint x="3485" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Aprovar_Compartilhar_di" bpmnElement="F_Aprovar_Compartilhar"><di:waypoint x="3485" y="95" /><di:waypoint x="3645" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Compartilhar_Endossar_di" bpmnElement="F_Compartilhar_Endossar"><di:waypoint x="3645" y="395" /><di:waypoint x="3805" y="545" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Endossar_End_di" bpmnElement="F_Endossar_End"><di:waypoint x="3805" y="545" /><di:waypoint x="3918" y="95" /></bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

const phases = [
  { name: 'Entrada', x: 80, width: 600 },
  { name: 'Dados Reais', x: 680, width: 650 },
  { name: 'Comportamento & Jornada', x: 1330, width: 700 },
  { name: 'Desenvolvimento de Personas', x: 2030, width: 700 },
  { name: 'Validacao & Governanca', x: 2730, width: 700 },
  { name: 'Saida', x: 3430, width: 820 }
];

const config = {
  zoom: 0.85,
  storageKey: 'subprocesso-3.2',
  startLabel: 'KEYWORDS DEFINIDAS',
  endLabels: {
    End_Success: { text: 'PERSONAS DEFINIDAS', className: 'end-label-success', marker: 'end-success' },
    End_PersonasInviaveis: { text: 'PERSONAS INVIAVEIS', className: 'end-label-lost' }
  },
  showDefaultEndLabel: false,
  useEndName: false,
  defaultEndLabelText: 'FIM',
  defaultEndClass: 'end-label-lost'
};

window.v5Data = window.v5Data || {};
window.v5Data['3.2'] = { diagramXML, nodeDetails, phases, ...config };
