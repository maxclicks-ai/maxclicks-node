import type { Maxclicks } from '../maxclicks';
import type {
  CreateContactRequest,
  CreateContactResponse,
  UpdateContactRequest,
  UpdateContactResponse,
  PublicAttributeValuesByKey,
} from './interfaces';
import type { ErrorResponse } from '../interfaces';
import { ErrorHelpers } from '../common/error-helpers';
import { AttributeHelper } from './helpers/contact-attribute-helper';

/**
 * Validation result interface
 */
interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Contact Builder providing fluent API for creating and updating contacts
 * Based on ContactModel.PublicInput from shared package
 *
 * @example
 * ```typescript
 * // Create a new contact
 * const contact = await maxclicks.contacts
 *   .create()
 *   .email('user@example.com')
 *   .firstName('John')
 *   .lastName('Doe')
 *   .execute();
 *
 * // Update existing contact with auto-create for custom attributes
 * const updated = await maxclicks.contacts
 *   .update('contact-id')
 *   .phone('+1234567890')
 *   .customAttribute('plan', 'premium')
 *   .autoCreate(true)  // Auto-create missing custom attributes
 *   .execute();
 * ```
 */
export class ContactBuilder {
  private data: Partial<CreateContactRequest> = {};
  private isUpdate = false;
  private contactId?: string;
  private attributeHelper: AttributeHelper;
  private autoCreateAttributes = false;

  constructor(private readonly maxclicks: Maxclicks) {
    this.attributeHelper = new AttributeHelper(maxclicks);
  }

  /**
   * Set the contact's email address
   * @param email - Valid email address
   * @example
   * ```typescript
   * const contact = await maxclicks.contacts
   *   .create()
   *   .email('user@example.com')
   *   .execute();
   * ```
   */
  email(email: string): this {
    this.data.email = email;
    return this;
  }

  /**
   * Set the contact's first name
   * @param firstName - First name
   */
  firstName(firstName: string): this {
    this.data.firstName = firstName;
    return this;
  }

  /**
   * Set the contact's last name
   * @param lastName - Last name
   */
  lastName(lastName: string): this {
    this.data.lastName = lastName;
    return this;
  }

  /**
   * Set the contact's phone number
   * @param phone - Phone number
   */
  phone(phone: string): this {
    this.data.phone = phone;
    return this;
  }

  /**
   * Set the contact's website URL
   * @param website - Website URL
   */
  website(website: string): this {
    this.data.website = website;
    return this;
  }

  /**
   * Set the contact's full name
   * @param fullName - Full name
   */
  fullName(fullName: string): this {
    this.data.fullName = fullName;
    return this;
  }

  /**
   * Set the contact's avatar URL
   * @param avatarUrl - Avatar/profile picture URL
   */
  avatarUrl(avatarUrl: string): this {
    this.data.avatarUrl = avatarUrl;
    return this;
  }

  /**
   * Set the contact's user ID for integration
   * @param userId - External user ID for integration
   */
  userId(userId: string): this {
    this.data.userId = userId;
    return this;
  }

  /**
   * Set the contact's user group classification
   * @param userGroup - User group classification
   */
  userGroup(userGroup: string): this {
    this.data.userGroup = userGroup;
    return this;
  }

  /**
   * Set notes about the contact
   * @param notes - Notes or comments about the contact
   */
  notes(notes: string): this {
    this.data.notes = notes;
    return this;
  }

  /**
   * Alias for notes() method
   * @param note - Notes or comments about the contact
   */
  note(note: string): this {
    return this.notes(note);
  }

  /**
   * Add a tag to the contact
   * @param tag - Tag to add to the contact
   * @example
   * ```typescript
   * const contact = await maxclicks.contacts.builder()
   *   .email('user@example.com')
   *   .tag('vip')
   *   .tag('customer')
   *   .create();
   * ```
   */
  tag(tag: string): this {
    if (!this.data.tags) {
      this.data.tags = [];
    }
    if (!this.data.tags.includes(tag)) {
      this.data.tags.push(tag);
    }
    return this;
  }

  /**
   * Set multiple tags at once
   * @param tags - Array of tags to set
   */
  tags(tags: string[]): this {
    this.data.tags = [...new Set(tags)]; // Remove duplicates
    return this;
  }

  /**
   * Set a custom attribute value
   * @param key - The attribute key
   * @param value - The attribute value
   * @example
   * ```typescript
   * const contact = await maxclicks.contacts
   *   .create()
   *   .email('user@example.com')
   *   .customAttribute('plan', 'premium')
   *   .customAttribute('signupDate', new Date().toISOString())
   *   .execute();
   * ```
   */
  customAttribute(key: string, value: any): this {
    if (!this.data.attributeValuesByKey) {
      this.data.attributeValuesByKey = {};
    }
    (this.data.attributeValuesByKey as PublicAttributeValuesByKey)[key] =
      value as PublicAttributeValuesByKey[string];
    return this;
  }

  /**
   * Set multiple custom attributes at once
   * @param attributes - Object containing attribute key-value pairs
   */
  customAttributes(attributes: Partial<PublicAttributeValuesByKey>): this {
    if (!this.data.attributeValuesByKey) {
      this.data.attributeValuesByKey = {};
    }
    Object.assign(this.data.attributeValuesByKey as PublicAttributeValuesByKey, attributes);
    return this;
  }

  /**
   * Enable auto-creation of missing custom attributes
   * When enabled, the builder will automatically create any custom attributes
   * that don't exist in your space before creating/updating the contact.
   *
   * @param enable - Whether to enable auto-creation (default: true)
   * @example
   * ```typescript
   * const contact = await maxclicks.contacts
   *   .create()
   *   .email('user@example.com')
   *   .customAttribute('plan', 'premium')
   *   .customAttribute('industry', 'technology')
   *   .autoCreate(true)  // Auto-create missing attributes
   *   .execute();
   * ```
   */
  autoCreate(enable: boolean = true): this {
    this.autoCreateAttributes = enable;
    return this;
  }

  /**
   * Basic validation for required fields
   * @private
   */
  private validate(): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    // Email is only required for create operations, not updates
    if (!this.isUpdate) {
      if (!this.data.email) {
        errors.push({
          field: 'email',
          message: 'Email is required for creating new contacts',
        });
      } else if (!this.isValidEmail(this.data.email)) {
        errors.push({
          field: 'email',
          message: 'Invalid email format',
        });
      }
    } else {
      // For updates, only validate email format if provided
      if (this.data.email && !this.isValidEmail(this.data.email)) {
        errors.push({
          field: 'email',
          message: 'Invalid email format',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Preview the request that would be sent without executing it
   * @returns The request payload
   */
  preview(): CreateContactRequest | UpdateContactRequest {
    return { ...this.data };
  }

  /**
   * Execute the contact creation or update with intelligent attribute handling
   * @returns Promise with success data or enhanced error
   */
  async execute(): Promise<
    | { data: CreateContactResponse | UpdateContactResponse; error: null }
    | { data: null; error: ErrorResponse }
  > {
    try {
      // Basic validation first
      const validation = this.validate();
      if (!validation.isValid) {
        return {
          data: null,
          error: ErrorHelpers.validation(validation.errors.map((e) => e.message).join(', ')),
        };
      }

      // Intelligent custom attribute validation using AttributeHelper
      if (
        this.data.attributeValuesByKey &&
        Object.keys(this.data.attributeValuesByKey).length > 0
      ) {
        const attributeValidation = await this.attributeHelper.validateCustomAttributes(
          this.data.attributeValuesByKey
        );

        // If there are missing attributes and auto-create is enabled, create them
        if (attributeValidation.missingAttributes.length > 0 && this.autoCreateAttributes) {
          const creationResult = await this.attributeHelper.createMissingAttributes(
            attributeValidation.missingAttributes
          );

          // Re-validate after creation
          const revalidation = await this.attributeHelper.validateCustomAttributes(
            this.data.attributeValuesByKey
          );

          if (!revalidation.isValid) {
            return {
              data: null,
              error: ErrorHelpers.validation(revalidation.errors.map((e) => e.message).join(', ')),
            };
          }
        } else if (!attributeValidation.isValid) {
          // Auto-create not enabled and there are validation errors
          return {
            data: null,
            error: ErrorHelpers.validation(
              attributeValidation.errors.map((e) => e.message).join(', ')
            ),
          };
        }
      }

      // Execute the request
      if (this.isUpdate) {
        if (!this.contactId) {
          return {
            data: null,
            error: ErrorHelpers.invalidParameter(
              'contactId',
              'a valid contact ID for update operation'
            ),
          };
        }
        return await this.maxclicks.contacts.update(
          this.contactId,
          this.data as UpdateContactRequest
        );
      }

      const response = await this.maxclicks.contacts.create(this.data as CreateContactRequest);

      return response;
    } catch (error) {
      return {
        data: null,
        error: ErrorHelpers.internalServer(
          error instanceof Error ? error.message : 'Unknown error occurred'
        ),
      };
    }
  }

  /**
   * Alias for execute() - creates or updates the contact
   * @returns Promise with success data or enhanced error
   */
  async create(): Promise<
    | { data: CreateContactResponse | UpdateContactResponse; error: null }
    | { data: null; error: ErrorResponse }
  > {
    return this.execute();
  }

  /**
   * Internal method to mark this builder as an update operation
   * @private
   */
  _markAsUpdate(contactId: string): this {
    this.isUpdate = true;
    this.contactId = contactId;
    return this;
  }

  /**
   * Validate email format
   * @private
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export default ContactBuilder;
