import { type FieldError } from 'react-hook-form';

export { zodResolver } from '@hookform/resolvers/zod';
export { Controller, useFieldArray, useForm, useWatch, type FieldError } from 'react-hook-form';

function asFieldError(value: unknown): FieldError | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const error = value as FieldError;
  return error.message ? error : undefined;
}

export function toFieldError(fieldError: FieldError | undefined, nestedError: unknown): FieldError | undefined {
  if (fieldError?.message) return fieldError;

  const directNested = asFieldError(nestedError);
  if (directNested) return directNested;

  if (Array.isArray(nestedError)) {
    for (const item of nestedError) {
      const nested = asFieldError(item);
      if (nested) return nested;
    }
  }

  return undefined;
}
