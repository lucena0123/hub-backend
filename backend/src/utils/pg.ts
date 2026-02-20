export const toStringArray = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const inner = trimmed.slice(1, -1);
      if (!inner) return [];
      return inner
        .split(',')
        .map((item) => item.trim().replace(/^\"(.*)\"$/, '$1'))
        .filter(Boolean);
    }
    return [value];
  }
  return [];
};

