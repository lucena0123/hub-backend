const nodeDetails = {
  // Ciclo de Faturamento
  'Task_I_PreverReceita': { sla: 'D-10', tag: 'IA Previsao', desc: 'Preve receita do mes baseada em contratos ativos.' },
  'Task_F_ValidarServicos': { sla: 'D-7', tag: 'Validacao', desc: 'Valida servicos prestados no periodo.' },
  'Task_F_CalcularValores': { sla: 'D-6', tag: 'Calculo', desc: 'Calcula valores de faturamento (fixo + variavel).' },
  'Task_F_GerarFatura': { sla: 'D-5', tag: 'Fatura', desc: 'Gera fatura e nota fiscal.' },
  'Task_A_EnviarFatura': { sla: 'D-5', tag: 'Auto', desc: 'Envia fatura ao cliente automaticamente.' },
  'Task_C_ReceberFatura': { sla: null, tag: 'Recebimento', desc: 'Cliente recebe fatura por email.' },
  'Task_I_MonitorarPrazo': { sla: 'D+0', tag: 'IA Monitor', desc: 'Monitora prazo de pagamento diariamente.' },

  // Gateway Principal
  'Gateway_PagoNoPrazo': { sla: null, tag: 'Gateway', desc: 'Cliente pagou no prazo?' },
  'Task_F_RegistrarPagamento': { sla: '24h', tag: 'Registro', desc: 'Registra pagamento no sistema financeiro.' },
  'Task_A_NotificarRecebimento': { sla: null, tag: 'Auto', desc: 'Notifica equipe sobre recebimento.' },
  'Task_F_ConciliarPagamento': { sla: '24h', tag: 'Conciliacao', desc: 'Concilia pagamento com fatura.' },

  // Fluxo de Cobranca - Nivel 1 (Amigavel)
  'Task_I_AlertarAtraso': { sla: 'D+3', tag: 'IA Alerta', desc: 'Alerta time sobre atraso no pagamento.' },
  'Task_CS_AnalisarHistorico': { sla: null, tag: 'Analise', desc: 'Analisa historico de pagamentos do cliente.' },
  'Task_CS_ContatoAmigavel': { sla: 'D+3', tag: 'Cobranca Leve', desc: 'Faz contato amigavel com o cliente.' },
  'Task_C_RespondeContato': { sla: null, tag: 'Resposta', desc: 'Cliente responde sobre o atraso.' },
  'Task_F_RegistrarJustificativa': { sla: null, tag: 'Registro', desc: 'Registra justificativa do cliente.' },
  'Gateway_ClientePagouAposAmigavel': { sla: null, tag: 'Gateway', desc: 'Cliente pagou apos contato amigavel?' },

  // Fluxo de Cobranca - Nivel 2 (Formal)
  'Task_F_GerarNotificacaoFormal': { sla: 'D+10', tag: 'Cobranca Formal', desc: 'Gera notificacao formal de cobranca.' },
  'Task_G_AprovarCobrancaFormal': { sla: null, tag: 'Aprovacao', desc: 'Gestao aprova cobranca formal.' },
  'Task_A_EnviarNotificacaoFormal': { sla: null, tag: 'Auto', desc: 'Envia notificacao formal ao cliente.' },
  'Task_C_ReceberNotificacao': { sla: null, tag: 'Recebimento', desc: 'Cliente recebe notificacao formal.' },
  'Task_CS_AcompanharCobranca': { sla: 'D+15', tag: 'Follow-up', desc: 'Acompanha resposta do cliente.' },
  'Gateway_ClientePagouAposFormal': { sla: null, tag: 'Gateway', desc: 'Cliente pagou apos notificacao formal?' },

  // Fluxo de Cobranca - Nivel 3 (Suspensao)
  'Task_G_AvaliarSuspensao': { sla: 'D+25', tag: 'Avaliacao', desc: 'Gestao avalia necessidade de suspensao.' },
  'Task_F_CalcularMultaJuros': { sla: null, tag: 'Calculo', desc: 'Calcula multa e juros por atraso.' },
  'Task_CS_NotificarSuspensao': { sla: 'D+28', tag: 'Aviso Final', desc: 'Notifica cliente sobre suspensao iminente.' },
  'Task_C_ReceberAvisoSuspensao': { sla: null, tag: 'Aviso', desc: 'Cliente recebe aviso de suspensao.' },
  'Gateway_ClientePagouAntesSuspensao': { sla: null, tag: 'Gateway', desc: 'Cliente pagou antes da suspensao?' },
  'Task_O_SuspenderServicos': { sla: 'D+30', tag: 'Suspensao', desc: 'Suspende servicos e campanhas do cliente.' },
  'Task_A_NotificarSuspensao': { sla: null, tag: 'Auto', desc: 'Notifica sistemas sobre suspensao.' },
  'Task_F_AcionarJuridico': { sla: 'D+45', tag: 'Juridico', desc: 'Aciona departamento juridico.' },

  // Analise e Aprendizado
  'Task_I_AnalisarPadraoPagamento': { sla: null, tag: 'IA Analise', desc: 'Analisa padroes de pagamento do cliente.' },
  'Task_F_AtualizarRisco': { sla: null, tag: 'Risco', desc: 'Atualiza score de risco financeiro.' },
  'Task_CS_AvaliarSaude': { sla: null, tag: 'Saude Conta', desc: 'Avalia saude geral da conta.' }
};

const diagramXML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_71_V5" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_71_V5">
    <bpmn:participant id="Participant_71_V5" name="Faturamento e Cobranca" processRef="Process_71_V5" />
  </bpmn:collaboration>
  <bpmn:process id="Process_71_V5" isExecutable="false">
    <bpmn:laneSet id="LaneSet_71_V5">
      <bpmn:lane id="Lane_Cliente" name="Cliente">
        <bpmn:flowNodeRef>Task_C_ReceberFatura</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_C_RespondeContato</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_C_ReceberNotificacao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_C_ReceberAvisoSuspensao</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Financeiro" name="Financeiro / Cobranca">
        <bpmn:flowNodeRef>Start_CicloFaturamento</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_F_ValidarServicos</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_F_CalcularValores</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_F_GerarFatura</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_F_RegistrarPagamento</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_F_ConciliarPagamento</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_F_RegistrarJustificativa</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_F_GerarNotificacaoFormal</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_F_CalcularMultaJuros</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_F_AcionarJuridico</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_F_AtualizarRisco</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_PagamentoRecebido</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_ContaSuspensa</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_IA" name="IA / Previsao">
        <bpmn:flowNodeRef>Task_I_PreverReceita</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_EnviarFatura</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_MonitorarPrazo</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_PagoNoPrazo</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_NotificarRecebimento</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_AlertarAtraso</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_ClientePagouAposAmigavel</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_EnviarNotificacaoFormal</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_ClientePagouAposFormal</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_ClientePagouAntesSuspensao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_NotificarSuspensao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_AnalisarPadraoPagamento</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_CS" name="CS / Relacionamento">
        <bpmn:flowNodeRef>Task_CS_AnalisarHistorico</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_ContatoAmigavel</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_AcompanharCobranca</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_NotificarSuspensao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_AvaliarSaude</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Gestao" name="Gestao / Aprovacao">
        <bpmn:flowNodeRef>Task_G_AprovarCobrancaFormal</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_G_AvaliarSuspensao</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Operacoes" name="Operacoes / Trafego">
        <bpmn:flowNodeRef>Task_O_SuspenderServicos</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>

    <bpmn:startEvent id="Start_CicloFaturamento" name="Ciclo de Faturamento" />

    <!-- Ciclo de Faturamento -->
    <bpmn:task id="Task_I_PreverReceita" name="Prever Receita do Mes" />
    <bpmn:task id="Task_F_ValidarServicos" name="Validar Servicos Prestados" />
    <bpmn:task id="Task_F_CalcularValores" name="Calcular Valores de Faturamento" />
    <bpmn:task id="Task_F_GerarFatura" name="Gerar Fatura e NF" />
    <bpmn:task id="Task_A_EnviarFatura" name="Enviar Fatura ao Cliente" />
    <bpmn:task id="Task_C_ReceberFatura" name="Receber Fatura" />
    <bpmn:task id="Task_I_MonitorarPrazo" name="Monitorar Prazo de Pagamento" />

    <!-- Gateway Principal -->
    <bpmn:exclusiveGateway id="Gateway_PagoNoPrazo" name="Pago no Prazo?" />
    <bpmn:task id="Task_F_RegistrarPagamento" name="Registrar Pagamento" />
    <bpmn:task id="Task_A_NotificarRecebimento" name="Notificar Recebimento" />
    <bpmn:task id="Task_F_ConciliarPagamento" name="Conciliar Pagamento" />
    <bpmn:task id="Task_I_AnalisarPadraoPagamento" name="Analisar Padrao de Pagamento" />
    <bpmn:task id="Task_F_AtualizarRisco" name="Atualizar Score de Risco" />
    <bpmn:task id="Task_CS_AvaliarSaude" name="Avaliar Saude da Conta" />
    <bpmn:endEvent id="End_PagamentoRecebido" name="Pagamento Recebido" />

    <!-- Cobranca Nivel 1 (Amigavel) -->
    <bpmn:task id="Task_I_AlertarAtraso" name="Alertar sobre Atraso (D+3)" />
    <bpmn:task id="Task_CS_AnalisarHistorico" name="Analisar Historico de Pagamentos" />
    <bpmn:task id="Task_CS_ContatoAmigavel" name="Contato Amigavel" />
    <bpmn:task id="Task_C_RespondeContato" name="Responder sobre Atraso" />
    <bpmn:task id="Task_F_RegistrarJustificativa" name="Registrar Justificativa" />
    <bpmn:exclusiveGateway id="Gateway_ClientePagouAposAmigavel" name="Pagou apos Contato?" />

    <!-- Cobranca Nivel 2 (Formal) -->
    <bpmn:task id="Task_F_GerarNotificacaoFormal" name="Gerar Notificacao Formal (D+10)" />
    <bpmn:task id="Task_G_AprovarCobrancaFormal" name="Aprovar Cobranca Formal" />
    <bpmn:task id="Task_A_EnviarNotificacaoFormal" name="Enviar Notificacao Formal" />
    <bpmn:task id="Task_C_ReceberNotificacao" name="Receber Notificacao Formal" />
    <bpmn:task id="Task_CS_AcompanharCobranca" name="Acompanhar Cobranca (D+15)" />
    <bpmn:exclusiveGateway id="Gateway_ClientePagouAposFormal" name="Pagou apos Formal?" />

    <!-- Cobranca Nivel 3 (Suspensao) -->
    <bpmn:task id="Task_G_AvaliarSuspensao" name="Avaliar Suspensao (D+25)" />
    <bpmn:task id="Task_F_CalcularMultaJuros" name="Calcular Multa e Juros" />
    <bpmn:task id="Task_CS_NotificarSuspensao" name="Notificar Suspensao Iminente (D+28)" />
    <bpmn:task id="Task_C_ReceberAvisoSuspensao" name="Receber Aviso de Suspensao" />
    <bpmn:exclusiveGateway id="Gateway_ClientePagouAntesSuspensao" name="Pagou antes Suspensao?" />
    <bpmn:task id="Task_O_SuspenderServicos" name="Suspender Servicos (D+30)" />
    <bpmn:task id="Task_A_NotificarSuspensao" name="Notificar Sistemas" />
    <bpmn:task id="Task_F_AcionarJuridico" name="Acionar Juridico (D+45)" />
    <bpmn:endEvent id="End_ContaSuspensa" name="Conta Suspensa" />

    <!-- Sequence Flows - Ciclo Normal -->
    <bpmn:sequenceFlow id="F_Start_Prever" sourceRef="Start_CicloFaturamento" targetRef="Task_I_PreverReceita" />
    <bpmn:sequenceFlow id="F_Prever_Validar" sourceRef="Task_I_PreverReceita" targetRef="Task_F_ValidarServicos" />
    <bpmn:sequenceFlow id="F_Validar_Calcular" sourceRef="Task_F_ValidarServicos" targetRef="Task_F_CalcularValores" />
    <bpmn:sequenceFlow id="F_Calcular_Gerar" sourceRef="Task_F_CalcularValores" targetRef="Task_F_GerarFatura" />
    <bpmn:sequenceFlow id="F_Gerar_Enviar" sourceRef="Task_F_GerarFatura" targetRef="Task_A_EnviarFatura" />
    <bpmn:sequenceFlow id="F_Enviar_Receber" sourceRef="Task_A_EnviarFatura" targetRef="Task_C_ReceberFatura" />
    <bpmn:sequenceFlow id="F_Receber_Monitorar" sourceRef="Task_C_ReceberFatura" targetRef="Task_I_MonitorarPrazo" />
    <bpmn:sequenceFlow id="F_Monitorar_Gateway" sourceRef="Task_I_MonitorarPrazo" targetRef="Gateway_PagoNoPrazo" />

    <!-- Gateway Principal - Pago SIM -->
    <bpmn:sequenceFlow id="F_Gateway_Sim" name="SIM" sourceRef="Gateway_PagoNoPrazo" targetRef="Task_F_RegistrarPagamento" />
    <bpmn:sequenceFlow id="F_Registrar_Notificar" sourceRef="Task_F_RegistrarPagamento" targetRef="Task_A_NotificarRecebimento" />
    <bpmn:sequenceFlow id="F_Notificar_Conciliar" sourceRef="Task_A_NotificarRecebimento" targetRef="Task_F_ConciliarPagamento" />
    <bpmn:sequenceFlow id="F_Conciliar_Analisar" sourceRef="Task_F_ConciliarPagamento" targetRef="Task_I_AnalisarPadraoPagamento" />
    <bpmn:sequenceFlow id="F_Analisar_Risco" sourceRef="Task_I_AnalisarPadraoPagamento" targetRef="Task_F_AtualizarRisco" />
    <bpmn:sequenceFlow id="F_Risco_Saude" sourceRef="Task_F_AtualizarRisco" targetRef="Task_CS_AvaliarSaude" />
    <bpmn:sequenceFlow id="F_Saude_End" sourceRef="Task_CS_AvaliarSaude" targetRef="End_PagamentoRecebido" />

    <!-- Gateway Principal - Pago NAO (Cobranca Nivel 1) -->
    <bpmn:sequenceFlow id="F_Gateway_Nao" name="NAO" sourceRef="Gateway_PagoNoPrazo" targetRef="Task_I_AlertarAtraso" />
    <bpmn:sequenceFlow id="F_Alertar_AnalisarHist" sourceRef="Task_I_AlertarAtraso" targetRef="Task_CS_AnalisarHistorico" />
    <bpmn:sequenceFlow id="F_AnalisarHist_Contato" sourceRef="Task_CS_AnalisarHistorico" targetRef="Task_CS_ContatoAmigavel" />
    <bpmn:sequenceFlow id="F_Contato_Responde" sourceRef="Task_CS_ContatoAmigavel" targetRef="Task_C_RespondeContato" />
    <bpmn:sequenceFlow id="F_Responde_Justificar" sourceRef="Task_C_RespondeContato" targetRef="Task_F_RegistrarJustificativa" />
    <bpmn:sequenceFlow id="F_Justificar_Gateway2" sourceRef="Task_F_RegistrarJustificativa" targetRef="Gateway_ClientePagouAposAmigavel" />

    <!-- Gateway Amigavel - Pagou SIM -->
    <bpmn:sequenceFlow id="F_Gateway2_Sim" name="SIM" sourceRef="Gateway_ClientePagouAposAmigavel" targetRef="Task_F_RegistrarPagamento" />

    <!-- Gateway Amigavel - Pagou NAO (Cobranca Nivel 2) -->
    <bpmn:sequenceFlow id="F_Gateway2_Nao" name="NAO" sourceRef="Gateway_ClientePagouAposAmigavel" targetRef="Task_F_GerarNotificacaoFormal" />
    <bpmn:sequenceFlow id="F_GerarFormal_Aprovar" sourceRef="Task_F_GerarNotificacaoFormal" targetRef="Task_G_AprovarCobrancaFormal" />
    <bpmn:sequenceFlow id="F_Aprovar_EnviarFormal" sourceRef="Task_G_AprovarCobrancaFormal" targetRef="Task_A_EnviarNotificacaoFormal" />
    <bpmn:sequenceFlow id="F_EnviarFormal_ReceberNot" sourceRef="Task_A_EnviarNotificacaoFormal" targetRef="Task_C_ReceberNotificacao" />
    <bpmn:sequenceFlow id="F_ReceberNot_Acompanhar" sourceRef="Task_C_ReceberNotificacao" targetRef="Task_CS_AcompanharCobranca" />
    <bpmn:sequenceFlow id="F_Acompanhar_Gateway3" sourceRef="Task_CS_AcompanharCobranca" targetRef="Gateway_ClientePagouAposFormal" />

    <!-- Gateway Formal - Pagou SIM -->
    <bpmn:sequenceFlow id="F_Gateway3_Sim" name="SIM" sourceRef="Gateway_ClientePagouAposFormal" targetRef="Task_F_RegistrarPagamento" />

    <!-- Gateway Formal - Pagou NAO (Cobranca Nivel 3 - Suspensao) -->
    <bpmn:sequenceFlow id="F_Gateway3_Nao" name="NAO" sourceRef="Gateway_ClientePagouAposFormal" targetRef="Task_G_AvaliarSuspensao" />
    <bpmn:sequenceFlow id="F_Avaliar_Multa" sourceRef="Task_G_AvaliarSuspensao" targetRef="Task_F_CalcularMultaJuros" />
    <bpmn:sequenceFlow id="F_Multa_NotifSusp" sourceRef="Task_F_CalcularMultaJuros" targetRef="Task_CS_NotificarSuspensao" />
    <bpmn:sequenceFlow id="F_NotifSusp_ReceberAviso" sourceRef="Task_CS_NotificarSuspensao" targetRef="Task_C_ReceberAvisoSuspensao" />
    <bpmn:sequenceFlow id="F_ReceberAviso_Gateway4" sourceRef="Task_C_ReceberAvisoSuspensao" targetRef="Gateway_ClientePagouAntesSuspensao" />

    <!-- Gateway Suspensao - Pagou SIM -->
    <bpmn:sequenceFlow id="F_Gateway4_Sim" name="SIM" sourceRef="Gateway_ClientePagouAntesSuspensao" targetRef="Task_F_RegistrarPagamento" />

    <!-- Gateway Suspensao - Pagou NAO (Suspensao Efetiva) -->
    <bpmn:sequenceFlow id="F_Gateway4_Nao" name="NAO" sourceRef="Gateway_ClientePagouAntesSuspensao" targetRef="Task_O_SuspenderServicos" />
    <bpmn:sequenceFlow id="F_Suspender_NotifSist" sourceRef="Task_O_SuspenderServicos" targetRef="Task_A_NotificarSuspensao" />
    <bpmn:sequenceFlow id="F_NotifSist_Juridico" sourceRef="Task_A_NotificarSuspensao" targetRef="Task_F_AcionarJuridico" />
    <bpmn:sequenceFlow id="F_Juridico_End" sourceRef="Task_F_AcionarJuridico" targetRef="End_ContaSuspensa" />
  </bpmn:process>

  <bpmndi:BPMNDiagram id="BPMNDiagram_71_V5">
    <bpmndi:BPMNPlane id="BPMNPlane_71_V5" bpmnElement="Collaboration_71_V5">
      <bpmndi:BPMNShape id="Participant_71_V5_di" bpmnElement="Participant_71_V5" isHorizontal="true">
        <dc:Bounds x="50" y="20" width="4800" height="1050" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Lane_Cliente_di" bpmnElement="Lane_Cliente" isHorizontal="true">
        <dc:Bounds x="80" y="20" width="4770" height="150" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Financeiro_di" bpmnElement="Lane_Financeiro" isHorizontal="true">
        <dc:Bounds x="80" y="170" width="4770" height="200" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_IA_di" bpmnElement="Lane_IA" isHorizontal="true">
        <dc:Bounds x="80" y="370" width="4770" height="200" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_CS_di" bpmnElement="Lane_CS" isHorizontal="true">
        <dc:Bounds x="80" y="570" width="4770" height="180" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Gestao_di" bpmnElement="Lane_Gestao" isHorizontal="true">
        <dc:Bounds x="80" y="750" width="4770" height="150" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Operacoes_di" bpmnElement="Lane_Operacoes" isHorizontal="true">
        <dc:Bounds x="80" y="900" width="4770" height="170" />
      </bpmndi:BPMNShape>

      <!-- Shapes - Ciclo Normal -->
      <bpmndi:BPMNShape id="Start_CicloFaturamento_di" bpmnElement="Start_CicloFaturamento">
        <dc:Bounds x="120" y="252" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_PreverReceita_di" bpmnElement="Task_I_PreverReceita">
        <dc:Bounds x="200" y="410" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_F_ValidarServicos_di" bpmnElement="Task_F_ValidarServicos">
        <dc:Bounds x="350" y="230" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_F_CalcularValores_di" bpmnElement="Task_F_CalcularValores">
        <dc:Bounds x="500" y="230" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_F_GerarFatura_di" bpmnElement="Task_F_GerarFatura">
        <dc:Bounds x="650" y="230" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_EnviarFatura_di" bpmnElement="Task_A_EnviarFatura">
        <dc:Bounds x="800" y="410" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_ReceberFatura_di" bpmnElement="Task_C_ReceberFatura">
        <dc:Bounds x="950" y="55" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_MonitorarPrazo_di" bpmnElement="Task_I_MonitorarPrazo">
        <dc:Bounds x="1100" y="410" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_PagoNoPrazo_di" bpmnElement="Gateway_PagoNoPrazo" isMarkerVisible="true">
        <dc:Bounds x="1250" y="425" width="50" height="50" />
      </bpmndi:BPMNShape>

      <!-- Fluxo SIM - Pagamento Recebido -->
      <bpmndi:BPMNShape id="Task_F_RegistrarPagamento_di" bpmnElement="Task_F_RegistrarPagamento">
        <dc:Bounds x="1330" y="230" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_NotificarRecebimento_di" bpmnElement="Task_A_NotificarRecebimento">
        <dc:Bounds x="1480" y="410" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_F_ConciliarPagamento_di" bpmnElement="Task_F_ConciliarPagamento">
        <dc:Bounds x="1630" y="230" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_AnalisarPadraoPagamento_di" bpmnElement="Task_I_AnalisarPadraoPagamento">
        <dc:Bounds x="1780" y="410" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_F_AtualizarRisco_di" bpmnElement="Task_F_AtualizarRisco">
        <dc:Bounds x="1930" y="230" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_AvaliarSaude_di" bpmnElement="Task_CS_AvaliarSaude">
        <dc:Bounds x="2080" y="610" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_PagamentoRecebido_di" bpmnElement="End_PagamentoRecebido">
        <dc:Bounds x="2122" y="252" width="36" height="36" />
      </bpmndi:BPMNShape>

      <!-- Fluxo NAO - Cobranca Nivel 1 (Amigavel) -->
      <bpmndi:BPMNShape id="Task_I_AlertarAtraso_di" bpmnElement="Task_I_AlertarAtraso">
        <dc:Bounds x="1330" y="500" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_AnalisarHistorico_di" bpmnElement="Task_CS_AnalisarHistorico">
        <dc:Bounds x="1480" y="610" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_ContatoAmigavel_di" bpmnElement="Task_CS_ContatoAmigavel">
        <dc:Bounds x="1630" y="610" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_RespondeContato_di" bpmnElement="Task_C_RespondeContato">
        <dc:Bounds x="1780" y="55" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_F_RegistrarJustificativa_di" bpmnElement="Task_F_RegistrarJustificativa">
        <dc:Bounds x="1930" y="310" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_ClientePagouAposAmigavel_di" bpmnElement="Gateway_ClientePagouAposAmigavel" isMarkerVisible="true">
        <dc:Bounds x="2080" y="425" width="50" height="50" />
      </bpmndi:BPMNShape>

      <!-- Cobranca Nivel 2 (Formal) -->
      <bpmndi:BPMNShape id="Task_F_GerarNotificacaoFormal_di" bpmnElement="Task_F_GerarNotificacaoFormal">
        <dc:Bounds x="2160" y="310" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_G_AprovarCobrancaFormal_di" bpmnElement="Task_G_AprovarCobrancaFormal">
        <dc:Bounds x="2310" y="785" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_EnviarNotificacaoFormal_di" bpmnElement="Task_A_EnviarNotificacaoFormal">
        <dc:Bounds x="2460" y="500" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_ReceberNotificacao_di" bpmnElement="Task_C_ReceberNotificacao">
        <dc:Bounds x="2610" y="55" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_AcompanharCobranca_di" bpmnElement="Task_CS_AcompanharCobranca">
        <dc:Bounds x="2760" y="610" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_ClientePagouAposFormal_di" bpmnElement="Gateway_ClientePagouAposFormal" isMarkerVisible="true">
        <dc:Bounds x="2910" y="425" width="50" height="50" />
      </bpmndi:BPMNShape>

      <!-- Cobranca Nivel 3 (Suspensao) -->
      <bpmndi:BPMNShape id="Task_G_AvaliarSuspensao_di" bpmnElement="Task_G_AvaliarSuspensao">
        <dc:Bounds x="2990" y="785" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_F_CalcularMultaJuros_di" bpmnElement="Task_F_CalcularMultaJuros">
        <dc:Bounds x="3140" y="310" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_NotificarSuspensao_di" bpmnElement="Task_CS_NotificarSuspensao">
        <dc:Bounds x="3290" y="610" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_ReceberAvisoSuspensao_di" bpmnElement="Task_C_ReceberAvisoSuspensao">
        <dc:Bounds x="3440" y="55" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_ClientePagouAntesSuspensao_di" bpmnElement="Gateway_ClientePagouAntesSuspensao" isMarkerVisible="true">
        <dc:Bounds x="3590" y="425" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_O_SuspenderServicos_di" bpmnElement="Task_O_SuspenderServicos">
        <dc:Bounds x="3670" y="940" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_NotificarSuspensao_di" bpmnElement="Task_A_NotificarSuspensao">
        <dc:Bounds x="3820" y="500" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_F_AcionarJuridico_di" bpmnElement="Task_F_AcionarJuridico">
        <dc:Bounds x="3970" y="310" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_ContaSuspensa_di" bpmnElement="End_ContaSuspensa">
        <dc:Bounds x="4012" y="252" width="36" height="36" />
      </bpmndi:BPMNShape>

      <!-- Edges - Ciclo Normal -->
      <bpmndi:BPMNEdge id="F_Start_Prever_di" bpmnElement="F_Start_Prever">
        <di:waypoint x="156" y="270" /><di:waypoint x="260" y="410" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Prever_Validar_di" bpmnElement="F_Prever_Validar">
        <di:waypoint x="260" y="410" /><di:waypoint x="410" y="310" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Validar_Calcular_di" bpmnElement="F_Validar_Calcular">
        <di:waypoint x="470" y="270" /><di:waypoint x="500" y="270" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Calcular_Gerar_di" bpmnElement="F_Calcular_Gerar">
        <di:waypoint x="620" y="270" /><di:waypoint x="650" y="270" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Gerar_Enviar_di" bpmnElement="F_Gerar_Enviar">
        <di:waypoint x="710" y="310" /><di:waypoint x="860" y="410" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Enviar_Receber_di" bpmnElement="F_Enviar_Receber">
        <di:waypoint x="860" y="410" /><di:waypoint x="1010" y="135" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Receber_Monitorar_di" bpmnElement="F_Receber_Monitorar">
        <di:waypoint x="1010" y="135" /><di:waypoint x="1160" y="410" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Monitorar_Gateway_di" bpmnElement="F_Monitorar_Gateway">
        <di:waypoint x="1220" y="450" /><di:waypoint x="1250" y="450" />
      </bpmndi:BPMNEdge>

      <!-- Gateway 1 - SIM -->
      <bpmndi:BPMNEdge id="F_Gateway_Sim_di" bpmnElement="F_Gateway_Sim">
        <di:waypoint x="1275" y="425" /><di:waypoint x="1390" y="310" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Registrar_Notificar_di" bpmnElement="F_Registrar_Notificar">
        <di:waypoint x="1390" y="310" /><di:waypoint x="1540" y="410" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Notificar_Conciliar_di" bpmnElement="F_Notificar_Conciliar">
        <di:waypoint x="1540" y="410" /><di:waypoint x="1690" y="310" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Conciliar_Analisar_di" bpmnElement="F_Conciliar_Analisar">
        <di:waypoint x="1690" y="310" /><di:waypoint x="1840" y="410" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Analisar_Risco_di" bpmnElement="F_Analisar_Risco">
        <di:waypoint x="1840" y="410" /><di:waypoint x="1990" y="310" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Risco_Saude_di" bpmnElement="F_Risco_Saude">
        <di:waypoint x="1990" y="310" /><di:waypoint x="2140" y="610" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Saude_End_di" bpmnElement="F_Saude_End">
        <di:waypoint x="2140" y="610" /><di:waypoint x="2140" y="288" />
      </bpmndi:BPMNEdge>

      <!-- Gateway 1 - NAO (Cobranca Amigavel) -->
      <bpmndi:BPMNEdge id="F_Gateway_Nao_di" bpmnElement="F_Gateway_Nao">
        <di:waypoint x="1275" y="475" /><di:waypoint x="1390" y="500" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Alertar_AnalisarHist_di" bpmnElement="F_Alertar_AnalisarHist">
        <di:waypoint x="1390" y="580" /><di:waypoint x="1540" y="610" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_AnalisarHist_Contato_di" bpmnElement="F_AnalisarHist_Contato">
        <di:waypoint x="1600" y="650" /><di:waypoint x="1630" y="650" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Contato_Responde_di" bpmnElement="F_Contato_Responde">
        <di:waypoint x="1690" y="610" /><di:waypoint x="1840" y="135" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Responde_Justificar_di" bpmnElement="F_Responde_Justificar">
        <di:waypoint x="1840" y="135" /><di:waypoint x="1990" y="310" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Justificar_Gateway2_di" bpmnElement="F_Justificar_Gateway2">
        <di:waypoint x="1990" y="390" /><di:waypoint x="2105" y="425" />
      </bpmndi:BPMNEdge>

      <!-- Gateway 2 - SIM (volta para Registrar Pagamento) -->
      <bpmndi:BPMNEdge id="F_Gateway2_Sim_di" bpmnElement="F_Gateway2_Sim">
        <di:waypoint x="2105" y="425" /><di:waypoint x="1390" y="310" />
      </bpmndi:BPMNEdge>

      <!-- Gateway 2 - NAO (Cobranca Formal) -->
      <bpmndi:BPMNEdge id="F_Gateway2_Nao_di" bpmnElement="F_Gateway2_Nao">
        <di:waypoint x="2130" y="450" /><di:waypoint x="2220" y="350" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_GerarFormal_Aprovar_di" bpmnElement="F_GerarFormal_Aprovar">
        <di:waypoint x="2220" y="390" /><di:waypoint x="2370" y="785" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Aprovar_EnviarFormal_di" bpmnElement="F_Aprovar_EnviarFormal">
        <di:waypoint x="2370" y="785" /><di:waypoint x="2520" y="580" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_EnviarFormal_ReceberNot_di" bpmnElement="F_EnviarFormal_ReceberNot">
        <di:waypoint x="2520" y="500" /><di:waypoint x="2670" y="135" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_ReceberNot_Acompanhar_di" bpmnElement="F_ReceberNot_Acompanhar">
        <di:waypoint x="2670" y="135" /><di:waypoint x="2820" y="610" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Acompanhar_Gateway3_di" bpmnElement="F_Acompanhar_Gateway3">
        <di:waypoint x="2820" y="610" /><di:waypoint x="2935" y="475" />
      </bpmndi:BPMNEdge>

      <!-- Gateway 3 - SIM (volta para Registrar Pagamento) -->
      <bpmndi:BPMNEdge id="F_Gateway3_Sim_di" bpmnElement="F_Gateway3_Sim">
        <di:waypoint x="2935" y="425" /><di:waypoint x="1390" y="310" />
      </bpmndi:BPMNEdge>

      <!-- Gateway 3 - NAO (Suspensao) -->
      <bpmndi:BPMNEdge id="F_Gateway3_Nao_di" bpmnElement="F_Gateway3_Nao">
        <di:waypoint x="2935" y="475" /><di:waypoint x="3050" y="785" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Avaliar_Multa_di" bpmnElement="F_Avaliar_Multa">
        <di:waypoint x="3050" y="785" /><di:waypoint x="3200" y="390" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Multa_NotifSusp_di" bpmnElement="F_Multa_NotifSusp">
        <di:waypoint x="3200" y="390" /><di:waypoint x="3350" y="610" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_NotifSusp_ReceberAviso_di" bpmnElement="F_NotifSusp_ReceberAviso">
        <di:waypoint x="3350" y="610" /><di:waypoint x="3500" y="135" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_ReceberAviso_Gateway4_di" bpmnElement="F_ReceberAviso_Gateway4">
        <di:waypoint x="3500" y="135" /><di:waypoint x="3615" y="425" />
      </bpmndi:BPMNEdge>

      <!-- Gateway 4 - SIM (volta para Registrar Pagamento) -->
      <bpmndi:BPMNEdge id="F_Gateway4_Sim_di" bpmnElement="F_Gateway4_Sim">
        <di:waypoint x="3615" y="425" /><di:waypoint x="1390" y="310" />
      </bpmndi:BPMNEdge>

      <!-- Gateway 4 - NAO (Suspensao Efetiva) -->
      <bpmndi:BPMNEdge id="F_Gateway4_Nao_di" bpmnElement="F_Gateway4_Nao">
        <di:waypoint x="3615" y="475" /><di:waypoint x="3730" y="940" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Suspender_NotifSist_di" bpmnElement="F_Suspender_NotifSist">
        <di:waypoint x="3730" y="940" /><di:waypoint x="3880" y="580" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_NotifSist_Juridico_di" bpmnElement="F_NotifSist_Juridico">
        <di:waypoint x="3880" y="500" /><di:waypoint x="4030" y="390" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Juridico_End_di" bpmnElement="F_Juridico_End">
        <di:waypoint x="4030" y="310" /><di:waypoint x="4030" y="288" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

const phases = [
  { name: 'Faturamento', x: 80, width: 1050 },
  { name: 'Monitoramento & Pagamento', x: 1130, width: 1050 },
  { name: 'Cobranca Amigavel (D+3)', x: 2180, width: 800 },
  { name: 'Cobranca Formal (D+10)', x: 2980, width: 850 },
  { name: 'Suspensao (D+30)', x: 3830, width: 970 }
];

const config = {
  zoom: 0.7,
  storageKey: 'subprocesso-7.1',
  startLabel: 'CICLO DE FATURAMENTO',
  endLabels: {
    End_PagamentoRecebido: { text: 'PAGAMENTO RECEBIDO', className: 'end-label-success', marker: 'end-success' },
    End_ContaSuspensa: { text: 'CONTA SUSPENSA', className: 'end-label-lost', marker: 'end-lost' }
  },
  showDefaultEndLabel: false,
  useEndName: false,
  defaultEndLabelText: 'FIM',
  defaultEndClass: 'end-label-neutral'
};

window.v5Data = window.v5Data || {};
window.v5Data['7.1'] = { diagramXML, nodeDetails, phases, ...config };
