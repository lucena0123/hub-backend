export function resolveCommercialFormsBaseUrl(): string {
  const baseUrl = process.env.HUB_FORMS_BASE_URL || process.env.APP_BASE_URL || 'http://localhost:3000';
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

export function resolveCommercialApiBaseUrl(): string {
  const baseUrl = process.env.HUB_API_BASE_URL || process.env.API_BASE_URL || process.env.APP_BASE_URL || 'http://localhost:3001';
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}
