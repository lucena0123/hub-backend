const nodeDetails = {
  // FASE 1: Detecção & Tentativa de Retenção
  'Task_C_SolicitarCancelamento': { sla: null, tag: 'Gatilho', desc: 'Cliente solicita cancelamento.' },
  'Task_I_DetectarRiscoChurn': { sla: '24h', tag: 'IA Proativo', desc: 'Detecta risco de churn proativamente.' },
  'Task_CS_RegistrarMotivo': { sla: '4h', tag: 'Registro', desc: 'Registra motivo do cancelamento.' },
  'Task_I_AnalisarHistorico': { sla: null, tag: 'IA Analise', desc: 'Analisa historico e sentimento do cliente.' },
  'Task_CS_QualificarMotivo': { sla: null, tag: 'Qualificar', desc: 'Qualifica motivo (Preco, Resultado, Atendimento).' },
  'Task_CS_ProporContraOferta': { sla: '48h', tag: 'Retencao', desc: 'Propoe contra-oferta se aplicavel.' },
  'Gateway_AceitaRetencao': { sla: null, tag: 'Gateway', desc: 'Cliente aceita retencao?' },
  'Task_CS_RegistrarRetencao': { sla: null, tag: 'Sucesso', desc: 'Registra retencao bem-sucedida.' },

  // FASE 2: Aprovação & Planejamento
  'Task_F_ValidarPendencias': { sla: '24h', tag: 'Validacao', desc: 'Valida pendencias financeiras.' },
  'Gateway_HaInadimplencia': { sla: null, tag: 'Gateway', desc: 'Ha inadimplencia?' },
  'Task_F_ProcessoCobranca': { sla: null, tag: 'Cobranca', desc: 'Aciona processo de cobranca especial.' },
  'Task_Co_ValidarObrigacoes': { sla: '48h', tag: 'LGPD', desc: 'Valida obrigacoes contratuais e LGPD.' },
  'Task_O_MapearCampanhas': { sla: null, tag: 'Mapeamento', desc: 'Mapeia todas as campanhas ativas.' },
  'Task_I_GerarPlanoDesativacao': { sla: null, tag: 'Plano IA', desc: 'Gera plano de desativacao automatizado.' },
  'Task_CS_AgendarReuniao': { sla: '24h', tag: 'Agenda', desc: 'Agenda reuniao de encerramento.' },
  'Task_C_ValidarPlano': { sla: null, tag: 'Validacao', desc: 'Cliente valida plano de desativacao.' },

  // FASE 3: Desativação Controlada
  'Task_O_PausarTestesAB': { sla: '2h', tag: 'Pausar 5.3', desc: 'Pausa todos os testes A/B ativos.' },
  'Task_O_PausarOtimizacoes': { sla: '2h', tag: 'Pausar 5.2', desc: 'Pausa otimizacoes de lances.' },
  'Task_O_ReduzirBudget': { sla: '5d', tag: 'Reducao', desc: 'Reduz budget gradualmente (20%/dia).' },
  'Task_I_MonitorarImpacto': { sla: null, tag: 'IA Monitor', desc: 'Monitora impacto da reducao.' },
  'Task_O_DesativarCampanhas': { sla: '24h', tag: 'Desativar 4.2', desc: 'Desativa campanhas nas plataformas.' },
  'Task_O_DesativarLandingPages': { sla: '24h', tag: 'Desativar 4.3', desc: 'Desativa landing pages.' },
  'Task_O_RegistrarMetricas': { sla: null, tag: 'Metricas', desc: 'Registra metricas finais de performance.' },

  // FASE 4: Backup & Handoff de Dados
  'Task_BI_ExportarRelatorios': { sla: '12h', tag: 'Exportacao', desc: 'Exporta todos os relatorios historicos.' },
  'Task_BI_GerarBackup': { sla: '24h', tag: 'Backup', desc: 'Gera backup completo de dados.' },
  'Task_Co_ValidarLGPD': { sla: null, tag: 'LGPD', desc: 'Valida direito ao esquecimento (LGPD).' },
  'Gateway_ClienteQuerDados': { sla: null, tag: 'Gateway', desc: 'Cliente quer receber dados?' },
  'Task_BI_GerarPacoteDados': { sla: '24h', tag: 'Pacote', desc: 'Gera pacote de dados exportado.' },
  'Task_A_EnviarDados': { sla: null, tag: 'Auto', desc: 'Envia pacote de dados ao cliente.' },
  'Task_O_RemoverAcessos': { sla: '2h', tag: 'Acesso', desc: 'Remove todos os acessos do cliente.' },
  'Task_O_DesconectarIntegracoes': { sla: '4h', tag: 'Integracao', desc: 'Desconecta todas as integracoes.' },
  'Task_I_RemoverDadosSensiveis': { sla: '24h', tag: 'LGPD Auto', desc: 'Remove dados sensiveis conforme LGPD.' },

  // FASE 5: Encerramento & Aprendizado
  'Task_F_EmitirNotaEncerramento': { sla: '24h', tag: 'Nota', desc: 'Emite nota fiscal de encerramento.' },
  'Task_F_ProcessarReembolso': { sla: '5d', tag: 'Reembolso', desc: 'Processa reembolso se aplicavel.' },
  'Task_CS_ConduzirExitInterview': { sla: '48h', tag: 'Exit', desc: 'Conduz reuniao de exit interview.' },
  'Task_C_ResponderPesquisa': { sla: null, tag: 'Pesquisa', desc: 'Responde pesquisa de saida.' },
  'Task_I_AnalisarMotivosChurn': { sla: null, tag: 'IA Analise', desc: 'Analisa motivos de churn para aprendizado.' },
  'Task_CS_ConsolidarAprendizados': { sla: null, tag: 'Aprendizado', desc: 'Consolida aprendizados do offboarding.' },
  'Task_CS_AtualizarPlaybook': { sla: null, tag: 'Playbook', desc: 'Atualiza playbook de retencao.' },
  'Task_CS_RegistrarWinBack': { sla: null, tag: 'Win-Back', desc: 'Registra cliente em lista de win-back.' },
  'Task_F_ArquivarDocumentacao': { sla: null, tag: 'Arquivo', desc: 'Arquiva toda a documentacao.' },
  'Task_A_NotificarSistema': { sla: null, tag: 'Auto', desc: 'Notifica sistema de atualizacao de status.' }
};

const diagramXML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_64_V5" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_64_V5">
    <bpmn:participant id="Participant_64_V5" name="Offboarding e Encerramento" processRef="Process_64_V5" />
  </bpmn:collaboration>
  <bpmn:process id="Process_64_V5" isExecutable="false">
    <bpmn:laneSet id="LaneSet_64_V5">
      <bpmn:lane id="Lane_Cliente" name="Cliente">
        <bpmn:flowNodeRef>Start_SolicitacaoCancelamento</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_C_SolicitarCancelamento</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_C_ValidarPlano</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_C_ResponderPesquisa</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_CS" name="CS / Retention">
        <bpmn:flowNodeRef>Task_CS_RegistrarMotivo</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_QualificarMotivo</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_ProporContraOferta</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_AceitaRetencao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_RegistrarRetencao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_AgendarReuniao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_ConduzirExitInterview</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_ConsolidarAprendizados</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_AtualizarPlaybook</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CS_RegistrarWinBack</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_RetencaoSucesso</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_OffboardingConcluido</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Operacoes" name="Operacoes / Trafego">
        <bpmn:flowNodeRef>Task_O_MapearCampanhas</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_O_PausarTestesAB</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_O_PausarOtimizacoes</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_O_ReduzirBudget</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_O_DesativarCampanhas</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_O_DesativarLandingPages</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_O_RegistrarMetricas</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_O_RemoverAcessos</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_O_DesconectarIntegracoes</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Financeiro" name="Financeiro / Cobranca">
        <bpmn:flowNodeRef>Task_F_ValidarPendencias</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_HaInadimplencia</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_F_ProcessoCobranca</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_F_EmitirNotaEncerramento</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_F_ProcessarReembolso</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_F_ArquivarDocumentacao</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Compliance" name="Compliance / Legal">
        <bpmn:flowNodeRef>Task_Co_ValidarObrigacoes</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_Co_ValidarLGPD</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_IA" name="IA &amp; Automacao">
        <bpmn:flowNodeRef>Task_I_DetectarRiscoChurn</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_AnalisarHistorico</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_GerarPlanoDesativacao</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_MonitorarImpacto</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_BI_ExportarRelatorios</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_BI_GerarBackup</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_ClienteQuerDados</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_BI_GerarPacoteDados</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_EnviarDados</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_RemoverDadosSensiveis</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_I_AnalisarMotivosChurn</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A_NotificarSistema</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>

    <bpmn:startEvent id="Start_SolicitacaoCancelamento" name="Solicitacao de Cancelamento" />

    <!-- FASE 1: Detecção & Tentativa de Retenção -->
    <bpmn:task id="Task_C_SolicitarCancelamento" name="Solicitar Cancelamento" />
    <bpmn:task id="Task_I_DetectarRiscoChurn" name="Detectar Risco de Churn (Proativo)" />
    <bpmn:task id="Task_CS_RegistrarMotivo" name="Registrar Motivo do Cancelamento" />
    <bpmn:task id="Task_I_AnalisarHistorico" name="Analisar Historico e Sentimento" />
    <bpmn:task id="Task_CS_QualificarMotivo" name="Qualificar Motivo" />
    <bpmn:task id="Task_CS_ProporContraOferta" name="Propor Contra-Oferta" />
    <bpmn:exclusiveGateway id="Gateway_AceitaRetencao" name="Cliente Aceita Retencao?" />
    <bpmn:task id="Task_CS_RegistrarRetencao" name="Registrar Retencao" />
    <bpmn:endEvent id="End_RetencaoSucesso" name="Retencao Bem-Sucedida" />

    <!-- FASE 2: Aprovação & Planejamento -->
    <bpmn:task id="Task_F_ValidarPendencias" name="Validar Pendencias Financeiras" />
    <bpmn:exclusiveGateway id="Gateway_HaInadimplencia" name="Ha Inadimplencia?" />
    <bpmn:task id="Task_F_ProcessoCobranca" name="Acionar Cobranca Especial" />
    <bpmn:task id="Task_Co_ValidarObrigacoes" name="Validar Obrigacoes LGPD" />
    <bpmn:task id="Task_O_MapearCampanhas" name="Mapear Campanhas Ativas" />
    <bpmn:task id="Task_I_GerarPlanoDesativacao" name="Gerar Plano de Desativacao" />
    <bpmn:task id="Task_CS_AgendarReuniao" name="Agendar Reuniao de Encerramento" />
    <bpmn:task id="Task_C_ValidarPlano" name="Validar Plano de Desativacao" />

    <!-- FASE 3: Desativação Controlada -->
    <bpmn:task id="Task_O_PausarTestesAB" name="Pausar Testes A/B (5.3)" />
    <bpmn:task id="Task_O_PausarOtimizacoes" name="Pausar Otimizacoes (5.2)" />
    <bpmn:task id="Task_O_ReduzirBudget" name="Reduzir Budget Gradualmente" />
    <bpmn:task id="Task_I_MonitorarImpacto" name="Monitorar Impacto da Reducao" />
    <bpmn:task id="Task_O_DesativarCampanhas" name="Desativar Campanhas (4.2)" />
    <bpmn:task id="Task_O_DesativarLandingPages" name="Desativar Landing Pages (4.3)" />
    <bpmn:task id="Task_O_RegistrarMetricas" name="Registrar Metricas Finais" />

    <!-- FASE 4: Backup & Handoff de Dados -->
    <bpmn:task id="Task_BI_ExportarRelatorios" name="Exportar Relatorios Historicos" />
    <bpmn:task id="Task_BI_GerarBackup" name="Gerar Backup Completo" />
    <bpmn:task id="Task_Co_ValidarLGPD" name="Validar Direito ao Esquecimento" />
    <bpmn:exclusiveGateway id="Gateway_ClienteQuerDados" name="Cliente Quer Dados?" />
    <bpmn:task id="Task_BI_GerarPacoteDados" name="Gerar Pacote de Dados" />
    <bpmn:task id="Task_A_EnviarDados" name="Enviar Dados ao Cliente" />
    <bpmn:task id="Task_O_RemoverAcessos" name="Remover Acessos" />
    <bpmn:task id="Task_O_DesconectarIntegracoes" name="Desconectar Integracoes" />
    <bpmn:task id="Task_I_RemoverDadosSensiveis" name="Remover Dados Sensiveis (LGPD)" />

    <!-- FASE 5: Encerramento & Aprendizado -->
    <bpmn:task id="Task_F_EmitirNotaEncerramento" name="Emitir Nota de Encerramento" />
    <bpmn:task id="Task_F_ProcessarReembolso" name="Processar Reembolso" />
    <bpmn:task id="Task_CS_ConduzirExitInterview" name="Conduzir Exit Interview" />
    <bpmn:task id="Task_C_ResponderPesquisa" name="Responder Pesquisa de Saida" />
    <bpmn:task id="Task_I_AnalisarMotivosChurn" name="Analisar Motivos de Churn" />
    <bpmn:task id="Task_CS_ConsolidarAprendizados" name="Consolidar Aprendizados" />
    <bpmn:task id="Task_CS_AtualizarPlaybook" name="Atualizar Playbook de Retencao" />
    <bpmn:task id="Task_CS_RegistrarWinBack" name="Registrar em Win-Back List" />
    <bpmn:task id="Task_F_ArquivarDocumentacao" name="Arquivar Documentacao" />
    <bpmn:task id="Task_A_NotificarSistema" name="Notificar Sistema" />
    <bpmn:endEvent id="End_OffboardingConcluido" name="Offboarding Concluido" />

    <!-- Sequence Flows -->
    <!-- FASE 1 -->
    <bpmn:sequenceFlow id="F_Start_Solicitar" sourceRef="Start_SolicitacaoCancelamento" targetRef="Task_C_SolicitarCancelamento" />
    <bpmn:sequenceFlow id="F_Solicitar_Registrar" sourceRef="Task_C_SolicitarCancelamento" targetRef="Task_CS_RegistrarMotivo" />
    <bpmn:sequenceFlow id="F_Registrar_Detectar" sourceRef="Task_CS_RegistrarMotivo" targetRef="Task_I_DetectarRiscoChurn" />
    <bpmn:sequenceFlow id="F_Detectar_Analisar" sourceRef="Task_I_DetectarRiscoChurn" targetRef="Task_I_AnalisarHistorico" />
    <bpmn:sequenceFlow id="F_Analisar_Qualificar" sourceRef="Task_I_AnalisarHistorico" targetRef="Task_CS_QualificarMotivo" />
    <bpmn:sequenceFlow id="F_Qualificar_Propor" sourceRef="Task_CS_QualificarMotivo" targetRef="Task_CS_ProporContraOferta" />
    <bpmn:sequenceFlow id="F_Propor_Gateway" sourceRef="Task_CS_ProporContraOferta" targetRef="Gateway_AceitaRetencao" />
    <bpmn:sequenceFlow id="F_Gateway_Sim" name="SIM" sourceRef="Gateway_AceitaRetencao" targetRef="Task_CS_RegistrarRetencao" />
    <bpmn:sequenceFlow id="F_Retencao_EndSucesso" sourceRef="Task_CS_RegistrarRetencao" targetRef="End_RetencaoSucesso" />
    <bpmn:sequenceFlow id="F_Gateway_Nao" name="NAO" sourceRef="Gateway_AceitaRetencao" targetRef="Task_F_ValidarPendencias" />

    <!-- FASE 2 -->
    <bpmn:sequenceFlow id="F_Validar_Gateway2" sourceRef="Task_F_ValidarPendencias" targetRef="Gateway_HaInadimplencia" />
    <bpmn:sequenceFlow id="F_Gateway2_Sim" name="SIM" sourceRef="Gateway_HaInadimplencia" targetRef="Task_F_ProcessoCobranca" />
    <bpmn:sequenceFlow id="F_Cobranca_Compliance" sourceRef="Task_F_ProcessoCobranca" targetRef="Task_Co_ValidarObrigacoes" />
    <bpmn:sequenceFlow id="F_Gateway2_Nao" name="NAO" sourceRef="Gateway_HaInadimplencia" targetRef="Task_Co_ValidarObrigacoes" />
    <bpmn:sequenceFlow id="F_Compliance_Mapear" sourceRef="Task_Co_ValidarObrigacoes" targetRef="Task_O_MapearCampanhas" />
    <bpmn:sequenceFlow id="F_Mapear_GerarPlano" sourceRef="Task_O_MapearCampanhas" targetRef="Task_I_GerarPlanoDesativacao" />
    <bpmn:sequenceFlow id="F_GerarPlano_Agendar" sourceRef="Task_I_GerarPlanoDesativacao" targetRef="Task_CS_AgendarReuniao" />
    <bpmn:sequenceFlow id="F_Agendar_Validar" sourceRef="Task_CS_AgendarReuniao" targetRef="Task_C_ValidarPlano" />

    <!-- FASE 3 -->
    <bpmn:sequenceFlow id="F_Validar_PausarTestes" sourceRef="Task_C_ValidarPlano" targetRef="Task_O_PausarTestesAB" />
    <bpmn:sequenceFlow id="F_PausarTestes_PausarOtim" sourceRef="Task_O_PausarTestesAB" targetRef="Task_O_PausarOtimizacoes" />
    <bpmn:sequenceFlow id="F_PausarOtim_Reduzir" sourceRef="Task_O_PausarOtimizacoes" targetRef="Task_O_ReduzirBudget" />
    <bpmn:sequenceFlow id="F_Reduzir_Monitorar" sourceRef="Task_O_ReduzirBudget" targetRef="Task_I_MonitorarImpacto" />
    <bpmn:sequenceFlow id="F_Monitorar_DesativarCamp" sourceRef="Task_I_MonitorarImpacto" targetRef="Task_O_DesativarCampanhas" />
    <bpmn:sequenceFlow id="F_DesativarCamp_DesativarLP" sourceRef="Task_O_DesativarCampanhas" targetRef="Task_O_DesativarLandingPages" />
    <bpmn:sequenceFlow id="F_DesativarLP_Metricas" sourceRef="Task_O_DesativarLandingPages" targetRef="Task_O_RegistrarMetricas" />

    <!-- FASE 4 -->
    <bpmn:sequenceFlow id="F_Metricas_Exportar" sourceRef="Task_O_RegistrarMetricas" targetRef="Task_BI_ExportarRelatorios" />
    <bpmn:sequenceFlow id="F_Exportar_Backup" sourceRef="Task_BI_ExportarRelatorios" targetRef="Task_BI_GerarBackup" />
    <bpmn:sequenceFlow id="F_Backup_ValidarLGPD" sourceRef="Task_BI_GerarBackup" targetRef="Task_Co_ValidarLGPD" />
    <bpmn:sequenceFlow id="F_ValidarLGPD_Gateway3" sourceRef="Task_Co_ValidarLGPD" targetRef="Gateway_ClienteQuerDados" />
    <bpmn:sequenceFlow id="F_Gateway3_Sim" name="SIM" sourceRef="Gateway_ClienteQuerDados" targetRef="Task_BI_GerarPacoteDados" />
    <bpmn:sequenceFlow id="F_GerarPacote_Enviar" sourceRef="Task_BI_GerarPacoteDados" targetRef="Task_A_EnviarDados" />
    <bpmn:sequenceFlow id="F_Enviar_RemoverAcessos" sourceRef="Task_A_EnviarDados" targetRef="Task_O_RemoverAcessos" />
    <bpmn:sequenceFlow id="F_Gateway3_Nao" name="NAO" sourceRef="Gateway_ClienteQuerDados" targetRef="Task_O_RemoverAcessos" />
    <bpmn:sequenceFlow id="F_RemoverAcessos_Desconectar" sourceRef="Task_O_RemoverAcessos" targetRef="Task_O_DesconectarIntegracoes" />
    <bpmn:sequenceFlow id="F_Desconectar_RemoverSensiveis" sourceRef="Task_O_DesconectarIntegracoes" targetRef="Task_I_RemoverDadosSensiveis" />

    <!-- FASE 5 -->
    <bpmn:sequenceFlow id="F_RemoverSensiveis_EmitirNota" sourceRef="Task_I_RemoverDadosSensiveis" targetRef="Task_F_EmitirNotaEncerramento" />
    <bpmn:sequenceFlow id="F_EmitirNota_Reembolso" sourceRef="Task_F_EmitirNotaEncerramento" targetRef="Task_F_ProcessarReembolso" />
    <bpmn:sequenceFlow id="F_Reembolso_Exit" sourceRef="Task_F_ProcessarReembolso" targetRef="Task_CS_ConduzirExitInterview" />
    <bpmn:sequenceFlow id="F_Exit_ResponderPesquisa" sourceRef="Task_CS_ConduzirExitInterview" targetRef="Task_C_ResponderPesquisa" />
    <bpmn:sequenceFlow id="F_ResponderPesquisa_AnalisarChurn" sourceRef="Task_C_ResponderPesquisa" targetRef="Task_I_AnalisarMotivosChurn" />
    <bpmn:sequenceFlow id="F_AnalisarChurn_Consolidar" sourceRef="Task_I_AnalisarMotivosChurn" targetRef="Task_CS_ConsolidarAprendizados" />
    <bpmn:sequenceFlow id="F_Consolidar_Playbook" sourceRef="Task_CS_ConsolidarAprendizados" targetRef="Task_CS_AtualizarPlaybook" />
    <bpmn:sequenceFlow id="F_Playbook_WinBack" sourceRef="Task_CS_AtualizarPlaybook" targetRef="Task_CS_RegistrarWinBack" />
    <bpmn:sequenceFlow id="F_WinBack_Arquivar" sourceRef="Task_CS_RegistrarWinBack" targetRef="Task_F_ArquivarDocumentacao" />
    <bpmn:sequenceFlow id="F_Arquivar_Notificar" sourceRef="Task_F_ArquivarDocumentacao" targetRef="Task_A_NotificarSistema" />
    <bpmn:sequenceFlow id="F_Notificar_End" sourceRef="Task_A_NotificarSistema" targetRef="End_OffboardingConcluido" />
  </bpmn:process>

  <bpmndi:BPMNDiagram id="BPMNDiagram_64_V5">
    <bpmndi:BPMNPlane id="BPMNPlane_64_V5" bpmnElement="Collaboration_64_V5">
      <bpmndi:BPMNShape id="Participant_64_V5_di" bpmnElement="Participant_64_V5" isHorizontal="true">
        <dc:Bounds x="50" y="20" width="7500" height="1050" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Lane_Cliente_di" bpmnElement="Lane_Cliente" isHorizontal="true">
        <dc:Bounds x="80" y="20" width="7470" height="150" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_CS_di" bpmnElement="Lane_CS" isHorizontal="true">
        <dc:Bounds x="80" y="170" width="7470" height="180" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Operacoes_di" bpmnElement="Lane_Operacoes" isHorizontal="true">
        <dc:Bounds x="80" y="350" width="7470" height="180" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Financeiro_di" bpmnElement="Lane_Financeiro" isHorizontal="true">
        <dc:Bounds x="80" y="530" width="7470" height="180" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Compliance_di" bpmnElement="Lane_Compliance" isHorizontal="true">
        <dc:Bounds x="80" y="710" width="7470" height="150" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_IA_di" bpmnElement="Lane_IA" isHorizontal="true">
        <dc:Bounds x="80" y="860" width="7470" height="210" />
      </bpmndi:BPMNShape>

      <!-- Shapes FASE 1 -->
      <bpmndi:BPMNShape id="Start_SolicitacaoCancelamento_di" bpmnElement="Start_SolicitacaoCancelamento">
        <dc:Bounds x="120" y="77" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_SolicitarCancelamento_di" bpmnElement="Task_C_SolicitarCancelamento">
        <dc:Bounds x="200" y="55" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_RegistrarMotivo_di" bpmnElement="Task_CS_RegistrarMotivo">
        <dc:Bounds x="350" y="210" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_DetectarRiscoChurn_di" bpmnElement="Task_I_DetectarRiscoChurn">
        <dc:Bounds x="500" y="900" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_AnalisarHistorico_di" bpmnElement="Task_I_AnalisarHistorico">
        <dc:Bounds x="650" y="900" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_QualificarMotivo_di" bpmnElement="Task_CS_QualificarMotivo">
        <dc:Bounds x="800" y="210" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_ProporContraOferta_di" bpmnElement="Task_CS_ProporContraOferta">
        <dc:Bounds x="950" y="210" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_AceitaRetencao_di" bpmnElement="Gateway_AceitaRetencao" isMarkerVisible="true">
        <dc:Bounds x="1100" y="225" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_RegistrarRetencao_di" bpmnElement="Task_CS_RegistrarRetencao">
        <dc:Bounds x="1065" y="55" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_RetencaoSucesso_di" bpmnElement="End_RetencaoSucesso">
        <dc:Bounds x="1107" y="20" width="36" height="36" />
      </bpmndi:BPMNShape>

      <!-- Shapes FASE 2 -->
      <bpmndi:BPMNShape id="Task_F_ValidarPendencias_di" bpmnElement="Task_F_ValidarPendencias">
        <dc:Bounds x="1200" y="570" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_HaInadimplencia_di" bpmnElement="Gateway_HaInadimplencia" isMarkerVisible="true">
        <dc:Bounds x="1350" y="585" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_F_ProcessoCobranca_di" bpmnElement="Task_F_ProcessoCobranca">
        <dc:Bounds x="1315" y="670" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Co_ValidarObrigacoes_di" bpmnElement="Task_Co_ValidarObrigacoes">
        <dc:Bounds x="1465" y="745" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_O_MapearCampanhas_di" bpmnElement="Task_O_MapearCampanhas">
        <dc:Bounds x="1615" y="390" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_GerarPlanoDesativacao_di" bpmnElement="Task_I_GerarPlanoDesativacao">
        <dc:Bounds x="1765" y="900" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_AgendarReuniao_di" bpmnElement="Task_CS_AgendarReuniao">
        <dc:Bounds x="1915" y="210" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_ValidarPlano_di" bpmnElement="Task_C_ValidarPlano">
        <dc:Bounds x="2065" y="55" width="120" height="80" />
      </bpmndi:BPMNShape>

      <!-- Shapes FASE 3 -->
      <bpmndi:BPMNShape id="Task_O_PausarTestesAB_di" bpmnElement="Task_O_PausarTestesAB">
        <dc:Bounds x="2215" y="390" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_O_PausarOtimizacoes_di" bpmnElement="Task_O_PausarOtimizacoes">
        <dc:Bounds x="2365" y="390" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_O_ReduzirBudget_di" bpmnElement="Task_O_ReduzirBudget">
        <dc:Bounds x="2515" y="390" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_MonitorarImpacto_di" bpmnElement="Task_I_MonitorarImpacto">
        <dc:Bounds x="2665" y="900" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_O_DesativarCampanhas_di" bpmnElement="Task_O_DesativarCampanhas">
        <dc:Bounds x="2815" y="390" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_O_DesativarLandingPages_di" bpmnElement="Task_O_DesativarLandingPages">
        <dc:Bounds x="2965" y="390" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_O_RegistrarMetricas_di" bpmnElement="Task_O_RegistrarMetricas">
        <dc:Bounds x="3115" y="390" width="120" height="80" />
      </bpmndi:BPMNShape>

      <!-- Shapes FASE 4 -->
      <bpmndi:BPMNShape id="Task_BI_ExportarRelatorios_di" bpmnElement="Task_BI_ExportarRelatorios">
        <dc:Bounds x="3265" y="900" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_BI_GerarBackup_di" bpmnElement="Task_BI_GerarBackup">
        <dc:Bounds x="3415" y="900" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Co_ValidarLGPD_di" bpmnElement="Task_Co_ValidarLGPD">
        <dc:Bounds x="3565" y="745" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_ClienteQuerDados_di" bpmnElement="Gateway_ClienteQuerDados" isMarkerVisible="true">
        <dc:Bounds x="3715" y="915" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_BI_GerarPacoteDados_di" bpmnElement="Task_BI_GerarPacoteDados">
        <dc:Bounds x="3680" y="1000" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_EnviarDados_di" bpmnElement="Task_A_EnviarDados">
        <dc:Bounds x="3830" y="1000" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_O_RemoverAcessos_di" bpmnElement="Task_O_RemoverAcessos">
        <dc:Bounds x="3980" y="390" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_O_DesconectarIntegracoes_di" bpmnElement="Task_O_DesconectarIntegracoes">
        <dc:Bounds x="4130" y="390" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_RemoverDadosSensiveis_di" bpmnElement="Task_I_RemoverDadosSensiveis">
        <dc:Bounds x="4280" y="900" width="120" height="80" />
      </bpmndi:BPMNShape>

      <!-- Shapes FASE 5 -->
      <bpmndi:BPMNShape id="Task_F_EmitirNotaEncerramento_di" bpmnElement="Task_F_EmitirNotaEncerramento">
        <dc:Bounds x="4430" y="570" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_F_ProcessarReembolso_di" bpmnElement="Task_F_ProcessarReembolso">
        <dc:Bounds x="4580" y="570" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_ConduzirExitInterview_di" bpmnElement="Task_CS_ConduzirExitInterview">
        <dc:Bounds x="4730" y="210" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_ResponderPesquisa_di" bpmnElement="Task_C_ResponderPesquisa">
        <dc:Bounds x="4880" y="55" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_I_AnalisarMotivosChurn_di" bpmnElement="Task_I_AnalisarMotivosChurn">
        <dc:Bounds x="5030" y="900" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_ConsolidarAprendizados_di" bpmnElement="Task_CS_ConsolidarAprendizados">
        <dc:Bounds x="5180" y="210" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_AtualizarPlaybook_di" bpmnElement="Task_CS_AtualizarPlaybook">
        <dc:Bounds x="5330" y="210" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_RegistrarWinBack_di" bpmnElement="Task_CS_RegistrarWinBack">
        <dc:Bounds x="5480" y="210" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_F_ArquivarDocumentacao_di" bpmnElement="Task_F_ArquivarDocumentacao">
        <dc:Bounds x="5630" y="570" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_NotificarSistema_di" bpmnElement="Task_A_NotificarSistema">
        <dc:Bounds x="5780" y="900" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_OffboardingConcluido_di" bpmnElement="End_OffboardingConcluido">
        <dc:Bounds x="5822" y="232" width="36" height="36" />
      </bpmndi:BPMNShape>

      <!-- Edges FASE 1 -->
      <bpmndi:BPMNEdge id="F_Start_Solicitar_di" bpmnElement="F_Start_Solicitar">
        <di:waypoint x="156" y="95" /><di:waypoint x="200" y="95" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Solicitar_Registrar_di" bpmnElement="F_Solicitar_Registrar">
        <di:waypoint x="260" y="135" /><di:waypoint x="410" y="210" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Registrar_Detectar_di" bpmnElement="F_Registrar_Detectar">
        <di:waypoint x="410" y="290" /><di:waypoint x="560" y="900" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Detectar_Analisar_di" bpmnElement="F_Detectar_Analisar">
        <di:waypoint x="620" y="940" /><di:waypoint x="650" y="940" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Analisar_Qualificar_di" bpmnElement="F_Analisar_Qualificar">
        <di:waypoint x="710" y="900" /><di:waypoint x="860" y="290" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Qualificar_Propor_di" bpmnElement="F_Qualificar_Propor">
        <di:waypoint x="920" y="250" /><di:waypoint x="950" y="250" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Propor_Gateway_di" bpmnElement="F_Propor_Gateway">
        <di:waypoint x="1070" y="250" /><di:waypoint x="1100" y="250" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Gateway_Sim_di" bpmnElement="F_Gateway_Sim">
        <di:waypoint x="1125" y="225" /><di:waypoint x="1125" y="135" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Retencao_EndSucesso_di" bpmnElement="F_Retencao_EndSucesso">
        <di:waypoint x="1125" y="55" /><di:waypoint x="1125" y="38" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Gateway_Nao_di" bpmnElement="F_Gateway_Nao">
        <di:waypoint x="1125" y="275" /><di:waypoint x="1260" y="570" />
      </bpmndi:BPMNEdge>

      <!-- Edges FASE 2 -->
      <bpmndi:BPMNEdge id="F_Validar_Gateway2_di" bpmnElement="F_Validar_Gateway2">
        <di:waypoint x="1320" y="610" /><di:waypoint x="1350" y="610" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Gateway2_Sim_di" bpmnElement="F_Gateway2_Sim">
        <di:waypoint x="1375" y="635" /><di:waypoint x="1375" y="670" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Cobranca_Compliance_di" bpmnElement="F_Cobranca_Compliance">
        <di:waypoint x="1435" y="710" /><di:waypoint x="1525" y="745" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Gateway2_Nao_di" bpmnElement="F_Gateway2_Nao">
        <di:waypoint x="1400" y="610" /><di:waypoint x="1525" y="745" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Compliance_Mapear_di" bpmnElement="F_Compliance_Mapear">
        <di:waypoint x="1525" y="745" /><di:waypoint x="1675" y="470" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Mapear_GerarPlano_di" bpmnElement="F_Mapear_GerarPlano">
        <di:waypoint x="1675" y="470" /><di:waypoint x="1825" y="900" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_GerarPlano_Agendar_di" bpmnElement="F_GerarPlano_Agendar">
        <di:waypoint x="1825" y="900" /><di:waypoint x="1975" y="290" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Agendar_Validar_di" bpmnElement="F_Agendar_Validar">
        <di:waypoint x="1975" y="210" /><di:waypoint x="2125" y="135" />
      </bpmndi:BPMNEdge>

      <!-- Edges FASE 3 -->
      <bpmndi:BPMNEdge id="F_Validar_PausarTestes_di" bpmnElement="F_Validar_PausarTestes">
        <di:waypoint x="2125" y="135" /><di:waypoint x="2275" y="390" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_PausarTestes_PausarOtim_di" bpmnElement="F_PausarTestes_PausarOtim">
        <di:waypoint x="2335" y="430" /><di:waypoint x="2365" y="430" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_PausarOtim_Reduzir_di" bpmnElement="F_PausarOtim_Reduzir">
        <di:waypoint x="2485" y="430" /><di:waypoint x="2515" y="430" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Reduzir_Monitorar_di" bpmnElement="F_Reduzir_Monitorar">
        <di:waypoint x="2575" y="470" /><di:waypoint x="2725" y="900" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Monitorar_DesativarCamp_di" bpmnElement="F_Monitorar_DesativarCamp">
        <di:waypoint x="2725" y="900" /><di:waypoint x="2875" y="470" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_DesativarCamp_DesativarLP_di" bpmnElement="F_DesativarCamp_DesativarLP">
        <di:waypoint x="2935" y="430" /><di:waypoint x="2965" y="430" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_DesativarLP_Metricas_di" bpmnElement="F_DesativarLP_Metricas">
        <di:waypoint x="3085" y="430" /><di:waypoint x="3115" y="430" />
      </bpmndi:BPMNEdge>

      <!-- Edges FASE 4 -->
      <bpmndi:BPMNEdge id="F_Metricas_Exportar_di" bpmnElement="F_Metricas_Exportar">
        <di:waypoint x="3175" y="470" /><di:waypoint x="3325" y="900" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Exportar_Backup_di" bpmnElement="F_Exportar_Backup">
        <di:waypoint x="3385" y="940" /><di:waypoint x="3415" y="940" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Backup_ValidarLGPD_di" bpmnElement="F_Backup_ValidarLGPD">
        <di:waypoint x="3475" y="900" /><di:waypoint x="3625" y="825" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_ValidarLGPD_Gateway3_di" bpmnElement="F_ValidarLGPD_Gateway3">
        <di:waypoint x="3625" y="825" /><di:waypoint x="3740" y="915" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Gateway3_Sim_di" bpmnElement="F_Gateway3_Sim">
        <di:waypoint x="3740" y="965" /><di:waypoint x="3740" y="1000" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_GerarPacote_Enviar_di" bpmnElement="F_GerarPacote_Enviar">
        <di:waypoint x="3800" y="1040" /><di:waypoint x="3830" y="1040" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Enviar_RemoverAcessos_di" bpmnElement="F_Enviar_RemoverAcessos">
        <di:waypoint x="3890" y="1000" /><di:waypoint x="4040" y="470" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Gateway3_Nao_di" bpmnElement="F_Gateway3_Nao">
        <di:waypoint x="3765" y="940" /><di:waypoint x="4040" y="470" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_RemoverAcessos_Desconectar_di" bpmnElement="F_RemoverAcessos_Desconectar">
        <di:waypoint x="4100" y="430" /><di:waypoint x="4130" y="430" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Desconectar_RemoverSensiveis_di" bpmnElement="F_Desconectar_RemoverSensiveis">
        <di:waypoint x="4190" y="470" /><di:waypoint x="4340" y="900" />
      </bpmndi:BPMNEdge>

      <!-- Edges FASE 5 -->
      <bpmndi:BPMNEdge id="F_RemoverSensiveis_EmitirNota_di" bpmnElement="F_RemoverSensiveis_EmitirNota">
        <di:waypoint x="4340" y="900" /><di:waypoint x="4490" y="650" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_EmitirNota_Reembolso_di" bpmnElement="F_EmitirNota_Reembolso">
        <di:waypoint x="4550" y="610" /><di:waypoint x="4580" y="610" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Reembolso_Exit_di" bpmnElement="F_Reembolso_Exit">
        <di:waypoint x="4640" y="570" /><di:waypoint x="4790" y="290" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Exit_ResponderPesquisa_di" bpmnElement="F_Exit_ResponderPesquisa">
        <di:waypoint x="4790" y="210" /><di:waypoint x="4940" y="135" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_ResponderPesquisa_AnalisarChurn_di" bpmnElement="F_ResponderPesquisa_AnalisarChurn">
        <di:waypoint x="4940" y="135" /><di:waypoint x="5090" y="900" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_AnalisarChurn_Consolidar_di" bpmnElement="F_AnalisarChurn_Consolidar">
        <di:waypoint x="5090" y="900" /><di:waypoint x="5240" y="290" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Consolidar_Playbook_di" bpmnElement="F_Consolidar_Playbook">
        <di:waypoint x="5300" y="250" /><di:waypoint x="5330" y="250" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Playbook_WinBack_di" bpmnElement="F_Playbook_WinBack">
        <di:waypoint x="5450" y="250" /><di:waypoint x="5480" y="250" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_WinBack_Arquivar_di" bpmnElement="F_WinBack_Arquivar">
        <di:waypoint x="5540" y="290" /><di:waypoint x="5690" y="570" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Arquivar_Notificar_di" bpmnElement="F_Arquivar_Notificar">
        <di:waypoint x="5690" y="650" /><di:waypoint x="5840" y="900" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Notificar_End_di" bpmnElement="F_Notificar_End">
        <di:waypoint x="5840" y="900" /><di:waypoint x="5840" y="268" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

const phases = [
  { name: 'Deteccao & Tentativa de Retencao', x: 80, width: 1120 },
  { name: 'Aprovacao & Planejamento', x: 1200, width: 985 },
  { name: 'Desativacao Controlada', x: 2185, width: 1050 },
  { name: 'Backup & Handoff de Dados', x: 3235, width: 1165 },
  { name: 'Encerramento & Aprendizado', x: 4400, width: 1500 }
];

const config = {
  zoom: 0.75,
  storageKey: 'subprocesso-6.4',
  startLabel: 'SOLICITACAO DE CANCELAMENTO',
  endLabels: {
    End_RetencaoSucesso: { text: 'RETENCAO BEM-SUCEDIDA', className: 'end-label-success', marker: 'end-success' },
    End_OffboardingConcluido: { text: 'OFFBOARDING CONCLUIDO', className: 'end-label-neutral', marker: 'end-neutral' }
  },
  showDefaultEndLabel: false,
  useEndName: false,
  defaultEndLabelText: 'FIM',
  defaultEndClass: 'end-label-lost'
};

window.v5Data = window.v5Data || {};
window.v5Data['6.4'] = { diagramXML, nodeDetails, phases, ...config };
