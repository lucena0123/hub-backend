const nodeDetails = {
  // Detecção de Oportunidade
  'Task_I_DetectarOportunidade': { sla: '24h', tag: 'IA Trigger', desc: 'Detecta oportunidade de expansao automaticamente.' },
  'Task_I_AnalisarGatilhos': { sla: null, tag: 'IA Analise', desc: 'Analisa gatilhos: Budget esgotado, ROAS alto, novos canais.' },
  'Task_CS_ReceberSolicitacao': { sla: '4h', tag: 'Recebimento', desc: 'Recebe solicitacao do cliente sobre expansao.' },
  'Task_CS_QualificarOportunidade': { sla: '24h', tag: 'Qualificacao', desc: 'Qualifica viabilidade e potencial da oportunidade.' },
  'Task_I_CalcularPotencial': { sla: null, tag: 'IA Calculo', desc: 'Calcula potencial de receita e ROI estimado.' },
  'Task_CS_AvaliarCapacidade': { sla: null, tag: 'Capacidade', desc: 'Avalia capacidade operacional para expansao.' },

  // Preparação da Proposta
  'Task_F_CalcularInvestimento': { sla: '24h', tag: 'Calculo', desc: 'Calcula investimento necessario para expansao.' },
  'Task_CS_PrepararPropostaExpansao': { sla: '48h', tag: 'Proposta', desc: 'Prepara proposta comercial de expansao.' },
  'Task_I_GerarProjecao': { sla: null, tag: 'IA Projecao', desc: 'Gera projecao de resultados com expansao.' },
  'Task_CS_RevisarProposta': { sla: null, tag: 'Revisao', desc: 'Revisa proposta antes de apresentar.' },

  // Apresentação Comercial
  'Task_CS_AgendarReuniaoComercial': { sla: '48h', tag: 'Agenda', desc: 'Agenda reuniao comercial com cliente.' },
  'Task_A_EnviarMaterial': { sla: null, tag: 'Auto', desc: 'Envia material preparatorio ao cliente.' },
  'Task_C_ReceberMaterial': { sla: null, tag: 'Recebimento', desc: 'Cliente recebe material sobre expansao.' },
  'Task_CS_ApresentarProposta': { sla: null, tag: 'Apresentacao', desc: 'Apresenta proposta de expansao.' },
  'Task_C_ParticiparReuniao': { sla: null, tag: 'Reuniao', desc: 'Cliente participa da reuniao comercial.' },

  // Avaliação do Cliente
  'Task_C_AvaliarProposta': { sla: '5d', tag: 'Avaliacao', desc: 'Cliente avalia proposta internamente.' },
  'Task_CS_AcompanharDecisao': { sla: '7d', tag: 'Follow-up', desc: 'Acompanha processo de decisao do cliente.' },
  'Task_CS_EsclarecerDuvidas': { sla: null, tag: 'Suporte', desc: 'Esclarece duvidas e ajusta proposta.' },
  'Gateway_ClienteAceita': { sla: null, tag: 'Gateway', desc: 'Cliente aceita expansao?' },

  // Fluxo de Aceitação (SIM)
  'Task_F_GerarAditivoContrato': { sla: '24h', tag: 'Contrato', desc: 'Gera aditivo contratual de expansao.' },
  'Task_A_EnviarContrato': { sla: null, tag: 'Auto', desc: 'Envia aditivo para assinatura digital.' },
  'Task_C_AssinarAditivo': { sla: '3d', tag: 'Assinatura', desc: 'Cliente assina aditivo contratual.' },
  'Task_F_RegistrarExpansao': { sla: '24h', tag: 'Registro', desc: 'Registra expansao no sistema financeiro.' },
  'Task_A_AtualizarSistemas': { sla: null, tag: 'Auto', desc: 'Atualiza sistemas com nova configuracao.' },
  'Task_CS_AcionarOnboardingParcial': { sla: '24h', tag: 'Trigger 2.1', desc: 'Aciona re-onboarding para novos canais/servicos.' },
  'Task_I_AnalisarTaxaExpansao': { sla: null, tag: 'IA Metricas', desc: 'Analisa taxa de expansao e upsell.' },
  'Task_CS_CelebrarExpansao': { sla: null, tag: 'Celebracao', desc: 'Celebra expansao com cliente.' },

  // Fluxo de Recusa (NÃO)
  'Task_CS_RegistrarMotivo': { sla: null, tag: 'Registro', desc: 'Registra motivo da recusa.' },
  'Task_I_AnalisarObjecoes': { sla: null, tag: 'IA Analise', desc: 'Analisa padroes de objecoes.' },
  'Task_CS_DefinirFollowUp': { sla: null, tag: 'Planejamento', desc: 'Define data de follow-up futuro.' },
  'Task_A_AgendarRetomada': { sla: null, tag: 'Auto', desc: 'Agenda retomada automatica da oportunidade.' },
  'Task_CS_AtualizarPipeline': { sla: null, tag: 'Pipeline', desc: 'Atualiza pipeline de expansao.' }
};

const diagramXML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_73_V5" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_73_V5">
    <bpmn:participant id="Participant_73_V5" name="Expansao (Upsell / Cross-sell)" processRef="Process_73_V5" />
  </bpmn:collaboration>
  <bpmn:process id="Process_73_V5" isExecutable="false">
    <bpmn:laneSet id="LaneSet_73_V5">
      <bpmn:lane id="Lane_Cliente" name="Cliente">
        <bpmn:flowNodeRef>Task_C_ReceberMaterial</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_C_ParticiparReuniao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_C_AvaliarProposta</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_C_AssinarAditivo</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_CS" name="CS / Growth">
        <bpmn:flowNodeRef>Task_CS_ReceberSolicitacao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_QualificarOportunidade</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_AvaliarCapacidade</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_PrepararPropostaExpansao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_RevisarProposta</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_AgendarReuniaoComercial</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_ApresentarProposta</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_AcompanharDecisao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_EsclarecerDuvidas</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_AcionarOnboardingParcial</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_CelebrarExpansao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_RegistrarMotivo</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_DefinirFollowUp</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_AtualizarPipeline</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_ExpansaoConcluida</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_OportunidadeRegistrada</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_IA" name="IA / Identificacao">
        <bpmn:flowNodeRef>Start_OportunidadeDetectada</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_DetectarOportunidade</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_AnalisarGatilhos</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_CalcularPotencial</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_GerarProjecao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_EnviarMaterial</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_ClienteAceita</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_EnviarContrato</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_AtualizarSistemas</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_AnalisarTaxaExpansao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_AnalisarObjecoes</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_AgendarRetomada</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Financeiro" name="Financeiro / Proposta">
        <bpmn:flowNodeRef>Task_F_CalcularInvestimento</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_F_GerarAditivoContrato</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_F_RegistrarExpansao</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>

    <bpmn:startEvent id="Start_OportunidadeDetectada" name="Oportunidade Detectada" />

    <!-- Detecção de Oportunidade -->
    <bpmn:task id="Task_I_DetectarOportunidade" name="Detectar Oportunidade (IA)" />
    <bpmn:task id="Task_I_AnalisarGatilhos" name="Analisar Gatilhos" />
    <bpmn:task id="Task_CS_ReceberSolicitacao" name="Receber Solicitacao do Cliente" />
    <bpmn:task id="Task_CS_QualificarOportunidade" name="Qualificar Oportunidade" />
    <bpmn:task id="Task_I_CalcularPotencial" name="Calcular Potencial (ROI/Receita)" />
    <bpmn:task id="Task_CS_AvaliarCapacidade" name="Avaliar Capacidade Operacional" />

    <!-- Preparação da Proposta -->
    <bpmn:task id="Task_F_CalcularInvestimento" name="Calcular Investimento Necessario" />
    <bpmn:task id="Task_CS_PrepararPropostaExpansao" name="Preparar Proposta de Expansao" />
    <bpmn:task id="Task_I_GerarProjecao" name="Gerar Projecao de Resultados" />
    <bpmn:task id="Task_CS_RevisarProposta" name="Revisar Proposta" />

    <!-- Apresentação Comercial -->
    <bpmn:task id="Task_CS_AgendarReuniaoComercial" name="Agendar Reuniao Comercial" />
    <bpmn:task id="Task_A_EnviarMaterial" name="Enviar Material Preparatorio" />
    <bpmn:task id="Task_C_ReceberMaterial" name="Receber Material" />
    <bpmn:task id="Task_CS_ApresentarProposta" name="Apresentar Proposta de Expansao" />
    <bpmn:task id="Task_C_ParticiparReuniao" name="Participar da Reuniao" />

    <!-- Avaliação do Cliente -->
    <bpmn:task id="Task_C_AvaliarProposta" name="Avaliar Proposta" />
    <bpmn:task id="Task_CS_AcompanharDecisao" name="Acompanhar Decisao" />
    <bpmn:task id="Task_CS_EsclarecerDuvidas" name="Esclarecer Duvidas" />
    <bpmn:exclusiveGateway id="Gateway_ClienteAceita" name="Cliente Aceita?" />

    <!-- Fluxo de Aceitação (SIM) -->
    <bpmn:task id="Task_F_GerarAditivoContrato" name="Gerar Aditivo Contratual" />
    <bpmn:task id="Task_A_EnviarContrato" name="Enviar Aditivo Digital" />
    <bpmn:task id="Task_C_AssinarAditivo" name="Assinar Aditivo" />
    <bpmn:task id="Task_F_RegistrarExpansao" name="Registrar Expansao" />
    <bpmn:task id="Task_A_AtualizarSistemas" name="Atualizar Sistemas" />
    <bpmn:task id="Task_CS_AcionarOnboardingParcial" name="Acionar Re-onboarding (2.1)" />
    <bpmn:task id="Task_I_AnalisarTaxaExpansao" name="Analisar Taxa de Expansao" />
    <bpmn:task id="Task_CS_CelebrarExpansao" name="Celebrar Expansao" />
    <bpmn:endEvent id="End_ExpansaoConcluida" name="Expansao Concluida" />

    <!-- Fluxo de Recusa (NÃO) -->
    <bpmn:task id="Task_CS_RegistrarMotivo" name="Registrar Motivo da Recusa" />
    <bpmn:task id="Task_I_AnalisarObjecoes" name="Analisar Padroes de Objecoes" />
    <bpmn:task id="Task_CS_DefinirFollowUp" name="Definir Follow-up Futuro" />
    <bpmn:task id="Task_A_AgendarRetomada" name="Agendar Retomada Automatica" />
    <bpmn:task id="Task_CS_AtualizarPipeline" name="Atualizar Pipeline" />
    <bpmn:endEvent id="End_OportunidadeRegistrada" name="Oportunidade Registrada" />

    <!-- Sequence Flows - Detecção -->
    <bpmn:sequenceFlow id="F_Start_Detectar" sourceRef="Start_OportunidadeDetectada" targetRef="Task_I_DetectarOportunidade" />
    <bpmn:sequenceFlow id="F_Detectar_Analisar" sourceRef="Task_I_DetectarOportunidade" targetRef="Task_I_AnalisarGatilhos" />
    <bpmn:sequenceFlow id="F_Analisar_Receber" sourceRef="Task_I_AnalisarGatilhos" targetRef="Task_CS_ReceberSolicitacao" />
    <bpmn:sequenceFlow id="F_Receber_Qualificar" sourceRef="Task_CS_ReceberSolicitacao" targetRef="Task_CS_QualificarOportunidade" />
    <bpmn:sequenceFlow id="F_Qualificar_Calcular" sourceRef="Task_CS_QualificarOportunidade" targetRef="Task_I_CalcularPotencial" />
    <bpmn:sequenceFlow id="F_Calcular_Avaliar" sourceRef="Task_I_CalcularPotencial" targetRef="Task_CS_AvaliarCapacidade" />

    <!-- Preparação -->
    <bpmn:sequenceFlow id="F_Avaliar_CalcularInv" sourceRef="Task_CS_AvaliarCapacidade" targetRef="Task_F_CalcularInvestimento" />
    <bpmn:sequenceFlow id="F_CalcularInv_Preparar" sourceRef="Task_F_CalcularInvestimento" targetRef="Task_CS_PrepararPropostaExpansao" />
    <bpmn:sequenceFlow id="F_Preparar_GerarProj" sourceRef="Task_CS_PrepararPropostaExpansao" targetRef="Task_I_GerarProjecao" />
    <bpmn:sequenceFlow id="F_GerarProj_Revisar" sourceRef="Task_I_GerarProjecao" targetRef="Task_CS_RevisarProposta" />

    <!-- Apresentação -->
    <bpmn:sequenceFlow id="F_Revisar_Agendar" sourceRef="Task_CS_RevisarProposta" targetRef="Task_CS_AgendarReuniaoComercial" />
    <bpmn:sequenceFlow id="F_Agendar_Enviar" sourceRef="Task_CS_AgendarReuniaoComercial" targetRef="Task_A_EnviarMaterial" />
    <bpmn:sequenceFlow id="F_Enviar_Receber" sourceRef="Task_A_EnviarMaterial" targetRef="Task_C_ReceberMaterial" />
    <bpmn:sequenceFlow id="F_Receber_Apresentar" sourceRef="Task_C_ReceberMaterial" targetRef="Task_CS_ApresentarProposta" />
    <bpmn:sequenceFlow id="F_Apresentar_Participar" sourceRef="Task_CS_ApresentarProposta" targetRef="Task_C_ParticiparReuniao" />

    <!-- Avaliação -->
    <bpmn:sequenceFlow id="F_Participar_Avaliar" sourceRef="Task_C_ParticiparReuniao" targetRef="Task_C_AvaliarProposta" />
    <bpmn:sequenceFlow id="F_Avaliar_Acompanhar" sourceRef="Task_C_AvaliarProposta" targetRef="Task_CS_AcompanharDecisao" />
    <bpmn:sequenceFlow id="F_Acompanhar_Esclarecer" sourceRef="Task_CS_AcompanharDecisao" targetRef="Task_CS_EsclarecerDuvidas" />
    <bpmn:sequenceFlow id="F_Esclarecer_Gateway" sourceRef="Task_CS_EsclarecerDuvidas" targetRef="Gateway_ClienteAceita" />

    <!-- Gateway - SIM (Aceitação) -->
    <bpmn:sequenceFlow id="F_Gateway_Sim" name="SIM" sourceRef="Gateway_ClienteAceita" targetRef="Task_F_GerarAditivoContrato" />
    <bpmn:sequenceFlow id="F_GerarAditivo_Enviar" sourceRef="Task_F_GerarAditivoContrato" targetRef="Task_A_EnviarContrato" />
    <bpmn:sequenceFlow id="F_EnviarContrato_Assinar" sourceRef="Task_A_EnviarContrato" targetRef="Task_C_AssinarAditivo" />
    <bpmn:sequenceFlow id="F_Assinar_Registrar" sourceRef="Task_C_AssinarAditivo" targetRef="Task_F_RegistrarExpansao" />
    <bpmn:sequenceFlow id="F_Registrar_Atualizar" sourceRef="Task_F_RegistrarExpansao" targetRef="Task_A_AtualizarSistemas" />
    <bpmn:sequenceFlow id="F_Atualizar_Acionar" sourceRef="Task_A_AtualizarSistemas" targetRef="Task_CS_AcionarOnboardingParcial" />
    <bpmn:sequenceFlow id="F_Acionar_Analisar" sourceRef="Task_CS_AcionarOnboardingParcial" targetRef="Task_I_AnalisarTaxaExpansao" />
    <bpmn:sequenceFlow id="F_Analisar_Celebrar" sourceRef="Task_I_AnalisarTaxaExpansao" targetRef="Task_CS_CelebrarExpansao" />
    <bpmn:sequenceFlow id="F_Celebrar_End" sourceRef="Task_CS_CelebrarExpansao" targetRef="End_ExpansaoConcluida" />

    <!-- Gateway - NÃO (Recusa) -->
    <bpmn:sequenceFlow id="F_Gateway_Nao" name="NAO" sourceRef="Gateway_ClienteAceita" targetRef="Task_CS_RegistrarMotivo" />
    <bpmn:sequenceFlow id="F_RegistrarMot_AnalisarObj" sourceRef="Task_CS_RegistrarMotivo" targetRef="Task_I_AnalisarObjecoes" />
    <bpmn:sequenceFlow id="F_AnalisarObj_Definir" sourceRef="Task_I_AnalisarObjecoes" targetRef="Task_CS_DefinirFollowUp" />
    <bpmn:sequenceFlow id="F_Definir_Agendar" sourceRef="Task_CS_DefinirFollowUp" targetRef="Task_A_AgendarRetomada" />
    <bpmn:sequenceFlow id="F_Agendar_Atualizar" sourceRef="Task_A_AgendarRetomada" targetRef="Task_CS_AtualizarPipeline" />
    <bpmn:sequenceFlow id="F_Atualizar_End2" sourceRef="Task_CS_AtualizarPipeline" targetRef="End_OportunidadeRegistrada" />
  </bpmn:process>

  <bpmndi:BPMNDiagram id="BPMNDiagram_73_V5">
    <bpmndi:BPMNPlane id="BPMNPlane_73_V5" bpmnElement="Collaboration_73_V5">
      <bpmndi:BPMNShape id="Participant_73_V5_di" bpmnElement="Participant_73_V5" isHorizontal="true">
        <dc:Bounds x="50" y="20" width="3800" height="700" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Lane_Cliente_di" bpmnElement="Lane_Cliente" isHorizontal="true">
        <dc:Bounds x="80" y="20" width="3770" height="150" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_CS_di" bpmnElement="Lane_CS" isHorizontal="true">
        <dc:Bounds x="80" y="170" width="3770" height="200" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_IA_di" bpmnElement="Lane_IA" isHorizontal="true">
        <dc:Bounds x="80" y="370" width="3770" height="180" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Financeiro_di" bpmnElement="Lane_Financeiro" isHorizontal="true">
        <dc:Bounds x="80" y="550" width="3770" height="170" />
      </bpmndi:BPMNShape>

      <!-- Shapes - Detecção -->
      <bpmndi:BPMNShape id="Start_OportunidadeDetectada_di" bpmnElement="Start_OportunidadeDetectada">
        <dc:Bounds x="120" y="442" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_DetectarOportunidade_di" bpmnElement="Task_I_DetectarOportunidade">
        <dc:Bounds x="200" y="420" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_AnalisarGatilhos_di" bpmnElement="Task_I_AnalisarGatilhos">
        <dc:Bounds x="350" y="420" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_ReceberSolicitacao_di" bpmnElement="Task_CS_ReceberSolicitacao">
        <dc:Bounds x="500" y="210" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_QualificarOportunidade_di" bpmnElement="Task_CS_QualificarOportunidade">
        <dc:Bounds x="650" y="210" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_CalcularPotencial_di" bpmnElement="Task_I_CalcularPotencial">
        <dc:Bounds x="800" y="420" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_AvaliarCapacidade_di" bpmnElement="Task_CS_AvaliarCapacidade">
        <dc:Bounds x="950" y="210" width="120" height="80" />
      </bpmndi:BPMNShape>

      <!-- Preparação -->
      <bpmndi:BPMNShape id="Task_F_CalcularInvestimento_di" bpmnElement="Task_F_CalcularInvestimento">
        <dc:Bounds x="1100" y="585" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_PrepararPropostaExpansao_di" bpmnElement="Task_CS_PrepararPropostaExpansao">
        <dc:Bounds x="1250" y="210" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_GerarProjecao_di" bpmnElement="Task_I_GerarProjecao">
        <dc:Bounds x="1400" y="420" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_RevisarProposta_di" bpmnElement="Task_CS_RevisarProposta">
        <dc:Bounds x="1550" y="210" width="120" height="80" />
      </bpmndi:BPMNShape>

      <!-- Apresentação -->
      <bpmndi:BPMNShape id="Task_CS_AgendarReuniaoComercial_di" bpmnElement="Task_CS_AgendarReuniaoComercial">
        <dc:Bounds x="1700" y="210" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_EnviarMaterial_di" bpmnElement="Task_A_EnviarMaterial">
        <dc:Bounds x="1850" y="420" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_ReceberMaterial_di" bpmnElement="Task_C_ReceberMaterial">
        <dc:Bounds x="2000" y="55" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_ApresentarProposta_di" bpmnElement="Task_CS_ApresentarProposta">
        <dc:Bounds x="2150" y="210" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_ParticiparReuniao_di" bpmnElement="Task_C_ParticiparReuniao">
        <dc:Bounds x="2300" y="55" width="120" height="80" />
      </bpmndi:BPMNShape>

      <!-- Avaliação -->
      <bpmndi:BPMNShape id="Task_C_AvaliarProposta_di" bpmnElement="Task_C_AvaliarProposta">
        <dc:Bounds x="2450" y="55" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_AcompanharDecisao_di" bpmnElement="Task_CS_AcompanharDecisao">
        <dc:Bounds x="2600" y="210" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_EsclarecerDuvidas_di" bpmnElement="Task_CS_EsclarecerDuvidas">
        <dc:Bounds x="2750" y="210" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_ClienteAceita_di" bpmnElement="Gateway_ClienteAceita" isMarkerVisible="true">
        <dc:Bounds x="2900" y="435" width="50" height="50" />
      </bpmndi:BPMNShape>

      <!-- Aceitação (SIM) -->
      <bpmndi:BPMNShape id="Task_F_GerarAditivoContrato_di" bpmnElement="Task_F_GerarAditivoContrato">
        <dc:Bounds x="2980" y="585" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_EnviarContrato_di" bpmnElement="Task_A_EnviarContrato">
        <dc:Bounds x="3130" y="420" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_AssinarAditivo_di" bpmnElement="Task_C_AssinarAditivo">
        <dc:Bounds x="3280" y="55" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_F_RegistrarExpansao_di" bpmnElement="Task_F_RegistrarExpansao">
        <dc:Bounds x="3430" y="585" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_AtualizarSistemas_di" bpmnElement="Task_A_AtualizarSistemas">
        <dc:Bounds x="3120" y="500" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_AcionarOnboardingParcial_di" bpmnElement="Task_CS_AcionarOnboardingParcial">
        <dc:Bounds x="3270" y="290" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_AnalisarTaxaExpansao_di" bpmnElement="Task_I_AnalisarTaxaExpansao">
        <dc:Bounds x="3420" y="420" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_CelebrarExpansao_di" bpmnElement="Task_CS_CelebrarExpansao">
        <dc:Bounds x="3570" y="210" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_ExpansaoConcluida_di" bpmnElement="End_ExpansaoConcluida">
        <dc:Bounds x="3612" y="232" width="36" height="36" />
      </bpmndi:BPMNShape>

      <!-- Recusa (NÃO) -->
      <bpmndi:BPMNShape id="Task_CS_RegistrarMotivo_di" bpmnElement="Task_CS_RegistrarMotivo">
        <dc:Bounds x="2980" y="290" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_AnalisarObjecoes_di" bpmnElement="Task_I_AnalisarObjecoes">
        <dc:Bounds x="3130" y="420" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_DefinirFollowUp_di" bpmnElement="Task_CS_DefinirFollowUp">
        <dc:Bounds x="3280" y="290" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_AgendarRetomada_di" bpmnElement="Task_A_AgendarRetomada">
        <dc:Bounds x="3430" y="420" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_AtualizarPipeline_di" bpmnElement="Task_CS_AtualizarPipeline">
        <dc:Bounds x="3580" y="290" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_OportunidadeRegistrada_di" bpmnElement="End_OportunidadeRegistrada">
        <dc:Bounds x="3622" y="312" width="36" height="36" />
      </bpmndi:BPMNShape>

      <!-- Edges - Detecção -->
      <bpmndi:BPMNEdge id="F_Start_Detectar_di" bpmnElement="F_Start_Detectar">
        <di:waypoint x="156" y="460" /><di:waypoint x="200" y="460" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Detectar_Analisar_di" bpmnElement="F_Detectar_Analisar">
        <di:waypoint x="320" y="460" /><di:waypoint x="350" y="460" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Analisar_Receber_di" bpmnElement="F_Analisar_Receber">
        <di:waypoint x="410" y="420" /><di:waypoint x="560" y="290" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Receber_Qualificar_di" bpmnElement="F_Receber_Qualificar">
        <di:waypoint x="620" y="250" /><di:waypoint x="650" y="250" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Qualificar_Calcular_di" bpmnElement="F_Qualificar_Calcular">
        <di:waypoint x="710" y="290" /><di:waypoint x="860" y="420" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Calcular_Avaliar_di" bpmnElement="F_Calcular_Avaliar">
        <di:waypoint x="860" y="420" /><di:waypoint x="1010" y="290" />
      </bpmndi:BPMNEdge>

      <!-- Preparação -->
      <bpmndi:BPMNEdge id="F_Avaliar_CalcularInv_di" bpmnElement="F_Avaliar_CalcularInv">
        <di:waypoint x="1010" y="290" /><di:waypoint x="1160" y="585" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_CalcularInv_Preparar_di" bpmnElement="F_CalcularInv_Preparar">
        <di:waypoint x="1160" y="585" /><di:waypoint x="1310" y="290" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Preparar_GerarProj_di" bpmnElement="F_Preparar_GerarProj">
        <di:waypoint x="1310" y="290" /><di:waypoint x="1460" y="420" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_GerarProj_Revisar_di" bpmnElement="F_GerarProj_Revisar">
        <di:waypoint x="1460" y="420" /><di:waypoint x="1610" y="290" />
      </bpmndi:BPMNEdge>

      <!-- Apresentação -->
      <bpmndi:BPMNEdge id="F_Revisar_Agendar_di" bpmnElement="F_Revisar_Agendar">
        <di:waypoint x="1670" y="250" /><di:waypoint x="1700" y="250" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Agendar_Enviar_di" bpmnElement="F_Agendar_Enviar">
        <di:waypoint x="1760" y="290" /><di:waypoint x="1910" y="420" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Enviar_Receber_di" bpmnElement="F_Enviar_Receber">
        <di:waypoint x="1910" y="420" /><di:waypoint x="2060" y="135" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Receber_Apresentar_di" bpmnElement="F_Receber_Apresentar">
        <di:waypoint x="2060" y="135" /><di:waypoint x="2210" y="210" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Apresentar_Participar_di" bpmnElement="F_Apresentar_Participar">
        <di:waypoint x="2210" y="210" /><di:waypoint x="2360" y="135" />
      </bpmndi:BPMNEdge>

      <!-- Avaliação -->
      <bpmndi:BPMNEdge id="F_Participar_Avaliar_di" bpmnElement="F_Participar_Avaliar">
        <di:waypoint x="2420" y="95" /><di:waypoint x="2450" y="95" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Avaliar_Acompanhar_di" bpmnElement="F_Avaliar_Acompanhar">
        <di:waypoint x="2510" y="135" /><di:waypoint x="2660" y="210" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Acompanhar_Esclarecer_di" bpmnElement="F_Acompanhar_Esclarecer">
        <di:waypoint x="2720" y="250" /><di:waypoint x="2750" y="250" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Esclarecer_Gateway_di" bpmnElement="F_Esclarecer_Gateway">
        <di:waypoint x="2810" y="290" /><di:waypoint x="2925" y="435" />
      </bpmndi:BPMNEdge>

      <!-- Gateway - SIM -->
      <bpmndi:BPMNEdge id="F_Gateway_Sim_di" bpmnElement="F_Gateway_Sim">
        <di:waypoint x="2925" y="485" /><di:waypoint x="3040" y="585" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_GerarAditivo_Enviar_di" bpmnElement="F_GerarAditivo_Enviar">
        <di:waypoint x="3040" y="585" /><di:waypoint x="3190" y="500" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_EnviarContrato_Assinar_di" bpmnElement="F_EnviarContrato_Assinar">
        <di:waypoint x="3190" y="420" /><di:waypoint x="3340" y="135" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Assinar_Registrar_di" bpmnElement="F_Assinar_Registrar">
        <di:waypoint x="3340" y="135" /><di:waypoint x="3490" y="585" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Registrar_Atualizar_di" bpmnElement="F_Registrar_Atualizar">
        <di:waypoint x="3430" y="625" /><di:waypoint x="3180" y="540" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Atualizar_Acionar_di" bpmnElement="F_Atualizar_Acionar">
        <di:waypoint x="3240" y="500" /><di:waypoint x="3330" y="370" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Acionar_Analisar_di" bpmnElement="F_Acionar_Analisar">
        <di:waypoint x="3330" y="370" /><di:waypoint x="3480" y="420" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Analisar_Celebrar_di" bpmnElement="F_Analisar_Celebrar">
        <di:waypoint x="3480" y="420" /><di:waypoint x="3630" y="290" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Celebrar_End_di" bpmnElement="F_Celebrar_End">
        <di:waypoint x="3630" y="250" /><di:waypoint x="3630" y="250" />
      </bpmndi:BPMNEdge>

      <!-- Gateway - NÃO -->
      <bpmndi:BPMNEdge id="F_Gateway_Nao_di" bpmnElement="F_Gateway_Nao">
        <di:waypoint x="2925" y="435" /><di:waypoint x="3040" y="330" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_RegistrarMot_AnalisarObj_di" bpmnElement="F_RegistrarMot_AnalisarObj">
        <di:waypoint x="3040" y="370" /><di:waypoint x="3190" y="420" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_AnalisarObj_Definir_di" bpmnElement="F_AnalisarObj_Definir">
        <di:waypoint x="3190" y="460" /><di:waypoint x="3340" y="330" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Definir_Agendar_di" bpmnElement="F_Definir_Agendar">
        <di:waypoint x="3340" y="370" /><di:waypoint x="3490" y="420" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Agendar_Atualizar_di" bpmnElement="F_Agendar_Atualizar">
        <di:waypoint x="3490" y="460" /><di:waypoint x="3640" y="330" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Atualizar_End2_di" bpmnElement="F_Atualizar_End2">
        <di:waypoint x="3640" y="330" /><di:waypoint x="3640" y="330" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

const phases = [
  { name: 'Deteccao & Qualificacao', x: 80, width: 1070 },
  { name: 'Preparacao de Proposta', x: 1150, width: 670 },
  { name: 'Apresentacao Comercial', x: 1820, width: 730 },
  { name: 'Avaliacao & Decisao', x: 2550, width: 500 },
  { name: 'Expansao ou Follow-up Futuro', x: 3050, width: 750 }
];

const config = {
  zoom: 0.8,
  storageKey: 'subprocesso-7.3',
  startLabel: 'OPORTUNIDADE DETECTADA',
  endLabels: {
    End_ExpansaoConcluida: { text: 'EXPANSAO CONCLUIDA', className: 'end-label-success', marker: 'end-success' },
    End_OportunidadeRegistrada: { text: 'OPORTUNIDADE REGISTRADA', className: 'end-label-neutral', marker: 'end-neutral' }
  },
  showDefaultEndLabel: false,
  useEndName: false,
  defaultEndLabelText: 'FIM',
  defaultEndClass: 'end-label-neutral'
};

window.v5Data = window.v5Data || {};
window.v5Data['7.3'] = { diagramXML, nodeDetails, phases, ...config };
