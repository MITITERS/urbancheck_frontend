import type { UseFormSetError, FieldValues, Path } from 'react-hook-form'
import { isApiError } from '@/api/client'
import { messages } from '@/config/messages'

/**
 * Pushes the `fieldErrors` of a normalized `ApiError` into a React Hook Form,
 * so a backend validation error (a duplicate municipality, an email already
 * taken) lands under its own input instead of a generic toast.
 *
 * `fieldMap` translates API field names into form field names; API fields not
 * present in the map are ignored and reported through the return value.
 *
 * Returns the message to show as a form-level error, or `null` when every error
 * was placed on a field.
 */
export function applyFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fieldMap: Partial<Record<string, Path<T>>> = {},
): string | null {
  if (!isApiError(error)) return messages.errors.unexpected

  let placed = false
  for (const [apiField, apiMessages] of Object.entries(error.fieldErrors)) {
    const formField = fieldMap[apiField] ?? (apiField as Path<T>)
    const [first] = apiMessages
    if (!first) continue
    setError(formField, { type: 'server', message: first })
    placed = true
  }

  return placed ? null : error.message
}
