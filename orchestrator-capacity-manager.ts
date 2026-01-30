/**
 * SOLUÇÃO 3: ORQUESTRAÇÃO E GESTÃO DE RECURSOS
 * Gerenciador de Capacidade de Time
 *
 * Aloca recursos (pessoas) baseado em:
 * - Disponibilidade
 * - Skills necessárias
 * - Balanceamento de carga
 * - Alertas de sobrecarga
 */

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface TeamMember {
  userId: string;
  name: string;
  role: string;
  skills: string[];          // Processos que pode executar: ["5.1", "5.2", "5.3"]
  currentLoad: number;       // % de capacidade utilizada
  assignedTasks: string[];   // IDs das tasks atribuídas
  maxConcurrentTasks: number;
  status: 'available' | 'busy' | 'offline';
}

export interface TeamCapacity {
  teamId: string;
  teamName: string;
  members: TeamMember[];
  totalCapacity: number;
  availableCapacity: number;
  utilization: number;        // %
  thresholds: {
    warning: number;          // % - Alerta amarelo
    critical: number;         // % - Alerta vermelho
  };
}

export interface AllocationRequest {
  taskId: string;
  processId: string;
  requiredSkills: string[];
  estimatedDuration: number; // minutos
  priority: number;
}

export interface AllocationResult {
  success: boolean;
  assignedTo?: string;
  reason?: string;
  waitTime?: number;         // minutos estimados de espera
}

// ============================================================================
// CONFIGURAÇÕES DE TIMES
// ============================================================================

// Estrutura de times por área
export const TEAM_STRUCTURE = {
  trafego: {
    teamId: 'team_trafego',
    teamName: 'Gestor de Tráfego',
    skills: ['5.1', '5.2', '5.3', '4.2'],
    defaultMaxConcurrent: 3
  },
  cs: {
    teamId: 'team_cs',
    teamName: 'Customer Success',
    skills: ['6.1', '6.2', '6.3', '6.4', '7.2', '7.3'],
    defaultMaxConcurrent: 5
  },
  financeiro: {
    teamId: 'team_financeiro',
    teamName: 'Financeiro',
    skills: ['7.1', '7.2', '1.3'],
    defaultMaxConcurrent: 4
  },
  vendas: {
    teamId: 'team_vendas',
    teamName: 'Vendas',
    skills: ['1.1', '1.2', '1.3'],
    defaultMaxConcurrent: 4
  },
  estrategia: {
    teamId: 'team_estrategia',
    teamName: 'Estratégia',
    skills: ['0.1', '2.2', '2.3', '3.1', '3.2', '3.3', '3.4'],
    defaultMaxConcurrent: 3
  },
  creative: {
    teamId: 'team_creative',
    teamName: 'Criativo',
    skills: ['4.1', '4.3'],
    defaultMaxConcurrent: 4
  }
};

// ============================================================================
// CAPACITY MANAGER CLASS
// ============================================================================

export class CapacityManager {
  private teams: Map<string, TeamCapacity>;

  constructor() {
    this.teams = new Map();
    this.initializeTeams();
  }

  /**
   * Inicializa times com estrutura padrão
   */
  private initializeTeams(): void {
    Object.values(TEAM_STRUCTURE).forEach(teamConfig => {
      this.teams.set(teamConfig.teamId, {
        teamId: teamConfig.teamId,
        teamName: teamConfig.teamName,
        members: [],
        totalCapacity: 0,
        availableCapacity: 0,
        utilization: 0,
        thresholds: {
          warning: 70,
          critical: 85
        }
      });
    });
  }

  /**
   * Adiciona membro ao time
   */
  public addTeamMember(teamId: string, member: Omit<TeamMember, 'currentLoad' | 'assignedTasks' | 'status'>): void {
    const team = this.teams.get(teamId);

    if (!team) {
      throw new Error(`Team ${teamId} not found`);
    }

    const newMember: TeamMember = {
      ...member,
      currentLoad: 0,
      assignedTasks: [],
      status: 'available'
    };

    team.members.push(newMember);
    this.recalculateCapacity(teamId);
  }

  /**
   * Recalcula capacidade total do time
   */
  private recalculateCapacity(teamId: string): void {
    const team = this.teams.get(teamId);

    if (!team) return;

    const availableMembers = team.members.filter(m => m.status !== 'offline');
    team.totalCapacity = availableMembers.length;

    const busyMembers = availableMembers.filter(m => m.currentLoad >= 90);
    team.availableCapacity = team.totalCapacity - busyMembers.length;

    if (team.totalCapacity > 0) {
      const avgLoad = availableMembers.reduce((sum, m) => sum + m.currentLoad, 0) / availableMembers.length;
      team.utilization = Math.round(avgLoad);
    } else {
      team.utilization = 0;
    }
  }

  /**
   * Encontra melhor membro para alocar uma task
   */
  public allocateTask(request: AllocationRequest): AllocationResult {
    // 1. Encontra times que têm a skill necessária
    const eligibleTeams = this.findTeamsWithSkills(request.processId);

    if (eligibleTeams.length === 0) {
      return {
        success: false,
        reason: `No team has skills for process ${request.processId}`
      };
    }

    // 2. Busca membro disponível com menor carga
    let bestMember: TeamMember | null = null;
    let bestTeam: TeamCapacity | null = null;
    let lowestLoad = 100;

    for (const team of eligibleTeams) {
      for (const member of team.members) {
        // Verifica se membro está disponível e tem a skill
        if (
          member.status === 'available' &&
          member.skills.includes(request.processId) &&
          member.currentLoad < 90 &&
          member.assignedTasks.length < member.maxConcurrentTasks &&
          member.currentLoad < lowestLoad
        ) {
          bestMember = member;
          bestTeam = team;
          lowestLoad = member.currentLoad;
        }
      }
    }

    // 3. Se encontrou membro, aloca
    if (bestMember && bestTeam) {
      bestMember.assignedTasks.push(request.taskId);

      // Estima aumento de carga baseado na duração
      const loadIncrease = this.estimateLoadIncrease(request.estimatedDuration);
      bestMember.currentLoad = Math.min(100, bestMember.currentLoad + loadIncrease);

      if (bestMember.currentLoad >= 90) {
        bestMember.status = 'busy';
      }

      this.recalculateCapacity(bestTeam.teamId);

      return {
        success: true,
        assignedTo: bestMember.userId
      };
    }

    // 4. Ninguém disponível, calcula tempo de espera
    const waitTime = this.estimateWaitTime(eligibleTeams);

    return {
      success: false,
      reason: 'No available members',
      waitTime
    };
  }

  /**
   * Estima aumento de carga baseado na duração da task
   */
  private estimateLoadIncrease(durationMinutes: number): number {
    // Assume workday de 8h (480 min)
    // 1h de task = ~12.5% de carga
    return Math.round((durationMinutes / 480) * 100);
  }

  /**
   * Estima tempo de espera até próximo membro disponível
   */
  private estimateWaitTime(teams: TeamCapacity[]): number {
    let shortestWait = Infinity;

    for (const team of teams) {
      for (const member of team.members) {
        if (member.status !== 'offline' && member.assignedTasks.length > 0) {
          // Estima que cada task leva ~60 min em média
          const estimatedWait = member.assignedTasks.length * 60;
          shortestWait = Math.min(shortestWait, estimatedWait);
        }
      }
    }

    return shortestWait === Infinity ? 120 : shortestWait; // Default: 2h
  }

  /**
   * Encontra times com skill necessária
   */
  private findTeamsWithSkills(processId: string): TeamCapacity[] {
    const eligibleTeams: TeamCapacity[] = [];

    this.teams.forEach(team => {
      const hasSkill = team.members.some(member =>
        member.skills.includes(processId)
      );

      if (hasSkill) {
        eligibleTeams.push(team);
      }
    });

    return eligibleTeams;
  }

  /**
   * Libera task concluída
   */
  public releaseTask(taskId: string, userId: string): void {
    this.teams.forEach(team => {
      const member = team.members.find(m => m.userId === userId);

      if (member) {
        // Remove task
        member.assignedTasks = member.assignedTasks.filter(t => t !== taskId);

        // Reduz carga (assume task média de 1h = 12.5%)
        member.currentLoad = Math.max(0, member.currentLoad - 12.5);

        if (member.currentLoad < 90) {
          member.status = 'available';
        }

        this.recalculateCapacity(team.teamId);
      }
    });
  }

  /**
   * Retorna status geral de capacidade
   */
  public getCapacityStatus(): Record<string, any> {
    const status: Record<string, any> = {
      overall: {
        totalTeams: this.teams.size,
        avgUtilization: 0,
        teamsAtWarning: 0,
        teamsAtCritical: 0
      },
      teams: {}
    };

    let totalUtilization = 0;

    this.teams.forEach((team, teamId) => {
      const isWarning = team.utilization >= team.thresholds.warning;
      const isCritical = team.utilization >= team.thresholds.critical;

      if (isWarning) status.overall.teamsAtWarning++;
      if (isCritical) status.overall.teamsAtCritical++;

      totalUtilization += team.utilization;

      status.teams[teamId] = {
        name: team.teamName,
        utilization: team.utilization,
        totalMembers: team.totalCapacity,
        availableMembers: team.availableCapacity,
        status: isCritical ? 'critical' : isWarning ? 'warning' : 'normal',
        members: team.members.map(m => ({
          userId: m.userId,
          name: m.name,
          load: m.currentLoad,
          tasks: m.assignedTasks.length,
          status: m.status
        }))
      };
    });

    status.overall.avgUtilization = Math.round(totalUtilization / this.teams.size);

    return status;
  }

  /**
   * Verifica se sistema está sobrecarregado
   */
  public isSystemOverloaded(): { overloaded: boolean; reason?: string } {
    let criticalTeams = 0;
    let totalTeams = 0;

    this.teams.forEach(team => {
      totalTeams++;
      if (team.utilization >= team.thresholds.critical) {
        criticalTeams++;
      }
    });

    const overloadPercentage = (criticalTeams / totalTeams) * 100;

    if (overloadPercentage >= 50) {
      return {
        overloaded: true,
        reason: `${criticalTeams} of ${totalTeams} teams are at critical capacity`
      };
    }

    return { overloaded: false };
  }
}

// ============================================================================
// EXEMPLOS DE USO
// ============================================================================

// Inicializar capacity manager
const capacityManager = new CapacityManager();

// Adicionar membros aos times
capacityManager.addTeamMember('team_trafego', {
  userId: 'user_001',
  name: 'João Silva',
  role: 'Gestor de Tráfego Senior',
  skills: ['5.1', '5.2', '5.3', '4.2'],
  maxConcurrentTasks: 3
});

capacityManager.addTeamMember('team_cs', {
  userId: 'user_002',
  name: 'Maria Santos',
  role: 'Customer Success Manager',
  skills: ['6.1', '6.2', '6.3', '6.4', '7.2'],
  maxConcurrentTasks: 5
});

// Alocar task
// const allocation = capacityManager.allocateTask({
//   taskId: 't_001',
//   processId: '5.2',
//   requiredSkills: ['5.2'],
//   estimatedDuration: 60,
//   priority: 8
// });

// console.log('Alocação:', allocation);

// Ver status de capacidade
// console.log('Status de capacidade:', capacityManager.getCapacityStatus());

export default capacityManager;
