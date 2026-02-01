const nodeDetails = {
  // Detecção e Análise
  'Task_I_DetectarVencimento': { sla: 'D-60', tag: 'IA Trigger', desc: 'Detecta contrato proximo ao vencimento (D-60).' },
  'Task_I_AnalisarSaude': { sla: 'D-58', tag: 'IA Analise', desc: 'Analisa saude da conta (CSAT, Resultados, Engagement).' },
  'Task_CS_RevisarHistorico': { sla: 'D-55', tag: 'Revisao', desc: 'Revisa historico de relacionamento.' },
  'Task_I_GerarInsights': { sla: null, tag: 'IA Insights', desc: 'Gera insights sobre performance e satisfacao.' },
  'Gateway_ContaSaudavel': { sla: null, tag: 'Gateway', desc: 'Conta esta saudavel?' },

  // Fluxo Conta Saudável (SIM) - Proposta Padrão
  'Task_F_CalcularRenovacaoPadrao': { sla: 'D-50', tag: 'Calculo', desc: 'Calcula valores de renovacao padrao.' },
  'Task_CS_PrepararPropostaPadrao': { sla: 'D-48', tag: 'Proposta', desc: 'Prepara proposta de renovacao padrao.' },

  // Fluxo Conta em Risco (NÃO) - Proposta com Incentivo
  'Task_CS_AnalisarMotivosRisco': { sla: 'D-52', tag: 'Analise Risco', desc: 'Analisa motivos do risco de churn.' },
  'Task_F_CalcularIncentivo': { sla: 'D-50', tag: 'Incentivo', desc: 'Calcula desconto ou incentivo especial.' },
  'Task_G_AprovarIncentivo': { sla: 'D-48', tag: 'Aprovacao', desc: 'Gestao aprova incentivo especial.' },
  'Task_CS_PrepararPropostaIncentivo': { sla: 'D-45', tag: 'Proposta', desc: 'Prepara proposta com incentivo.' },

  // Apresentação da Proposta
  'Task_I_GerarApresentacao': { sla: null, tag: 'IA Deck', desc: 'Gera apresentacao da proposta automaticamente.' },
  'Task_CS_RevisarProposta': { sla: 'D-46', tag: 'Revisao', desc: 'Revisa proposta antes de enviar.' },
  'Task_CS_AgendarReuniaoRenovacao': { sla: 'D-45', tag: 'Agenda', desc: 'Agenda reuniao de renovacao com cliente.' },
  'Task_A_EnviarProposta': { sla: null, tag: 'Auto', desc: 'Envia proposta ao cliente.' },
  'Task_C_ReceberProposta': { sla: null, tag: 'Recebimento', desc: 'Cliente recebe proposta de renovacao.' },

  // Reunião de Renovação
  'Task_CS_ApresentarProposta': { sla: 'D-40', tag: 'Apresentacao', desc: 'Apresenta proposta em reuniao.' },
  'Task_C_ParticiparReuniao': { sla: null, tag: 'Reuniao', desc: 'Cliente participa da reuniao.' },
  'Task_C_AvaliarProposta': { sla: 'D-35', tag: 'Avaliacao', desc: 'Cliente avalia proposta internamente.' },
  'Task_CS_AcompanharDecisao': { sla: 'D-30', tag: 'Follow-up', desc: 'Acompanha decisao do cliente.' },
  'Gateway_ClienteAceita': { sla: null, tag: 'Gateway', desc: 'Cliente aceita renovacao?' },

  // Fluxo de Negociação (Cliente pediu ajustes)
  'Task_C_SolicitarAjustes': { sla: null, tag: 'Negociacao', desc: 'Cliente solicita ajustes na proposta.' },
  'Task_CS_RegistrarObjecoes': { sla: null, tag: 'Registro', desc: 'Registra objecoes e solicitacoes.' },
  'Task_F_RevisarValores': { sla: 'D-25', tag: 'Revisao', desc: 'Revisa valores e condicoes.' },
  'Task_G_AprovarAjustes': { sla: 'D-20', tag: 'Aprovacao', desc: 'Gestao aprova ajustes solicitados.' },
  'Task_CS_ApresentarContraProposta': { sla: 'D-15', tag: 'Contraproposta', desc: 'Apresenta contraproposta ao cliente.' },
  'Task_C_AvaliarContraProposta': { sla: 'D-10', tag: 'Avaliacao', desc: 'Cliente avalia contraproposta.' },
  'Gateway_AceitaContraProposta': { sla: null, tag: 'Gateway', desc: 'Cliente aceita contraproposta?' },

  // Renovação Aceita
  'Task_F_GerarNovoContrato': { sla: 'D-7', tag: 'Contrato', desc: 'Gera novo contrato de renovacao.' },
  'Task_A_EnviarContrato': { sla: null, tag: 'Auto', desc: 'Envia contrato para assinatura.' },
  'Task_C_AssinarContrato': { sla: 'D-3', tag: 'Assinatura', desc: 'Cliente assina novo contrato.' },
  'Task_F_RegistrarRenovacao': { sla: 'D-1', tag: 'Registro', desc: 'Registra renovacao no sistema financeiro.' },
  'Task_A_AtualizarSistemas': { sla: null, tag: 'Auto', desc: 'Atualiza sistemas com novo contrato.' },
  'Task_CS_CelebrarRenovacao': { sla: null, tag: 'Celebracao', desc: 'Celebra renovacao com cliente.' },
  'Task_I_AnalisarTaxaRenovacao': { sla: null, tag: 'IA Metricas', desc: 'Analisa taxa de renovacao e padroes.' },

  // Renovação Recusada (Offboarding)
  'Task_CS_TentarRetencaoFinal': { sla: 'D-10', tag: 'Retencao', desc: 'Ultima tentativa de retencao.' },
  'Task_G_AvaliarEscalacao': { sla: null, tag: 'Escalacao', desc: 'Gestao avalia escalacao para diretoria.' },
  'Task_CS_RegistrarMotivoCancelamento': { sla: null, tag: 'Registro', desc: 'Registra motivo do nao-renovacao.' },
  'Task_A_AcionarOffboarding': { sla: null, tag: 'Trigger 6.4', desc: 'Aciona processo de offboarding (6.4).' }
};

const diagramXML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_72_V5" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_72_V5">
    <bpmn:participant id="Participant_72_V5" name="Renovacao de Contratos" processRef="Process_72_V5" />
  </bpmn:collaboration>
  <bpmn:process id="Process_72_V5" isExecutable="false">
    <bpmn:laneSet id="LaneSet_72_V5">
      <bpmn:lane id="Lane_Cliente" name="Cliente">
        <bpmn:flowNodeRef>Task_C_ReceberProposta</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_C_ParticiparReuniao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_C_AvaliarProposta</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_C_SolicitarAjustes</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_C_AvaliarContraProposta</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_C_AssinarContrato</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_CS" name="CS / Renovacao">
        <bpmn:flowNodeRef>Task_CS_RevisarHistorico</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_PrepararPropostaPadrao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_AnalisarMotivosRisco</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_PrepararPropostaIncentivo</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_RevisarProposta</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_AgendarReuniaoRenovacao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_ApresentarProposta</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_AcompanharDecisao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_RegistrarObjecoes</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_ApresentarContraProposta</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_CelebrarRenovacao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_TentarRetencaoFinal</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_RegistrarMotivoCancelamento</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_RenovacaoConcluida</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_AcionarOffboarding</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_IA" name="IA / Analise">
        <bpmn:flowNodeRef>Start_VencimentoProximo</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_DetectarVencimento</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_AnalisarSaude</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_GerarInsights</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_ContaSaudavel</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_GerarApresentacao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_EnviarProposta</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_ClienteAceita</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_AceitaContraProposta</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_EnviarContrato</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_AtualizarSistemas</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_AnalisarTaxaRenovacao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_AcionarOffboarding</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Financeiro" name="Financeiro / Proposta">
        <bpmn:flowNodeRef>Task_F_CalcularRenovacaoPadrao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_F_CalcularIncentivo</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_F_RevisarValores</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_F_GerarNovoContrato</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_F_RegistrarRenovacao</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Gestao" name="Gestao / Aprovacao">
        <bpmn:flowNodeRef>Task_G_AprovarIncentivo</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_G_AprovarAjustes</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_G_AvaliarEscalacao</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>

    <bpmn:startEvent id="Start_VencimentoProximo" name="Vencimento Proximo (D-60)" />

    <!-- Detecção e Análise -->
    <bpmn:task id="Task_I_DetectarVencimento" name="Detectar Vencimento (D-60)" />
    <bpmn:task id="Task_I_AnalisarSaude" name="Analisar Saude da Conta" />
    <bpmn:task id="Task_CS_RevisarHistorico" name="Revisar Historico de Relacionamento" />
    <bpmn:task id="Task_I_GerarInsights" name="Gerar Insights IA" />
    <bpmn:exclusiveGateway id="Gateway_ContaSaudavel" name="Conta Saudavel?" />

    <!-- Fluxo SIM - Conta Saudável (Proposta Padrão) -->
    <bpmn:task id="Task_F_CalcularRenovacaoPadrao" name="Calcular Renovacao Padrao" />
    <bpmn:task id="Task_CS_PrepararPropostaPadrao" name="Preparar Proposta Padrao" />

    <!-- Fluxo NÃO - Conta em Risco (Proposta com Incentivo) -->
    <bpmn:task id="Task_CS_AnalisarMotivosRisco" name="Analisar Motivos de Risco" />
    <bpmn:task id="Task_F_CalcularIncentivo" name="Calcular Incentivo/Desconto" />
    <bpmn:task id="Task_G_AprovarIncentivo" name="Aprovar Incentivo" />
    <bpmn:task id="Task_CS_PrepararPropostaIncentivo" name="Preparar Proposta c/ Incentivo" />

    <!-- Apresentação -->
    <bpmn:task id="Task_I_GerarApresentacao" name="Gerar Apresentacao (IA)" />
    <bpmn:task id="Task_CS_RevisarProposta" name="Revisar Proposta" />
    <bpmn:task id="Task_CS_AgendarReuniaoRenovacao" name="Agendar Reuniao de Renovacao" />
    <bpmn:task id="Task_A_EnviarProposta" name="Enviar Proposta ao Cliente" />
    <bpmn:task id="Task_C_ReceberProposta" name="Receber Proposta" />

    <!-- Reunião de Renovação -->
    <bpmn:task id="Task_CS_ApresentarProposta" name="Apresentar Proposta" />
    <bpmn:task id="Task_C_ParticiparReuniao" name="Participar da Reuniao" />
    <bpmn:task id="Task_C_AvaliarProposta" name="Avaliar Proposta" />
    <bpmn:task id="Task_CS_AcompanharDecisao" name="Acompanhar Decisao" />
    <bpmn:exclusiveGateway id="Gateway_ClienteAceita" name="Cliente Aceita?" />

    <!-- Fluxo Negociação -->
    <bpmn:task id="Task_C_SolicitarAjustes" name="Solicitar Ajustes" />
    <bpmn:task id="Task_CS_RegistrarObjecoes" name="Registrar Objecoes" />
    <bpmn:task id="Task_F_RevisarValores" name="Revisar Valores" />
    <bpmn:task id="Task_G_AprovarAjustes" name="Aprovar Ajustes" />
    <bpmn:task id="Task_CS_ApresentarContraProposta" name="Apresentar Contraproposta" />
    <bpmn:task id="Task_C_AvaliarContraProposta" name="Avaliar Contraproposta" />
    <bpmn:exclusiveGateway id="Gateway_AceitaContraProposta" name="Aceita Contraproposta?" />

    <!-- Renovação Aceita -->
    <bpmn:task id="Task_F_GerarNovoContrato" name="Gerar Novo Contrato" />
    <bpmn:task id="Task_A_EnviarContrato" name="Enviar Contrato Digital" />
    <bpmn:task id="Task_C_AssinarContrato" name="Assinar Contrato" />
    <bpmn:task id="Task_F_RegistrarRenovacao" name="Registrar Renovacao" />
    <bpmn:task id="Task_A_AtualizarSistemas" name="Atualizar Sistemas" />
    <bpmn:task id="Task_CS_CelebrarRenovacao" name="Celebrar Renovacao" />
    <bpmn:task id="Task_I_AnalisarTaxaRenovacao" name="Analisar Taxa de Renovacao" />
    <bpmn:endEvent id="End_RenovacaoConcluida" name="Renovacao Concluida" />

    <!-- Renovação Recusada -->
    <bpmn:task id="Task_CS_TentarRetencaoFinal" name="Tentar Retencao Final" />
    <bpmn:task id="Task_G_AvaliarEscalacao" name="Avaliar Escalacao" />
    <bpmn:task id="Task_CS_RegistrarMotivoCancelamento" name="Registrar Motivo" />
    <bpmn:task id="Task_A_AcionarOffboarding" name="Acionar Offboarding (6.4)" />
    <bpmn:endEvent id="End_AcionarOffboarding" name="Offboarding Acionado" />

    <!-- Sequence Flows - Detecção -->
    <bpmn:sequenceFlow id="F_Start_Detectar" sourceRef="Start_VencimentoProximo" targetRef="Task_I_DetectarVencimento" />
    <bpmn:sequenceFlow id="F_Detectar_Analisar" sourceRef="Task_I_DetectarVencimento" targetRef="Task_I_AnalisarSaude" />
    <bpmn:sequenceFlow id="F_Analisar_Revisar" sourceRef="Task_I_AnalisarSaude" targetRef="Task_CS_RevisarHistorico" />
    <bpmn:sequenceFlow id="F_Revisar_Insights" sourceRef="Task_CS_RevisarHistorico" targetRef="Task_I_GerarInsights" />
    <bpmn:sequenceFlow id="F_Insights_Gateway" sourceRef="Task_I_GerarInsights" targetRef="Gateway_ContaSaudavel" />

    <!-- Gateway Saúde - SIM (Proposta Padrão) -->
    <bpmn:sequenceFlow id="F_Gateway_Sim" name="SIM" sourceRef="Gateway_ContaSaudavel" targetRef="Task_F_CalcularRenovacaoPadrao" />
    <bpmn:sequenceFlow id="F_CalcularPadrao_Preparar" sourceRef="Task_F_CalcularRenovacaoPadrao" targetRef="Task_CS_PrepararPropostaPadrao" />
    <bpmn:sequenceFlow id="F_PropostaPadrao_Gerar" sourceRef="Task_CS_PrepararPropostaPadrao" targetRef="Task_I_GerarApresentacao" />

    <!-- Gateway Saúde - NÃO (Proposta com Incentivo) -->
    <bpmn:sequenceFlow id="F_Gateway_Nao" name="NAO" sourceRef="Gateway_ContaSaudavel" targetRef="Task_CS_AnalisarMotivosRisco" />
    <bpmn:sequenceFlow id="F_AnalisarRisco_Calcular" sourceRef="Task_CS_AnalisarMotivosRisco" targetRef="Task_F_CalcularIncentivo" />
    <bpmn:sequenceFlow id="F_CalcularIncentivo_Aprovar" sourceRef="Task_F_CalcularIncentivo" targetRef="Task_G_AprovarIncentivo" />
    <bpmn:sequenceFlow id="F_AprovarIncentivo_Preparar" sourceRef="Task_G_AprovarIncentivo" targetRef="Task_CS_PrepararPropostaIncentivo" />
    <bpmn:sequenceFlow id="F_PropostaIncentivo_Gerar" sourceRef="Task_CS_PrepararPropostaIncentivo" targetRef="Task_I_GerarApresentacao" />

    <!-- Apresentação (convergência dos dois fluxos) -->
    <bpmn:sequenceFlow id="F_Gerar_Revisar" sourceRef="Task_I_GerarApresentacao" targetRef="Task_CS_RevisarProposta" />
    <bpmn:sequenceFlow id="F_Revisar_Agendar" sourceRef="Task_CS_RevisarProposta" targetRef="Task_CS_AgendarReuniaoRenovacao" />
    <bpmn:sequenceFlow id="F_Agendar_Enviar" sourceRef="Task_CS_AgendarReuniaoRenovacao" targetRef="Task_A_EnviarProposta" />
    <bpmn:sequenceFlow id="F_Enviar_Receber" sourceRef="Task_A_EnviarProposta" targetRef="Task_C_ReceberProposta" />

    <!-- Reunião -->
    <bpmn:sequenceFlow id="F_Receber_Apresentar" sourceRef="Task_C_ReceberProposta" targetRef="Task_CS_ApresentarProposta" />
    <bpmn:sequenceFlow id="F_Apresentar_Participar" sourceRef="Task_CS_ApresentarProposta" targetRef="Task_C_ParticiparReuniao" />
    <bpmn:sequenceFlow id="F_Participar_Avaliar" sourceRef="Task_C_ParticiparReuniao" targetRef="Task_C_AvaliarProposta" />
    <bpmn:sequenceFlow id="F_Avaliar_Acompanhar" sourceRef="Task_C_AvaliarProposta" targetRef="Task_CS_AcompanharDecisao" />
    <bpmn:sequenceFlow id="F_Acompanhar_Gateway2" sourceRef="Task_CS_AcompanharDecisao" targetRef="Gateway_ClienteAceita" />

    <!-- Gateway Aceita - SIM (Renovação Direta) -->
    <bpmn:sequenceFlow id="F_Gateway2_Sim" name="SIM" sourceRef="Gateway_ClienteAceita" targetRef="Task_F_GerarNovoContrato" />

    <!-- Gateway Aceita - NÃO (Negociação) -->
    <bpmn:sequenceFlow id="F_Gateway2_Nao" name="NAO" sourceRef="Gateway_ClienteAceita" targetRef="Task_C_SolicitarAjustes" />
    <bpmn:sequenceFlow id="F_Solicitar_Registrar" sourceRef="Task_C_SolicitarAjustes" targetRef="Task_CS_RegistrarObjecoes" />
    <bpmn:sequenceFlow id="F_Registrar_RevisarVal" sourceRef="Task_CS_RegistrarObjecoes" targetRef="Task_F_RevisarValores" />
    <bpmn:sequenceFlow id="F_RevisarVal_AprovarAjust" sourceRef="Task_F_RevisarValores" targetRef="Task_G_AprovarAjustes" />
    <bpmn:sequenceFlow id="F_AprovarAjust_Contra" sourceRef="Task_G_AprovarAjustes" targetRef="Task_CS_ApresentarContraProposta" />
    <bpmn:sequenceFlow id="F_Contra_AvaliarContra" sourceRef="Task_CS_ApresentarContraProposta" targetRef="Task_C_AvaliarContraProposta" />
    <bpmn:sequenceFlow id="F_AvaliarContra_Gateway3" sourceRef="Task_C_AvaliarContraProposta" targetRef="Gateway_AceitaContraProposta" />

    <!-- Gateway Contraproposta - SIM -->
    <bpmn:sequenceFlow id="F_Gateway3_Sim" name="SIM" sourceRef="Gateway_AceitaContraProposta" targetRef="Task_F_GerarNovoContrato" />

    <!-- Gateway Contraproposta - NÃO (Offboarding) -->
    <bpmn:sequenceFlow id="F_Gateway3_Nao" name="NAO" sourceRef="Gateway_AceitaContraProposta" targetRef="Task_CS_TentarRetencaoFinal" />
    <bpmn:sequenceFlow id="F_Retencao_Escalacao" sourceRef="Task_CS_TentarRetencaoFinal" targetRef="Task_G_AvaliarEscalacao" />
    <bpmn:sequenceFlow id="F_Escalacao_Registrar" sourceRef="Task_G_AvaliarEscalacao" targetRef="Task_CS_RegistrarMotivoCancelamento" />
    <bpmn:sequenceFlow id="F_Registrar_Acionar" sourceRef="Task_CS_RegistrarMotivoCancelamento" targetRef="Task_A_AcionarOffboarding" />
    <bpmn:sequenceFlow id="F_Acionar_End2" sourceRef="Task_A_AcionarOffboarding" targetRef="End_AcionarOffboarding" />

    <!-- Renovação Concluída (convergência) -->
    <bpmn:sequenceFlow id="F_GerarContrato_Enviar" sourceRef="Task_F_GerarNovoContrato" targetRef="Task_A_EnviarContrato" />
    <bpmn:sequenceFlow id="F_EnviarContrato_Assinar" sourceRef="Task_A_EnviarContrato" targetRef="Task_C_AssinarContrato" />
    <bpmn:sequenceFlow id="F_Assinar_Registrar" sourceRef="Task_C_AssinarContrato" targetRef="Task_F_RegistrarRenovacao" />
    <bpmn:sequenceFlow id="F_Registrar_Atualizar" sourceRef="Task_F_RegistrarRenovacao" targetRef="Task_A_AtualizarSistemas" />
    <bpmn:sequenceFlow id="F_Atualizar_Celebrar" sourceRef="Task_A_AtualizarSistemas" targetRef="Task_CS_CelebrarRenovacao" />
    <bpmn:sequenceFlow id="F_Celebrar_Analisar" sourceRef="Task_CS_CelebrarRenovacao" targetRef="Task_I_AnalisarTaxaRenovacao" />
    <bpmn:sequenceFlow id="F_Analisar_End" sourceRef="Task_I_AnalisarTaxaRenovacao" targetRef="End_RenovacaoConcluida" />
  </bpmn:process>

  <bpmndi:BPMNDiagram id="BPMNDiagram_72_V5">
    <bpmndi:BPMNPlane id="BPMNPlane_72_V5" bpmnElement="Collaboration_72_V5">
      <bpmndi:BPMNShape id="Participant_72_V5_di" bpmnElement="Participant_72_V5" isHorizontal="true">
        <dc:Bounds x="50" y="20" width="4500" height="850" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Lane_Cliente_di" bpmnElement="Lane_Cliente" isHorizontal="true">
        <dc:Bounds x="80" y="20" width="4470" height="150" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_CS_di" bpmnElement="Lane_CS" isHorizontal="true">
        <dc:Bounds x="80" y="170" width="4470" height="200" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_IA_di" bpmnElement="Lane_IA" isHorizontal="true">
        <dc:Bounds x="80" y="370" width="4470" height="180" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Financeiro_di" bpmnElement="Lane_Financeiro" isHorizontal="true">
        <dc:Bounds x="80" y="550" width="4470" height="150" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Gestao_di" bpmnElement="Lane_Gestao" isHorizontal="true">
        <dc:Bounds x="80" y="700" width="4470" height="170" />
      </bpmndi:BPMNShape>

      <!-- Shapes - Detecção -->
      <bpmndi:BPMNShape id="Start_VencimentoProximo_di" bpmnElement="Start_VencimentoProximo">
        <dc:Bounds x="120" y="442" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_DetectarVencimento_di" bpmnElement="Task_I_DetectarVencimento">
        <dc:Bounds x="200" y="420" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_AnalisarSaude_di" bpmnElement="Task_I_AnalisarSaude">
        <dc:Bounds x="350" y="420" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_RevisarHistorico_di" bpmnElement="Task_CS_RevisarHistorico">
        <dc:Bounds x="500" y="210" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_GerarInsights_di" bpmnElement="Task_I_GerarInsights">
        <dc:Bounds x="650" y="420" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_ContaSaudavel_di" bpmnElement="Gateway_ContaSaudavel" isMarkerVisible="true">
        <dc:Bounds x="800" y="435" width="50" height="50" />
      </bpmndi:BPMNShape>

      <!-- Proposta Padrão (SIM) -->
      <bpmndi:BPMNShape id="Task_F_CalcularRenovacaoPadrao_di" bpmnElement="Task_F_CalcularRenovacaoPadrao">
        <dc:Bounds x="880" y="585" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_PrepararPropostaPadrao_di" bpmnElement="Task_CS_PrepararPropostaPadrao">
        <dc:Bounds x="1030" y="210" width="120" height="80" />
      </bpmndi:BPMNShape>

      <!-- Proposta com Incentivo (NÃO) -->
      <bpmndi:BPMNShape id="Task_CS_AnalisarMotivosRisco_di" bpmnElement="Task_CS_AnalisarMotivosRisco">
        <dc:Bounds x="880" y="290" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_F_CalcularIncentivo_di" bpmnElement="Task_F_CalcularIncentivo">
        <dc:Bounds x="1030" y="585" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_G_AprovarIncentivo_di" bpmnElement="Task_G_AprovarIncentivo">
        <dc:Bounds x="1180" y="735" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_PrepararPropostaIncentivo_di" bpmnElement="Task_CS_PrepararPropostaIncentivo">
        <dc:Bounds x="1330" y="290" width="120" height="80" />
      </bpmndi:BPMNShape>

      <!-- Apresentação (convergência) -->
      <bpmndi:BPMNShape id="Task_I_GerarApresentacao_di" bpmnElement="Task_I_GerarApresentacao">
        <dc:Bounds x="1480" y="420" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_RevisarProposta_di" bpmnElement="Task_CS_RevisarProposta">
        <dc:Bounds x="1630" y="210" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_AgendarReuniaoRenovacao_di" bpmnElement="Task_CS_AgendarReuniaoRenovacao">
        <dc:Bounds x="1780" y="210" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_EnviarProposta_di" bpmnElement="Task_A_EnviarProposta">
        <dc:Bounds x="1930" y="420" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_ReceberProposta_di" bpmnElement="Task_C_ReceberProposta">
        <dc:Bounds x="2080" y="55" width="120" height="80" />
      </bpmndi:BPMNShape>

      <!-- Reunião -->
      <bpmndi:BPMNShape id="Task_CS_ApresentarProposta_di" bpmnElement="Task_CS_ApresentarProposta">
        <dc:Bounds x="2230" y="210" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_ParticiparReuniao_di" bpmnElement="Task_C_ParticiparReuniao">
        <dc:Bounds x="2380" y="55" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_AvaliarProposta_di" bpmnElement="Task_C_AvaliarProposta">
        <dc:Bounds x="2530" y="55" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_AcompanharDecisao_di" bpmnElement="Task_CS_AcompanharDecisao">
        <dc:Bounds x="2680" y="210" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_ClienteAceita_di" bpmnElement="Gateway_ClienteAceita" isMarkerVisible="true">
        <dc:Bounds x="2830" y="435" width="50" height="50" />
      </bpmndi:BPMNShape>

      <!-- Negociação -->
      <bpmndi:BPMNShape id="Task_C_SolicitarAjustes_di" bpmnElement="Task_C_SolicitarAjustes">
        <dc:Bounds x="2795" y="55" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_RegistrarObjecoes_di" bpmnElement="Task_CS_RegistrarObjecoes">
        <dc:Bounds x="2945" y="210" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_F_RevisarValores_di" bpmnElement="Task_F_RevisarValores">
        <dc:Bounds x="3095" y="585" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_G_AprovarAjustes_di" bpmnElement="Task_G_AprovarAjustes">
        <dc:Bounds x="3245" y="735" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_ApresentarContraProposta_di" bpmnElement="Task_CS_ApresentarContraProposta">
        <dc:Bounds x="3395" y="290" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_AvaliarContraProposta_di" bpmnElement="Task_C_AvaliarContraProposta">
        <dc:Bounds x="3545" y="55" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_AceitaContraProposta_di" bpmnElement="Gateway_AceitaContraProposta" isMarkerVisible="true">
        <dc:Bounds x="3695" y="435" width="50" height="50" />
      </bpmndi:BPMNShape>

      <!-- Renovação Concluída -->
      <bpmndi:BPMNShape id="Task_F_GerarNovoContrato_di" bpmnElement="Task_F_GerarNovoContrato">
        <dc:Bounds x="2910" y="585" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_EnviarContrato_di" bpmnElement="Task_A_EnviarContrato">
        <dc:Bounds x="3060" y="420" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_AssinarContrato_di" bpmnElement="Task_C_AssinarContrato">
        <dc:Bounds x="3210" y="55" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_F_RegistrarRenovacao_di" bpmnElement="Task_F_RegistrarRenovacao">
        <dc:Bounds x="3360" y="585" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_AtualizarSistemas_di" bpmnElement="Task_A_AtualizarSistemas">
        <dc:Bounds x="3510" y="420" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_CelebrarRenovacao_di" bpmnElement="Task_CS_CelebrarRenovacao">
        <dc:Bounds x="3660" y="210" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_AnalisarTaxaRenovacao_di" bpmnElement="Task_I_AnalisarTaxaRenovacao">
        <dc:Bounds x="3810" y="420" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_RenovacaoConcluida_di" bpmnElement="End_RenovacaoConcluida">
        <dc:Bounds x="3852" y="232" width="36" height="36" />
      </bpmndi:BPMNShape>

      <!-- Offboarding -->
      <bpmndi:BPMNShape id="Task_CS_TentarRetencaoFinal_di" bpmnElement="Task_CS_TentarRetencaoFinal">
        <dc:Bounds x="3775" y="290" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_G_AvaliarEscalacao_di" bpmnElement="Task_G_AvaliarEscalacao">
        <dc:Bounds x="3925" y="735" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_RegistrarMotivoCancelamento_di" bpmnElement="Task_CS_RegistrarMotivoCancelamento">
        <dc:Bounds x="4075" y="290" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_AcionarOffboarding_di" bpmnElement="Task_A_AcionarOffboarding">
        <dc:Bounds x="4225" y="420" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_AcionarOffboarding_di" bpmnElement="End_AcionarOffboarding">
        <dc:Bounds x="4267" y="232" width="36" height="36" />
      </bpmndi:BPMNShape>

      <!-- Edges - Detecção -->
      <bpmndi:BPMNEdge id="F_Start_Detectar_di" bpmnElement="F_Start_Detectar">
        <di:waypoint x="156" y="460" /><di:waypoint x="200" y="460" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Detectar_Analisar_di" bpmnElement="F_Detectar_Analisar">
        <di:waypoint x="320" y="460" /><di:waypoint x="350" y="460" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Analisar_Revisar_di" bpmnElement="F_Analisar_Revisar">
        <di:waypoint x="410" y="420" /><di:waypoint x="560" y="290" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Revisar_Insights_di" bpmnElement="F_Revisar_Insights">
        <di:waypoint x="560" y="290" /><di:waypoint x="710" y="420" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Insights_Gateway_di" bpmnElement="F_Insights_Gateway">
        <di:waypoint x="770" y="460" /><di:waypoint x="800" y="460" />
      </bpmndi:BPMNEdge>

      <!-- Gateway 1 - SIM -->
      <bpmndi:BPMNEdge id="F_Gateway_Sim_di" bpmnElement="F_Gateway_Sim">
        <di:waypoint x="825" y="485" /><di:waypoint x="940" y="585" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_CalcularPadrao_Preparar_di" bpmnElement="F_CalcularPadrao_Preparar">
        <di:waypoint x="940" y="585" /><di:waypoint x="1090" y="290" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_PropostaPadrao_Gerar_di" bpmnElement="F_PropostaPadrao_Gerar">
        <di:waypoint x="1090" y="290" /><di:waypoint x="1540" y="420" />
      </bpmndi:BPMNEdge>

      <!-- Gateway 1 - NÃO -->
      <bpmndi:BPMNEdge id="F_Gateway_Nao_di" bpmnElement="F_Gateway_Nao">
        <di:waypoint x="825" y="435" /><di:waypoint x="940" y="290" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_AnalisarRisco_Calcular_di" bpmnElement="F_AnalisarRisco_Calcular">
        <di:waypoint x="940" y="370" /><di:waypoint x="1090" y="585" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_CalcularIncentivo_Aprovar_di" bpmnElement="F_CalcularIncentivo_Aprovar">
        <di:waypoint x="1090" y="665" /><di:waypoint x="1240" y="735" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_AprovarIncentivo_Preparar_di" bpmnElement="F_AprovarIncentivo_Preparar">
        <di:waypoint x="1240" y="735" /><di:waypoint x="1390" y="370" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_PropostaIncentivo_Gerar_di" bpmnElement="F_PropostaIncentivo_Gerar">
        <di:waypoint x="1390" y="370" /><di:waypoint x="1540" y="420" />
      </bpmndi:BPMNEdge>

      <!-- Apresentação -->
      <bpmndi:BPMNEdge id="F_Gerar_Revisar_di" bpmnElement="F_Gerar_Revisar">
        <di:waypoint x="1540" y="420" /><di:waypoint x="1690" y="290" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Revisar_Agendar_di" bpmnElement="F_Revisar_Agendar">
        <di:waypoint x="1750" y="250" /><di:waypoint x="1780" y="250" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Agendar_Enviar_di" bpmnElement="F_Agendar_Enviar">
        <di:waypoint x="1840" y="290" /><di:waypoint x="1990" y="420" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Enviar_Receber_di" bpmnElement="F_Enviar_Receber">
        <di:waypoint x="1990" y="420" /><di:waypoint x="2140" y="135" />
      </bpmndi:BPMNEdge>

      <!-- Reunião -->
      <bpmndi:BPMNEdge id="F_Receber_Apresentar_di" bpmnElement="F_Receber_Apresentar">
        <di:waypoint x="2140" y="135" /><di:waypoint x="2290" y="210" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Apresentar_Participar_di" bpmnElement="F_Apresentar_Participar">
        <di:waypoint x="2290" y="210" /><di:waypoint x="2440" y="135" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Participar_Avaliar_di" bpmnElement="F_Participar_Avaliar">
        <di:waypoint x="2500" y="95" /><di:waypoint x="2530" y="95" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Avaliar_Acompanhar_di" bpmnElement="F_Avaliar_Acompanhar">
        <di:waypoint x="2590" y="135" /><di:waypoint x="2740" y="210" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Acompanhar_Gateway2_di" bpmnElement="F_Acompanhar_Gateway2">
        <di:waypoint x="2740" y="290" /><di:waypoint x="2855" y="435" />
      </bpmndi:BPMNEdge>

      <!-- Gateway 2 - SIM (Renovação Direta) -->
      <bpmndi:BPMNEdge id="F_Gateway2_Sim_di" bpmnElement="F_Gateway2_Sim">
        <di:waypoint x="2855" y="485" /><di:waypoint x="2970" y="585" />
      </bpmndi:BPMNEdge>

      <!-- Gateway 2 - NÃO (Negociação) -->
      <bpmndi:BPMNEdge id="F_Gateway2_Nao_di" bpmnElement="F_Gateway2_Nao">
        <di:waypoint x="2855" y="435" /><di:waypoint x="2855" y="135" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Solicitar_Registrar_di" bpmnElement="F_Solicitar_Registrar">
        <di:waypoint x="2855" y="135" /><di:waypoint x="3005" y="210" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Registrar_RevisarVal_di" bpmnElement="F_Registrar_RevisarVal">
        <di:waypoint x="3005" y="290" /><di:waypoint x="3155" y="585" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_RevisarVal_AprovarAjust_di" bpmnElement="F_RevisarVal_AprovarAjust">
        <di:waypoint x="3155" y="665" /><di:waypoint x="3305" y="735" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_AprovarAjust_Contra_di" bpmnElement="F_AprovarAjust_Contra">
        <di:waypoint x="3305" y="735" /><di:waypoint x="3455" y="370" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Contra_AvaliarContra_di" bpmnElement="F_Contra_AvaliarContra">
        <di:waypoint x="3455" y="290" /><di:waypoint x="3605" y="135" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_AvaliarContra_Gateway3_di" bpmnElement="F_AvaliarContra_Gateway3">
        <di:waypoint x="3605" y="135" /><di:waypoint x="3720" y="435" />
      </bpmndi:BPMNEdge>

      <!-- Gateway 3 - SIM -->
      <bpmndi:BPMNEdge id="F_Gateway3_Sim_di" bpmnElement="F_Gateway3_Sim">
        <di:waypoint x="3720" y="460" /><di:waypoint x="2970" y="625" />
      </bpmndi:BPMNEdge>

      <!-- Gateway 3 - NÃO (Offboarding) -->
      <bpmndi:BPMNEdge id="F_Gateway3_Nao_di" bpmnElement="F_Gateway3_Nao">
        <di:waypoint x="3720" y="435" /><di:waypoint x="3835" y="290" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Retencao_Escalacao_di" bpmnElement="F_Retencao_Escalacao">
        <di:waypoint x="3835" y="370" /><di:waypoint x="3985" y="735" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Escalacao_Registrar_di" bpmnElement="F_Escalacao_Registrar">
        <di:waypoint x="3985" y="735" /><di:waypoint x="4135" y="370" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Registrar_Acionar_di" bpmnElement="F_Registrar_Acionar">
        <di:waypoint x="4135" y="370" /><di:waypoint x="4285" y="420" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Acionar_End2_di" bpmnElement="F_Acionar_End2">
        <di:waypoint x="4285" y="420" /><di:waypoint x="4285" y="268" />
      </bpmndi:BPMNEdge>

      <!-- Renovação Concluída -->
      <bpmndi:BPMNEdge id="F_GerarContrato_Enviar_di" bpmnElement="F_GerarContrato_Enviar">
        <di:waypoint x="2970" y="585" /><di:waypoint x="3120" y="500" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_EnviarContrato_Assinar_di" bpmnElement="F_EnviarContrato_Assinar">
        <di:waypoint x="3120" y="420" /><di:waypoint x="3270" y="135" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Assinar_Registrar_di" bpmnElement="F_Assinar_Registrar">
        <di:waypoint x="3270" y="135" /><di:waypoint x="3420" y="585" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Registrar_Atualizar_di" bpmnElement="F_Registrar_Atualizar">
        <di:waypoint x="3420" y="585" /><di:waypoint x="3570" y="500" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Atualizar_Celebrar_di" bpmnElement="F_Atualizar_Celebrar">
        <di:waypoint x="3570" y="420" /><di:waypoint x="3720" y="290" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Celebrar_Analisar_di" bpmnElement="F_Celebrar_Analisar">
        <di:waypoint x="3720" y="290" /><di:waypoint x="3870" y="420" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Analisar_End_di" bpmnElement="F_Analisar_End">
        <di:waypoint x="3870" y="420" /><di:waypoint x="3870" y="268" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

const phases = [
  { name: 'Deteccao & Analise (D-60)', x: 80, width: 770 },
  { name: 'Preparacao de Proposta (D-50)', x: 850, width: 780 },
  { name: 'Apresentacao & Reuniao (D-45)', x: 1630, width: 1220 },
  { name: 'Negociacao (D-30)', x: 2850, width: 895 },
  { name: 'Fechamento ou Offboarding (D-7)', x: 3745, width: 605 }
];

const config = {
  zoom: 0.75,
  storageKey: 'subprocesso-7.2',
  startLabel: 'VENCIMENTO PROXIMO (D-60)',
  endLabels: {
    End_RenovacaoConcluida: { text: 'RENOVACAO CONCLUIDA', className: 'end-label-success', marker: 'end-success' },
    End_AcionarOffboarding: { text: 'OFFBOARDING ACIONADO', className: 'end-label-lost', marker: 'end-lost' }
  },
  showDefaultEndLabel: false,
  useEndName: false,
  defaultEndLabelText: 'FIM',
  defaultEndClass: 'end-label-neutral'
};

window.v5Data = window.v5Data || {};
window.v5Data['7.2'] = { diagramXML, nodeDetails, phases, ...config };
