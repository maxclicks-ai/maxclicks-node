// Import Contact type
import type { Contact } from './contact';

/**
 * List contacts options - matches GET /v1/contacts query parameters exactly
 */
export interface ListContactsOptions {
  /** Filter contacts by name (partial match) */
  name?: string;
  /** Filter contacts by exact email match */
  email?: string;
  /** Page number (1-based indexing) */
  page?: number;
  /** Number of contacts per page (max 100) */
  per_page?: number;
}

/**
 * List contacts response - matches GET /v1/contacts response exactly
 */
export interface ListContactsResponse {
  /** Array of contacts (ContactModel.PublicOutput[]) */
  contacts: Contact[];
  /** Pagination information */
  pagination: {
    /** Current page number */
    page: number;
    /** Number of contacts per page */
    per_page: number;
    /** Total count of contacts */
    total_count: number;
    /** Total number of pages */
    total_pages: number;
  };
}
