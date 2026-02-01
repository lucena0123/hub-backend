export const PORT = parseInt(process.env.PORT || '3001');
export const HOST = '0.0.0.0';
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const JWT_SECRET = process.env.JWT_SECRET || 'bpmn-system-dev-secret-change-in-production';
