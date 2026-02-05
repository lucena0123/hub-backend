import type { OptimizationThemeMatch } from '../../types';
import type { OptimizationThemeInfo } from './types';

export const toThemeInfo = (theme: OptimizationThemeMatch): OptimizationThemeInfo => ({
  key: theme.themeKey,
  name: theme.themeName,
  matchedBy: theme.matchedBy,
  matchedValue: theme.matchedValue,
});

