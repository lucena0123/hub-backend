const readEnv = (name: string) => {
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() : '';
};

const requiredEnv = (name: string, opts?: { allowTestFallback?: boolean; minLength?: number }) => {
  const value = readEnv(name);
  if (value) {
    if (opts?.minLength && value.length < opts.minLength) {
      throw new Error(`${name} must be at least ${opts.minLength} characters long`);
    }
    return value;
  }

  if (opts?.allowTestFallback && process.env.NODE_ENV === 'test') {
    return `test-${name.toLowerCase()}-fallback`;
  }

  throw new Error(`${name} is required`);
};

export const PORT = parseInt(process.env.PORT || '3001');
export const HOST = '0.0.0.0';
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const IS_TEST = process.env.NODE_ENV === 'test';
export const JWT_SECRET = requiredEnv('JWT_SECRET', { allowTestFallback: true, minLength: 32 });
