import { ApiError } from '../lib/api';

export type RegisterField = 'email' | 'password' | 'fullName' | 'hotelName';

export type ValidationErrors = Partial<Record<RegisterField, string>>;

export interface RegisterPayload {
  role: 'HOTEL' | 'CANDIDATE';
  email: string;
  password: string;
  hotelName?: string;
  fullName?: string;
}

interface RegisterErrorDetails {
  fieldErrors?: Partial<Record<RegisterField, string[]>>;
}

interface ApiErrorLike {
  message: string;
  details?: unknown;
}

const hasUppercase = /[A-Z]/;
const hasLowercase = /[a-z]/;
const hasDigit = /[0-9]/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeRegisterPayload = (payload: RegisterPayload): RegisterPayload => ({
  role: payload.role,
  email: payload.email.trim(),
  password: payload.password,
  hotelName: payload.role === 'HOTEL' ? payload.hotelName?.trim() : undefined,
  fullName: payload.role === 'CANDIDATE' ? payload.fullName?.trim() : undefined,
});

export const validateRegisterPayload = (payload: RegisterPayload): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!payload.email || payload.email.length > 255 || !emailPattern.test(payload.email)) {
    errors.email = 'Adresse email invalide.';
  }

  if (payload.password.length < 10) {
    errors.password = 'Le mot de passe doit contenir au moins 10 caractères.';
  } else if (payload.password.length > 128) {
    errors.password = 'Le mot de passe ne peut pas dépasser 128 caractères.';
  } else if (
    !hasUppercase.test(payload.password) ||
    !hasLowercase.test(payload.password) ||
    !hasDigit.test(payload.password)
  ) {
    errors.password = 'Le mot de passe doit inclure une majuscule, une minuscule et un chiffre.';
  }

  if (payload.role === 'CANDIDATE') {
    if (!payload.fullName || payload.fullName.length < 2 || payload.fullName.length > 150) {
      errors.fullName = 'Le nom complet doit contenir entre 2 et 150 caractères.';
    }
  }

  if (payload.role === 'HOTEL') {
    if (!payload.hotelName || payload.hotelName.length < 2 || payload.hotelName.length > 150) {
      errors.hotelName = "Le nom de l'hôtel doit contenir entre 2 et 150 caractères.";
    }
  }

  return errors;
};

const isRegisterErrorDetails = (value: unknown): value is RegisterErrorDetails => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  return 'fieldErrors' in value;
};

export const extractRegisterErrors = (details: unknown): ValidationErrors => {
  if (!isRegisterErrorDetails(details) || !details.fieldErrors) {
    return {};
  }

  const errors: ValidationErrors = {};
  const fields: RegisterField[] = ['email', 'password', 'fullName', 'hotelName'];

  for (const field of fields) {
    const values = details.fieldErrors[field];
    if (Array.isArray(values) && values.length > 0 && typeof values[0] === 'string') {
      errors[field] = values[0];
    }
  }

  return errors;
};

export const isApiErrorLike = (value: unknown): value is ApiErrorLike => {
  if (value instanceof ApiError) {
    return true;
  }

  if (!value || typeof value !== 'object') {
    return false;
  }

  if (!('message' in value) || typeof value.message !== 'string') {
    return false;
  }

  return 'details' in value;
};
