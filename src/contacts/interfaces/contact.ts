// Contact interfaces based on ContactModel from shared package
// These interfaces MUST match ContactModel.PublicInput and ContactModel.PublicOutput exactly

/**
 * Custom attribute values organized by attribute key
 * Matches AttributeModel.PublicValuesByKey exactly
 */
export interface PublicAttributeValuesByKey {
  [key: string]: string | number | boolean | string[] | null;
}

/**
 * Contact output interface - matches ContactModel.PublicOutput exactly
 * Used for API responses (GET /v1/contacts, GET /v1/contacts/:id)
 */
export interface Contact {
  id: string;
  createdAt: string; // ISO string format
  updatedAt: string; // ISO string format
  source: string | null; // ContactModel.Source
  subscribed: boolean;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  userId: string | null;
  userGroup: string | null;
  notes: string | null;
  tags: string[];
  [key: string]: any; // Dynamic custom attributes
}

/**
 * Contact input interface
 * Used for API requests (POST /v1/contacts, PUT /v1/contacts/:id, POST /v1/contacts/batch)
 *
 * IMPORTANT: ID is optional and used for:
 * - Upsert operations (create if not exists, update if exists)
 * - Internal identification in batch operations
 * - Updates via PUT (though ID comes from URL params)
 */
export interface ContactInput {
  id?: string | null; // Optional for upsert operations
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  userId?: string | null;
  userGroup?: string | null;
  notes?: string | null;
  tags?: string[];
  attributeValuesByKey?: PublicAttributeValuesByKey;
  [key: string]: any; // Dynamic custom attributes
}

/**
 * @deprecated Use ContactInput instead - id field is now optional in ContactInput
 */
export interface ContactInputWithId extends ContactInput {
  id: string;
}
