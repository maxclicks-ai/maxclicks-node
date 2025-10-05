import type { ContactInput } from './contact';

/**
 * Create contact request - matches ContactModel.PublicInput exactly
 * Used for POST /v1/contacts and POST /v1/contacts/batch
 */
export interface CreateContactRequest extends ContactInput {}

/**
 * Create contact response - matches POST /v1/contacts response exactly
 */
export interface CreateContactResponse {
  /** The ID of the created/updated contact */
  id: string;
}

/**
 * Create contacts batch response - matches POST /v1/contacts/batch response exactly
 */
export interface CreateContactsBatchResponse {
  /** Array of IDs for the created/updated contacts */
  ids: string[];
}
