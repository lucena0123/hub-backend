/**
 * Client validation schemas and functions
 */

import { isValidCPF, isValidCNPJ, isValidEmail, calculateTier } from '../utils/validators';

export interface ClientCreateData {
  name: string;
  email: string;
  cpfCnpj?: string;
  tier?: 'basic' | 'premium' | 'enterprise';
  status?: 'active' | 'inactive' | 'pending';
  budget: number;
  contractStart: string;
  contractEnd: string;
}

export interface ClientUpdateData {
  name?: string;
  email?: string;
  cpfCnpj?: string;
  tier?: 'basic' | 'premium' | 'enterprise';
  status?: 'active' | 'inactive' | 'pending';
  budget?: number;
  contractStart?: string;
  contractEnd?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validates client creation data
 */
export function validateClientCreate(data: any): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  // Required fields
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Name is required and must be a non-empty string' });
  }

  if (!data.email || typeof data.email !== 'string') {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!isValidEmail(data.email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }

  if (data.budget === undefined || data.budget === null) {
    errors.push({ field: 'budget', message: 'Budget is required' });
  } else if (typeof data.budget !== 'number' || data.budget < 0) {
    errors.push({ field: 'budget', message: 'Budget must be a positive number' });
  }

  if (!data.contractStart) {
    errors.push({ field: 'contractStart', message: 'Contract start date is required' });
  } else {
    const startDate = new Date(data.contractStart);
    if (isNaN(startDate.getTime())) {
      errors.push({ field: 'contractStart', message: 'Invalid contract start date format' });
    }
  }

  if (!data.contractEnd) {
    errors.push({ field: 'contractEnd', message: 'Contract end date is required' });
  } else {
    const endDate = new Date(data.contractEnd);
    if (isNaN(endDate.getTime())) {
      errors.push({ field: 'contractEnd', message: 'Invalid contract end date format' });
    } else if (data.contractStart) {
      const startDate = new Date(data.contractStart);
      if (endDate <= startDate) {
        errors.push({ field: 'contractEnd', message: 'Contract end date must be after start date' });
      }
    }
  }

  // Optional CPF/CNPJ validation
  if (data.cpfCnpj) {
    const cleanDoc = data.cpfCnpj.replace(/\D/g, '');
    if (cleanDoc.length === 11) {
      if (!isValidCPF(data.cpfCnpj)) {
        errors.push({ field: 'cpfCnpj', message: 'Invalid CPF' });
      }
    } else if (cleanDoc.length === 14) {
      if (!isValidCNPJ(data.cpfCnpj)) {
        errors.push({ field: 'cpfCnpj', message: 'Invalid CNPJ' });
      }
    } else {
      errors.push({ field: 'cpfCnpj', message: 'CPF/CNPJ must have 11 or 14 digits' });
    }
  }

  // Validate tier if provided
  if (data.tier && !['basic', 'premium', 'enterprise'].includes(data.tier)) {
    errors.push({ field: 'tier', message: 'Tier must be basic, premium, or enterprise' });
  }

  // Validate status if provided
  if (data.status && !['active', 'inactive', 'pending'].includes(data.status)) {
    errors.push({ field: 'status', message: 'Status must be active, inactive, or pending' });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates client update data
 */
export function validateClientUpdate(data: any): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  // Name validation (if provided)
  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Name must be a non-empty string' });
    }
  }

  // Email validation (if provided)
  if (data.email !== undefined) {
    if (typeof data.email !== 'string') {
      errors.push({ field: 'email', message: 'Email must be a string' });
    } else if (!isValidEmail(data.email)) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    }
  }

  // Budget validation (if provided)
  if (data.budget !== undefined) {
    if (typeof data.budget !== 'number' || data.budget < 0) {
      errors.push({ field: 'budget', message: 'Budget must be a positive number' });
    }
  }

  // Date validations (if provided)
  if (data.contractStart !== undefined) {
    const startDate = new Date(data.contractStart);
    if (isNaN(startDate.getTime())) {
      errors.push({ field: 'contractStart', message: 'Invalid contract start date format' });
    }
  }

  if (data.contractEnd !== undefined) {
    const endDate = new Date(data.contractEnd);
    if (isNaN(endDate.getTime())) {
      errors.push({ field: 'contractEnd', message: 'Invalid contract end date format' });
    }
  }

  // CPF/CNPJ validation (if provided)
  if (data.cpfCnpj !== undefined && data.cpfCnpj !== null) {
    const cleanDoc = data.cpfCnpj.replace(/\D/g, '');
    if (cleanDoc.length === 11) {
      if (!isValidCPF(data.cpfCnpj)) {
        errors.push({ field: 'cpfCnpj', message: 'Invalid CPF' });
      }
    } else if (cleanDoc.length === 14) {
      if (!isValidCNPJ(data.cpfCnpj)) {
        errors.push({ field: 'cpfCnpj', message: 'Invalid CNPJ' });
      }
    } else if (cleanDoc.length > 0) {
      errors.push({ field: 'cpfCnpj', message: 'CPF/CNPJ must have 11 or 14 digits' });
    }
  }

  // Tier validation (if provided)
  if (data.tier !== undefined && !['basic', 'premium', 'enterprise'].includes(data.tier)) {
    errors.push({ field: 'tier', message: 'Tier must be basic, premium, or enterprise' });
  }

  // Status validation (if provided)
  if (data.status !== undefined && !['active', 'inactive', 'pending'].includes(data.status)) {
    errors.push({ field: 'status', message: 'Status must be active, inactive, or pending' });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Prepares client data for database insertion
 */
export function prepareClientData(data: ClientCreateData): any {
  return {
    name: data.name.trim(),
    email: data.email.toLowerCase().trim(),
    cpfCnpj: data.cpfCnpj?.replace(/\D/g, '') || null,
    tier: data.tier || calculateTier(data.budget),
    status: data.status || 'active',
    budget: data.budget,
    contractStart: data.contractStart,
    contractEnd: data.contractEnd,
  };
}
