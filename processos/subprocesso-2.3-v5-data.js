const nodeDetails = {
  'Task_S_ProporMetas': { sla: '24h', tag: 'Proposta', desc: 'Define metas iniciais com base na analise 2.2, briefing e verba.' },
  'Task_S_AgendarReuniao': { sla: '48h', tag: 'Alinhamento', desc: 'Agenda reuniao com stakeholders do cliente e interno.' },
  'Task_S_RealizarReuniao': { sla: null, tag: 'Alinhamento', desc: 'Reuniao para apresentar metas, negociar ajustes e registrar decisoes.' },
  'Task_S_RevisarMetas': { sla: '24h', tag: 'Revisao', desc: 'Recalibra metas com base em objecoes e restricoes.' },
  'Task_S_DocumentarMetas': { sla: '24h', tag: 'Formalizacao', desc: 'Documenta metas e KPIs finais com mensuracao e responsabilidades.' },
  'Task_I_ResumoAnalise': { sla: null, tag: 'Resumo', desc: 'Resume a analise 2.2 com foco em metas e orcamento.' },
  'Task_I_SugerirMetas': { sla: null, tag: 'Sugestao', desc: 'Sugere metas e KPIs com base em benchmarks.' },
  'Task_I_SimularCenarios': { sla: null, tag: 'Cenarios', desc: 'Simula cenarios conservador, base e agressivo.' },
  'Task_I_RoteiroReuniao': { sla: null, tag: 'Roteiro', desc: 'Gera pauta da reuniao com topicos e perguntas-chave.' },
  'Task_I_RecalibrarMetas': { sla: null, tag: 'Revisao IA', desc: 'Recalibra metas com feedback e limites de viabilidade.' },
  'Task_I_GerarDocumento': { sla: null, tag: 'Documento', desc: 'Gera texto base do documento final de metas.' },
  'Task_I_ResumoCliente': { sla: null, tag: 'Sumario', desc: 'Cria versao resumida para o cliente.' },
  'Task_A_DispararProposta': { sla: null, tag: 'Envio', desc: 'Dispara proposta de metas antes da reuniao.' },
  'Task_A_CriarEvento': { sla: null, tag: 'Agenda', desc: 'Cria evento no calendario com link da reuniao.' },
  'Task_A_RegistrarMetas': { sla: null, tag: 'Registro', desc: 'Registra metas finais em CRM/Projetos.' },
  'Task_A_AtualizarDashboards': { sla: null, tag: 'Dashboards', desc: 'Atualiza dashboards com targets definidos.' },
  'Task_C_RevisarProposta': { sla: null, tag: 'Cliente', desc: 'Cliente revisa proposta e prepara duvidas.' },
  'Task_C_ParticiparReuniao': { sla: null, tag: 'Cliente', desc: 'Cliente participa da reuniao de metas.' },
  'Task_C_AprovarMetas': { sla: null, tag: 'Aprovacao', desc: 'Cliente aprova metas e KPIs formalmente.' },
  'Task_R_AvaliarViabilidade': { sla: null, tag: 'Viabilidade', desc: 'Avalia se metas propostas sao realistas.' },
  'Task_R_AjustarCenarios': { sla: null, tag: 'Cenarios', desc: 'Ajusta cenarios e limites se necessario.' },
  'Task_R_AprovarVersaoFinal': { sla: null, tag: 'Direcao', desc: 'Aprova versao final internamente.' }
};

const diagramXML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_23_V5" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_23_V5">
    <bpmn:participant id="Participant_23_V5" name="Definicao de Metas e KPIs" processRef="Process_23_V5" />
  </bpmn:collaboration>
  <bpmn:process id="Process_23_V5" isExecutable="false">
    <bpmn:laneSet id="LaneSet_23_V5">
      <bpmn:lane id="Lane_Strategy" name="Estrategia / Planejamento">
        <bpmn:flowNodeRef>Start_Onboarding</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_ProporMetas</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_AgendarReuniao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_RealizarReuniao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_Aprovadas</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_RevisarMetas</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_S_DocumentarMetas</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_Success</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_IA" name="IA & Cenarios">
        <bpmn:flowNodeRef>Task_I_ResumoAnalise</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_SugerirMetas</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_SimularCenarios</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_RoteiroReuniao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_RecalibrarMetas</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_GerarDocumento</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_ResumoCliente</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Auto" name="Automacao / CRM">
        <bpmn:flowNodeRef>Task_A_DispararProposta</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_CriarEvento</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_RegistrarMetas</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_AtualizarDashboards</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Cliente" name="Cliente">
        <bpmn:flowNodeRef>Task_C_RevisarProposta</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_C_ParticiparReuniao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_C_AprovarMetas</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Gestao" name="Gestao / Direcao">
        <bpmn:flowNodeRef>Task_R_AvaliarViabilidade</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_MetasViaveis</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_R_AjustarCenarios</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_R_AprovarVersaoFinal</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_MetasInviaveis</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>

    <bpmn:startEvent id="Start_Onboarding" name="Analise Concluida">
      <bpmn:outgoing>F_Start_Propor</bpmn:outgoing>
    </bpmn:startEvent>

    <bpmn:task id="Task_S_ProporMetas" name="1. Propor Metas e KPIs">
      <bpmn:incoming>F_Start_Propor</bpmn:incoming>
      <bpmn:outgoing>F_Propor_Resumo</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_I_ResumoAnalise" name="Resumir Analise 2.2">
      <bpmn:incoming>F_Propor_Resumo</bpmn:incoming>
      <bpmn:outgoing>F_Resumo_Sugerir</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_I_SugerirMetas" name="Gerar Metas Propostas">
      <bpmn:incoming>F_Resumo_Sugerir</bpmn:incoming>
      <bpmn:outgoing>F_Sugerir_Simular</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_I_SimularCenarios" name="Simular Cenarios">
      <bpmn:incoming>F_Sugerir_Simular</bpmn:incoming>
      <bpmn:outgoing>F_Simular_Avaliar</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_R_AvaliarViabilidade" name="Avaliar Viabilidade">
      <bpmn:incoming>F_Simular_Avaliar</bpmn:incoming>
      <bpmn:outgoing>F_Avaliar_Gateway</bpmn:outgoing>
    </bpmn:task>

    <bpmn:exclusiveGateway id="Gateway_MetasViaveis" name="Metas viaveis?">
      <bpmn:incoming>F_Avaliar_Gateway</bpmn:incoming>
      <bpmn:outgoing>F_Gateway_Yes_Ajustar</bpmn:outgoing>
      <bpmn:outgoing>F_Gateway_No_Inviavel</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <bpmn:task id="Task_R_AjustarCenarios" name="Ajustar Cenarios">
      <bpmn:incoming>F_Gateway_Yes_Ajustar</bpmn:incoming>
      <bpmn:outgoing>F_Ajustar_Disparar</bpmn:outgoing>
    </bpmn:task>

    <bpmn:endEvent id="End_MetasInviaveis" name="Fim Metas Inviaveis">
      <bpmn:incoming>F_Gateway_No_Inviavel</bpmn:incoming>
    </bpmn:endEvent>

    <bpmn:task id="Task_A_DispararProposta" name="Disparar Proposta de Metas">
      <bpmn:incoming>F_Ajustar_Disparar</bpmn:incoming>
      <bpmn:outgoing>F_Disparar_Revisar</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_C_RevisarProposta" name="Revisar Proposta de Metas">
      <bpmn:incoming>F_Disparar_Revisar</bpmn:incoming>
      <bpmn:outgoing>F_Revisar_Agendar</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_S_AgendarReuniao" name="2. Agendar Reuniao">
      <bpmn:incoming>F_Revisar_Agendar</bpmn:incoming>
      <bpmn:outgoing>F_Agendar_Evento</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_A_CriarEvento" name="Criar Evento no Calendario">
      <bpmn:incoming>F_Agendar_Evento</bpmn:incoming>
      <bpmn:outgoing>F_Evento_Roteiro</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_I_RoteiroReuniao" name="Montar Pauta da Reuniao">
      <bpmn:incoming>F_Evento_Roteiro</bpmn:incoming>
      <bpmn:outgoing>F_Roteiro_Reuniao</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_S_RealizarReuniao" name="3. Realizar Reuniao">
      <bpmn:incoming>F_Roteiro_Reuniao</bpmn:incoming>
      <bpmn:outgoing>F_Reuniao_Participar</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_C_ParticiparReuniao" name="Participar da Reuniao">
      <bpmn:incoming>F_Reuniao_Participar</bpmn:incoming>
      <bpmn:outgoing>F_Participar_Gateway</bpmn:outgoing>
    </bpmn:task>

    <bpmn:exclusiveGateway id="Gateway_Aprovadas" name="Metas aprovadas?">
      <bpmn:incoming>F_Participar_Gateway</bpmn:incoming>
      <bpmn:outgoing>F_Gateway_Yes_Aprovar</bpmn:outgoing>
      <bpmn:outgoing>F_Gateway_No_Recalibrar</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <bpmn:task id="Task_C_AprovarMetas" name="Aprovar Metas e KPIs">
      <bpmn:incoming>F_Gateway_Yes_Aprovar</bpmn:incoming>
      <bpmn:outgoing>F_Aprovar_DocumentoIA</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_I_RecalibrarMetas" name="Recalibrar Metas">
      <bpmn:incoming>F_Gateway_No_Recalibrar</bpmn:incoming>
      <bpmn:outgoing>F_Recalibrar_Revisar</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_S_RevisarMetas" name="4. Revisar Metas">
      <bpmn:incoming>F_Recalibrar_Revisar</bpmn:incoming>
      <bpmn:outgoing>F_Revisar_Avaliar</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_I_GerarDocumento" name="Gerar Documento de Metas">
      <bpmn:incoming>F_Aprovar_DocumentoIA</bpmn:incoming>
      <bpmn:outgoing>F_DocumentoIA_ResumoCliente</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_I_ResumoCliente" name="Criar Versao Resumida">
      <bpmn:incoming>F_DocumentoIA_ResumoCliente</bpmn:incoming>
      <bpmn:outgoing>F_ResumoCliente_Documentar</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_S_DocumentarMetas" name="5. Documentar Metas e KPIs">
      <bpmn:incoming>F_ResumoCliente_Documentar</bpmn:incoming>
      <bpmn:outgoing>F_Documentar_AprovarFinal</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_R_AprovarVersaoFinal" name="Aprovar Versao Final">
      <bpmn:incoming>F_Documentar_AprovarFinal</bpmn:incoming>
      <bpmn:outgoing>F_AprovarFinal_Registrar</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_A_RegistrarMetas" name="Registrar Metas em CRM">
      <bpmn:incoming>F_AprovarFinal_Registrar</bpmn:incoming>
      <bpmn:outgoing>F_Registrar_Dash</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_A_AtualizarDashboards" name="Atualizar Dashboards">
      <bpmn:incoming>F_Registrar_Dash</bpmn:incoming>
      <bpmn:outgoing>F_Dash_End</bpmn:outgoing>
    </bpmn:task>

    <bpmn:endEvent id="End_Success" name="Metas e KPIs Definidos">
      <bpmn:incoming>F_Dash_End</bpmn:incoming>
    </bpmn:endEvent>

    <bpmn:sequenceFlow id="F_Start_Propor" sourceRef="Start_Onboarding" targetRef="Task_S_ProporMetas" />
    <bpmn:sequenceFlow id="F_Propor_Resumo" sourceRef="Task_S_ProporMetas" targetRef="Task_I_ResumoAnalise" />
    <bpmn:sequenceFlow id="F_Resumo_Sugerir" sourceRef="Task_I_ResumoAnalise" targetRef="Task_I_SugerirMetas" />
    <bpmn:sequenceFlow id="F_Sugerir_Simular" sourceRef="Task_I_SugerirMetas" targetRef="Task_I_SimularCenarios" />
    <bpmn:sequenceFlow id="F_Simular_Avaliar" sourceRef="Task_I_SimularCenarios" targetRef="Task_R_AvaliarViabilidade" />
    <bpmn:sequenceFlow id="F_Avaliar_Gateway" sourceRef="Task_R_AvaliarViabilidade" targetRef="Gateway_MetasViaveis" />
    <bpmn:sequenceFlow id="F_Gateway_Yes_Ajustar" name="Sim" sourceRef="Gateway_MetasViaveis" targetRef="Task_R_AjustarCenarios" />
    <bpmn:sequenceFlow id="F_Gateway_No_Inviavel" name="Nao" sourceRef="Gateway_MetasViaveis" targetRef="End_MetasInviaveis" />
    <bpmn:sequenceFlow id="F_Ajustar_Disparar" sourceRef="Task_R_AjustarCenarios" targetRef="Task_A_DispararProposta" />
    <bpmn:sequenceFlow id="F_Disparar_Revisar" sourceRef="Task_A_DispararProposta" targetRef="Task_C_RevisarProposta" />
    <bpmn:sequenceFlow id="F_Revisar_Agendar" sourceRef="Task_C_RevisarProposta" targetRef="Task_S_AgendarReuniao" />
    <bpmn:sequenceFlow id="F_Agendar_Evento" sourceRef="Task_S_AgendarReuniao" targetRef="Task_A_CriarEvento" />
    <bpmn:sequenceFlow id="F_Evento_Roteiro" sourceRef="Task_A_CriarEvento" targetRef="Task_I_RoteiroReuniao" />
    <bpmn:sequenceFlow id="F_Roteiro_Reuniao" sourceRef="Task_I_RoteiroReuniao" targetRef="Task_S_RealizarReuniao" />
    <bpmn:sequenceFlow id="F_Reuniao_Participar" sourceRef="Task_S_RealizarReuniao" targetRef="Task_C_ParticiparReuniao" />
    <bpmn:sequenceFlow id="F_Participar_Gateway" sourceRef="Task_C_ParticiparReuniao" targetRef="Gateway_Aprovadas" />
    <bpmn:sequenceFlow id="F_Gateway_Yes_Aprovar" name="Sim" sourceRef="Gateway_Aprovadas" targetRef="Task_C_AprovarMetas" />
    <bpmn:sequenceFlow id="F_Gateway_No_Recalibrar" name="Nao" sourceRef="Gateway_Aprovadas" targetRef="Task_I_RecalibrarMetas" />
    <bpmn:sequenceFlow id="F_Recalibrar_Revisar" sourceRef="Task_I_RecalibrarMetas" targetRef="Task_S_RevisarMetas" />
    <bpmn:sequenceFlow id="F_Revisar_Avaliar" sourceRef="Task_S_RevisarMetas" targetRef="Task_R_AvaliarViabilidade" />
    <bpmn:sequenceFlow id="F_Aprovar_DocumentoIA" sourceRef="Task_C_AprovarMetas" targetRef="Task_I_GerarDocumento" />
    <bpmn:sequenceFlow id="F_DocumentoIA_ResumoCliente" sourceRef="Task_I_GerarDocumento" targetRef="Task_I_ResumoCliente" />
    <bpmn:sequenceFlow id="F_ResumoCliente_Documentar" sourceRef="Task_I_ResumoCliente" targetRef="Task_S_DocumentarMetas" />
    <bpmn:sequenceFlow id="F_Documentar_AprovarFinal" sourceRef="Task_S_DocumentarMetas" targetRef="Task_R_AprovarVersaoFinal" />
    <bpmn:sequenceFlow id="F_AprovarFinal_Registrar" sourceRef="Task_R_AprovarVersaoFinal" targetRef="Task_A_RegistrarMetas" />
    <bpmn:sequenceFlow id="F_Registrar_Dash" sourceRef="Task_A_RegistrarMetas" targetRef="Task_A_AtualizarDashboards" />
    <bpmn:sequenceFlow id="F_Dash_End" sourceRef="Task_A_AtualizarDashboards" targetRef="End_Success" />
  </bpmn:process>

  <bpmndi:BPMNDiagram id="BPMNDiagram_23_V5">
    <bpmndi:BPMNPlane id="BPMNPlane_23_V5" bpmnElement="Collaboration_23_V5">
      <bpmndi:BPMNShape id="Participant_23_V5_di" bpmnElement="Participant_23_V5" isHorizontal="true">
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

      <bpmndi:BPMNShape id="Start_Onboarding_di" bpmnElement="Start_Onboarding">
        <dc:Bounds x="120" y="77" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_ProporMetas_di" bpmnElement="Task_S_ProporMetas">
        <dc:Bounds x="220" y="55" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_ResumoAnalise_di" bpmnElement="Task_I_ResumoAnalise">
        <dc:Bounds x="380" y="205" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_SugerirMetas_di" bpmnElement="Task_I_SugerirMetas">
        <dc:Bounds x="540" y="205" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_SimularCenarios_di" bpmnElement="Task_I_SimularCenarios">
        <dc:Bounds x="700" y="205" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_R_AvaliarViabilidade_di" bpmnElement="Task_R_AvaliarViabilidade">
        <dc:Bounds x="860" y="655" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_MetasViaveis_di" bpmnElement="Gateway_MetasViaveis" isMarkerVisible="true">
        <dc:Bounds x="1020" y="670" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_R_AjustarCenarios_di" bpmnElement="Task_R_AjustarCenarios">
        <dc:Bounds x="1180" y="655" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_MetasInviaveis_di" bpmnElement="End_MetasInviaveis">
        <dc:Bounds x="1340" y="677" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_DispararProposta_di" bpmnElement="Task_A_DispararProposta">
        <dc:Bounds x="1360" y="355" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_RevisarProposta_di" bpmnElement="Task_C_RevisarProposta">
        <dc:Bounds x="1520" y="505" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_AgendarReuniao_di" bpmnElement="Task_S_AgendarReuniao">
        <dc:Bounds x="1680" y="55" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_CriarEvento_di" bpmnElement="Task_A_CriarEvento">
        <dc:Bounds x="1840" y="355" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_RoteiroReuniao_di" bpmnElement="Task_I_RoteiroReuniao">
        <dc:Bounds x="2000" y="205" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_RealizarReuniao_di" bpmnElement="Task_S_RealizarReuniao">
        <dc:Bounds x="2160" y="55" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_ParticiparReuniao_di" bpmnElement="Task_C_ParticiparReuniao">
        <dc:Bounds x="2320" y="505" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_Aprovadas_di" bpmnElement="Gateway_Aprovadas" isMarkerVisible="true">
        <dc:Bounds x="2480" y="70" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_RecalibrarMetas_di" bpmnElement="Task_I_RecalibrarMetas">
        <dc:Bounds x="2560" y="205" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_RevisarMetas_di" bpmnElement="Task_S_RevisarMetas">
        <dc:Bounds x="2720" y="55" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_AprovarMetas_di" bpmnElement="Task_C_AprovarMetas">
        <dc:Bounds x="2640" y="505" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_GerarDocumento_di" bpmnElement="Task_I_GerarDocumento">
        <dc:Bounds x="2880" y="205" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_ResumoCliente_di" bpmnElement="Task_I_ResumoCliente">
        <dc:Bounds x="3040" y="205" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_DocumentarMetas_di" bpmnElement="Task_S_DocumentarMetas">
        <dc:Bounds x="3200" y="55" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_R_AprovarVersaoFinal_di" bpmnElement="Task_R_AprovarVersaoFinal">
        <dc:Bounds x="3360" y="655" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_RegistrarMetas_di" bpmnElement="Task_A_RegistrarMetas">
        <dc:Bounds x="3520" y="355" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_AtualizarDashboards_di" bpmnElement="Task_A_AtualizarDashboards">
        <dc:Bounds x="3680" y="355" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_Success_di" bpmnElement="End_Success">
        <dc:Bounds x="3860" y="77" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="F_Start_Propor_di" bpmnElement="F_Start_Propor">
        <di:waypoint x="138" y="95" />
        <di:waypoint x="280" y="95" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Propor_Resumo_di" bpmnElement="F_Propor_Resumo">
        <di:waypoint x="280" y="95" />
        <di:waypoint x="440" y="245" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Resumo_Sugerir_di" bpmnElement="F_Resumo_Sugerir">
        <di:waypoint x="440" y="245" />
        <di:waypoint x="600" y="245" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Sugerir_Simular_di" bpmnElement="F_Sugerir_Simular">
        <di:waypoint x="600" y="245" />
        <di:waypoint x="760" y="245" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Simular_Avaliar_di" bpmnElement="F_Simular_Avaliar">
        <di:waypoint x="760" y="245" />
        <di:waypoint x="920" y="695" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Avaliar_Gateway_di" bpmnElement="F_Avaliar_Gateway">
        <di:waypoint x="920" y="695" />
        <di:waypoint x="1045" y="695" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Gateway_Yes_Ajustar_di" bpmnElement="F_Gateway_Yes_Ajustar">
        <di:waypoint x="1045" y="695" />
        <di:waypoint x="1240" y="695" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Gateway_No_Inviavel_di" bpmnElement="F_Gateway_No_Inviavel">
        <di:waypoint x="1045" y="695" />
        <di:waypoint x="1358" y="695" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Ajustar_Disparar_di" bpmnElement="F_Ajustar_Disparar">
        <di:waypoint x="1240" y="695" />
        <di:waypoint x="1420" y="395" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Disparar_Revisar_di" bpmnElement="F_Disparar_Revisar">
        <di:waypoint x="1420" y="395" />
        <di:waypoint x="1580" y="545" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Revisar_Agendar_di" bpmnElement="F_Revisar_Agendar">
        <di:waypoint x="1580" y="545" />
        <di:waypoint x="1740" y="95" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Agendar_Evento_di" bpmnElement="F_Agendar_Evento">
        <di:waypoint x="1740" y="95" />
        <di:waypoint x="1900" y="395" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Evento_Roteiro_di" bpmnElement="F_Evento_Roteiro">
        <di:waypoint x="1900" y="395" />
        <di:waypoint x="2060" y="245" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Roteiro_Reuniao_di" bpmnElement="F_Roteiro_Reuniao">
        <di:waypoint x="2060" y="245" />
        <di:waypoint x="2220" y="95" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Reuniao_Participar_di" bpmnElement="F_Reuniao_Participar">
        <di:waypoint x="2220" y="95" />
        <di:waypoint x="2380" y="545" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Participar_Gateway_di" bpmnElement="F_Participar_Gateway">
        <di:waypoint x="2380" y="545" />
        <di:waypoint x="2505" y="95" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Gateway_Yes_Aprovar_di" bpmnElement="F_Gateway_Yes_Aprovar">
        <di:waypoint x="2505" y="95" />
        <di:waypoint x="2700" y="545" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Gateway_No_Recalibrar_di" bpmnElement="F_Gateway_No_Recalibrar">
        <di:waypoint x="2505" y="95" />
        <di:waypoint x="2620" y="245" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Recalibrar_Revisar_di" bpmnElement="F_Recalibrar_Revisar">
        <di:waypoint x="2620" y="245" />
        <di:waypoint x="2780" y="95" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Revisar_Avaliar_di" bpmnElement="F_Revisar_Avaliar">
        <di:waypoint x="2780" y="95" />
        <di:waypoint x="920" y="695" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Aprovar_DocumentoIA_di" bpmnElement="F_Aprovar_DocumentoIA">
        <di:waypoint x="2700" y="545" />
        <di:waypoint x="2940" y="245" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_DocumentoIA_ResumoCliente_di" bpmnElement="F_DocumentoIA_ResumoCliente">
        <di:waypoint x="2940" y="245" />
        <di:waypoint x="3100" y="245" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_ResumoCliente_Documentar_di" bpmnElement="F_ResumoCliente_Documentar">
        <di:waypoint x="3100" y="245" />
        <di:waypoint x="3260" y="95" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Documentar_AprovarFinal_di" bpmnElement="F_Documentar_AprovarFinal">
        <di:waypoint x="3260" y="95" />
        <di:waypoint x="3420" y="695" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_AprovarFinal_Registrar_di" bpmnElement="F_AprovarFinal_Registrar">
        <di:waypoint x="3420" y="695" />
        <di:waypoint x="3580" y="395" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Registrar_Dash_di" bpmnElement="F_Registrar_Dash">
        <di:waypoint x="3580" y="395" />
        <di:waypoint x="3740" y="395" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Dash_End_di" bpmnElement="F_Dash_End">
        <di:waypoint x="3740" y="395" />
        <di:waypoint x="3878" y="95" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

const phases = [
  { name: 'Entrada', x: 80, width: 520 },
  { name: 'Proposta', x: 600, width: 640 },
  { name: 'Alinhamento', x: 1240, width: 640 },
  { name: 'Revisao', x: 1880, width: 640 },
  { name: 'Formalizacao', x: 2520, width: 640 },
  { name: 'Saida', x: 3160, width: 780 }
];

const config = {
  zoom: 0.85,
  storageKey: 'subprocesso-2.3',
  startLabel: 'ANALISE CONCLUIDA',
  endLabels: {
    End_Success: { text: 'METAS E KPIS DEFINIDOS', className: 'end-label-success', marker: 'end-success' },
    End_MetasInviaveis: { text: 'METAS INVIAVEIS', className: 'end-label-lost' }
  },
  showDefaultEndLabel: false,
  useEndName: false,
  defaultEndLabelText: 'FIM',
  defaultEndClass: 'end-label-lost'
};

window.v5Data = window.v5Data || {};
window.v5Data['2.3'] = { diagramXML, nodeDetails, phases, ...config };
