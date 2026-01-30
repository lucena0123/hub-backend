/**
 * SOLUÇÃO 7: VERSIONAMENTO DE PROCESSOS
 * Sistema de Versionamento e Deploy Canary
 *
 * Gerencia múltiplas versões de processos BPMN:
 * - Semantic versioning (Major.Minor.Patch)
 * - Deploy incremental (Canary)
 * - Rollback automático
 * - Migração gradual de clientes
 */

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface ProcessVersion {
  version: string;             // ex: "2.0.0"
  processId: string;
  status: 'active' | 'deprecated' | 'archived';
  deployedAt: string;
  deprecatedAt?: string;
  description: string;
  breaking: boolean;           // Mudança incompatível?
  rollbackVersion?: string;    // Versão segura para rollback
  metadata: {
    author: string;
    changelog: string[];
    testsPass: boolean;
    approvedBy?: string;
  };
}

export interface ClientVersion {
  clientId: string;
  clientName: string;
  processId: string;
  version: string;
  migratedAt: string;
  scheduledMigration?: string;  // Data planejada para migração
  canary: boolean;              // Cliente faz parte do canary group?
}

export interface CanaryDeployment {
  deploymentId: string;
  processId: string;
  fromVersion: string;
  toVersion: string;
  startedAt: string;
  completedAt?: string;
  status: 'planning' | 'running' | 'completed' | 'rolled_back';
  stages: CanaryStage[];
  metrics: CanaryMetrics;
}

export interface CanaryStage {
  stage: number;
  percentage: number;          // % de clientes nesta fase
  startedAt: string;
  completedAt?: string;
  clientsMigrated: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  healthCheck: {
    passed: boolean;
    errors: number;
    avgDuration: number;
    slaBreaches: number;
  };
}

export interface CanaryMetrics {
  totalClients: number;
  migrated: number;
  remaining: number;
  percentComplete: number;
  successRate: number;
  avgMigrationTime: number;    // ms
  errors: number;
  rollbacks: number;
}

export interface VersionRegistry {
  processId: string;
  versions: ProcessVersion[];
  activeVersion: string;
  clients: ClientVersion[];
  deployments: CanaryDeployment[];
}

// ============================================================================
// VERSION MANAGER CLASS
// ============================================================================

export class ProcessVersionManager {
  private registry: Map<string, VersionRegistry>; // processId => Registry

  constructor() {
    this.registry = new Map();
  }

  /**
   * Registra nova versão de processo
   */
  public registerVersion(version: Omit<ProcessVersion, 'status' | 'deployedAt'>): void {
    if (!this.registry.has(version.processId)) {
      this.registry.set(version.processId, {
        processId: version.processId,
        versions: [],
        activeVersion: version.version,
        clients: [],
        deployments: []
      });
    }

    const registry = this.registry.get(version.processId)!;

    const newVersion: ProcessVersion = {
      ...version,
      status: 'active',
      deployedAt: new Date().toISOString()
    };

    registry.versions.push(newVersion);

    // Se versão anterior existir e breaking=false, marca como deprecated
    if (registry.versions.length > 1 && !version.breaking) {
      const previousVersion = registry.versions[registry.versions.length - 2];
      previousVersion.status = 'deprecated';
      previousVersion.deprecatedAt = new Date().toISOString();
    }

    console.log(`[VersionManager] Registered ${version.processId} v${version.version}`);
  }

  /**
   * Valida formato de versão semântica
   */
  private validateSemanticVersion(version: string): boolean {
    const semverRegex = /^\d+\.\d+\.\d+$/;
    return semverRegex.test(version);
  }

  /**
   * Compara duas versões
   * Retorna: -1 se v1 < v2, 0 se v1 = v2, 1 se v1 > v2
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      if (parts1[i] > parts2[i]) return 1;
      if (parts1[i] < parts2[i]) return -1;
    }

    return 0;
  }

  /**
   * Inicia deploy canary
   */
  public startCanaryDeployment(
    processId: string,
    toVersion: string,
    canaryPlan?: number[] // % de clientes por fase, ex: [5, 20, 50, 100]
  ): string {
    const registry = this.registry.get(processId);

    if (!registry) {
      throw new Error(`Process ${processId} not found in registry`);
    }

    const targetVersion = registry.versions.find(v => v.version === toVersion);

    if (!targetVersion) {
      throw new Error(`Version ${toVersion} not found for process ${processId}`);
    }

    const fromVersion = registry.activeVersion;

    // Plano canary padrão: 5% -> 20% -> 50% -> 100%
    const stages = canaryPlan || [5, 20, 50, 100];

    const deploymentId = `deploy_${processId}_${toVersion}_${Date.now()}`;

    const deployment: CanaryDeployment = {
      deploymentId,
      processId,
      fromVersion,
      toVersion,
      startedAt: new Date().toISOString(),
      status: 'running',
      stages: stages.map((percentage, index) => ({
        stage: index + 1,
        percentage,
        startedAt: '',
        clientsMigrated: [],
        status: 'pending',
        healthCheck: {
          passed: false,
          errors: 0,
          avgDuration: 0,
          slaBreaches: 0
        }
      })),
      metrics: {
        totalClients: registry.clients.length,
        migrated: 0,
        remaining: registry.clients.length,
        percentComplete: 0,
        successRate: 100,
        avgMigrationTime: 0,
        errors: 0,
        rollbacks: 0
      }
    };

    registry.deployments.push(deployment);

    console.log(`[VersionManager] Started canary deployment ${deploymentId}`);

    // Inicia primeira fase automaticamente
    this.executeCanaryStage(deploymentId, 0);

    return deploymentId;
  }

  /**
   * Executa uma fase do canary deployment
   */
  private executeCanaryStage(deploymentId: string, stageIndex: number): void {
    let deployment: CanaryDeployment | undefined;
    let registry: VersionRegistry | undefined;

    // Encontra deployment
    this.registry.forEach(reg => {
      const dep = reg.deployments.find(d => d.deploymentId === deploymentId);
      if (dep) {
        deployment = dep;
        registry = reg;
      }
    });

    if (!deployment || !registry) {
      console.error(`Deployment ${deploymentId} not found`);
      return;
    }

    const stage = deployment.stages[stageIndex];

    if (!stage || stage.status !== 'pending') {
      return;
    }

    stage.status = 'running';
    stage.startedAt = new Date().toISOString();

    // Calcula quantos clientes migrar nesta fase
    const totalClients = deployment.metrics.totalClients;
    const targetCount = Math.ceil((stage.percentage / 100) * totalClients);
    const alreadyMigrated = deployment.metrics.migrated;
    const toMigrate = targetCount - alreadyMigrated;

    // Seleciona clientes para migração
    const clientsToMigrate = registry.clients
      .filter(c => c.version === deployment.fromVersion)
      .slice(0, toMigrate);

    console.log(`[VersionManager] Stage ${stage.stage}: Migrating ${clientsToMigrate.length} clients to v${deployment.toVersion}`);

    // Migra clientes
    clientsToMigrate.forEach(client => {
      this.migrateClient(client.clientId, deployment!.processId, deployment!.toVersion);
      stage.clientsMigrated.push(client.clientId);
    });

    // Atualiza métricas
    deployment.metrics.migrated += clientsToMigrate.length;
    deployment.metrics.remaining -= clientsToMigrate.length;
    deployment.metrics.percentComplete = Math.round(
      (deployment.metrics.migrated / deployment.metrics.totalClients) * 100
    );

    // Simula health check (em produção: verificar métricas reais)
    stage.healthCheck = this.performHealthCheck(deployment.processId, deployment.toVersion);

    stage.status = 'completed';
    stage.completedAt = new Date().toISOString();

    // Verifica se health check passou
    if (!stage.healthCheck.passed) {
      console.error(`[VersionManager] Health check failed for stage ${stage.stage}, rolling back...`);
      this.rollbackDeployment(deploymentId);
      return;
    }

    console.log(`[VersionManager] Stage ${stage.stage} completed successfully`);

    // Se não é última fase, aguarda 48h antes de próxima (em produção)
    // Por simplicidade, executa próxima fase imediatamente
    if (stageIndex < deployment.stages.length - 1) {
      deployment.stages[stageIndex + 1].status = 'pending';
      // setTimeout(() => this.executeCanaryStage(deploymentId, stageIndex + 1), 48 * 60 * 60 * 1000);
    } else {
      // Deployment completo
      deployment.status = 'completed';
      deployment.completedAt = new Date().toISOString();
      registry.activeVersion = deployment.toVersion;

      console.log(`[VersionManager] Canary deployment ${deploymentId} completed successfully`);
    }
  }

  /**
   * Realiza health check de uma versão
   */
  private performHealthCheck(processId: string, version: string): CanaryStage['healthCheck'] {
    // Em produção: integrar com SystemMonitor
    // Mock data para demonstração

    return {
      passed: true,
      errors: 0,
      avgDuration: 1500, // ms
      slaBreaches: 0
    };
  }

  /**
   * Migra cliente para nova versão
   */
  private migrateClient(clientId: string, processId: string, toVersion: string): void {
    const registry = this.registry.get(processId);

    if (!registry) return;

    const client = registry.clients.find(c => c.clientId === clientId);

    if (client) {
      client.version = toVersion;
      client.migratedAt = new Date().toISOString();
      console.log(`[VersionManager] Migrated client ${clientId} to v${toVersion}`);
    }
  }

  /**
   * Rollback de deployment
   */
  public rollbackDeployment(deploymentId: string): void {
    let deployment: CanaryDeployment | undefined;
    let registry: VersionRegistry | undefined;

    // Encontra deployment
    this.registry.forEach(reg => {
      const dep = reg.deployments.find(d => d.deploymentId === deploymentId);
      if (dep) {
        deployment = dep;
        registry = reg;
      }
    });

    if (!deployment || !registry) {
      console.error(`Deployment ${deploymentId} not found`);
      return;
    }

    console.log(`[VersionManager] Rolling back deployment ${deploymentId}...`);

    deployment.status = 'rolled_back';
    deployment.metrics.rollbacks++;

    // Reverte todos os clientes migrados
    const migratedClients = deployment.stages
      .flatMap(stage => stage.clientsMigrated);

    migratedClients.forEach(clientId => {
      this.migrateClient(clientId, deployment!.processId, deployment!.fromVersion);
    });

    console.log(`[VersionManager] Rolled back ${migratedClients.length} clients to v${deployment.fromVersion}`);
  }

  /**
   * Adiciona cliente ao registry
   */
  public registerClient(
    clientId: string,
    clientName: string,
    processId: string,
    version: string
  ): void {
    if (!this.registry.has(processId)) {
      throw new Error(`Process ${processId} not found in registry`);
    }

    const registry = this.registry.get(processId)!;

    const client: ClientVersion = {
      clientId,
      clientName,
      processId,
      version,
      migratedAt: new Date().toISOString(),
      canary: false
    };

    registry.clients.push(client);
  }

  /**
   * Retorna informações de versão de um processo
   */
  public getProcessVersionInfo(processId: string): VersionRegistry | null {
    return this.registry.get(processId) || null;
  }

  /**
   * Lista todas as versões disponíveis de um processo
   */
  public listVersions(processId: string): ProcessVersion[] {
    const registry = this.registry.get(processId);
    return registry ? registry.versions : [];
  }

  /**
   * Retorna estatísticas de versionamento
   */
  public getVersionStatistics(): Record<string, any> {
    const stats: Record<string, any> = {
      totalProcesses: this.registry.size,
      processes: {}
    };

    this.registry.forEach((registry, processId) => {
      const activeDeployment = registry.deployments.find(d => d.status === 'running');

      stats.processes[processId] = {
        activeVersion: registry.activeVersion,
        totalVersions: registry.versions.length,
        totalClients: registry.clients.length,
        versionDistribution: this.getVersionDistribution(registry),
        activeDeployment: activeDeployment ? {
          deploymentId: activeDeployment.deploymentId,
          toVersion: activeDeployment.toVersion,
          progress: activeDeployment.metrics.percentComplete
        } : null
      };
    });

    return stats;
  }

  /**
   * Retorna distribuição de clientes por versão
   */
  private getVersionDistribution(registry: VersionRegistry): Record<string, number> {
    const distribution: Record<string, number> = {};

    registry.clients.forEach(client => {
      distribution[client.version] = (distribution[client.version] || 0) + 1;
    });

    return distribution;
  }
}

// ============================================================================
// EXEMPLOS DE USO
// ============================================================================

// Inicializar version manager
const versionManager = new ProcessVersionManager();

// Registrar versões
versionManager.registerVersion({
  version: '1.0.0',
  processId: '5.2',
  description: 'Versão inicial de otimização de lances',
  breaking: false,
  metadata: {
    author: 'team_trafego',
    changelog: ['Initial release'],
    testsPass: true
  }
});

versionManager.registerVersion({
  version: '2.0.0',
  processId: '5.2',
  description: 'Nova estratégia de bid com ML',
  breaking: true,
  rollbackVersion: '1.0.0',
  metadata: {
    author: 'team_trafego',
    changelog: [
      'Adiciona modelo ML para previsão de bids',
      'Melhora taxa de sucesso em 15%',
      'Breaking: Novo formato de configuração'
    ],
    testsPass: true,
    approvedBy: 'tech_lead'
  }
});

// Registrar clientes
// versionManager.registerClient('cliente_A', 'Cliente A Corp', '5.2', '1.0.0');
// versionManager.registerClient('cliente_B', 'Cliente B Ltd', '5.2', '1.0.0');
// versionManager.registerClient('cliente_C', 'Cliente C Inc', '5.2', '1.0.0');

// Iniciar deploy canary
// const deploymentId = versionManager.startCanaryDeployment('5.2', '2.0.0', [5, 20, 50, 100]);

// Ver estatísticas
// console.log('Version Statistics:', versionManager.getVersionStatistics());

export default versionManager;
