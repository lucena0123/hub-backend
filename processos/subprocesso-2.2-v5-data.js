const nodeDetails = {
  'Task_S_ConfirmarEscopo': { sla: '24h', tag: 'Contexto', desc: 'Revisa briefing e objetivos, define regiao, publico e periodo.' },
  'Task_S_PesquisarMercado': { sla: '2 dias', tag: 'Mercado', desc: 'Analisa tamanho, demanda, dores e comportamento de busca.' },
  'Task_S_IdentificarConcorrentes': { sla: null, tag: 'Concorrencia', desc: 'Identifica concorrentes diretos e indiretos por relevancia.' },
  'Task_S_AnalisarEstrategias': { sla: '2 dias', tag: 'Estrategias', desc: 'Analisa funis, criativos, ofertas, provas e ganchos.' },
  'Task_S_DefinirOportunidades': { sla: null, tag: 'Sintese', desc: 'Define oportunidades, riscos e posicionamento ideal.' },
  'Task_S_CompilarRelatorio': { sla: '5 dias', tag: 'Relatorio', desc: 'Compila relatorio estruturado com insights e recomendacoes.' },
  'Task_I_ResumoCliente': { sla: null, tag: 'Resumo', desc: 'Gera resumo do briefing e contexto do cliente.' },
  'Task_I_AnalisarDemanda': { sla: null, tag: 'Mercado', desc: 'Analisa demanda, dores e possiveis objecoes.' },
  'Task_I_ClusterConcorrentes': { sla: null, tag: 'Cluster', desc: 'Agrupa concorrentes por categoria e proposta.' },
  'Task_I_ClusterCriativos': { sla: null, tag: 'Criativos', desc: 'Agrupa anuncios por angulos e mensagens.' },
  'Task_I_GerarInsights': { sla: null, tag: 'Insights', desc: 'Gera hipoteses, ganchos e riscos.' },
  'Task_I_SumarioExecutivo': { sla: null, tag: 'Sumario', desc: 'Gera sumario executivo para apresentacao.' },
  'Task_A_ColetarMercado': { sla: null, tag: 'Coleta', desc: 'Coleta dados de mercado em ferramentas externas.' },
  'Task_A_ColetarConcorrentes': { sla: null, tag: 'Coleta', desc: 'Coleta dados de concorrentes e registra URLs.' },
  'Task_A_ColetarCriativos': { sla: null, tag: 'Ads', desc: 'Coleta criativos relevantes em bibliotecas.' },
  'Task_A_OrganizarBenchmark': { sla: null, tag: 'Base', desc: 'Organiza dados em planilhas ou Notion.' },
  'Task_A_AtualizarKPIs': { sla: null, tag: 'KPIs', desc: 'Atualiza KPIs da analise.' },
  'Task_R_ValidarEscopo': { sla: null, tag: 'Aprovacao', desc: 'Valida escopo para contas estrategicas.' },
  'Task_R_AvaliarAtratividade': { sla: null, tag: 'Risco', desc: 'Avalia atratividade e possivel ajuste de foco.' },
  'Task_R_AjustarConcorrentes': { sla: null, tag: 'Foco', desc: 'Ajusta lista de concorrentes prioritarios.' },
  'Task_R_ValidarRecomendacoes': { sla: null, tag: 'Direcao', desc: 'Valida recomendacoes antes do relatorio.' }
};

const diagramXML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_22_V5" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_22_V5">
    <bpmn:participant id="Participant_22_V5" name="Analise de Mercado e Concorrencia" processRef="Process_22_V5" />
  </bpmn:collaboration>
  <bpmn:process id="Process_22_V5" isExecutable="false">
    <bpmn:laneSet id="LaneSet_22_V5">
      <bpmn:lane id="Lane_Strategy" name="Estrategia / Planejamento">
        <bpmn:flowNodeRef>Start_Onboarding</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_ConfirmarEscopo</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_PesquisarMercado</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_IdentificarConcorrentes</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_AnalisarEstrategias</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_DefinirOportunidades</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_CompilarRelatorio</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_Success</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_IA" name="IA & Dados">
        <bpmn:flowNodeRef>Task_I_ResumoCliente</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_AnalisarDemanda</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_ClusterConcorrentes</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_ClusterCriativos</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_GerarInsights</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_SumarioExecutivo</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Auto" name="Automacao / Ferramentas">
        <bpmn:flowNodeRef>Task_A_ColetarMercado</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_ColetarConcorrentes</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_ColetarCriativos</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_OrganizarBenchmark</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_AtualizarKPIs</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Gestao" name="Gestao / Direcao">
        <bpmn:flowNodeRef>Task_R_ValidarEscopo</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_R_AvaliarAtratividade</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_MercadoViavel</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_R_AjustarConcorrentes</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_R_ValidarRecomendacoes</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_MercadoInviavel</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>

    <bpmn:startEvent id="Start_Onboarding" name="Onboarding Completo">
      <bpmn:outgoing>F_Start_Confirmar</bpmn:outgoing>
    </bpmn:startEvent>

    <bpmn:task id="Task_S_ConfirmarEscopo" name="1. Confirmar Escopo">
      <bpmn:incoming>F_Start_Confirmar</bpmn:incoming>
      <bpmn:outgoing>F_Confirmar_ValidarEscopo</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_R_ValidarEscopo" name="Validar Escopo">
      <bpmn:incoming>F_Confirmar_ValidarEscopo</bpmn:incoming>
      <bpmn:outgoing>F_ValidarEscopo_Resumo</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_I_ResumoCliente" name="Gerar Resumo do Cliente">
      <bpmn:incoming>F_ValidarEscopo_Resumo</bpmn:incoming>
      <bpmn:outgoing>F_Resumo_ColetaMercado</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_A_ColetarMercado" name="Coletar Dados de Mercado">
      <bpmn:incoming>F_Resumo_ColetaMercado</bpmn:incoming>
      <bpmn:outgoing>F_ColetaMercado_AnalisarDemanda</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_I_AnalisarDemanda" name="Analisar Demanda e Perfil">
      <bpmn:incoming>F_ColetaMercado_AnalisarDemanda</bpmn:incoming>
      <bpmn:outgoing>F_AnalisarDemanda_Pesquisar</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_S_PesquisarMercado" name="2. Pesquisar Mercado">
      <bpmn:incoming>F_AnalisarDemanda_Pesquisar</bpmn:incoming>
      <bpmn:outgoing>F_Pesquisar_Avaliar</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_R_AvaliarAtratividade" name="Avaliar Atratividade">
      <bpmn:incoming>F_Pesquisar_Avaliar</bpmn:incoming>
      <bpmn:outgoing>F_Avaliar_Gateway</bpmn:outgoing>
    </bpmn:task>

    <bpmn:exclusiveGateway id="Gateway_MercadoViavel" name="Mercado viavel?">
      <bpmn:incoming>F_Avaliar_Gateway</bpmn:incoming>
      <bpmn:outgoing>F_Gateway_Yes_ColetarConcorrentes</bpmn:outgoing>
      <bpmn:outgoing>F_Gateway_No_MercadoInviavel</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <bpmn:endEvent id="End_MercadoInviavel" name="Fim Mercado Inviavel">
      <bpmn:incoming>F_Gateway_No_MercadoInviavel</bpmn:incoming>
    </bpmn:endEvent>

    <bpmn:task id="Task_A_ColetarConcorrentes" name="Coletar Dados de Concorrentes">
      <bpmn:incoming>F_Gateway_Yes_ColetarConcorrentes</bpmn:incoming>
      <bpmn:outgoing>F_ColetarConcorrentes_ClusterConc</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_I_ClusterConcorrentes" name="Clusterizar Concorrentes">
      <bpmn:incoming>F_ColetarConcorrentes_ClusterConc</bpmn:incoming>
      <bpmn:outgoing>F_ClusterConc_Identificar</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_S_IdentificarConcorrentes" name="3. Identificar Concorrentes">
      <bpmn:incoming>F_ClusterConc_Identificar</bpmn:incoming>
      <bpmn:outgoing>F_Identificar_Ajustar</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_R_AjustarConcorrentes" name="Ajustar Lista de Concorrentes">
      <bpmn:incoming>F_Identificar_Ajustar</bpmn:incoming>
      <bpmn:outgoing>F_Ajustar_ColetarCriativos</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_A_ColetarCriativos" name="Coletar Criativos de Anuncios">
      <bpmn:incoming>F_Ajustar_ColetarCriativos</bpmn:incoming>
      <bpmn:outgoing>F_ColetarCriativos_ClusterCriativos</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_I_ClusterCriativos" name="Clusterizar Criativos">
      <bpmn:incoming>F_ColetarCriativos_ClusterCriativos</bpmn:incoming>
      <bpmn:outgoing>F_ClusterCriativos_AnalisarEstrategias</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_S_AnalisarEstrategias" name="4. Analisar Estrategias e Funis">
      <bpmn:incoming>F_ClusterCriativos_AnalisarEstrategias</bpmn:incoming>
      <bpmn:outgoing>F_AnalisarEstrategias_GerarInsights</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_I_GerarInsights" name="Gerar Hipoteses e Oportunidades">
      <bpmn:incoming>F_AnalisarEstrategias_GerarInsights</bpmn:incoming>
      <bpmn:outgoing>F_GerarInsights_DefinirOportunidades</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_S_DefinirOportunidades" name="5. Definir Oportunidades">
      <bpmn:incoming>F_GerarInsights_DefinirOportunidades</bpmn:incoming>
      <bpmn:outgoing>F_DefinirOportunidades_ValidarRecomendacoes</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_R_ValidarRecomendacoes" name="Validar Recomendacoes">
      <bpmn:incoming>F_DefinirOportunidades_ValidarRecomendacoes</bpmn:incoming>
      <bpmn:outgoing>F_ValidarRecomendacoes_OrganizarBenchmark</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_A_OrganizarBenchmark" name="Organizar Dados em Benchmark">
      <bpmn:incoming>F_ValidarRecomendacoes_OrganizarBenchmark</bpmn:incoming>
      <bpmn:outgoing>F_OrganizarBenchmark_Sumario</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_I_SumarioExecutivo" name="Gerar Sumario Executivo">
      <bpmn:incoming>F_OrganizarBenchmark_Sumario</bpmn:incoming>
      <bpmn:outgoing>F_Sumario_Compilar</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_S_CompilarRelatorio" name="6. Compilar Relatorio">
      <bpmn:incoming>F_Sumario_Compilar</bpmn:incoming>
      <bpmn:outgoing>F_Compilar_AtualizarKPIs</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_A_AtualizarKPIs" name="Atualizar KPIs de Analise">
      <bpmn:incoming>F_Compilar_AtualizarKPIs</bpmn:incoming>
      <bpmn:outgoing>F_AtualizarKPIs_End</bpmn:outgoing>
    </bpmn:task>

    <bpmn:endEvent id="End_Success" name="Analise Concluida">
      <bpmn:incoming>F_AtualizarKPIs_End</bpmn:incoming>
    </bpmn:endEvent>

    <bpmn:sequenceFlow id="F_Start_Confirmar" sourceRef="Start_Onboarding" targetRef="Task_S_ConfirmarEscopo" />
    <bpmn:sequenceFlow id="F_Confirmar_ValidarEscopo" sourceRef="Task_S_ConfirmarEscopo" targetRef="Task_R_ValidarEscopo" />
    <bpmn:sequenceFlow id="F_ValidarEscopo_Resumo" sourceRef="Task_R_ValidarEscopo" targetRef="Task_I_ResumoCliente" />
    <bpmn:sequenceFlow id="F_Resumo_ColetaMercado" sourceRef="Task_I_ResumoCliente" targetRef="Task_A_ColetarMercado" />
    <bpmn:sequenceFlow id="F_ColetaMercado_AnalisarDemanda" sourceRef="Task_A_ColetarMercado" targetRef="Task_I_AnalisarDemanda" />
    <bpmn:sequenceFlow id="F_AnalisarDemanda_Pesquisar" sourceRef="Task_I_AnalisarDemanda" targetRef="Task_S_PesquisarMercado" />
    <bpmn:sequenceFlow id="F_Pesquisar_Avaliar" sourceRef="Task_S_PesquisarMercado" targetRef="Task_R_AvaliarAtratividade" />
    <bpmn:sequenceFlow id="F_Avaliar_Gateway" sourceRef="Task_R_AvaliarAtratividade" targetRef="Gateway_MercadoViavel" />
    <bpmn:sequenceFlow id="F_Gateway_Yes_ColetarConcorrentes" name="Sim" sourceRef="Gateway_MercadoViavel" targetRef="Task_A_ColetarConcorrentes" />
    <bpmn:sequenceFlow id="F_Gateway_No_MercadoInviavel" name="Nao" sourceRef="Gateway_MercadoViavel" targetRef="End_MercadoInviavel" />
    <bpmn:sequenceFlow id="F_ColetarConcorrentes_ClusterConc" sourceRef="Task_A_ColetarConcorrentes" targetRef="Task_I_ClusterConcorrentes" />
    <bpmn:sequenceFlow id="F_ClusterConc_Identificar" sourceRef="Task_I_ClusterConcorrentes" targetRef="Task_S_IdentificarConcorrentes" />
    <bpmn:sequenceFlow id="F_Identificar_Ajustar" sourceRef="Task_S_IdentificarConcorrentes" targetRef="Task_R_AjustarConcorrentes" />
    <bpmn:sequenceFlow id="F_Ajustar_ColetarCriativos" sourceRef="Task_R_AjustarConcorrentes" targetRef="Task_A_ColetarCriativos" />
    <bpmn:sequenceFlow id="F_ColetarCriativos_ClusterCriativos" sourceRef="Task_A_ColetarCriativos" targetRef="Task_I_ClusterCriativos" />
    <bpmn:sequenceFlow id="F_ClusterCriativos_AnalisarEstrategias" sourceRef="Task_I_ClusterCriativos" targetRef="Task_S_AnalisarEstrategias" />
    <bpmn:sequenceFlow id="F_AnalisarEstrategias_GerarInsights" sourceRef="Task_S_AnalisarEstrategias" targetRef="Task_I_GerarInsights" />
    <bpmn:sequenceFlow id="F_GerarInsights_DefinirOportunidades" sourceRef="Task_I_GerarInsights" targetRef="Task_S_DefinirOportunidades" />
    <bpmn:sequenceFlow id="F_DefinirOportunidades_ValidarRecomendacoes" sourceRef="Task_S_DefinirOportunidades" targetRef="Task_R_ValidarRecomendacoes" />
    <bpmn:sequenceFlow id="F_ValidarRecomendacoes_OrganizarBenchmark" sourceRef="Task_R_ValidarRecomendacoes" targetRef="Task_A_OrganizarBenchmark" />
    <bpmn:sequenceFlow id="F_OrganizarBenchmark_Sumario" sourceRef="Task_A_OrganizarBenchmark" targetRef="Task_I_SumarioExecutivo" />
    <bpmn:sequenceFlow id="F_Sumario_Compilar" sourceRef="Task_I_SumarioExecutivo" targetRef="Task_S_CompilarRelatorio" />
    <bpmn:sequenceFlow id="F_Compilar_AtualizarKPIs" sourceRef="Task_S_CompilarRelatorio" targetRef="Task_A_AtualizarKPIs" />
    <bpmn:sequenceFlow id="F_AtualizarKPIs_End" sourceRef="Task_A_AtualizarKPIs" targetRef="End_Success" />
  </bpmn:process>

  <bpmndi:BPMNDiagram id="BPMNDiagram_22_V5">
    <bpmndi:BPMNPlane id="BPMNPlane_22_V5" bpmnElement="Collaboration_22_V5">
      <bpmndi:BPMNShape id="Participant_22_V5_di" bpmnElement="Participant_22_V5" isHorizontal="true">
        <dc:Bounds x="50" y="20" width="4100" height="600" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Strategy_di" bpmnElement="Lane_Strategy" isHorizontal="true">
        <dc:Bounds x="80" y="20" width="4070" height="150" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_IA_di" bpmnElement="Lane_IA" isHorizontal="true">
        <dc:Bounds x="80" y="170" width="4070" height="150" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Auto_di" bpmnElement="Lane_Auto" isHorizontal="true">
        <dc:Bounds x="80" y="320" width="4070" height="150" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Gestao_di" bpmnElement="Lane_Gestao" isHorizontal="true">
        <dc:Bounds x="80" y="470" width="4070" height="150" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Start_Onboarding_di" bpmnElement="Start_Onboarding">
        <dc:Bounds x="120" y="77" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_ConfirmarEscopo_di" bpmnElement="Task_S_ConfirmarEscopo">
        <dc:Bounds x="200" y="55" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_R_ValidarEscopo_di" bpmnElement="Task_R_ValidarEscopo">
        <dc:Bounds x="360" y="505" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_ResumoCliente_di" bpmnElement="Task_I_ResumoCliente">
        <dc:Bounds x="520" y="205" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_ColetarMercado_di" bpmnElement="Task_A_ColetarMercado">
        <dc:Bounds x="680" y="355" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_AnalisarDemanda_di" bpmnElement="Task_I_AnalisarDemanda">
        <dc:Bounds x="840" y="205" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_PesquisarMercado_di" bpmnElement="Task_S_PesquisarMercado">
        <dc:Bounds x="1000" y="55" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_R_AvaliarAtratividade_di" bpmnElement="Task_R_AvaliarAtratividade">
        <dc:Bounds x="1160" y="505" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_MercadoViavel_di" bpmnElement="Gateway_MercadoViavel" isMarkerVisible="true">
        <dc:Bounds x="1320" y="520" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_MercadoInviavel_di" bpmnElement="End_MercadoInviavel">
        <dc:Bounds x="1500" y="527" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_ColetarConcorrentes_di" bpmnElement="Task_A_ColetarConcorrentes">
        <dc:Bounds x="1480" y="355" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_ClusterConcorrentes_di" bpmnElement="Task_I_ClusterConcorrentes">
        <dc:Bounds x="1640" y="205" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_IdentificarConcorrentes_di" bpmnElement="Task_S_IdentificarConcorrentes">
        <dc:Bounds x="1800" y="55" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_R_AjustarConcorrentes_di" bpmnElement="Task_R_AjustarConcorrentes">
        <dc:Bounds x="1960" y="505" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_ColetarCriativos_di" bpmnElement="Task_A_ColetarCriativos">
        <dc:Bounds x="2120" y="355" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_ClusterCriativos_di" bpmnElement="Task_I_ClusterCriativos">
        <dc:Bounds x="2280" y="205" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_AnalisarEstrategias_di" bpmnElement="Task_S_AnalisarEstrategias">
        <dc:Bounds x="2440" y="55" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_GerarInsights_di" bpmnElement="Task_I_GerarInsights">
        <dc:Bounds x="2600" y="205" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_DefinirOportunidades_di" bpmnElement="Task_S_DefinirOportunidades">
        <dc:Bounds x="2760" y="55" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_R_ValidarRecomendacoes_di" bpmnElement="Task_R_ValidarRecomendacoes">
        <dc:Bounds x="2920" y="505" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_OrganizarBenchmark_di" bpmnElement="Task_A_OrganizarBenchmark">
        <dc:Bounds x="3080" y="355" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_SumarioExecutivo_di" bpmnElement="Task_I_SumarioExecutivo">
        <dc:Bounds x="3240" y="205" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_CompilarRelatorio_di" bpmnElement="Task_S_CompilarRelatorio">
        <dc:Bounds x="3400" y="55" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_AtualizarKPIs_di" bpmnElement="Task_A_AtualizarKPIs">
        <dc:Bounds x="3560" y="355" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_Success_di" bpmnElement="End_Success">
        <dc:Bounds x="3740" y="77" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="F_Start_Confirmar_di" bpmnElement="F_Start_Confirmar">
        <di:waypoint x="138" y="95" />
        <di:waypoint x="260" y="95" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Confirmar_ValidarEscopo_di" bpmnElement="F_Confirmar_ValidarEscopo">
        <di:waypoint x="260" y="95" />
        <di:waypoint x="420" y="545" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_ValidarEscopo_Resumo_di" bpmnElement="F_ValidarEscopo_Resumo">
        <di:waypoint x="420" y="545" />
        <di:waypoint x="580" y="245" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Resumo_ColetaMercado_di" bpmnElement="F_Resumo_ColetaMercado">
        <di:waypoint x="580" y="245" />
        <di:waypoint x="740" y="395" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_ColetaMercado_AnalisarDemanda_di" bpmnElement="F_ColetaMercado_AnalisarDemanda">
        <di:waypoint x="740" y="395" />
        <di:waypoint x="900" y="245" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_AnalisarDemanda_Pesquisar_di" bpmnElement="F_AnalisarDemanda_Pesquisar">
        <di:waypoint x="900" y="245" />
        <di:waypoint x="1060" y="95" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Pesquisar_Avaliar_di" bpmnElement="F_Pesquisar_Avaliar">
        <di:waypoint x="1060" y="95" />
        <di:waypoint x="1220" y="545" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Avaliar_Gateway_di" bpmnElement="F_Avaliar_Gateway">
        <di:waypoint x="1220" y="545" />
        <di:waypoint x="1345" y="545" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Gateway_Yes_ColetarConcorrentes_di" bpmnElement="F_Gateway_Yes_ColetarConcorrentes">
        <di:waypoint x="1345" y="545" />
        <di:waypoint x="1540" y="395" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Gateway_No_MercadoInviavel_di" bpmnElement="F_Gateway_No_MercadoInviavel">
        <di:waypoint x="1345" y="545" />
        <di:waypoint x="1518" y="545" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_ColetarConcorrentes_ClusterConc_di" bpmnElement="F_ColetarConcorrentes_ClusterConc">
        <di:waypoint x="1540" y="395" />
        <di:waypoint x="1700" y="245" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_ClusterConc_Identificar_di" bpmnElement="F_ClusterConc_Identificar">
        <di:waypoint x="1700" y="245" />
        <di:waypoint x="1860" y="95" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Identificar_Ajustar_di" bpmnElement="F_Identificar_Ajustar">
        <di:waypoint x="1860" y="95" />
        <di:waypoint x="2020" y="545" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Ajustar_ColetarCriativos_di" bpmnElement="F_Ajustar_ColetarCriativos">
        <di:waypoint x="2020" y="545" />
        <di:waypoint x="2180" y="395" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_ColetarCriativos_ClusterCriativos_di" bpmnElement="F_ColetarCriativos_ClusterCriativos">
        <di:waypoint x="2180" y="395" />
        <di:waypoint x="2340" y="245" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_ClusterCriativos_AnalisarEstrategias_di" bpmnElement="F_ClusterCriativos_AnalisarEstrategias">
        <di:waypoint x="2340" y="245" />
        <di:waypoint x="2500" y="95" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_AnalisarEstrategias_GerarInsights_di" bpmnElement="F_AnalisarEstrategias_GerarInsights">
        <di:waypoint x="2500" y="95" />
        <di:waypoint x="2660" y="245" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_GerarInsights_DefinirOportunidades_di" bpmnElement="F_GerarInsights_DefinirOportunidades">
        <di:waypoint x="2660" y="245" />
        <di:waypoint x="2820" y="95" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_DefinirOportunidades_ValidarRecomendacoes_di" bpmnElement="F_DefinirOportunidades_ValidarRecomendacoes">
        <di:waypoint x="2820" y="95" />
        <di:waypoint x="2980" y="545" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_ValidarRecomendacoes_OrganizarBenchmark_di" bpmnElement="F_ValidarRecomendacoes_OrganizarBenchmark">
        <di:waypoint x="2980" y="545" />
        <di:waypoint x="3140" y="395" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_OrganizarBenchmark_Sumario_di" bpmnElement="F_OrganizarBenchmark_Sumario">
        <di:waypoint x="3140" y="395" />
        <di:waypoint x="3300" y="245" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Sumario_Compilar_di" bpmnElement="F_Sumario_Compilar">
        <di:waypoint x="3300" y="245" />
        <di:waypoint x="3460" y="95" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Compilar_AtualizarKPIs_di" bpmnElement="F_Compilar_AtualizarKPIs">
        <di:waypoint x="3460" y="95" />
        <di:waypoint x="3620" y="395" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_AtualizarKPIs_End_di" bpmnElement="F_AtualizarKPIs_End">
        <di:waypoint x="3620" y="395" />
        <di:waypoint x="3758" y="95" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

const phases = [
  { name: 'Contexto', x: 80, width: 600 },
  { name: 'Mercado', x: 680, width: 640 },
  { name: 'Concorrencia', x: 1320, width: 640 },
  { name: 'Estrategias', x: 1960, width: 640 },
  { name: 'Sintese', x: 2600, width: 640 },
  { name: 'Saida', x: 3240, width: 820 }
];

const config = {
  zoom: 0.85,
  storageKey: 'subprocesso-2.2',
  startLabel: 'ONBOARDING COMPLETO',
  endLabels: {
    End_Success: { text: 'ANALISE CONCLUIDA', className: 'end-label-success', marker: 'end-success' },
    End_MercadoInviavel: { text: 'MERCADO INVIAVEL', className: 'end-label-lost' }
  },
  showDefaultEndLabel: false,
  useEndName: false,
  defaultEndLabelText: 'FIM',
  defaultEndClass: 'end-label-lost'
};

window.v5Data = window.v5Data || {};
window.v5Data['2.2'] = { diagramXML, nodeDetails, phases, ...config };
