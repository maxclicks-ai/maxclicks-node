/**
 * Delete contact request - matches DELETE /v1/contacts body exactly
 */
export interface DeleteContactRequest {
  /** Contact ID to delete */
  id?: string;
  /** User ID to identify contact for deletion */
  userId?: string;
  /** Email to identify contact for deletion */
  email?: string;
  /** Phone to identify contact for deletion */
  phone?: string;
}

/**
 * Delete contact response - matches DELETE /v1/contacts response exactly
 */
export interface DeleteContactResponse {
  /** ID of the deleted contact */
  id: string | null;
}

/**
 * Delete contact by ID response - matches DELETE /v1/contacts/:id response exactly
 * Returns empty body with 204 status code
 */
export interface DeleteContactByIdResponse {
  // Empty response body from DELETE /v1/contacts/:id (204 status)
}
