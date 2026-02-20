import type { OptimizationCenterRule } from '../../types';
import { getOptimizationCenterRuleMetas } from '../engine/registry';

export const OPTIMIZATION_CENTER_PLAYBOOK_V1_RULES: OptimizationCenterRule[] = getOptimizationCenterRuleMetas();
