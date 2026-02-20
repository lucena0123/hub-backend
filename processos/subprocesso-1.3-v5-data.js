const nodeDetails = {
            'Task_V_Validar': { sla: '30 min', tag: 'Checklist', desc: "Validar Lead: Confere perfil, fit jurídico e momento de compra com checklist padronizado." },
            'Task_A_EnvioProp': { sla: '< 5 min', tag: 'Subprocesso', desc: "Envio Automático: Dispara WhatsApp, e-mail e registra evento no CRM. Links rastreáveis." },
            'Task_C_LerProp': { sla: null, tag: 'Experiência', desc: "Cliente: Recebe e analisa proposta comercial no link rastreável." },
            'Task_I_Comportamento': { sla: 'Real-time', tag: 'Analytics', desc: "IA: Monitora tempo de leitura, cliques e gera score de intenção." },
            'Task_V_RevisarProp': { sla: '1h', tag: 'IA + Vendas', desc: "Revisar Proposta: IA monta rascunho e executivo faz o ajuste fino final." },
            'Task_I_Objeções': { sla: 'On-demand', tag: 'Objeções', desc: "IA: Classifica objeções e sugere scripts de contorno em tempo real." },
            'Task_V_Negociar': { sla: '3 dias', tag: 'Negociação', desc: "Negociação: IA sugere argumentos e âncoras de preço baseadas em dados." },
            'Task_A_Contrato': { sla: '< 10 min', tag: 'Contrato', desc: "Geração Automática: API monta contrato dinâmico com dados do lead." },
            'Task_A_EnvioCont': { sla: 'Imediato', tag: 'Envio', desc: "Envio Automático: Disparo via canal preferido com tracking de abertura." },
            'Task_C_LerCont': { sla: null, tag: 'Revisão', desc: "Cliente: Revisão jurídica com checklist de entendimento e canal de dúvidas." },
            'Task_I_Risco': { sla: 'Contínuo', tag: 'Risco', desc: "IA: Calcula probabilidade de desistência e alerta time de vendas." },
            'Task_V_Recuperar': { sla: '24h', tag: 'Human Touch', desc: "Recuperação: Executivo faz contato direto se IA detectar alto risco." },
            'Task_A_FollowUp': { sla: '5 dias', tag: 'Follow-up', desc: "Cadência: Mensagens escalonadas em CRM até o limite do SLA de decisão." },
            'Task_A_Registro': { sla: '< 15 min', tag: 'CRM & Fin', desc: "Registro Automático: Sincroniza dados com CRM, ERP e financeiro." },
            'Task_B_Setup': { sla: '4h', tag: 'Setup', desc: "Setup Técnico: Configuração do ambiente de onboarding do cliente." },
            'Task_B_Handoff': { sla: '1h', tag: 'Handoff', desc: "Handoff Interno: Passagem de bastão documentada para o gestor de contas." },
            'Task_C_Kickoff': { sla: null, tag: 'Kick-off', desc: "Kick-off Meeting: Reunião estratégica inicial com o cliente." },
            'Task_A_ETL': { sla: 'Diário', tag: 'ETL', desc: "Carga de Dados: Pipelines consolidam tempos e taxas para modelos de IA." },
            'Task_I_Loop': { sla: 'Semanal', tag: 'Loop Nível 5', desc: "Ajustes de IA: IA revisa métricas, identifica gargalos e propõe melhorias automáticas." },
            'Gateway_AcaoRecupera': { sla: null, tag: 'Decisão', desc: "Gatilho de Re-negociação: Executivo decide se volta para Negociação ou segue Follow-up." }
        };

const diagramXML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_Parity" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_Parity">
    <bpmn:participant id="Participant_Parity" name="Fechamento Nível 5 Otimizado" processRef="Process_Parity" />
  </bpmn:collaboration>
  <bpmn:process id="Process_Parity" isExecutable="false">
    <bpmn:laneSet id="LaneSet_1">
      <bpmn:lane id="Lane_Vendas" name="Vendas"><bpmn:flowNodeRef>StartEvent_1</bpmn:flowNodeRef><bpmn:flowNodeRef>Task_V_Validar</bpmn:flowNodeRef><bpmn:flowNodeRef>Gateway_Apto</bpmn:flowNodeRef><bpmn:flowNodeRef>Task_V_RevisarProp</bpmn:flowNodeRef><bpmn:flowNodeRef>Task_V_Negociar</bpmn:flowNodeRef><bpmn:flowNodeRef>Gateway_Acordo</bpmn:flowNodeRef><bpmn:flowNodeRef>Task_V_Recuperar</bpmn:flowNodeRef><bpmn:flowNodeRef>Gateway_AcaoRecupera</bpmn:flowNodeRef><bpmn:flowNodeRef>End_Success</bpmn:flowNodeRef><bpmn:flowNodeRef>End_Lost</bpmn:flowNodeRef></bpmn:lane>
      <bpmn:lane id="Lane_Auto" name="Automação"><bpmn:flowNodeRef>Task_A_EnvioProp</bpmn:flowNodeRef><bpmn:flowNodeRef>Task_A_Contrato</bpmn:flowNodeRef><bpmn:flowNodeRef>Task_A_EnvioCont</bpmn:flowNodeRef><bpmn:flowNodeRef>Task_A_FollowUp</bpmn:flowNodeRef><bpmn:flowNodeRef>Task_A_Registro</bpmn:flowNodeRef><bpmn:flowNodeRef>Start_ETL</bpmn:flowNodeRef><bpmn:flowNodeRef>Task_A_ETL</bpmn:flowNodeRef></bpmn:lane>
      <bpmn:lane id="Lane_IA" name="IA"><bpmn:flowNodeRef>Task_I_Comportamento</bpmn:flowNodeRef><bpmn:flowNodeRef>Task_I_Objeções</bpmn:flowNodeRef><bpmn:flowNodeRef>Task_I_Risco</bpmn:flowNodeRef><bpmn:flowNodeRef>Task_I_Loop</bpmn:flowNodeRef><bpmn:flowNodeRef>End_IA_Loop</bpmn:flowNodeRef></bpmn:lane>
      <bpmn:lane id="Lane_Cliente" name="Cliente"><bpmn:flowNodeRef>Task_C_LerProp</bpmn:flowNodeRef><bpmn:flowNodeRef>Gateway_Aceita</bpmn:flowNodeRef><bpmn:flowNodeRef>Task_C_LerCont</bpmn:flowNodeRef><bpmn:flowNodeRef>Event_Wait_Assina</bpmn:flowNodeRef><bpmn:flowNodeRef>Gateway_Assina</bpmn:flowNodeRef><bpmn:flowNodeRef>Task_C_Kickoff</bpmn:flowNodeRef></bpmn:lane>
      <bpmn:lane id="Lane_Back" name="Backoffice"><bpmn:flowNodeRef>Task_B_Setup</bpmn:flowNodeRef><bpmn:flowNodeRef>Task_B_Handoff</bpmn:flowNodeRef></bpmn:lane>
    </bpmn:laneSet>
    <bpmn:startEvent id="StartEvent_1"><bpmn:outgoing>F1</bpmn:outgoing></bpmn:startEvent>
    <bpmn:startEvent id="Start_ETL" name="ETL Semanal"><bpmn:outgoing>F_IA_Start</bpmn:outgoing><bpmn:timerEventDefinition /></bpmn:startEvent>
    <bpmn:task id="Task_V_Validar" name="Validar Lead"><bpmn:incoming>F1</bpmn:incoming><bpmn:outgoing>F2</bpmn:outgoing></bpmn:task>
    <bpmn:exclusiveGateway id="Gateway_Apto" name="Apto?"><bpmn:incoming>F2</bpmn:incoming><bpmn:outgoing>F3_Yes</bpmn:outgoing><bpmn:outgoing>F_Lost_1</bpmn:outgoing></bpmn:exclusiveGateway>
    <bpmn:task id="Task_A_EnvioProp" name="Envio Proposta"><bpmn:incoming>F3_Yes</bpmn:incoming><bpmn:outgoing>F4</bpmn:outgoing></bpmn:task>
    <bpmn:task id="Task_C_LerProp" name="Avalia Proposta"><bpmn:incoming>F4</bpmn:incoming><bpmn:outgoing>F5</bpmn:outgoing></bpmn:task>
    <bpmn:task id="Task_I_Comportamento" name="Analisar Score"><bpmn:incoming>F5</bpmn:incoming><bpmn:outgoing>F6</bpmn:outgoing></bpmn:task>
    <bpmn:task id="Task_V_RevisarProp" name="Revisar Proposta"><bpmn:incoming>F6</bpmn:incoming><bpmn:outgoing>F7</bpmn:outgoing></bpmn:task>
    <bpmn:exclusiveGateway id="Gateway_Aceita" name="Aceita?"><bpmn:incoming>F7</bpmn:incoming><bpmn:outgoing>F8_Yes</bpmn:outgoing><bpmn:outgoing>F8_No</bpmn:outgoing></bpmn:exclusiveGateway>
    <bpmn:task id="Task_I_Objeções" name="Scripts Objeções"><bpmn:incoming>F8_No</bpmn:incoming><bpmn:outgoing>F9</bpmn:outgoing></bpmn:task>
    <bpmn:task id="Task_V_Negociar" name="Negociação"><bpmn:incoming>F9</bpmn:incoming><bpmn:incoming>F_Renegociar</bpmn:incoming><bpmn:outgoing>F10</bpmn:outgoing></bpmn:task>
    <bpmn:exclusiveGateway id="Gateway_Acordo" name="Acordo?"><bpmn:incoming>F10</bpmn:incoming><bpmn:outgoing>F11_Yes</bpmn:outgoing><bpmn:outgoing>F_Lost_2</bpmn:outgoing></bpmn:exclusiveGateway>
    <bpmn:task id="Task_A_Contrato" name="Geração Contrato"><bpmn:incoming>F8_Yes</bpmn:incoming><bpmn:incoming>F11_Yes</bpmn:incoming><bpmn:outgoing>F12</bpmn:outgoing></bpmn:task>
    <bpmn:task id="Task_A_EnvioCont" name="Envio Contrato"><bpmn:incoming>F12</bpmn:incoming><bpmn:outgoing>F13</bpmn:outgoing></bpmn:task>
    <bpmn:task id="Task_C_LerCont" name="Revisão Cliente"><bpmn:incoming>F13</bpmn:incoming><bpmn:outgoing>F14</bpmn:outgoing></bpmn:task>
    <bpmn:task id="Task_I_Risco" name="Previsão Risco"><bpmn:incoming>F14</bpmn:incoming><bpmn:outgoing>F15</bpmn:outgoing></bpmn:task>
    <bpmn:intermediateCatchEvent id="Event_Wait_Assina" name="Aguardar 5 dias"><bpmn:incoming>F15</bpmn:incoming><bpmn:outgoing>F15_Wait</bpmn:outgoing><bpmn:timerEventDefinition /></bpmn:intermediateCatchEvent>
    <bpmn:exclusiveGateway id="Gateway_Assina" name="Assinou?"><bpmn:incoming>F15_Wait</bpmn:incoming><bpmn:incoming>F18</bpmn:incoming><bpmn:outgoing>F16_Yes</bpmn:outgoing><bpmn:outgoing>F16_No</bpmn:outgoing></bpmn:exclusiveGateway>
    <bpmn:task id="Task_V_Recuperar" name="Recuperação"><bpmn:incoming>F16_No</bpmn:incoming><bpmn:outgoing>F_Recup_Acao</bpmn:outgoing></bpmn:task>
    <bpmn:exclusiveGateway id="Gateway_AcaoRecupera" name="Ação?"><bpmn:incoming>F_Recup_Acao</bpmn:incoming><bpmn:outgoing>F_Renegociar</bpmn:outgoing><bpmn:outgoing>F_SeguirFollow</bpmn:outgoing></bpmn:exclusiveGateway>
    <bpmn:task id="Task_A_FollowUp" name="Follow-up CRM"><bpmn:incoming>F_SeguirFollow</bpmn:incoming><bpmn:outgoing>F18</bpmn:outgoing></bpmn:task>
    <bpmn:task id="Task_A_Registro" name="Registro CRM"><bpmn:incoming>F16_Yes</bpmn:incoming><bpmn:outgoing>F19</bpmn:outgoing></bpmn:task>
    <bpmn:task id="Task_B_Setup" name="Setup Técnico"><bpmn:incoming>F19</bpmn:incoming><bpmn:outgoing>F20</bpmn:outgoing></bpmn:task>
    <bpmn:task id="Task_B_Handoff" name="Handoff Interno"><bpmn:incoming>F20</bpmn:incoming><bpmn:outgoing>F21</bpmn:outgoing></bpmn:task>
    <bpmn:task id="Task_C_Kickoff" name="Kick-off Meeting"><bpmn:incoming>F21</bpmn:incoming><bpmn:outgoing>F22</bpmn:outgoing></bpmn:task>
    <bpmn:endEvent id="End_Success"><bpmn:incoming>F22</bpmn:incoming></bpmn:endEvent>
    <bpmn:endEvent id="End_Lost"><bpmn:incoming>F_Lost_1</bpmn:incoming><bpmn:incoming>F_Lost_2</bpmn:incoming></bpmn:endEvent>
    <bpmn:task id="Task_A_ETL" name="ETL Diário"><bpmn:incoming>F_IA_Start</bpmn:incoming><bpmn:outgoing>F_IA_1</bpmn:outgoing></bpmn:task>
    <bpmn:task id="Task_I_Loop" name="IA Loop Melhoria"><bpmn:incoming>F_IA_1</bpmn:incoming><bpmn:outgoing>F_IA_2</bpmn:outgoing></bpmn:task>
    <bpmn:endEvent id="End_IA_Loop" name="IA Ajustada"><bpmn:incoming>F_IA_2</bpmn:incoming></bpmn:endEvent>
    <bpmn:sequenceFlow id="F1" sourceRef="StartEvent_1" targetRef="Task_V_Validar" />
    <bpmn:sequenceFlow id="F2" sourceRef="Task_V_Validar" targetRef="Gateway_Apto" />
    <bpmn:sequenceFlow id="F3_Yes" name="Sim" sourceRef="Gateway_Apto" targetRef="Task_A_EnvioProp" />
    <bpmn:sequenceFlow id="F4" sourceRef="Task_A_EnvioProp" targetRef="Task_C_LerProp" />
    <bpmn:sequenceFlow id="F5" sourceRef="Task_C_LerProp" targetRef="Task_I_Comportamento" />
    <bpmn:sequenceFlow id="F6" sourceRef="Task_I_Comportamento" targetRef="Task_V_RevisarProp" />
    <bpmn:sequenceFlow id="F7" sourceRef="Task_V_RevisarProp" targetRef="Gateway_Aceita" />
    <bpmn:sequenceFlow id="F8_Yes" name="Sim" sourceRef="Gateway_Aceita" targetRef="Task_A_Contrato" />
    <bpmn:sequenceFlow id="F8_No" name="Não" sourceRef="Gateway_Aceita" targetRef="Task_I_Objeções" />
    <bpmn:sequenceFlow id="F9" sourceRef="Task_I_Objeções" targetRef="Task_V_Negociar" />
    <bpmn:sequenceFlow id="F10" sourceRef="Task_V_Negociar" targetRef="Gateway_Acordo" />
    <bpmn:sequenceFlow id="F11_Yes" name="Sim" sourceRef="Gateway_Acordo" targetRef="Task_A_Contrato" />
    <bpmn:sequenceFlow id="F12" sourceRef="Task_A_Contrato" targetRef="Task_A_EnvioCont" />
    <bpmn:sequenceFlow id="F13" sourceRef="Task_A_EnvioCont" targetRef="Task_C_LerCont" />
    <bpmn:sequenceFlow id="F14" sourceRef="Task_C_LerCont" targetRef="Task_I_Risco" />
    <bpmn:sequenceFlow id="F15" sourceRef="Task_I_Risco" targetRef="Event_Wait_Assina" />
    <bpmn:sequenceFlow id="F15_Wait" sourceRef="Event_Wait_Assina" targetRef="Gateway_Assina" />
    <bpmn:sequenceFlow id="F16_Yes" name="Sim" sourceRef="Gateway_Assina" targetRef="Task_A_Registro" />
    <bpmn:sequenceFlow id="F16_No" name="Não" sourceRef="Gateway_Assina" targetRef="Task_V_Recuperar" />
    <bpmn:sequenceFlow id="F_Recup_Acao" sourceRef="Task_V_Recuperar" targetRef="Gateway_AcaoRecupera" />
    <bpmn:sequenceFlow id="F_Renegociar" name="Renegociar" sourceRef="Gateway_AcaoRecupera" targetRef="Task_V_Negociar" />
    <bpmn:sequenceFlow id="F_SeguirFollow" name="Follow-up" sourceRef="Gateway_AcaoRecupera" targetRef="Task_A_FollowUp" />
    <bpmn:sequenceFlow id="F18" sourceRef="Task_A_FollowUp" targetRef="Gateway_Assina" />
    <bpmn:sequenceFlow id="F19" sourceRef="Task_A_Registro" targetRef="Task_B_Setup" />
    <bpmn:sequenceFlow id="F20" sourceRef="Task_B_Setup" targetRef="Task_B_Handoff" />
    <bpmn:sequenceFlow id="F21" sourceRef="Task_B_Handoff" targetRef="Task_C_Kickoff" />
    <bpmn:sequenceFlow id="F22" sourceRef="Task_C_Kickoff" targetRef="End_Success" />
    <bpmn:sequenceFlow id="F_Lost_1" name="Não" sourceRef="Gateway_Apto" targetRef="End_Lost" />
    <bpmn:sequenceFlow id="F_Lost_2" name="Não" sourceRef="Gateway_Acordo" targetRef="End_Lost" />
    <bpmn:sequenceFlow id="F_IA_Start" sourceRef="Start_ETL" targetRef="Task_A_ETL" />
    <bpmn:sequenceFlow id="F_IA_1" sourceRef="Task_A_ETL" targetRef="Task_I_Loop" />
    <bpmn:sequenceFlow id="F_IA_2" sourceRef="Task_I_Loop" targetRef="End_IA_Loop" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Collaboration_Parity">
      <bpmndi:BPMNShape id="Participant_1_di" bpmnElement="Participant_Parity" isHorizontal="true"><dc:Bounds x="50" y="50" width="2800" height="750" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Vendas_di" bpmnElement="Lane_Vendas" isHorizontal="true"><dc:Bounds x="80" y="50" width="2770" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Auto_di" bpmnElement="Lane_Auto" isHorizontal="true"><dc:Bounds x="80" y="200" width="2770" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_IA_di" bpmnElement="Lane_IA" isHorizontal="true"><dc:Bounds x="80" y="350" width="2770" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Cliente_di" bpmnElement="Lane_Cliente" isHorizontal="true"><dc:Bounds x="80" y="500" width="2770" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Back_di" bpmnElement="Lane_Back" isHorizontal="true"><dc:Bounds x="80" y="650" width="2770" height="150" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1"><dc:Bounds x="130" y="107" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_V_Validar_di" bpmnElement="Task_V_Validar"><dc:Bounds x="230" y="85" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_Apto_di" bpmnElement="Gateway_Apto" isMarkerVisible="true"><dc:Bounds x="380" y="100" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_EnvioProp_di" bpmnElement="Task_A_EnvioProp"><dc:Bounds x="520" y="235" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_LerProp_di" bpmnElement="Task_C_LerProp"><dc:Bounds x="520" y="535" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_Comportamento_di" bpmnElement="Task_I_Comportamento"><dc:Bounds x="670" y="385" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_V_RevisarProp_di" bpmnElement="Task_V_RevisarProp"><dc:Bounds x="820" y="85" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_Aceita_di" bpmnElement="Gateway_Aceita" isMarkerVisible="true"><dc:Bounds x="970" y="535" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_Objeções_di" bpmnElement="Task_I_Objeções"><dc:Bounds x="970" y="385" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_V_Negociar_di" bpmnElement="Task_V_Negociar"><dc:Bounds x="1120" y="85" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_Acordo_di" bpmnElement="Gateway_Acordo" isMarkerVisible="true"><dc:Bounds x="1270" y="100" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_Contrato_di" bpmnElement="Task_A_Contrato"><dc:Bounds x="1420" y="235" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_EnvioCont_di" bpmnElement="Task_A_EnvioCont"><dc:Bounds x="1570" y="235" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_LerCont_di" bpmnElement="Task_C_LerCont"><dc:Bounds x="1570" y="535" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_Risco_di" bpmnElement="Task_I_Risco"><dc:Bounds x="1720" y="385" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Event_Wait_Assina_di" bpmnElement="Event_Wait_Assina"><dc:Bounds x="1810" y="535" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_Assina_di" bpmnElement="Gateway_Assina" isMarkerVisible="true"><dc:Bounds x="1880" y="535" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_V_Recuperar_di" bpmnElement="Task_V_Recuperar"><dc:Bounds x="1960" y="85" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_AcaoRecupera_di" bpmnElement="Gateway_AcaoRecupera" isMarkerVisible="true"><dc:Bounds x="2100" y="100" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_FollowUp_di" bpmnElement="Task_A_FollowUp"><dc:Bounds x="2050" y="235" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_Registro_di" bpmnElement="Task_A_Registro"><dc:Bounds x="2180" y="235" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_B_Setup_di" bpmnElement="Task_B_Setup"><dc:Bounds x="2180" y="685" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_B_Handoff_di" bpmnElement="Task_B_Handoff"><dc:Bounds x="2320" y="685" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_Kickoff_di" bpmnElement="Task_C_Kickoff"><dc:Bounds x="2320" y="535" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Start_ETL_di" bpmnElement="Start_ETL"><dc:Bounds x="2480" y="257" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_ETL_di" bpmnElement="Task_A_ETL"><dc:Bounds x="2570" y="235" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_Loop_di" bpmnElement="Task_I_Loop"><dc:Bounds x="2680" y="385" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_IA_Loop_di" bpmnElement="End_IA_Loop"><dc:Bounds x="2790" y="407" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_Success_di" bpmnElement="End_Success"><dc:Bounds x="2420" y="107" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_Lost_di" bpmnElement="End_Lost"><dc:Bounds x="1360" y="107" width="36" height="36" /></bpmndi:BPMNShape>
            <bpmndi:BPMNEdge id="F1_di" bpmnElement="F1">

              <di:waypoint x="166" y="125" />

              <di:waypoint x="230" y="125" />

            </bpmndi:BPMNEdge>
            <bpmndi:BPMNEdge id="F2_di" bpmnElement="F2">

              <di:waypoint x="330" y="125" />

              <di:waypoint x="380" y="125" />

            </bpmndi:BPMNEdge>
            <bpmndi:BPMNEdge id="F3_Yes_di" bpmnElement="F3_Yes">


              <di:waypoint x="430" y="125" />

              <di:waypoint x="475" y="125" />

              <di:waypoint x="475" y="275" />

              <di:waypoint x="520" y="275" />

              <bpmndi:BPMNLabel><dc:Bounds x="485" y="190" width="20" height="14" /></bpmndi:BPMNLabel>

            
</bpmndi:BPMNEdge>
            <bpmndi:BPMNEdge id="F4_di" bpmnElement="F4">

              <di:waypoint x="570" y="315" />

              <di:waypoint x="570" y="535" />

            </bpmndi:BPMNEdge>
            <bpmndi:BPMNEdge id="F5_di" bpmnElement="F5">

              <di:waypoint x="620" y="575" />

              <di:waypoint x="645" y="575" />

              <di:waypoint x="645" y="425" />

              <di:waypoint x="670" y="425" />

            </bpmndi:BPMNEdge>
            <bpmndi:BPMNEdge id="F6_di" bpmnElement="F6">

              <di:waypoint x="720" y="385" />

              <di:waypoint x="720" y="275" />

              <di:waypoint x="870" y="275" />

              <di:waypoint x="870" y="165" />

            </bpmndi:BPMNEdge>
<bpmndi:BPMNEdge id="F7_di" bpmnElement="F7">

              <di:waypoint x="920" y="125" />

              <di:waypoint x="940" y="125" />

              <di:waypoint x="940" y="560" />

              <di:waypoint x="970" y="560" />

            </bpmndi:BPMNEdge>
            <bpmndi:BPMNEdge id="F8_Yes_di" bpmnElement="F8_Yes">


              <di:waypoint x="1020" y="560" />

              <di:waypoint x="1220" y="560" />

              <di:waypoint x="1220" y="275" />

              <di:waypoint x="1420" y="275" />

              <bpmndi:BPMNLabel><dc:Bounds x="1110" y="540" width="20" height="14" /></bpmndi:BPMNLabel>

            
</bpmndi:BPMNEdge>
            <bpmndi:BPMNEdge id="F8_No_di" bpmnElement="F8_No">


              <di:waypoint x="995" y="535" />

              <di:waypoint x="995" y="500" />

              <di:waypoint x="1020" y="500" />

              <di:waypoint x="1020" y="465" />

              <bpmndi:BPMNLabel><dc:Bounds x="1001" y="510" width="21" height="14" /></bpmndi:BPMNLabel>

            
</bpmndi:BPMNEdge>
            <bpmndi:BPMNEdge id="F9_di" bpmnElement="F9">

              <di:waypoint x="1020" y="385" />

              <di:waypoint x="1020" y="275" />

              <di:waypoint x="1170" y="275" />

              <di:waypoint x="1170" y="165" />

            </bpmndi:BPMNEdge>
            <bpmndi:BPMNEdge id="F10_di" bpmnElement="F10">

              <di:waypoint x="1220" y="125" />

              <di:waypoint x="1270" y="125" />

            </bpmndi:BPMNEdge>
            <bpmndi:BPMNEdge id="F11_Yes_di" bpmnElement="F11_Yes">


              <di:waypoint x="1320" y="125" />

              <di:waypoint x="1340" y="125" />

              <di:waypoint x="1340" y="275" />

              <di:waypoint x="1420" y="275" />

              <bpmndi:BPMNLabel><dc:Bounds x="1346" y="190" width="20" height="14" /></bpmndi:BPMNLabel>

            
</bpmndi:BPMNEdge>
            <bpmndi:BPMNEdge id="F12_di" bpmnElement="F12">

              <di:waypoint x="1520" y="275" />

              <di:waypoint x="1570" y="275" />

            </bpmndi:BPMNEdge>
            <bpmndi:BPMNEdge id="F13_di" bpmnElement="F13">

              <di:waypoint x="1620" y="315" />

              <di:waypoint x="1620" y="535" />

            </bpmndi:BPMNEdge>
            <bpmndi:BPMNEdge id="F14_di" bpmnElement="F14">

              <di:waypoint x="1670" y="575" />

              <di:waypoint x="1695" y="575" />

              <di:waypoint x="1695" y="425" />

              <di:waypoint x="1720" y="425" />

            </bpmndi:BPMNEdge>
            <bpmndi:BPMNEdge id="F15_di" bpmnElement="F15">

              <di:waypoint x="1770" y="465" />

              <di:waypoint x="1770" y="500" />

              <di:waypoint x="1828" y="500" />

              <di:waypoint x="1828" y="535" />

            </bpmndi:BPMNEdge>
            <bpmndi:BPMNEdge id="F15_Wait_di" bpmnElement="F15_Wait">

              <di:waypoint x="1846" y="553" />

              <di:waypoint x="1863" y="553" />

              <di:waypoint x="1863" y="560" />

              <di:waypoint x="1880" y="560" />

            </bpmndi:BPMNEdge>
<bpmndi:BPMNEdge id="F16_Yes_di" bpmnElement="F16_Yes">


              <di:waypoint x="1930" y="560" />

              <di:waypoint x="2230" y="560" />

              <di:waypoint x="2230" y="235" />

              <bpmndi:BPMNLabel><dc:Bounds x="2060" y="540" width="20" height="14" /></bpmndi:BPMNLabel>

            
</bpmndi:BPMNEdge>
            <bpmndi:BPMNEdge id="F16_No_di" bpmnElement="F16_No">


              <di:waypoint x="1905" y="535" />

              <di:waypoint x="1905" y="350" />

              <di:waypoint x="2010" y="350" />

              <di:waypoint x="2010" y="165" />

              <bpmndi:BPMNLabel><dc:Bounds x="1911" y="436" width="21" height="14" /></bpmndi:BPMNLabel>

            
</bpmndi:BPMNEdge>
            <bpmndi:BPMNEdge id="F_Recup_Acao_di" bpmnElement="F_Recup_Acao">

              <di:waypoint x="2060" y="125" />

              <di:waypoint x="2100" y="125" />

            </bpmndi:BPMNEdge>
<bpmndi:BPMNEdge id="F_Renegociar_di" bpmnElement="F_Renegociar">


              <di:waypoint x="2100" y="125" />

              <di:waypoint x="2100" y="60" />

              <di:waypoint x="1120" y="60" />

              <di:waypoint x="1120" y="125" />

              <bpmndi:BPMNLabel><dc:Bounds x="1600" y="40" width="58" height="14" /></bpmndi:BPMNLabel>

            
</bpmndi:BPMNEdge>
            <bpmndi:BPMNEdge id="F_SeguirFollow_di" bpmnElement="F_SeguirFollow">


              <di:waypoint x="2125" y="150" />

              <di:waypoint x="2125" y="192" />

              <di:waypoint x="2100" y="192" />

              <di:waypoint x="2100" y="235" />

              <bpmndi:BPMNLabel><dc:Bounds x="2131" y="164" width="49" height="14" /></bpmndi:BPMNLabel>

            
</bpmndi:BPMNEdge>
            <bpmndi:BPMNEdge id="F18_di" bpmnElement="F18">

              <di:waypoint x="2100" y="315" />

              <di:waypoint x="2100" y="425" />

              <di:waypoint x="1905" y="425" />

              <di:waypoint x="1905" y="535" />

            </bpmndi:BPMNEdge>
            <bpmndi:BPMNEdge id="F19_di" bpmnElement="F19">

              <di:waypoint x="2230" y="315" />

              <di:waypoint x="2230" y="685" />

            </bpmndi:BPMNEdge>
            <bpmndi:BPMNEdge id="F20_di" bpmnElement="F20">

              <di:waypoint x="2280" y="725" />

              <di:waypoint x="2320" y="725" />

            </bpmndi:BPMNEdge>
            <bpmndi:BPMNEdge id="F21_di" bpmnElement="F21">

              <di:waypoint x="2370" y="685" />

              <di:waypoint x="2370" y="615" />

            </bpmndi:BPMNEdge>
            <bpmndi:BPMNEdge id="F22_di" bpmnElement="F22">

              <di:waypoint x="2370" y="535" />

              <di:waypoint x="2370" y="339" />

              <di:waypoint x="2438" y="339" />

              <di:waypoint x="2438" y="143" />

            </bpmndi:BPMNEdge>
            <bpmndi:BPMNEdge id="F_IA_Start_di" bpmnElement="F_IA_Start">

              <di:waypoint x="2516" y="275" />

              <di:waypoint x="2570" y="275" />

            </bpmndi:BPMNEdge>
            <bpmndi:BPMNEdge id="F_IA_1_di" bpmnElement="F_IA_1">

              <di:waypoint x="2620" y="315" />

              <di:waypoint x="2620" y="350" />

              <di:waypoint x="2730" y="350" />

              <di:waypoint x="2730" y="385" />

            </bpmndi:BPMNEdge>
            <bpmndi:BPMNEdge id="F_IA_2_di" bpmnElement="F_IA_2">

              <di:waypoint x="2780" y="425" />

              <di:waypoint x="2790" y="425" />

            </bpmndi:BPMNEdge>
<bpmndi:BPMNEdge id="FLost1_di" bpmnElement="F_Lost_1">


              <di:waypoint x="405" y="100" />

              <di:waypoint x="405" y="60" />

              <di:waypoint x="1378" y="60" />

              <di:waypoint x="1378" y="107" />

              <bpmndi:BPMNLabel><dc:Bounds x="415" y="70" width="21" height="14" /></bpmndi:BPMNLabel>

            
</bpmndi:BPMNEdge>
<bpmndi:BPMNEdge id="FLost2_di" bpmnElement="F_Lost_2">


              <di:waypoint x="1295" y="150" />

              <di:waypoint x="1295" y="190" />

              <di:waypoint x="1378" y="190" />

              <di:waypoint x="1378" y="143" />

              <bpmndi:BPMNLabel><dc:Bounds x="1305" y="165" width="21" height="14" /></bpmndi:BPMNLabel>

            
</bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

const phases = [
            { name: 'Qualific. & Proposta', x: 80, width: 680 },
            { name: 'Negociação', x: 760, width: 400 },
            { name: 'Contrato', x: 1160, width: 450 },
            { name: 'Assinatura & Follow-up', x: 1610, width: 500 },
            { name: 'Registro & Onboarding', x: 2110, width: 350 },
            { name: 'Melhoria Contínua', x: 2460, width: 390 }
        ];

const config = {
zoom: 0.8,
            storageKey: 'subprocesso-1.3',
            startLabel: 'INÍCIO DO PROCESSO',
            endLabels: {
                End_Success: { text: 'FIM (SUCESSO)', className: 'end-label-success' },
                End_Lost: { text: 'FIM (PERDIDO)', className: 'end-label-lost' }
            },
            showDefaultEndLabel: false,
            useEndName: false,
            defaultEndLabelText: null,
            defaultEndClass: 'end-label-lost'
};

window.v5Data = window.v5Data || {};
window.v5Data['1.3'] = { diagramXML, nodeDetails, phases, ...config };
