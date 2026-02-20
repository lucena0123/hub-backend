const nodeDetails = {
  'Task_T_EnviarBriefing': { sla: '4h', tag: 'Briefing', desc: 'Consolida briefing para LP.' },
  'Task_T_AvaliarNecessidade': { sla: null, tag: 'Diagnostico', desc: 'Avalia necessidade de nova LP.' },
  'Task_UX_Diagnosticar': { sla: null, tag: 'Metricas', desc: 'Diagnostica LP atual com dados.' },
  'Task_UX_PlanejarNova': { sla: null, tag: 'Nova LP', desc: 'Planeja estrutura da nova LP.' },
  'Task_UX_CopyCompleta': { sla: null, tag: 'Copy', desc: 'Produz copy completa.' },
  'Task_UX_Hipoteses': { sla: null, tag: 'Otimizacao', desc: 'Define hipoteses de melhoria.' },
  'Task_UX_AjustarConteudo': { sla: null, tag: 'Ajustes', desc: 'Ajusta conteudo da LP.' },
  'Task_UI_CriarLayout': { sla: null, tag: 'UI', desc: 'Cria layout da nova LP.' },
  'Task_UI_DesenvolverNova': { sla: null, tag: 'Dev', desc: 'Desenvolve nova LP.' },
  'Task_UI_ImplementarOtimizacoes': { sla: null, tag: 'Dev', desc: 'Implementa otimizacoes.' },
  'Task_UI_ConfigurarForm': { sla: null, tag: 'Integracoes', desc: 'Configura formularios e eventos.' },
  'Task_UI_RegistrarVersao': { sla: null, tag: 'Versao', desc: 'Registra versao da LP.' },
  'Task_QA_Usabilidade': { sla: null, tag: 'Usabilidade', desc: 'Testes de usabilidade.' },
  'Task_QA_Funcionais': { sla: null, tag: 'Funcional', desc: 'Testes funcionais.' },
  'Task_QA_Performance': { sla: null, tag: 'Performance', desc: 'Performance e SEO basico.' },
  'Task_QA_AprovacaoFinal': { sla: null, tag: 'Aprovacao', desc: 'Aprovacao final da LP.' },
  'Task_IA_SugerirEstrutura': { sla: null, tag: 'IA', desc: 'Sugere estrutura de LP.' },
  'Task_IA_ApoiarCopy': { sla: null, tag: 'Copy IA', desc: 'Apoia geracao de copy.' },
  'Task_A_RegistrarRepositorio': { sla: null, tag: 'Registro', desc: 'Registra LP no repositorio.' }
};

const diagramXML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_43_V5" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_43_V5">
    <bpmn:participant id="Participant_43_V5" name="Criacao de Landing Pages" processRef="Process_43_V5" />
  </bpmn:collaboration>
  <bpmn:process id="Process_43_V5" isExecutable="false">
    <bpmn:laneSet id="LaneSet_43_V5">
      <bpmn:lane id="Lane_Trafego" name="Trafego / Estrategia">
        <bpmn:flowNodeRef>Start_Campanhas</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_T_EnviarBriefing</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_T_AvaliarNecessidade</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_UX" name="UX &amp; Copy">
        <bpmn:flowNodeRef>Task_UX_Diagnosticar</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_NovaLP</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_UX_PlanejarNova</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_UX_CopyCompleta</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_UX_Hipoteses</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_UX_AjustarConteudo</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_UI" name="UI / Implementacao">
        <bpmn:flowNodeRef>Task_UI_CriarLayout</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_UI_DesenvolverNova</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_UI_ImplementarOtimizacoes</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_UI_ConfigurarForm</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_UI_RegistrarVersao</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_QA" name="QA &amp; Metricas">
        <bpmn:flowNodeRef>Task_QA_Usabilidade</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_QA_Funcionais</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_QA_Performance</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_QA_AprovacaoFinal</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_LPAprovada</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_LPPronta</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_IA" name="IA &amp; Automacao">
        <bpmn:flowNodeRef>Task_IA_SugerirEstrutura</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_IA_ApoiarCopy</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_RegistrarRepositorio</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_LPPendencias</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>

    <bpmn:startEvent id="Start_Campanhas" name="Campanhas Configuradas" />
    <bpmn:task id="Task_T_EnviarBriefing" name="Enviar Briefing de LP" />
    <bpmn:task id="Task_T_AvaliarNecessidade" name="Avaliar Necessidade de Nova LP" />
    <bpmn:task id="Task_UX_Diagnosticar" name="Diagnosticar LP Atual" />
    <bpmn:exclusiveGateway id="Gateway_NovaLP" name="Nova LP?" />
    <bpmn:task id="Task_IA_SugerirEstrutura" name="Sugerir Estrutura de LP" />
    <bpmn:task id="Task_UX_PlanejarNova" name="Planejar Estrutura da Nova LP" />
    <bpmn:task id="Task_IA_ApoiarCopy" name="Apoiar na Copy" />
    <bpmn:task id="Task_UX_CopyCompleta" name="Produzir Copy Completa" />
    <bpmn:task id="Task_UX_Hipoteses" name="Definir Hipoteses de Melhoria" />
    <bpmn:task id="Task_UX_AjustarConteudo" name="Ajustar Conteudo da LP" />
    <bpmn:task id="Task_UI_CriarLayout" name="Criar Layout da Nova LP" />
    <bpmn:task id="Task_UI_DesenvolverNova" name="Desenvolver Nova LP" />
    <bpmn:task id="Task_UI_ImplementarOtimizacoes" name="Implementar Otimizacoes" />
    <bpmn:task id="Task_UI_ConfigurarForm" name="Configurar Formularios e Eventos" />
    <bpmn:task id="Task_UI_RegistrarVersao" name="Registrar Versao da LP" />
    <bpmn:task id="Task_QA_Usabilidade" name="Testes de Usabilidade" />
    <bpmn:task id="Task_QA_Funcionais" name="Testes Funcionais" />
    <bpmn:task id="Task_QA_Performance" name="Performance e SEO Basico" />
    <bpmn:task id="Task_QA_AprovacaoFinal" name="Aprovacao Final" />
    <bpmn:exclusiveGateway id="Gateway_LPAprovada" name="LP aprovada?" />
    <bpmn:task id="Task_A_RegistrarRepositorio" name="Registrar LP no Repositorio" />
    <bpmn:endEvent id="End_LPPronta" name="LP Pronta" />
    <bpmn:endEvent id="End_LPPendencias" name="LP com Pendencias" />

    <bpmn:sequenceFlow id="F_Start_Briefing" sourceRef="Start_Campanhas" targetRef="Task_T_EnviarBriefing" />
    <bpmn:sequenceFlow id="F_Briefing_Avaliar" sourceRef="Task_T_EnviarBriefing" targetRef="Task_T_AvaliarNecessidade" />
    <bpmn:sequenceFlow id="F_Avaliar_Diagnosticar" sourceRef="Task_T_AvaliarNecessidade" targetRef="Task_UX_Diagnosticar" />
    <bpmn:sequenceFlow id="F_Diagnosticar_Gateway" sourceRef="Task_UX_Diagnosticar" targetRef="Gateway_NovaLP" />

    <bpmn:sequenceFlow id="F_Gateway_Nova_Sugerir" name="Nova" sourceRef="Gateway_NovaLP" targetRef="Task_IA_SugerirEstrutura" />
    <bpmn:sequenceFlow id="F_Sugerir_Planejar" sourceRef="Task_IA_SugerirEstrutura" targetRef="Task_UX_PlanejarNova" />
    <bpmn:sequenceFlow id="F_Planejar_ApoiarCopy" sourceRef="Task_UX_PlanejarNova" targetRef="Task_IA_ApoiarCopy" />
    <bpmn:sequenceFlow id="F_ApoiarCopy_Copy" sourceRef="Task_IA_ApoiarCopy" targetRef="Task_UX_CopyCompleta" />
    <bpmn:sequenceFlow id="F_Copy_CriarLayout" sourceRef="Task_UX_CopyCompleta" targetRef="Task_UI_CriarLayout" />
    <bpmn:sequenceFlow id="F_CriarLayout_Desenvolver" sourceRef="Task_UI_CriarLayout" targetRef="Task_UI_DesenvolverNova" />
    <bpmn:sequenceFlow id="F_Desenvolver_Configurar" sourceRef="Task_UI_DesenvolverNova" targetRef="Task_UI_ConfigurarForm" />

    <bpmn:sequenceFlow id="F_Gateway_Otimizar_Hipoteses" name="Otimizar" sourceRef="Gateway_NovaLP" targetRef="Task_UX_Hipoteses" />
    <bpmn:sequenceFlow id="F_Hipoteses_Ajustar" sourceRef="Task_UX_Hipoteses" targetRef="Task_UX_AjustarConteudo" />
    <bpmn:sequenceFlow id="F_Ajustar_Implementar" sourceRef="Task_UX_AjustarConteudo" targetRef="Task_UI_ImplementarOtimizacoes" />
    <bpmn:sequenceFlow id="F_Implementar_Configurar" sourceRef="Task_UI_ImplementarOtimizacoes" targetRef="Task_UI_ConfigurarForm" />

    <bpmn:sequenceFlow id="F_Configurar_RegistrarVersao" sourceRef="Task_UI_ConfigurarForm" targetRef="Task_UI_RegistrarVersao" />
    <bpmn:sequenceFlow id="F_RegistrarVersao_Usabilidade" sourceRef="Task_UI_RegistrarVersao" targetRef="Task_QA_Usabilidade" />
    <bpmn:sequenceFlow id="F_Usabilidade_Funcionais" sourceRef="Task_QA_Usabilidade" targetRef="Task_QA_Funcionais" />
    <bpmn:sequenceFlow id="F_Funcionais_Performance" sourceRef="Task_QA_Funcionais" targetRef="Task_QA_Performance" />
    <bpmn:sequenceFlow id="F_Performance_Aprovacao" sourceRef="Task_QA_Performance" targetRef="Task_QA_AprovacaoFinal" />
    <bpmn:sequenceFlow id="F_Aprovacao_Gateway" sourceRef="Task_QA_AprovacaoFinal" targetRef="Gateway_LPAprovada" />
    <bpmn:sequenceFlow id="F_Gateway_Yes_Registrar" name="Sim" sourceRef="Gateway_LPAprovada" targetRef="Task_A_RegistrarRepositorio" />
    <bpmn:sequenceFlow id="F_Registrar_End" sourceRef="Task_A_RegistrarRepositorio" targetRef="End_LPPronta" />
    <bpmn:sequenceFlow id="F_Gateway_No_Pendencias" name="Nao" sourceRef="Gateway_LPAprovada" targetRef="End_LPPendencias" />
  </bpmn:process>

  <bpmndi:BPMNDiagram id="BPMNDiagram_43_V5">
    <bpmndi:BPMNPlane id="BPMNPlane_43_V5" bpmnElement="Collaboration_43_V5">
      <bpmndi:BPMNShape id="Participant_43_V5_di" bpmnElement="Participant_43_V5" isHorizontal="true"><dc:Bounds x="50" y="20" width="4000" height="750" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Trafego_di" bpmnElement="Lane_Trafego" isHorizontal="true"><dc:Bounds x="80" y="20" width="3970" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_UX_di" bpmnElement="Lane_UX" isHorizontal="true"><dc:Bounds x="80" y="170" width="3970" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_UI_di" bpmnElement="Lane_UI" isHorizontal="true"><dc:Bounds x="80" y="320" width="3970" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_QA_di" bpmnElement="Lane_QA" isHorizontal="true"><dc:Bounds x="80" y="470" width="3970" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_IA_di" bpmnElement="Lane_IA" isHorizontal="true"><dc:Bounds x="80" y="620" width="3970" height="150" /></bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Start_Campanhas_di" bpmnElement="Start_Campanhas"><dc:Bounds x="120" y="77" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_T_EnviarBriefing_di" bpmnElement="Task_T_EnviarBriefing"><dc:Bounds x="220" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_T_AvaliarNecessidade_di" bpmnElement="Task_T_AvaliarNecessidade"><dc:Bounds x="380" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_UX_Diagnosticar_di" bpmnElement="Task_UX_Diagnosticar"><dc:Bounds x="540" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_NovaLP_di" bpmnElement="Gateway_NovaLP" isMarkerVisible="true"><dc:Bounds x="700" y="220" width="50" height="50" /></bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Task_IA_SugerirEstrutura_di" bpmnElement="Task_IA_SugerirEstrutura"><dc:Bounds x="860" y="655" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_UX_PlanejarNova_di" bpmnElement="Task_UX_PlanejarNova"><dc:Bounds x="1020" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_IA_ApoiarCopy_di" bpmnElement="Task_IA_ApoiarCopy"><dc:Bounds x="1180" y="655" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_UX_CopyCompleta_di" bpmnElement="Task_UX_CopyCompleta"><dc:Bounds x="1340" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_UI_CriarLayout_di" bpmnElement="Task_UI_CriarLayout"><dc:Bounds x="1500" y="355" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_UI_DesenvolverNova_di" bpmnElement="Task_UI_DesenvolverNova"><dc:Bounds x="1660" y="355" width="120" height="80" /></bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Task_UX_Hipoteses_di" bpmnElement="Task_UX_Hipoteses"><dc:Bounds x="860" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_UX_AjustarConteudo_di" bpmnElement="Task_UX_AjustarConteudo"><dc:Bounds x="1020" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_UI_ImplementarOtimizacoes_di" bpmnElement="Task_UI_ImplementarOtimizacoes"><dc:Bounds x="1180" y="355" width="120" height="80" /></bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Task_UI_ConfigurarForm_di" bpmnElement="Task_UI_ConfigurarForm"><dc:Bounds x="1820" y="355" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_UI_RegistrarVersao_di" bpmnElement="Task_UI_RegistrarVersao"><dc:Bounds x="1980" y="355" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_QA_Usabilidade_di" bpmnElement="Task_QA_Usabilidade"><dc:Bounds x="2140" y="505" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_QA_Funcionais_di" bpmnElement="Task_QA_Funcionais"><dc:Bounds x="2300" y="505" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_QA_Performance_di" bpmnElement="Task_QA_Performance"><dc:Bounds x="2460" y="505" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_QA_AprovacaoFinal_di" bpmnElement="Task_QA_AprovacaoFinal"><dc:Bounds x="2620" y="505" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_LPAprovada_di" bpmnElement="Gateway_LPAprovada" isMarkerVisible="true"><dc:Bounds x="2780" y="520" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_RegistrarRepositorio_di" bpmnElement="Task_A_RegistrarRepositorio"><dc:Bounds x="2940" y="655" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_LPPronta_di" bpmnElement="End_LPPronta"><dc:Bounds x="3100" y="527" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_LPPendencias_di" bpmnElement="End_LPPendencias"><dc:Bounds x="3100" y="677" width="36" height="36" /></bpmndi:BPMNShape>

      <bpmndi:BPMNEdge id="F_Start_Briefing_di" bpmnElement="F_Start_Briefing"><di:waypoint x="138" y="95" /><di:waypoint x="280" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Briefing_Avaliar_di" bpmnElement="F_Briefing_Avaliar"><di:waypoint x="280" y="95" /><di:waypoint x="440" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Avaliar_Diagnosticar_di" bpmnElement="F_Avaliar_Diagnosticar"><di:waypoint x="440" y="95" /><di:waypoint x="600" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Diagnosticar_Gateway_di" bpmnElement="F_Diagnosticar_Gateway"><di:waypoint x="600" y="245" /><di:waypoint x="725" y="245" /></bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="F_Gateway_Nova_Sugerir_di" bpmnElement="F_Gateway_Nova_Sugerir"><di:waypoint x="725" y="245" /><di:waypoint x="920" y="695" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Sugerir_Planejar_di" bpmnElement="F_Sugerir_Planejar"><di:waypoint x="920" y="695" /><di:waypoint x="1080" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Planejar_ApoiarCopy_di" bpmnElement="F_Planejar_ApoiarCopy"><di:waypoint x="1080" y="245" /><di:waypoint x="1240" y="695" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_ApoiarCopy_Copy_di" bpmnElement="F_ApoiarCopy_Copy"><di:waypoint x="1240" y="695" /><di:waypoint x="1400" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Copy_CriarLayout_di" bpmnElement="F_Copy_CriarLayout"><di:waypoint x="1400" y="245" /><di:waypoint x="1560" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_CriarLayout_Desenvolver_di" bpmnElement="F_CriarLayout_Desenvolver"><di:waypoint x="1560" y="395" /><di:waypoint x="1720" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Desenvolver_Configurar_di" bpmnElement="F_Desenvolver_Configurar"><di:waypoint x="1720" y="395" /><di:waypoint x="1880" y="395" /></bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="F_Gateway_Otimizar_Hipoteses_di" bpmnElement="F_Gateway_Otimizar_Hipoteses"><di:waypoint x="725" y="245" /><di:waypoint x="920" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Hipoteses_Ajustar_di" bpmnElement="F_Hipoteses_Ajustar"><di:waypoint x="920" y="245" /><di:waypoint x="1080" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Ajustar_Implementar_di" bpmnElement="F_Ajustar_Implementar"><di:waypoint x="1080" y="245" /><di:waypoint x="1240" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Implementar_Configurar_di" bpmnElement="F_Implementar_Configurar"><di:waypoint x="1240" y="395" /><di:waypoint x="1880" y="395" /></bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="F_Configurar_RegistrarVersao_di" bpmnElement="F_Configurar_RegistrarVersao"><di:waypoint x="1880" y="395" /><di:waypoint x="2040" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_RegistrarVersao_Usabilidade_di" bpmnElement="F_RegistrarVersao_Usabilidade"><di:waypoint x="2040" y="395" /><di:waypoint x="2200" y="545" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Usabilidade_Funcionais_di" bpmnElement="F_Usabilidade_Funcionais"><di:waypoint x="2200" y="545" /><di:waypoint x="2360" y="545" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Funcionais_Performance_di" bpmnElement="F_Funcionais_Performance"><di:waypoint x="2360" y="545" /><di:waypoint x="2520" y="545" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Performance_Aprovacao_di" bpmnElement="F_Performance_Aprovacao"><di:waypoint x="2520" y="545" /><di:waypoint x="2680" y="545" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Aprovacao_Gateway_di" bpmnElement="F_Aprovacao_Gateway"><di:waypoint x="2680" y="545" /><di:waypoint x="2805" y="545" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Gateway_Yes_Registrar_di" bpmnElement="F_Gateway_Yes_Registrar"><di:waypoint x="2805" y="545" /><di:waypoint x="3000" y="695" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Registrar_End_di" bpmnElement="F_Registrar_End"><di:waypoint x="3000" y="695" /><di:waypoint x="3118" y="545" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Gateway_No_Pendencias_di" bpmnElement="F_Gateway_No_Pendencias"><di:waypoint x="2805" y="545" /><di:waypoint x="3118" y="695" /></bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

const phases = [
  { name: 'Entrada', x: 80, width: 520 },
  { name: 'Diagnostico', x: 600, width: 640 },
  { name: 'Planejamento', x: 1240, width: 640 },
  { name: 'Implementacao', x: 1880, width: 640 },
  { name: 'QA & Aprovacao', x: 2520, width: 640 },
  { name: 'Saida', x: 3160, width: 890 }
];

const config = {
  zoom: 0.85,
  storageKey: 'subprocesso-4.3',
  startLabel: 'CAMPANHAS CONFIGURADAS',
  endLabels: {
    End_LPPronta: { text: 'LP PRONTA', className: 'end-label-success', marker: 'end-success' },
    End_LPPendencias: { text: 'LP COM PENDENCIAS', className: 'end-label-lost' }
  },
  showDefaultEndLabel: false,
  useEndName: false,
  defaultEndLabelText: 'FIM',
  defaultEndClass: 'end-label-lost'
};

window.v5Data = window.v5Data || {};
window.v5Data['4.3'] = { diagramXML, nodeDetails, phases, ...config };
