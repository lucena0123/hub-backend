const nodeDetails = {
            'Task_S_ICP': { sla: 'Mensal', tag: 'Subprocesso', desc: "ICP & Estratégia: Definição do perfil de cliente ideal revisado mensalmente." },
            'Task_S_Lista': { sla: 'Diário', tag: 'Checklist', desc: "Gerar Lista: SDR gera base filtrada por ICP e enriquecida." },
            'Task_A_Enriquecer': { sla: 'Real-time', tag: 'Automação', desc: "Automação: Obtém CNPJ, site e sinais de intenção automaticamente." },
            'Task_I_Qualifica': { sla: 'Real-time', tag: 'IA', desc: "IA Qualifica Leads: Analisa fit jurídico, urgência e score de intenção." },
            'Task_I_Prioriza': { sla: 'Real-time', tag: 'Priorização', desc: "Score de Prioridade: IA decide qual lead deve ser contatado primeiro." },
            'Task_S_Tentativas': { sla: '1 dia úteis', tag: 'Subprocesso', desc: "Tentar 1º Contato: 3 tentativas em diferentes canais conforme cadência." },
            'Task_S_Contato': { sla: 'Imediato', tag: 'Human Touch', desc: "Realizar 1º Contato: Conexão humana direta no momento de alta intenção." },
            'Task_C_Responde': { sla: null, tag: 'Experiência', desc: "Cliente: Interação com a prospecção (resposta ou silêncio)." },
            'Task_A_FollowUp': { sla: '3 dias', tag: 'Sequência', desc: "Follow-up Automático: WhatsApp e e-mails inteligentes disparados por n8n." },
            'Task_I_Rejeição': { sla: 'On-demand', tag: 'IA Analytics', desc: "Análise de Rejeição: IA identifica se é preço, tempo ou fit." },
            'Task_S_Registro': { sla: '15 min', tag: 'CRM', desc: "Registrar Reunião: Logging completo no CRM + Briefing técnico." },
            'Task_A_Nurturing': { sla: 'Semanal', tag: 'Nurturing', desc: "Entrar em Nurturing: Fluxo periódico de educação para leads sem resposta." },
            'Task_I_Loop': { sla: 'Semanal', tag: 'Loop Nível 5', desc: "Melhoria Contínua: IA ajusta scripts e critérios com base nos resultados." }
        };

const diagramXML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_SDR" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_SDR">
    <bpmn:participant id="Participant_SDR" name="Prospecção SDR Nível 5" processRef="Process_SDR" />
  </bpmn:collaboration>
  <bpmn:process id="Process_SDR" isExecutable="false">
    <bpmn:laneSet id="LaneSet_SDR">
      <bpmn:lane id="Lane_SDR" name="SDR"><bpmn:flowNodeRef>StartEvent_1</bpmn:flowNodeRef><bpmn:flowNodeRef>Task_S_ICP</bpmn:flowNodeRef><bpmn:flowNodeRef>Task_S_Lista</bpmn:flowNodeRef><bpmn:flowNodeRef>Task_S_Tentativas</bpmn:flowNodeRef><bpmn:flowNodeRef>Task_S_Contato</bpmn:flowNodeRef><bpmn:flowNodeRef>Gateway_Agenda</bpmn:flowNodeRef><bpmn:flowNodeRef>Task_S_Registro</bpmn:flowNodeRef><bpmn:flowNodeRef>End_Success</bpmn:flowNodeRef></bpmn:lane>
      <bpmn:lane id="Lane_Auto" name="Automação"><bpmn:flowNodeRef>Task_A_Enriquecer</bpmn:flowNodeRef><bpmn:flowNodeRef>Task_A_FollowUp</bpmn:flowNodeRef><bpmn:flowNodeRef>Gateway_PosFollow</bpmn:flowNodeRef><bpmn:flowNodeRef>Event_Wait_NoResponse</bpmn:flowNodeRef><bpmn:flowNodeRef>Task_A_Nurturing</bpmn:flowNodeRef></bpmn:lane>
      <bpmn:lane id="Lane_IA" name="IA"><bpmn:flowNodeRef>Start_IA_Loop</bpmn:flowNodeRef><bpmn:flowNodeRef>Task_I_Qualifica</bpmn:flowNodeRef><bpmn:flowNodeRef>Gateway_Qualificado</bpmn:flowNodeRef><bpmn:flowNodeRef>Task_I_Prioriza</bpmn:flowNodeRef><bpmn:flowNodeRef>Task_I_Rejeição</bpmn:flowNodeRef><bpmn:flowNodeRef>Task_I_Loop</bpmn:flowNodeRef><bpmn:flowNodeRef>End_IA_Loop</bpmn:flowNodeRef></bpmn:lane>
      <bpmn:lane id="Lane_Cliente" name="Cliente"><bpmn:flowNodeRef>Task_C_Responde</bpmn:flowNodeRef><bpmn:flowNodeRef>Gateway_Responde</bpmn:flowNodeRef><bpmn:flowNodeRef>End_Silent</bpmn:flowNodeRef></bpmn:lane>
      <bpmn:lane id="Lane_Nurturing" name="Nurturing"><bpmn:flowNodeRef>End_Nurturing</bpmn:flowNodeRef></bpmn:lane>
    </bpmn:laneSet>
    <bpmn:startEvent id="StartEvent_1"><bpmn:outgoing>F1</bpmn:outgoing></bpmn:startEvent>
    <bpmn:startEvent id="Start_IA_Loop" name="IA Review Semanal"><bpmn:outgoing>F_IA_Start</bpmn:outgoing><bpmn:timerEventDefinition /></bpmn:startEvent>
    <bpmn:task id="Task_S_ICP" name="Definir ICP"><bpmn:incoming>F1</bpmn:incoming><bpmn:outgoing>F2</bpmn:outgoing></bpmn:task>
    <bpmn:task id="Task_S_Lista" name="Gerar Lista"><bpmn:incoming>F2</bpmn:incoming><bpmn:outgoing>F3</bpmn:outgoing></bpmn:task>
    <bpmn:task id="Task_A_Enriquecer" name="Enriquecer Lead"><bpmn:incoming>F3</bpmn:incoming><bpmn:outgoing>F4</bpmn:outgoing></bpmn:task>
    <bpmn:task id="Task_I_Qualifica" name="IA Qualifica"><bpmn:incoming>F4</bpmn:incoming><bpmn:outgoing>F5</bpmn:outgoing></bpmn:task>
    <bpmn:exclusiveGateway id="Gateway_Qualificado" name="Qualificado?"><bpmn:incoming>F5</bpmn:incoming><bpmn:outgoing>F6_Yes</bpmn:outgoing><bpmn:outgoing>F6_No</bpmn:outgoing></bpmn:exclusiveGateway>
    <bpmn:task id="Task_I_Rejeição" name="Analisar Rejeição"><bpmn:incoming>F6_No</bpmn:incoming><bpmn:outgoing>F7_PoorFit</bpmn:outgoing></bpmn:task>
    <bpmn:task id="Task_I_Prioriza" name="Priorizar Lead"><bpmn:incoming>F6_Yes</bpmn:incoming><bpmn:outgoing>F8</bpmn:outgoing></bpmn:task>
    <bpmn:task id="Task_S_Tentativas" name="Tentar Contato"><bpmn:incoming>F8</bpmn:incoming><bpmn:outgoing>F9</bpmn:outgoing></bpmn:task>
    <bpmn:task id="Task_S_Contato" name="Realizar Contato"><bpmn:incoming>F9</bpmn:incoming><bpmn:outgoing>F10</bpmn:outgoing></bpmn:task>
    <bpmn:task id="Task_C_Responde" name="Respostas Cliente"><bpmn:incoming>F10</bpmn:incoming><bpmn:outgoing>F11</bpmn:outgoing></bpmn:task>
    <bpmn:exclusiveGateway id="Gateway_Responde" name="Respondeu?"><bpmn:incoming>F11</bpmn:incoming><bpmn:outgoing>FR_Yes</bpmn:outgoing><bpmn:outgoing>FR_No</bpmn:outgoing></bpmn:exclusiveGateway>
    <bpmn:task id="Task_A_FollowUp" name="Follow-up Auto"><bpmn:incoming>FR_No</bpmn:incoming><bpmn:outgoing>F12_Result</bpmn:outgoing></bpmn:task>
    <bpmn:exclusiveGateway id="Gateway_PosFollow" name="Respondido?"><bpmn:incoming>F12_Result</bpmn:incoming><bpmn:outgoing>F_Follow_Yes</bpmn:outgoing><bpmn:outgoing>F_Follow_No</bpmn:outgoing></bpmn:exclusiveGateway>
    <bpmn:intermediateCatchEvent id="Event_Wait_NoResponse" name="Aguardar 7 dias"><bpmn:incoming>F_Follow_No</bpmn:incoming><bpmn:outgoing>F_NoResponse_End</bpmn:outgoing><bpmn:timerEventDefinition /></bpmn:intermediateCatchEvent>
    <bpmn:exclusiveGateway id="Gateway_Agenda" name="Agendado?"><bpmn:incoming>FR_Yes</bpmn:incoming><bpmn:incoming>F_Follow_Yes</bpmn:incoming><bpmn:outgoing>FA_Yes</bpmn:outgoing><bpmn:outgoing>FA_No</bpmn:outgoing></bpmn:exclusiveGateway>
    <bpmn:task id="Task_S_Registro" name="Registrar Reunião"><bpmn:incoming>FA_Yes</bpmn:incoming><bpmn:outgoing>F13</bpmn:outgoing></bpmn:task>
    <bpmn:task id="Task_A_Nurturing" name="Entrar Nurturing"><bpmn:incoming>FA_No</bpmn:incoming><bpmn:incoming>F7_PoorFit</bpmn:incoming><bpmn:outgoing>F14</bpmn:outgoing></bpmn:task>
    <bpmn:endEvent id="End_Success" name="Agendada"><bpmn:incoming>F13</bpmn:incoming></bpmn:endEvent>
    <bpmn:endEvent id="End_Nurturing" name="Nurturing"><bpmn:incoming>F14</bpmn:incoming></bpmn:endEvent>
    <bpmn:endEvent id="End_Silent" name="Sem Resposta"><bpmn:incoming>F_NoResponse_End</bpmn:incoming></bpmn:endEvent>
    <bpmn:task id="Task_I_Loop" name="IA Loop Melhoria"><bpmn:incoming>F_IA_Start</bpmn:incoming><bpmn:outgoing>F_Loop_Out</bpmn:outgoing></bpmn:task>
    <bpmn:endEvent id="End_IA_Loop" name="IA Ajustada"><bpmn:incoming>F_Loop_Out</bpmn:incoming></bpmn:endEvent>
    <bpmn:sequenceFlow id="F1" sourceRef="StartEvent_1" targetRef="Task_S_ICP" />
    <bpmn:sequenceFlow id="F2" sourceRef="Task_S_ICP" targetRef="Task_S_Lista" />
    <bpmn:sequenceFlow id="F3" sourceRef="Task_S_Lista" targetRef="Task_A_Enriquecer" />
    <bpmn:sequenceFlow id="F4" sourceRef="Task_A_Enriquecer" targetRef="Task_I_Qualifica" />
    <bpmn:sequenceFlow id="F5" sourceRef="Task_I_Qualifica" targetRef="Gateway_Qualificado" />
    <bpmn:sequenceFlow id="F6_Yes" name="Sim" sourceRef="Gateway_Qualificado" targetRef="Task_I_Prioriza" />
    <bpmn:sequenceFlow id="F6_No" name="Não" sourceRef="Gateway_Qualificado" targetRef="Task_I_Rejeição" />
    <bpmn:sequenceFlow id="F7_PoorFit" sourceRef="Task_I_Rejeição" targetRef="Task_A_Nurturing" />
    <bpmn:sequenceFlow id="F8" sourceRef="Task_I_Prioriza" targetRef="Task_S_Tentativas" />
    <bpmn:sequenceFlow id="F9" sourceRef="Task_S_Tentativas" targetRef="Task_S_Contato" />
    <bpmn:sequenceFlow id="F10" sourceRef="Task_S_Contato" targetRef="Task_C_Responde" />
    <bpmn:sequenceFlow id="F11" sourceRef="Task_C_Responde" targetRef="Gateway_Responde" />
    <bpmn:sequenceFlow id="FR_Yes" name="Sim" sourceRef="Gateway_Responde" targetRef="Gateway_Agenda" />
    <bpmn:sequenceFlow id="FR_No" name="Não" sourceRef="Gateway_Responde" targetRef="Task_A_FollowUp" />
    <bpmn:sequenceFlow id="F12_Result" sourceRef="Task_A_FollowUp" targetRef="Gateway_PosFollow" />
    <bpmn:sequenceFlow id="F_Follow_Yes" name="Sim" sourceRef="Gateway_PosFollow" targetRef="Gateway_Agenda" />
    <bpmn:sequenceFlow id="F_Follow_No" name="Não" sourceRef="Gateway_PosFollow" targetRef="Event_Wait_NoResponse" />
    <bpmn:sequenceFlow id="F_NoResponse_End" sourceRef="Event_Wait_NoResponse" targetRef="End_Silent" />
    <bpmn:sequenceFlow id="FA_Yes" name="Sim" sourceRef="Gateway_Agenda" targetRef="Task_S_Registro" />
    <bpmn:sequenceFlow id="FA_No" name="Não" sourceRef="Gateway_Agenda" targetRef="Task_A_Nurturing" />
    <bpmn:sequenceFlow id="F13" sourceRef="Task_S_Registro" targetRef="End_Success" />
    <bpmn:sequenceFlow id="F14" sourceRef="Task_A_Nurturing" targetRef="End_Nurturing" />
    <bpmn:sequenceFlow id="F_IA_Start" sourceRef="Start_IA_Loop" targetRef="Task_I_Loop" />
    <bpmn:sequenceFlow id="F_Loop_Out" sourceRef="Task_I_Loop" targetRef="End_IA_Loop" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Collaboration_SDR">
      <bpmndi:BPMNShape id="Participant_SDR_di" bpmnElement="Participant_SDR" isHorizontal="true"><dc:Bounds x="50" y="50" width="3150" height="750" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_SDR_di" bpmnElement="Lane_SDR" isHorizontal="true"><dc:Bounds x="80" y="50" width="3120" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Auto_di" bpmnElement="Lane_Auto" isHorizontal="true"><dc:Bounds x="80" y="200" width="3120" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_IA_di" bpmnElement="Lane_IA" isHorizontal="true"><dc:Bounds x="80" y="350" width="3120" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Cliente_di" bpmnElement="Lane_Cliente" isHorizontal="true"><dc:Bounds x="80" y="500" width="3120" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Nurturing_di" bpmnElement="Lane_Nurturing" isHorizontal="true"><dc:Bounds x="80" y="650" width="3120" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1"><dc:Bounds x="130" y="107" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_ICP_di" bpmnElement="Task_S_ICP"><dc:Bounds x="250" y="85" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_Lista_di" bpmnElement="Task_S_Lista"><dc:Bounds x="430" y="85" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_Enriquecer_di" bpmnElement="Task_A_Enriquecer"><dc:Bounds x="610" y="235" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_Qualifica_di" bpmnElement="Task_I_Qualifica"><dc:Bounds x="790" y="385" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_Qualificado_di" bpmnElement="Gateway_Qualificado" isMarkerVisible="true"><dc:Bounds x="970" y="400" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_Rejeição_di" bpmnElement="Task_I_Rejeição"><dc:Bounds x="1150" y="365" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_Prioriza_di" bpmnElement="Task_I_Prioriza"><dc:Bounds x="1150" y="455" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_Tentativas_di" bpmnElement="Task_S_Tentativas"><dc:Bounds x="1330" y="85" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_Contato_di" bpmnElement="Task_S_Contato"><dc:Bounds x="1510" y="85" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_Responde_di" bpmnElement="Task_C_Responde"><dc:Bounds x="1690" y="535" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_Responde_di" bpmnElement="Gateway_Responde" isMarkerVisible="true"><dc:Bounds x="1870" y="550" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_FollowUp_di" bpmnElement="Task_A_FollowUp"><dc:Bounds x="2050" y="235" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_PosFollow_di" bpmnElement="Gateway_PosFollow" isMarkerVisible="true"><dc:Bounds x="2230" y="250" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Event_Wait_NoResponse_di" bpmnElement="Event_Wait_NoResponse"><dc:Bounds x="2450" y="257" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_Agenda_di" bpmnElement="Gateway_Agenda" isMarkerVisible="true"><dc:Bounds x="2410" y="100" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S_Registro_di" bpmnElement="Task_S_Registro"><dc:Bounds x="2590" y="85" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_Nurturing_di" bpmnElement="Task_A_Nurturing"><dc:Bounds x="2590" y="235" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Start_IA_Loop_di" bpmnElement="Start_IA_Loop"><dc:Bounds x="2770" y="407" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_Loop_di" bpmnElement="Task_I_Loop"><dc:Bounds x="2950" y="385" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_IA_Loop_di" bpmnElement="End_IA_Loop"><dc:Bounds x="3090" y="407" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_Success_di" bpmnElement="End_Success"><dc:Bounds x="2800" y="107" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_Nurturing_di" bpmnElement="End_Nurturing"><dc:Bounds x="2800" y="707" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_Silent_di" bpmnElement="End_Silent"><dc:Bounds x="2800" y="557" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="F1_di" bpmnElement="F1">

        <di:waypoint x="166" y="125" />

        <di:waypoint x="250" y="125" />

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F2_di" bpmnElement="F2">

        <di:waypoint x="350" y="125" />

        <di:waypoint x="430" y="125" />

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F3_di" bpmnElement="F3">

        <di:waypoint x="530" y="125" />

        <di:waypoint x="570" y="125" />

        <di:waypoint x="570" y="275" />

        <di:waypoint x="610" y="275" />

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F4_di" bpmnElement="F4">

        <di:waypoint x="710" y="275" />

        <di:waypoint x="750" y="275" />

        <di:waypoint x="750" y="425" />

        <di:waypoint x="790" y="425" />

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F5_di" bpmnElement="F5">

        <di:waypoint x="890" y="425" />

        <di:waypoint x="970" y="425" />

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F6_Yes_di" bpmnElement="F6_Yes">

        <di:waypoint x="1020" y="425" />

        <di:waypoint x="1085" y="425" />

        <di:waypoint x="1085" y="495" />

        <di:waypoint x="1150" y="495" />

        <bpmndi:BPMNLabel><dc:Bounds x="1005" y="465" width="20" height="14" /></bpmndi:BPMNLabel>

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F6_No_di" bpmnElement="F6_No">

        <di:waypoint x="1020" y="425" />

        <di:waypoint x="1085" y="425" />

        <di:waypoint x="1085" y="405" />

        <di:waypoint x="1150" y="405" />

        <bpmndi:BPMNLabel><dc:Bounds x="1005" y="385" width="21" height="14" /></bpmndi:BPMNLabel>

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F7_PoorFit_di" bpmnElement="F7_PoorFit">

        <di:waypoint x="1250" y="405" />

        <di:waypoint x="2510" y="405" />

        <di:waypoint x="2510" y="275" />

        <di:waypoint x="2590" y="275" />

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F8_di" bpmnElement="F8">

        <di:waypoint x="1250" y="495" />

        <di:waypoint x="1290" y="495" />

        <di:waypoint x="1290" y="125" />

        <di:waypoint x="1330" y="125" />

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F9_di" bpmnElement="F9">

        <di:waypoint x="1430" y="125" />

        <di:waypoint x="1510" y="125" />

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F10_di" bpmnElement="F10">

        <di:waypoint x="1560" y="165" />

        <di:waypoint x="1560" y="350" />

        <di:waypoint x="1740" y="350" />

        <di:waypoint x="1740" y="535" />

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F11_di" bpmnElement="F11">

        <di:waypoint x="1790" y="575" />

        <di:waypoint x="1870" y="575" />

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="FR_Yes_di" bpmnElement="FR_Yes">

        <di:waypoint x="1920" y="575" />

        <di:waypoint x="2165" y="575" />

        <di:waypoint x="2165" y="125" />

        <di:waypoint x="2410" y="125" />

        <bpmndi:BPMNLabel><dc:Bounds x="1905" y="515" width="20" height="14" /></bpmndi:BPMNLabel>

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="FR_No_di" bpmnElement="FR_No">

        <di:waypoint x="1895" y="550" />

        <di:waypoint x="1895" y="432" />

        <di:waypoint x="2100" y="432" />

        <di:waypoint x="2100" y="315" />

        <bpmndi:BPMNLabel><dc:Bounds x="1905" y="622" width="21" height="14" /></bpmndi:BPMNLabel>

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F12_Result_di" bpmnElement="F12_Result">

        <di:waypoint x="2150" y="275" />

        <di:waypoint x="2230" y="275" />

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Follow_Yes_di" bpmnElement="F_Follow_Yes">

        <di:waypoint x="2280" y="275" />

        <di:waypoint x="2345" y="275" />

        <di:waypoint x="2345" y="125" />

        <di:waypoint x="2410" y="125" />

        <bpmndi:BPMNLabel><dc:Bounds x="2265" y="195" width="20" height="14" /></bpmndi:BPMNLabel>

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Follow_No_di" bpmnElement="F_Follow_No">

        <di:waypoint x="2280" y="275" />

        <di:waypoint x="2450" y="275" />

        <bpmndi:BPMNLabel><dc:Bounds x="2300" y="255" width="21" height="14" /></bpmndi:BPMNLabel>

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_NoResponse_End_di" bpmnElement="F_NoResponse_End">

        <di:waypoint x="2486" y="275" />

        <di:waypoint x="2566" y="275" />

        <di:waypoint x="2566" y="575" />

        <di:waypoint x="2800" y="575" />

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="FA_Yes_di" bpmnElement="FA_Yes">

        <di:waypoint x="2460" y="125" />

        <di:waypoint x="2590" y="125" />

        <bpmndi:BPMNLabel><dc:Bounds x="2485" y="105" width="20" height="14" /></bpmndi:BPMNLabel>

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="FA_No_di" bpmnElement="FA_No">

        <di:waypoint x="2460" y="125" />

        <di:waypoint x="2525" y="125" />

        <di:waypoint x="2525" y="275" />

        <di:waypoint x="2590" y="275" />

        <bpmndi:BPMNLabel><dc:Bounds x="2445" y="195" width="21" height="14" /></bpmndi:BPMNLabel>

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F13_di" bpmnElement="F13">

        <di:waypoint x="2690" y="125" />

        <di:waypoint x="2800" y="125" />

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F14_di" bpmnElement="F14">

        <di:waypoint x="2640" y="315" />

        <di:waypoint x="2640" y="627" />

        <di:waypoint x="2818" y="627" />

        <di:waypoint x="2818" y="707" />

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_IA_Start_di" bpmnElement="F_IA_Start">

        <di:waypoint x="2806" y="425" />

        <di:waypoint x="2950" y="425" />

      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Loop_Out_di" bpmnElement="F_Loop_Out">

        <di:waypoint x="3050" y="425" />

        <di:waypoint x="3090" y="425" />

      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

const phases = [
            { name: 'ICP & Lista', x: 80, width: 480 },
            { name: 'Qualificação', x: 560, width: 730 },
            { name: 'Contato', x: 1290, width: 540 },
            { name: 'Follow-up', x: 1830, width: 720 },
            { name: 'Agendamento', x: 2550, width: 360 },
            { name: 'Review & IA', x: 2910, width: 300 }
        ];

const config = {
zoom: 0.85,
            storageKey: 'subprocesso-1.1',
            startLabel: 'INÍCIO DO PROCESSO',
            endLabels: {
                End_Success: { text: 'REUNIÃO AGENDADA', className: 'end-label-success', marker: 'end-success' }
            },
            showDefaultEndLabel: true,
            useEndName: true,
            defaultEndLabelText: 'FIM',
            defaultEndClass: 'end-label-lost'
};

window.v5Data = window.v5Data || {};
window.v5Data['1.1'] = { diagramXML, nodeDetails, phases, ...config };
