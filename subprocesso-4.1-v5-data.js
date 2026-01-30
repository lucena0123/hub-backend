const nodeDetails = {
  'Task_S_ReceberBriefing': { sla: '4h', tag: 'Briefing', desc: 'Consolida briefing completo da campanha.' },
  'Task_S_DefinirConceitos': { sla: null, tag: 'Conceitos', desc: 'Define conceitos visuais principais.' },
  'Task_S_DesenvolverCriativos': { sla: null, tag: 'Criativos', desc: 'Desenvolve criativos base.' },
  'Task_S_GerarVariacoes': { sla: null, tag: 'Variacoes', desc: 'Cria variacoes para testes.' },
  'Task_S_AdaptarFormatos': { sla: null, tag: 'Formatos', desc: 'Adapta criativos por formato.' },
  'Task_S_RevisarVisuais': { sla: null, tag: 'QA Visual', desc: 'Revisa padronizacao e legibilidade.' },
  'Task_C_MapearMensagens': { sla: null, tag: 'Mapeamento', desc: 'Relaciona criativos a mensagens.' },
  'Task_C_RedigirCopy': { sla: '24h', tag: 'Copy', desc: 'Redige copys finais.' },
  'Task_C_AdaptarCopy': { sla: null, tag: 'Formatos', desc: 'Adapta copy por formato.' },
  'Task_C_EstruturarAB': { sla: null, tag: 'Testes', desc: 'Estrutura variacoes para testes AB.' },
  'Task_I_IdeiasCriativos': { sla: null, tag: 'IA', desc: 'Sugere ideias de criativos.' },
  'Task_I_Headlines': { sla: null, tag: 'Headlines', desc: 'Sugere variacoes de headlines.' },
  'Task_I_RevisarTom': { sla: null, tag: 'Tom', desc: 'Revisa tom de voz e clareza.' },
  'Task_QA_RevisarOrtografia': { sla: null, tag: 'Linguagem', desc: 'Revisa ortografia e gramatica.' },
  'Task_QA_ChecarPoliticas': { sla: null, tag: 'Meta', desc: 'Checa politicas de anuncio.' },
  'Task_QA_Compliance': { sla: null, tag: 'OAB', desc: 'Valida compliance juridico.' },
  'Task_A_RegistrarAssets': { sla: null, tag: 'Assets', desc: 'Registra criativos e copys.' },
  'Task_A_MontarPacote': { sla: null, tag: 'Entrega', desc: 'Monta pacote de anuncios.' },
  'Task_A_ControlarVersionamento': { sla: null, tag: 'Versoes', desc: 'Controla versionamento.' },
  'Task_G_AprovarInterno': { sla: null, tag: 'Aprovacao', desc: 'Aprova anuncios internamente.' }
};

const diagramXML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_41_V5" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_41_V5">
    <bpmn:participant id="Participant_41_V5" name="Criacao de Anuncios" processRef="Process_41_V5" />
  </bpmn:collaboration>
  <bpmn:process id="Process_41_V5" isExecutable="false">
    <bpmn:laneSet id="LaneSet_41_V5">
      <bpmn:lane id="Lane_Criacao" name="Producao Criativa">
        <bpmn:flowNodeRef>Start_Plano</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_ReceberBriefing</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_DefinirConceitos</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_DesenvolverCriativos</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_GerarVariacoes</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_AdaptarFormatos</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_RevisarVisuais</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_AnunciosAprovados</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Copy" name="Copywriting">
        <bpmn:flowNodeRef>Task_C_MapearMensagens</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_C_RedigirCopy</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_C_AdaptarCopy</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_C_EstruturarAB</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_IA" name="IA &amp; Sugestoes">
        <bpmn:flowNodeRef>Task_I_IdeiasCriativos</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_Headlines</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_RevisarTom</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_QA" name="QA / Compliance">
        <bpmn:flowNodeRef>Task_QA_RevisarOrtografia</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_QA_ChecarPoliticas</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_QA_Compliance</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Auto" name="Automacao / Repositorio">
        <bpmn:flowNodeRef>Task_A_RegistrarAssets</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_MontarPacote</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_ControlarVersionamento</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Gestao" name="Gestao / Direcao">
        <bpmn:flowNodeRef>Task_G_AprovarInterno</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_Aprovado</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_AnunciosReprovados</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>

    <bpmn:startEvent id="Start_Plano" name="Plano e Orcamento Definidos" />
    <bpmn:task id="Task_S_ReceberBriefing" name="Receber Briefing de Campanha" />
    <bpmn:task id="Task_I_IdeiasCriativos" name="Gerar Ideias de Criativos" />
    <bpmn:task id="Task_S_DefinirConceitos" name="Definir Conceitos Visuais" />
    <bpmn:task id="Task_S_DesenvolverCriativos" name="Desenvolver Criativos Base" />
    <bpmn:task id="Task_S_GerarVariacoes" name="Gerar Variacoes de Criativos" />
    <bpmn:task id="Task_S_AdaptarFormatos" name="Adaptar Criativos por Formato" />
    <bpmn:task id="Task_S_RevisarVisuais" name="Revisar Criativos Visuais" />
    <bpmn:task id="Task_C_MapearMensagens" name="Mapear Mensagens por Criativo" />
    <bpmn:task id="Task_I_Headlines" name="Sugerir Variacoes de Headlines" />
    <bpmn:task id="Task_C_RedigirCopy" name="Redigir Copys Finais" />
    <bpmn:task id="Task_I_RevisarTom" name="Revisar Tom de Voz e Clareza" />
    <bpmn:task id="Task_C_AdaptarCopy" name="Adaptar Copy por Formato" />
    <bpmn:task id="Task_C_EstruturarAB" name="Estruturar Variacoes para Testes AB" />
    <bpmn:task id="Task_QA_RevisarOrtografia" name="Revisar Ortografia e Gramatica" />
    <bpmn:task id="Task_QA_ChecarPoliticas" name="Checar Politicas de Anuncio" />
    <bpmn:task id="Task_QA_Compliance" name="Validar Compliance Juridico" />
    <bpmn:task id="Task_A_RegistrarAssets" name="Registrar Criativos e Copys" />
    <bpmn:task id="Task_A_MontarPacote" name="Montar Pacote de Anuncios" />
    <bpmn:task id="Task_A_ControlarVersionamento" name="Controlar Versionamento" />
    <bpmn:task id="Task_G_AprovarInterno" name="Aprovar Anuncios Internamente" />
    <bpmn:exclusiveGateway id="Gateway_Aprovado" name="Anuncios aprovados?" />
    <bpmn:endEvent id="End_AnunciosAprovados" name="Anuncios Aprovados" />
    <bpmn:endEvent id="End_AnunciosReprovados" name="Fim Anuncios Reprovados" />

    <bpmn:sequenceFlow id="F_Start_Briefing" sourceRef="Start_Plano" targetRef="Task_S_ReceberBriefing" />
    <bpmn:sequenceFlow id="F_Briefing_Ideias" sourceRef="Task_S_ReceberBriefing" targetRef="Task_I_IdeiasCriativos" />
    <bpmn:sequenceFlow id="F_Ideias_Conceitos" sourceRef="Task_I_IdeiasCriativos" targetRef="Task_S_DefinirConceitos" />
    <bpmn:sequenceFlow id="F_Conceitos_Base" sourceRef="Task_S_DefinirConceitos" targetRef="Task_S_DesenvolverCriativos" />
    <bpmn:sequenceFlow id="F_Base_Variacoes" sourceRef="Task_S_DesenvolverCriativos" targetRef="Task_S_GerarVariacoes" />
    <bpmn:sequenceFlow id="F_Variacoes_Formatos" sourceRef="Task_S_GerarVariacoes" targetRef="Task_S_AdaptarFormatos" />
    <bpmn:sequenceFlow id="F_Formatos_RevisarVisual" sourceRef="Task_S_AdaptarFormatos" targetRef="Task_S_RevisarVisuais" />
    <bpmn:sequenceFlow id="F_RevisarVisual_Mapear" sourceRef="Task_S_RevisarVisuais" targetRef="Task_C_MapearMensagens" />
    <bpmn:sequenceFlow id="F_Mapear_Headlines" sourceRef="Task_C_MapearMensagens" targetRef="Task_I_Headlines" />
    <bpmn:sequenceFlow id="F_Headlines_Redigir" sourceRef="Task_I_Headlines" targetRef="Task_C_RedigirCopy" />
    <bpmn:sequenceFlow id="F_Redigir_RevisarTom" sourceRef="Task_C_RedigirCopy" targetRef="Task_I_RevisarTom" />
    <bpmn:sequenceFlow id="F_RevisarTom_AdaptarCopy" sourceRef="Task_I_RevisarTom" targetRef="Task_C_AdaptarCopy" />
    <bpmn:sequenceFlow id="F_AdaptarCopy_AB" sourceRef="Task_C_AdaptarCopy" targetRef="Task_C_EstruturarAB" />
    <bpmn:sequenceFlow id="F_AB_Ortografia" sourceRef="Task_C_EstruturarAB" targetRef="Task_QA_RevisarOrtografia" />
    <bpmn:sequenceFlow id="F_Ortografia_Politicas" sourceRef="Task_QA_RevisarOrtografia" targetRef="Task_QA_ChecarPoliticas" />
    <bpmn:sequenceFlow id="F_Politicas_Compliance" sourceRef="Task_QA_ChecarPoliticas" targetRef="Task_QA_Compliance" />
    <bpmn:sequenceFlow id="F_Compliance_Registrar" sourceRef="Task_QA_Compliance" targetRef="Task_A_RegistrarAssets" />
    <bpmn:sequenceFlow id="F_Registrar_Pacote" sourceRef="Task_A_RegistrarAssets" targetRef="Task_A_MontarPacote" />
    <bpmn:sequenceFlow id="F_Pacote_Versionar" sourceRef="Task_A_MontarPacote" targetRef="Task_A_ControlarVersionamento" />
    <bpmn:sequenceFlow id="F_Versionar_Aprovar" sourceRef="Task_A_ControlarVersionamento" targetRef="Task_G_AprovarInterno" />
    <bpmn:sequenceFlow id="F_Aprovar_Gateway" sourceRef="Task_G_AprovarInterno" targetRef="Gateway_Aprovado" />
    <bpmn:sequenceFlow id="F_Gateway_Yes_End" name="Sim" sourceRef="Gateway_Aprovado" targetRef="End_AnunciosAprovados" />
    <bpmn:sequenceFlow id="F_Gateway_No_End" name="Nao" sourceRef="Gateway_Aprovado" targetRef="End_AnunciosReprovados" />
  </bpmn:process>

  <bpmndi:BPMNDiagram id="BPMNDiagram_41_V5">
    <bpmndi:BPMNPlane id="BPMNPlane_41_V5" bpmnElement="Collaboration_41_V5">
      <bpmndi:BPMNShape id="Participant_41_V5_di" bpmnElement="Participant_41_V5" isHorizontal="true"><dc:Bounds x="50" y="20" width="4000" height="900" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Criacao_di" bpmnElement="Lane_Criacao" isHorizontal="true"><dc:Bounds x="80" y="20" width="3970" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Copy_di" bpmnElement="Lane_Copy" isHorizontal="true"><dc:Bounds x="80" y="170" width="3970" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_IA_di" bpmnElement="Lane_IA" isHorizontal="true"><dc:Bounds x="80" y="320" width="3970" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_QA_di" bpmnElement="Lane_QA" isHorizontal="true"><dc:Bounds x="80" y="470" width="3970" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Auto_di" bpmnElement="Lane_Auto" isHorizontal="true"><dc:Bounds x="80" y="620" width="3970" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Gestao_di" bpmnElement="Lane_Gestao" isHorizontal="true"><dc:Bounds x="80" y="770" width="3970" height="150" /></bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Start_Plano_di" bpmnElement="Start_Plano"><dc:Bounds x="120" y="77" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_ReceberBriefing_di" bpmnElement="Task_S_ReceberBriefing"><dc:Bounds x="220" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_IdeiasCriativos_di" bpmnElement="Task_I_IdeiasCriativos"><dc:Bounds x="380" y="355" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_DefinirConceitos_di" bpmnElement="Task_S_DefinirConceitos"><dc:Bounds x="540" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_DesenvolverCriativos_di" bpmnElement="Task_S_DesenvolverCriativos"><dc:Bounds x="700" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_GerarVariacoes_di" bpmnElement="Task_S_GerarVariacoes"><dc:Bounds x="860" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_AdaptarFormatos_di" bpmnElement="Task_S_AdaptarFormatos"><dc:Bounds x="1020" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_RevisarVisuais_di" bpmnElement="Task_S_RevisarVisuais"><dc:Bounds x="1180" y="55" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_MapearMensagens_di" bpmnElement="Task_C_MapearMensagens"><dc:Bounds x="1340" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_Headlines_di" bpmnElement="Task_I_Headlines"><dc:Bounds x="1500" y="355" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_RedigirCopy_di" bpmnElement="Task_C_RedigirCopy"><dc:Bounds x="1660" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_RevisarTom_di" bpmnElement="Task_I_RevisarTom"><dc:Bounds x="1820" y="355" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_AdaptarCopy_di" bpmnElement="Task_C_AdaptarCopy"><dc:Bounds x="1980" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_EstruturarAB_di" bpmnElement="Task_C_EstruturarAB"><dc:Bounds x="2140" y="205" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_QA_RevisarOrtografia_di" bpmnElement="Task_QA_RevisarOrtografia"><dc:Bounds x="2300" y="505" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_QA_ChecarPoliticas_di" bpmnElement="Task_QA_ChecarPoliticas"><dc:Bounds x="2460" y="505" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_QA_Compliance_di" bpmnElement="Task_QA_Compliance"><dc:Bounds x="2620" y="505" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_RegistrarAssets_di" bpmnElement="Task_A_RegistrarAssets"><dc:Bounds x="2780" y="655" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_MontarPacote_di" bpmnElement="Task_A_MontarPacote"><dc:Bounds x="2940" y="655" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_ControlarVersionamento_di" bpmnElement="Task_A_ControlarVersionamento"><dc:Bounds x="3100" y="655" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_G_AprovarInterno_di" bpmnElement="Task_G_AprovarInterno"><dc:Bounds x="3260" y="805" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_Aprovado_di" bpmnElement="Gateway_Aprovado" isMarkerVisible="true"><dc:Bounds x="3420" y="820" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_AnunciosAprovados_di" bpmnElement="End_AnunciosAprovados"><dc:Bounds x="3760" y="77" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_AnunciosReprovados_di" bpmnElement="End_AnunciosReprovados"><dc:Bounds x="3580" y="827" width="36" height="36" /></bpmndi:BPMNShape>

      <bpmndi:BPMNEdge id="F_Start_Briefing_di" bpmnElement="F_Start_Briefing"><di:waypoint x="138" y="95" /><di:waypoint x="280" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Briefing_Ideias_di" bpmnElement="F_Briefing_Ideias"><di:waypoint x="280" y="95" /><di:waypoint x="440" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Ideias_Conceitos_di" bpmnElement="F_Ideias_Conceitos"><di:waypoint x="440" y="395" /><di:waypoint x="600" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Conceitos_Base_di" bpmnElement="F_Conceitos_Base"><di:waypoint x="600" y="95" /><di:waypoint x="760" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Base_Variacoes_di" bpmnElement="F_Base_Variacoes"><di:waypoint x="760" y="95" /><di:waypoint x="920" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Variacoes_Formatos_di" bpmnElement="F_Variacoes_Formatos"><di:waypoint x="920" y="95" /><di:waypoint x="1080" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Formatos_RevisarVisual_di" bpmnElement="F_Formatos_RevisarVisual"><di:waypoint x="1080" y="95" /><di:waypoint x="1240" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_RevisarVisual_Mapear_di" bpmnElement="F_RevisarVisual_Mapear"><di:waypoint x="1240" y="95" /><di:waypoint x="1400" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Mapear_Headlines_di" bpmnElement="F_Mapear_Headlines"><di:waypoint x="1400" y="245" /><di:waypoint x="1560" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Headlines_Redigir_di" bpmnElement="F_Headlines_Redigir"><di:waypoint x="1560" y="395" /><di:waypoint x="1720" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Redigir_RevisarTom_di" bpmnElement="F_Redigir_RevisarTom"><di:waypoint x="1720" y="245" /><di:waypoint x="1880" y="395" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_RevisarTom_AdaptarCopy_di" bpmnElement="F_RevisarTom_AdaptarCopy"><di:waypoint x="1880" y="395" /><di:waypoint x="2040" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_AdaptarCopy_AB_di" bpmnElement="F_AdaptarCopy_AB"><di:waypoint x="2040" y="245" /><di:waypoint x="2200" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_AB_Ortografia_di" bpmnElement="F_AB_Ortografia"><di:waypoint x="2200" y="245" /><di:waypoint x="2360" y="545" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Ortografia_Politicas_di" bpmnElement="F_Ortografia_Politicas"><di:waypoint x="2360" y="545" /><di:waypoint x="2520" y="545" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Politicas_Compliance_di" bpmnElement="F_Politicas_Compliance"><di:waypoint x="2520" y="545" /><di:waypoint x="2680" y="545" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Compliance_Registrar_di" bpmnElement="F_Compliance_Registrar"><di:waypoint x="2680" y="545" /><di:waypoint x="2840" y="695" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Registrar_Pacote_di" bpmnElement="F_Registrar_Pacote"><di:waypoint x="2840" y="695" /><di:waypoint x="3000" y="695" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Pacote_Versionar_di" bpmnElement="F_Pacote_Versionar"><di:waypoint x="3000" y="695" /><di:waypoint x="3160" y="695" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Versionar_Aprovar_di" bpmnElement="F_Versionar_Aprovar"><di:waypoint x="3160" y="695" /><di:waypoint x="3320" y="845" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Aprovar_Gateway_di" bpmnElement="F_Aprovar_Gateway"><di:waypoint x="3320" y="845" /><di:waypoint x="3445" y="845" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Gateway_Yes_End_di" bpmnElement="F_Gateway_Yes_End"><di:waypoint x="3445" y="845" /><di:waypoint x="3778" y="95" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Gateway_No_End_di" bpmnElement="F_Gateway_No_End"><di:waypoint x="3445" y="845" /><di:waypoint x="3598" y="845" /></bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

const phases = [
  { name: 'Entrada', x: 80, width: 520 },
  { name: 'Pre-producao', x: 600, width: 640 },
  { name: 'Criacao Visual', x: 1240, width: 800 },
  { name: 'Copy & Mensagem', x: 2040, width: 800 },
  { name: 'QA & Aprovacao', x: 2840, width: 800 },
  { name: 'Saida', x: 3640, width: 410 }
];

const config = {
  zoom: 0.85,
  storageKey: 'subprocesso-4.1',
  startLabel: 'PLANO & ORCAMENTO DEFINIDOS',
  endLabels: {
    End_AnunciosAprovados: { text: 'ANUNCIOS APROVADOS', className: 'end-label-success', marker: 'end-success' },
    End_AnunciosReprovados: { text: 'ANUNCIOS REPROVADOS', className: 'end-label-lost' }
  },
  showDefaultEndLabel: false,
  useEndName: false,
  defaultEndLabelText: 'FIM',
  defaultEndClass: 'end-label-lost'
};

window.v5Data = window.v5Data || {};
window.v5Data['4.1'] = { diagramXML, nodeDetails, phases, ...config };
