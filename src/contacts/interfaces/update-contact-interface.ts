import type { ContactInput } from './contact';

/**
 * Update contact request - matches PUT /v1/contacts/:id body exactly
 * ID comes from URL params, body matches ContactModel.PublicInput without id
 */
export interface UpdateContactRequest extends Omit<ContactInput, 'id'> {}

/**
 * Update contact response - matches PUT /v1/contacts/:id response exactly
 */
export interface UpdateContactResponse {
  /** The timestamp when the contact was last updated (ISO string) */
  updatedAt: string;
}
