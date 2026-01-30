const nodeDetails = {
  'Task_O_ReceberPacote': { sla: '2h', tag: 'Briefing', desc: 'Consolida criativos, copys e plano de midia.' },
  'Task_O_ChecarPrerequisitos': { sla: null, tag: 'Pre-check', desc: 'Verifica contas, permisssoes, pixel e dominio.' },
  'Task_O_DefinirCampanhas': { sla: null, tag: 'Campanhas', desc: 'Define estrutura de campanhas.' },
  'Task_O_DefinirConjuntos': { sla: null, tag: 'Adsets', desc: 'Define estrutura de conjuntos.' },
  'Task_O_CriarCampanhas': { sla: null, tag: 'Criacao', desc: 'Cria campanhas na plataforma.' },
  'Task_O_ConfigurarConjuntos': { sla: null, tag: 'Adsets', desc: 'Configura conjuntos e segmentacoes.' },
  'Task_O_UploadAnuncios': { sla: null, tag: 'Upload', desc: 'Faz upload e vincula anuncios.' },
  'Task_O_RevisarEstrutura': { sla: null, tag: 'Revisao', desc: 'Revisa estrutura e configuracoes.' },
  'Task_O_ConfigurarEvento': { sla: null, tag: 'Conversao', desc: 'Configura evento de conversao.' },
  'Task_O_TestarRastreamento': { sla: null, tag: 'Teste', desc: 'Testa rastreamento de eventos.' },
  'Task_O_ChecklistTecnico': { sla: null, tag: 'QA', desc: 'Checklist tecnico das campanhas.' },
  'Task_O_AprovarCampanhas': { sla: null, tag: 'Aprovacao', desc: 'Aprova campanhas para ativacao.' },
  'Task_I_LerPlano': { sla: null, tag: 'Input IA', desc: 'Interpreta plano e historico.' },
  'Task_I_SugerirEstrutura': { sla: null, tag: 'Estrutura', desc: 'Sugere estrutura de campanhas.' },
  'Task_I_VerificarObjetivo': { sla: null, tag: 'Consistencia', desc: 'Verifica objetivo vs conteudo.' },
  'Task_I_SinalizarRiscos': { sla: null, tag: 'Riscos', desc: 'Sinaliza riscos tecnicos.' },
  'Task_A_ColetarDados': { sla: null, tag: 'Conta', desc: 'Coleta dados de conta e eventos.' },
  'Task_A_AtualizarPlanoIds': { sla: null, tag: 'IDs', desc: 'Atualiza plano com IDs de campanha.' },
  'Task_A_RegistrarStatus': { sla: null, tag: 'Status', desc: 'Registra status das campanhas.' },
  'Task_C_ResolverAcessos': { sla: null, tag: 'Pendencia', desc: 'Resolve acessos e configuracoes.' },
  'Task_G_RevisarRiscos': { sla: null, tag: 'Governanca', desc: 'Revisa riscos e diretrizes.' }
};

const diagramXML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_42_V5" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_42_V5">
    <bpmn:participant id="Participant_42_V5" name="Configuracao de Campanhas" processRef="Process_42_V5" />
  </bpmn:collaboration>
  <bpmn:process id="Process_42_V5" isExecutable="false">
    <bpmn:laneSet id="LaneSet_42_V5">
      <bpmn:lane id="Lane_Operacoes" name="Operacoes / Gestor">
        <bpmn:flowNodeRef>Start_Anuncios</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_O_ReceberPacote</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_O_ChecarPrerequisitos</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_O_DefinirCampanhas</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_O_DefinirConjuntos</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_O_CriarCampanhas</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_O_ConfigurarConjuntos</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_O_UploadAnuncios</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_O_RevisarEstrutura</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_O_ConfigurarEvento</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_O_TestarRastreamento</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_O_ChecklistTecnico</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_O_AprovarCampanhas</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_CampanhasConfiguradas</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_IA" name="IA &amp; Insights">
        <bpmn:flowNodeRef>Task_I_LerPlano</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_SugerirEstrutura</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_VerificarObjetivo</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_SinalizarRiscos</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Auto" name="Automacao / Dados">
        <bpmn:flowNodeRef>Task_A_ColetarDados</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_AtualizarPlanoIds</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_RegistrarStatus</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Cliente" name="Cliente">
        <bpmn:flowNodeRef>Task_C_ResolverAcessos</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Gestao" name="Gestao / Direcao">
        <bpmn:flowNodeRef>Task_G_RevisarRiscos</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_PreReqOk</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_CampanhasPendencias</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>

    <bpmn:startEvent id="Start_Anuncios" name="Anuncios Aprovados" />
    <bpmn:task id="Task_O_ReceberPacote" name="Receber Pacote e Plano" />
    <bpmn:task id="Task_A_ColetarDados" name="Coletar Dados de Conta e Eventos" />
    <bpmn:task id="Task_O_ChecarPrerequisitos" name="Checar Pre-requisitos da Conta" />
    <bpmn:exclusiveGateway id="Gateway_PreReqOk" name="Pre-requisitos ok?" />
    <bpmn:task id="Task_C_ResolverAcessos" name="Resolver Acessos e Configuracoes" />
    <bpmn:task id="Task_I_LerPlano" name="Ler Plano e Historico" />
    <bpmn:task id="Task_O_DefinirCampanhas" name="Definir Estrutura de Campanhas" />
    <bpmn:task id="Task_I_SugerirEstrutura" name="Sugerir Estrutura de Campanhas" />
    <bpmn:task id="Task_O_DefinirConjuntos" name="Definir Estrutura de Conjuntos" />
    <bpmn:task id="Task_O_CriarCampanhas" name="Criar Campanhas" />
    <bpmn:task id="Task_O_ConfigurarConjuntos" name="Configurar Conjuntos" />
    <bpmn:task id="Task_O_UploadAnuncios" name="Upload e Vincular Anuncios" />
    <bpmn:task id="Task_O_RevisarEstrutura" name="Revisar Estrutura e Configuracoes" />
    <bpmn:task id="Task_I_VerificarObjetivo" name="Verificar Objetivo x Conteudo" />
    <bpmn:task id="Task_O_ConfigurarEvento" name="Configurar Evento de Conversao" />
    <bpmn:task id="Task_O_TestarRastreamento" name="Testar Rastreamento" />
    <bpmn:task id="Task_I_SinalizarRiscos" name="Sinalizar Riscos Tecnicos" />
    <bpmn:task id="Task_O_ChecklistTecnico" name="Checklist Tecnico" />
    <bpmn:task id="Task_G_RevisarRiscos" name="Revisar Riscos e Diretrizes" />
    <bpmn:task id="Task_O_AprovarCampanhas" name="Aprovar Campanhas para Ativacao" />
    <bpmn:task id="Task_A_AtualizarPlanoIds" name="Atualizar Plano com IDs" />
    <bpmn:task id="Task_A_RegistrarStatus" name="Registrar Status das Campanhas" />
    <bpmn:endEvent id="End_CampanhasConfiguradas" name="Campanhas Configuradas" />
    <bpmn:endEvent id="End_CampanhasPendencias" name="Campanhas com Pendencias" />

    <bpmn:sequenceFlow id="F_Start_Receber" sourceRef="Start_Anuncios" targetRef="Task_O_ReceberPacote" />
    <bpmn:sequenceFlow id="F_Receber_Coletar" sourceRef="Task_O_ReceberPacote" targetRef="Task_A_ColetarDados" />
    <bpmn:sequenceFlow id="F_Coletar_Checar" sourceRef="Task_A_ColetarDados" targetRef="Task_O_ChecarPrerequisitos" />
    <bpmn:sequenceFlow id="F_Checar_Gateway" sourceRef="Task_O_ChecarPrerequisitos" targetRef="Gateway_PreReqOk" />
    <bpmn:sequenceFlow id="F_Gateway_No_Resolver" name="Nao" sourceRef="Gateway_PreReqOk" targetRef="Task_C_ResolverAcessos" />
    <bpmn:sequenceFlow id="F_Resolver_EndPendencias" sourceRef="Task_C_ResolverAcessos" targetRef="End_CampanhasPendencias" />
    <bpmn:sequenceFlow id="F_Gateway_Yes_LerPlano" name="Sim" sourceRef="Gateway_PreReqOk" targetRef="Task_I_LerPlano" />
    <bpmn:sequenceFlow id="F_LerPlano_DefinirCampanhas" sourceRef="Task_I_LerPlano" targetRef="Task_O_DefinirCampanhas" />
    <bpmn:sequenceFlow id="F_DefinirCampanhas_SugerirEstrutura" sourceRef="Task_O_DefinirCampanhas" targetRef="Task_I_SugerirEstrutura" />
    <bpmn:sequenceFlow id="F_SugerirEstrutura_DefinirConjuntos" sourceRef="Task_I_SugerirEstrutura" targetRef="Task_O_DefinirConjuntos" />
    <bpmn:sequenceFlow id="F_DefinirConjuntos_CriarCampanhas" sourceRef="Task_O_DefinirConjuntos" targetRef="Task_O_CriarCampanhas" />
    <bpmn:sequenceFlow id="F_CriarCampanhas_ConfigurarConjuntos" sourceRef="Task_O_CriarCampanhas" targetRef="Task_O_ConfigurarConjuntos" />
    <bpmn:sequenceFlow id="F_ConfigurarConjuntos_Upload" sourceRef="Task_O_ConfigurarConjuntos" targetRef="Task_O_UploadAnuncios" />
    <bpmn:sequenceFlow id="F_Upload_Revisar" sourceRef="Task_O_UploadAnuncios" targetRef="Task_O_RevisarEstrutura" />
    <bpmn:sequenceFlow id="F_Revisar_VerificarObjetivo" sourceRef="Task_O_RevisarEstrutura" targetRef="Task_I_VerificarObjetivo" />
    <bpmn:sequenceFlow id="F_VerificarObjetivo_ConfigurarEvento" sourceRef="Task_I_VerificarObjetivo" targetRef="Task_O_ConfigurarEvento" />
    <bpmn:sequenceFlow id="F_ConfigurarEvento_Testar" sourceRef="Task_O_ConfigurarEvento" targetRef="Task_O_TestarRastreamento" />
    <bpmn:sequenceFlow id="F_Testar_SinalizarRiscos" sourceRef="Task_O_TestarRastreamento" targetRef="Task_I_SinalizarRiscos" />
    <bpmn:sequenceFlow id="F_SinalizarRiscos_Checklist" sourceRef="Task_I_SinalizarRiscos" targetRef="Task_O_ChecklistTecnico" />
    <bpmn:sequenceFlow id="F_Checklist_RevisarRiscos" sourceRef="Task_O_ChecklistTecnico" targetRef="Task_G_RevisarRiscos" />
    <bpmn:sequenceFlow id="F_RevisarRiscos_Aprovar" sourceRef="Task_G_RevisarRiscos" targetRef="Task_O_AprovarCampanhas" />
    <bpmn:sequenceFlow id="F_Aprovar_Atualizar" sourceRef="Task_O_AprovarCampanhas" targetRef="Task_A_AtualizarPlanoIds" />
    <bpmn:sequenceFlow id="F_Atualizar_Registrar" sourceRef="Task_A_AtualizarPlanoIds" targetRef="Task_A_RegistrarStatus" />
    <bpmn:sequenceFlow id="F_Registrar_End" sourceRef="Task_A_RegistrarStatus" targetRef="End_CampanhasConfiguradas" />
  </bpmn:process>

  <bpmndi:BPMNDiagram id="BPMNDiagram_42_V5">
    <bpmndi:BPMNPlane id="BPMNPlane_42_V5" bpmnElement="Collaboration_42_V5">
      <bpmndi:BPMNShape id="Participant_42_V5_di" bpmnElement="Participant_42_V5" isHorizontal="true"><dc:Bounds x="50" y="20" width="4000" height="750" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Operacoes_di" bpmnElement="Lane_Operacoes" isHorizontal="true"><dc:Bounds x="80" y="20" width="3970" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_IA_di" bpmnElement="Lane_IA" isHorizontal="true"><dc:Bounds x="80" y="170" width="3970" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Auto_di" bpmnElement="Lane_Auto" isHorizontal="true"><dc:Bounds x="80" y="320" width="3970" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Cliente_di" bpmnElement="Lane_Cliente" isHorizontal="true"><dc:Bounds x="80" y="470" width="3970" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Gestao_di" bpmnElement="Lane_Gestao" isHorizontal="true"><dc:Bounds x="80" y="620" width="3970" height="150" /></bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Start_Anuncios_di" bpmnElement="Start_Anuncios"><dc:Bounds x="120" y="77" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_O_ReceberPacote_di" bpmnElement="Task_O_ReceberPacote"><dc:Bounds x="220" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_ColetarDados_di" bpmnElement="Task_A_ColetarDados"><dc:Bounds x="380" y="355" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_O_ChecarPrerequisitos_di" bpmnElement="Task_O_ChecarPrerequisitos"><dc:Bounds x="540" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_PreReqOk_di" bpmnElement="Gateway_PreReqOk" isMarkerVisible="true"><dc:Bounds x="700" y="70" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_ResolverAcessos_di" bpmnElement="Task_C_ResolverAcessos"><dc:Bounds x="860" y="505" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_LerPlano_di" bpmnElement="Task_I_LerPlano"><dc:Bounds x="860" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_O_DefinirCampanhas_di" bpmnElement="Task_O_DefinirCampanhas"><dc:Bounds x="1020" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_SugerirEstrutura_di" bpmnElement="Task_I_SugerirEstrutura"><dc:Bounds x="1180" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_O_DefinirConjuntos_di" bpmnElement="Task_O_DefinirConjuntos"><dc:Bounds x="1340" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_O_CriarCampanhas_di" bpmnElement="Task_O_CriarCampanhas"><dc:Bounds x="1500" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_O_ConfigurarConjuntos_di" bpmnElement="Task_O_ConfigurarConjuntos"><dc:Bounds x="1660" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_O_UploadAnuncios_di" bpmnElement="Task_O_UploadAnuncios"><dc:Bounds x="1820" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_O_RevisarEstrutura_di" bpmnElement="Task_O_RevisarEstrutura"><dc:Bounds x="1980" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_VerificarObjetivo_di" bpmnElement="Task_I_VerificarObjetivo"><dc:Bounds x="2140" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_O_ConfigurarEvento_di" bpmnElement="Task_O_ConfigurarEvento"><dc:Bounds x="2300" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_O_TestarRastreamento_di" bpmnElement="Task_O_TestarRastreamento"><dc:Bounds x="2460" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_SinalizarRiscos_di" bpmnElement="Task_I_SinalizarRiscos"><dc:Bounds x="2620" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_O_ChecklistTecnico_di" bpmnElement="Task_O_ChecklistTecnico"><dc:Bounds x="2780" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_G_RevisarRiscos_di" bpmnElement="Task_G_RevisarRiscos"><dc:Bounds x="2940" y="655" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_O_AprovarCampanhas_di" bpmnElement="Task_O_AprovarCampanhas"><dc:Bounds x="3100" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_AtualizarPlanoIds_di" bpmnElement="Task_A_AtualizarPlanoIds"><dc:Bounds x="3260" y="355" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_RegistrarStatus_di" bpmnElement="Task_A_RegistrarStatus"><dc:Bounds x="3420" y="355" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_CampanhasConfiguradas_di" bpmnElement="End_CampanhasConfiguradas"><dc:Bounds x="3580" y="77" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_CampanhasPendencias_di" bpmnElement="End_CampanhasPendencias"><dc:Bounds x="1040" y="677" width="36" height="36" /></bpmndi:BPMNShape>

      <bpmndi:BPMNEdge id="F_Start_Receber_di" bpmnElement="F_Start_Receber"><di:waypoint x="138" y="95" /><di:waypoint x="280" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Receber_Coletar_di" bpmnElement="F_Receber_Coletar"><di:waypoint x="280" y="95" /><di:waypoint x="440" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Coletar_Checar_di" bpmnElement="F_Coletar_Checar"><di:waypoint x="440" y="395" /><di:waypoint x="600" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Checar_Gateway_di" bpmnElement="F_Checar_Gateway"><di:waypoint x="600" y="95" /><di:waypoint x="725" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Gateway_No_Resolver_di" bpmnElement="F_Gateway_No_Resolver"><di:waypoint x="725" y="95" /><di:waypoint x="920" y="545" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Resolver_EndPendencias_di" bpmnElement="F_Resolver_EndPendencias"><di:waypoint x="920" y="545" /><di:waypoint x="1058" y="695" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Gateway_Yes_LerPlano_di" bpmnElement="F_Gateway_Yes_LerPlano"><di:waypoint x="725" y="95" /><di:waypoint x="920" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_LerPlano_DefinirCampanhas_di" bpmnElement="F_LerPlano_DefinirCampanhas"><di:waypoint x="920" y="245" /><di:waypoint x="1080" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_DefinirCampanhas_SugerirEstrutura_di" bpmnElement="F_DefinirCampanhas_SugerirEstrutura"><di:waypoint x="1080" y="95" /><di:waypoint x="1240" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_SugerirEstrutura_DefinirConjuntos_di" bpmnElement="F_SugerirEstrutura_DefinirConjuntos"><di:waypoint x="1240" y="245" /><di:waypoint x="1400" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_DefinirConjuntos_CriarCampanhas_di" bpmnElement="F_DefinirConjuntos_CriarCampanhas"><di:waypoint x="1400" y="95" /><di:waypoint x="1560" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_CriarCampanhas_ConfigurarConjuntos_di" bpmnElement="F_CriarCampanhas_ConfigurarConjuntos"><di:waypoint x="1560" y="95" /><di:waypoint x="1720" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_ConfigurarConjuntos_Upload_di" bpmnElement="F_ConfigurarConjuntos_Upload"><di:waypoint x="1720" y="95" /><di:waypoint x="1880" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Upload_Revisar_di" bpmnElement="F_Upload_Revisar"><di:waypoint x="1880" y="95" /><di:waypoint x="2040" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Revisar_VerificarObjetivo_di" bpmnElement="F_Revisar_VerificarObjetivo"><di:waypoint x="2040" y="95" /><di:waypoint x="2200" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_VerificarObjetivo_ConfigurarEvento_di" bpmnElement="F_VerificarObjetivo_ConfigurarEvento"><di:waypoint x="2200" y="245" /><di:waypoint x="2360" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_ConfigurarEvento_Testar_di" bpmnElement="F_ConfigurarEvento_Testar"><di:waypoint x="2360" y="95" /><di:waypoint x="2520" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Testar_SinalizarRiscos_di" bpmnElement="F_Testar_SinalizarRiscos"><di:waypoint x="2520" y="95" /><di:waypoint x="2680" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_SinalizarRiscos_Checklist_di" bpmnElement="F_SinalizarRiscos_Checklist"><di:waypoint x="2680" y="245" /><di:waypoint x="2840" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Checklist_RevisarRiscos_di" bpmnElement="F_Checklist_RevisarRiscos"><di:waypoint x="2840" y="95" /><di:waypoint x="3000" y="695" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_RevisarRiscos_Aprovar_di" bpmnElement="F_RevisarRiscos_Aprovar"><di:waypoint x="3000" y="695" /><di:waypoint x="3160" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Aprovar_Atualizar_di" bpmnElement="F_Aprovar_Atualizar"><di:waypoint x="3160" y="95" /><di:waypoint x="3320" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Atualizar_Registrar_di" bpmnElement="F_Atualizar_Registrar"><di:waypoint x="3320" y="395" /><di:waypoint x="3480" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Registrar_End_di" bpmnElement="F_Registrar_End"><di:waypoint x="3480" y="395" /><di:waypoint x="3598" y="95" /></bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

const phases = [
  { name: 'Entrada', x: 80, width: 520 },
  { name: 'Estruturacao', x: 600, width: 640 },
  { name: 'Implementacao', x: 1240, width: 640 },
  { name: 'Rastreamento', x: 1880, width: 640 },
  { name: 'QA & Governanca', x: 2520, width: 640 },
  { name: 'Saida', x: 3160, width: 890 }
];

const config = {
  zoom: 0.85,
  storageKey: 'subprocesso-4.2',
  startLabel: 'ANUNCIOS APROVADOS',
  endLabels: {
    End_CampanhasConfiguradas: { text: 'CAMPANHAS CONFIGURADAS', className: 'end-label-success', marker: 'end-success' },
    End_CampanhasPendencias: { text: 'CAMPANHAS COM PENDENCIAS', className: 'end-label-lost' }
  },
  showDefaultEndLabel: false,
  useEndName: false,
  defaultEndLabelText: 'FIM',
  defaultEndClass: 'end-label-lost'
};

window.v5Data = window.v5Data || {};
window.v5Data['4.2'] = { diagramXML, nodeDetails, phases, ...config };
