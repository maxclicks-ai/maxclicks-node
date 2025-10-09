import type { Maxclicks } from '../maxclicks';
import type { ErrorResponse } from '../interfaces';
import { ErrorHelpers } from '../common/error-helpers';
import type {
  Contact,
  CreateContactRequest,
  CreateContactResponse,
  CreateContactsBatchResponse,
  UpdateContactRequest,
  UpdateContactResponse,
  DeleteContactRequest,
  DeleteContactResponse,
  DeleteContactByIdResponse,
  ListContactsOptions,
  ListContactsResponse,
} from './interfaces';
import { ContactBuilder } from './contact-builder';

/**
 * Contacts - Complete Contact Management
 *
 .
 *
 * @example
 * ```typescript
 * // ===== Contact Operations =====
 * // List contacts with pagination
 * const contacts = await maxclicks.contacts.list({ page: 1, per_page: 25 });
 *
 * // Get single contact
 * const contact = await maxclicks.contacts.retrieve('contact-id');
 * // or
 * const contact = await maxclicks.contacts.getById('contact-id');
 *
 * // Create contact with direct API
 * const contact = await maxclicks.contacts.create({
 *   email: 'user@example.com',
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   attributeValuesByKey: { plan: 'premium' }
 * });
 *
 * // Create with builder (fluent API - consistent with Objects)
 * const contact = await maxclicks.contacts.builder()
 *   .email('user@example.com')
 *   .firstName('John')
 *   .lastName('Doe')
 *   .customAttribute('plan', 'premium')
 *   .customAttribute('industry', 'technology')
 *   .autoCreate(true)  // Auto-create missing custom attributes
 *   .execute();
 *
 * // Quick create helper
 * const contact = await maxclicks.contacts.quick('user@example.com', 'John', 'Doe');
 *
 * // Batch create multiple contacts
 * const result = await maxclicks.contacts.batch().create([
 *   { email: 'user1@example.com', firstName: 'John' },
 *   { email: 'user2@example.com', firstName: 'Jane' }
 * ]);
 *
 * // Update contact with direct API
 * const updated = await maxclicks.contacts.update('contact-id', {
 *   firstName: 'Jane',
 *   customAttribute: { plan: 'enterprise' }
 * });
 *
 * // Update with builder
 * const updated = await maxclicks.contacts.builder()
 *   ._markAsUpdate('contact-id')
 *   .firstName('Jane')
 *   .customAttribute('plan', 'enterprise')
 *   .execute();
 *
 * // Delete contact
 * await maxclicks.contacts.deleteById('contact-id');
 * ```
 */

/**
 * Enhanced batch operations for multiple contacts
 */
interface BatchOperations {
  /**
   * Create multiple contacts in a single request
   * Maps to POST /v1/contacts/batch endpoint
   * @param contacts - Array of contact data (matches ContactModel.PublicInput[] exactly)
   * @example
   * ```typescript
   * const result = await maxclicks.contacts.batch().create([
   *   { email: 'user1@example.com', firstName: 'John' },
   *   { email: 'user2@example.com', firstName: 'Jane' }
   * ]);
   * ```
   */
  create(
    contacts: CreateContactRequest[]
  ): Promise<
    { data: CreateContactsBatchResponse; error: null } | { data: null; error: ErrorResponse }
  >;
}

export class Contacts {
  constructor(private readonly maxclicks: Maxclicks) {}

  /**
   * Create a new contact builder for fluent API
   * @example
   * ```typescript
   * const contact = await maxclicks.contacts.builder()
   *   .email('user@example.com')
   *   .firstName('John')
   *   .lastName('Doe')
   *   .customAttribute('plan', 'premium')
   *   .create();
   * ```
   */
  builder(): ContactBuilder {
    return new ContactBuilder(this.maxclicks);
  }

  /**
   * Create a new contact with fluent builder pattern or direct API
   * Maps to POST /v1/contacts endpoint
   * Body matches ContactModel.PublicInput exactly
   *
   * @example
   * ```typescript
   * // Fluent API
   * const contact = await maxclicks.contacts
   *   .create()
   *   .email('user@example.com')
   *   .firstName('John')
   *   .lastName('Doe')
   *   .customAttribute('plan', 'premium')
   *   .execute();
   *
   * // Direct API (matches ContactModel.PublicInput exactly)
   * const contact = await maxclicks.contacts.create({
   *   email: 'user@example.com',
   *   firstName: 'John',
   *   lastName: 'Doe',
   *   attributeValuesByKey: { plan: 'premium' }
   * });
   * ```
   */
  create(): ContactBuilder;
  create(
    contact: CreateContactRequest
  ): Promise<{ data: CreateContactResponse; error: null } | { data: null; error: ErrorResponse }>;
  create(contact?: CreateContactRequest) {
    if (contact) {
      // Direct API call - body matches ContactModel.PublicInput
      return this.maxclicks.post<CreateContactResponse>('/v1/contacts', contact);
    }
    // Return builder for fluent API
    return new ContactBuilder(this.maxclicks);
  }

  /**
   * List contacts with optional filtering and pagination
   * Maps to GET /v1/contacts
   * Returns ContactModel.PublicOutput[] with pagination info
   *
   * @param options - Filtering and pagination options (matches query params exactly)
   * @example
   * ```typescript
   * // List all contacts
   * const result = await maxclicks.contacts.list();
   * console.log('Contacts:', result.data?.contacts);
   * console.log('Pagination:', result.data?.pagination);
   *
   * // Filter by name (partial match)
   * const result = await maxclicks.contacts.list({
   *   name: 'John'
   * });
   *
   * // Filter by exact email
   * const result = await maxclicks.contacts.list({
   *   email: 'user@example.com'
   * });
   *
   * // Pagination (1-based indexing)
   * const result = await maxclicks.contacts.list({
   *   page: 1,
   *   per_page: 25
   * });
   * ```
   */
  async list(
    options: ListContactsOptions = {}
  ): Promise<{ data: ListContactsResponse; error: null } | { data: null; error: ErrorResponse }> {
    const queryParams = new URLSearchParams();

    if (options.name) queryParams.set('name', options.name);
    if (options.email) queryParams.set('email', options.email);
    if (options.page !== undefined) queryParams.set('page', options.page.toString());
    if (options.per_page !== undefined) queryParams.set('per_page', options.per_page.toString());

    const queryString = queryParams.toString();
    const path = `/v1/contacts${queryString ? `?${queryString}` : ''}`;

    return this.maxclicks.get<ListContactsResponse>(path);
  }

  /**
   * Retrieve a specific contact by ID
   * Maps to GET /v1/contacts/:id
   * Returns ContactModel.PublicOutput
   *
   * @param id - Contact ID
   * @example
   * ```typescript
   * const contact = await maxclicks.contacts.retrieve('contact-id');
   * if (contact.error) {
   *   console.error('Contact not found:', contact.error);
   * } else {
   *   console.log('Contact:', contact.data);
   * }
   * ```
   */
  async retrieve(
    id: string
  ): Promise<{ data: Contact; error: null } | { data: null; error: ErrorResponse }> {
    if (!id) {
      return {
        data: null,
        error: ErrorHelpers.invalidParameter('id', 'a valid contact ID'),
      };
    }

    return this.maxclicks.get<Contact>(`/v1/contacts/${encodeURIComponent(id)}`);
  }

  /**
   * Alias for retrieve method - get a specific contact by its ID
   * Maps to GET /v1/contacts/:id
   * Returns the full ContactModel.PublicOutput structure wrapped in expected format
   *
   * @param id - Contact ID to retrieve
   * @example
   * ```typescript
   * const result = await maxclicks.contacts.getById('contact-id');
   * if (result.error) {
   *   console.error('Contact not found:', result.error);
   * } else {
   *   console.log('Contact:', result.data.contact);
   * }
   * ```
   */
  async getById(
    id: string
  ): Promise<{ data: Contact; error: null } | { data: null; error: ErrorResponse }> {
    return this.retrieve(id);
  }

  /**
   * Update an existing contact with fluent builder pattern or direct API
   * Maps to PUT /v1/contacts/:id
   * Body matches ContactModel.PublicInput without id (ID comes from URL params)
   *
   * @param id - Contact ID to update
   * @param contact - Contact data to update (optional for builder pattern)
   * @example
   * ```typescript
   * // Fluent API
   * const result = await maxclicks.contacts
   *   .update('contact-id')
   *   .firstName('Jane')
   *   .customAttribute('plan', 'enterprise')
   *   .execute();
   *
   * // Direct API (matches ContactModel.PublicInput without id)
   * const result = await maxclicks.contacts.update('contact-id', {
   *   firstName: 'Jane',
   *   lastName: 'Smith',
   *   attributeValuesByKey: { plan: 'enterprise' }
   * });
   * ```
   */
  update(id: string): ContactBuilder;
  update(
    id: string,
    contact: UpdateContactRequest
  ): Promise<{ data: UpdateContactResponse; error: null } | { data: null; error: ErrorResponse }>;
  update(id: string, contact?: UpdateContactRequest) {
    if (!id) {
      throw new Error('Contact ID is required for update operations');
    }

    if (contact) {
      // Direct API call - body matches ContactModel.PublicInput without id
      return this.maxclicks.put<UpdateContactResponse>(
        `/v1/contacts/${encodeURIComponent(id)}`,
        contact
      );
    }

    // Return builder for fluent API
    return new ContactBuilder(this.maxclicks)._markAsUpdate(id);
  }

  /**
   * Alias for update method - update an existing contact by ID
   * Maps to PUT /v1/contacts/:id
   * Body matches ContactModel.PublicInput without id (ID comes from URL params)
   *
   * @param id - Contact ID to update
   * @param contact - Contact data to update
   * @example
   * ```typescript
   * const result = await maxclicks.contacts.updateById('contact-id', {
   *   firstName: 'Jane',
   *   lastName: 'Smith'
   * });
   * ```
   */
  async updateById(
    id: string,
    contact: UpdateContactRequest
  ): Promise<{ data: UpdateContactResponse; error: null } | { data: null; error: ErrorResponse }> {
    return this.update(id, contact);
  }

  /**
   * Delete a contact by ID
   * Maps to DELETE /v1/contacts/:id
   * Returns 204 status with empty body
   *
   * @param id - Contact ID to delete
   * @example
   * ```typescript
   * const result = await maxclicks.contacts.deleteById('contact-id');
   * if (result.error) {
   *   console.error('Delete failed:', result.error);
   * } else {
   *   console.log('Contact deleted successfully');
   * }
   * ```
   */
  async deleteById(
    id: string
  ): Promise<
    { data: DeleteContactByIdResponse; error: null } | { data: null; error: ErrorResponse }
  > {
    if (!id) {
      return {
        data: null,
        error: ErrorHelpers.invalidParameter('id', 'a valid contact ID'),
      };
    }

    return this.maxclicks.delete<DeleteContactByIdResponse>(
      `/v1/contacts/${encodeURIComponent(id)}`
    );
  }

  /**
   * Delete a contact by identifier (id, userId, email, or phone)
   * Maps to DELETE /v1/contacts
   * Body matches DeleteContactRequest exactly
   *
   * @param request - Contact identifier for deletion
   * @example
   * ```typescript
   * // Delete by email
   * const result = await maxclicks.contacts.delete({
   *   email: 'user@example.com'
   * });
   *
   * // Delete by userId
   * const result = await maxclicks.contacts.delete({
   *   userId: 'external-user-123'
   * });
   *
   * // Delete by ID
   * const result = await maxclicks.contacts.delete({
   *   id: 'contact-id'
   * });
   * ```
   */
  async delete(
    request: DeleteContactRequest
  ): Promise<{ data: DeleteContactResponse; error: null } | { data: null; error: ErrorResponse }> {
    if (!request.id && !request.userId && !request.email && !request.phone) {
      return {
        data: null,
        error: ErrorHelpers.validation(
          'At least one identifier is required (id, userId, email, or phone)',
          {
            suggestions: [
              'Provide an id: { id: "contact-id" }',
              'Provide a userId: { userId: "user-123" }',
              'Provide an email: { email: "user@example.com" }',
              'Provide a phone: { phone: "+1234567890" }',
            ],
          }
        ),
      };
    }

    return this.maxclicks.delete<DeleteContactResponse>('/v1/contacts', request);
  }

  /**
   * Batch operations for multiple contacts
   * Maps to POST /v1/contacts/batch
   * Body is ContactModel.PublicInput[] (array sent directly as body)
   *
   * @example
   * ```typescript
   * const result = await maxclicks.contacts.batch().create([
   *   { email: 'user1@example.com', firstName: 'John' },
   *   { email: 'user2@example.com', firstName: 'Jane' },
   *   { email: 'user3@example.com', firstName: 'Bob' }
   * ]);
   *
   * console.log('Created contact IDs:', result.data?.ids);
   * ```
   */
  batch(): BatchOperations {
    return {
      create: async (contacts: CreateContactRequest[]) => {
        if (!Array.isArray(contacts) || contacts.length === 0) {
          return {
            data: null,
            error: ErrorHelpers.validation('Contacts array is required and must not be empty', {
              suggestions: ['Provide an array of contact objects'],
            }),
          };
        }

        // Basic shape validation to help developers catch null/primitive entries early
        const hasInvalidEntry = contacts.some((c) => !c || typeof c !== 'object');
        if (hasInvalidEntry) {
          return {
            data: null,
            error: ErrorHelpers.invalidParameter('contacts', 'an array of contact objects'),
          };
        }

        // Send array directly as body (matches ContactModel.PublicInput[] exactly)
        return this.maxclicks.post<CreateContactsBatchResponse>('/v1/contacts/batch', contacts);
      },
    };
  }

  /**
   * Create multiple contacts in a single batch request
   * Convenience method that wraps batch().create()
   *
   * @param contacts - Array of contact data
   * @example
   * ```typescript
   * const result = await maxclicks.contacts.createBatch([
   *   { email: 'user1@example.com', firstName: 'John' },
   *   { email: 'user2@example.com', firstName: 'Jane' }
   * ]);
   * ```
   */
  async createBatch(
    contacts: CreateContactRequest[]
  ): Promise<
    { data: CreateContactsBatchResponse; error: null } | { data: null; error: ErrorResponse }
  > {
    return this.batch().create(contacts);
  }

  /**
   * Quick contact creation helper
   * @param email - Contact email
   * @param firstName - Contact first name
   * @param lastName - Contact last name (optional)
   * @example
   * ```typescript
   * const contact = await maxclicks.contacts.quick(
   *   'user@example.com',
   *   'John',
   *   'Doe'
   * );
   * ```
   */
  async quick(
    email: string,
    firstName: string,
    lastName?: string
  ): Promise<{ data: CreateContactResponse; error: null } | { data: null; error: ErrorResponse }> {
    // Light email validation for immediate feedback
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return {
        data: null,
        error: ErrorHelpers.invalidParameter('email', 'a valid email address'),
      };
    }
    const contactData: CreateContactRequest = {
      email,
      firstName,
      ...(lastName && { lastName }),
    };

    return this.create(contactData);
  }
}
