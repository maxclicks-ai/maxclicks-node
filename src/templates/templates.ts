import type { Maxclicks } from '../maxclicks';
import type { ErrorResponse } from '../interfaces';
import type { SendTemplateRequest, SendTemplateResponse } from './interfaces/template-interface';

/**
 * Templates API
 *
 * Template Operations:
 * - POST /v1/template/:id/send - Send template with data
 */
export class Templates {
  constructor(private readonly maxclicks: Maxclicks) {}

  /**
   * Send a template with provided data
   * Maps to POST /v1/template/:id/send endpoint
   *
   * The template ID must be a valid UUID. The data object should contain all required
   * properties defined in the template's data schema, including contact, object, event,
   * or JSON data as specified by the template configuration.
   *
   * @param id - The template ID (must be a valid UUID)
   * @param request - Template data to send
   * @example
   * ```typescript
   * // Send template with contact data
   * const result = await maxclicks.templates.send('template-uuid-here', {
   *   data: {
   *     recipient: 'contact-id-or-email',
   *     orderNumber: 'ORD-12345',
   *     items: [
   *       { name: 'Product 1', price: 29.99 },
   *       { name: 'Product 2', price: 49.99 }
   *     ],
   *     total: 79.98
   *   }
   * });
   *
   * if (result.error) {
   *   console.error('Failed to send template:', result.error.error.message);
   * } else {
   *   console.log('Template sent successfully');
   * }
   * ```
   */
  async send(
    id: string,
    request: SendTemplateRequest
  ): Promise<{ data: SendTemplateResponse; error: null } | { data: null; error: ErrorResponse }> {
    // Validate template ID (must be UUID)
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return {
        data: null,
        error: {
          success: false,
          error: {
            code: 'invalid_parameter',
            message: 'Template ID is required',
            details: {
              field: 'id',
              suggestions: ['Provide a valid template UUID'],
            },
          },
          requestId: '',
          timestamp: new Date().toISOString(),
        } as ErrorResponse,
      };
    }

    // Basic UUID format validation (RFC 4122)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id.trim())) {
      return {
        data: null,
        error: {
          success: false,
          error: {
            code: 'invalid_parameter',
            message: 'Invalid template ID format. Template ID must be a valid UUID',
            details: {
              field: 'id',
              provided: id,
              suggestions: [
                'Provide a valid UUID format (e.g., 123e4567-e89b-12d3-a456-426614174000)',
              ],
            },
          },
          requestId: '',
          timestamp: new Date().toISOString(),
        } as ErrorResponse,
      };
    }

    // Validate data object
    if (!request.data || typeof request.data !== 'object' || Array.isArray(request.data)) {
      return {
        data: null,
        error: {
          success: false,
          error: {
            code: 'validation_error',
            message: 'Template data must be a valid object',
            details: {
              field: 'data',
              suggestions: [
                'Provide template data as an object with properties matching your template schema',
                'Example: { data: { recipient: "user@example.com", orderNumber: "ORD-123" } }',
              ],
            },
          },
          requestId: '',
          timestamp: new Date().toISOString(),
        } as ErrorResponse,
      };
    }

    // Validate data is not null
    if (request.data === null) {
      return {
        data: null,
        error: {
          success: false,
          error: {
            code: 'validation_error',
            message: 'Template data cannot be null',
            details: {
              field: 'data',
              suggestions: ['Provide a valid object with template data properties'],
            },
          },
          requestId: '',
          timestamp: new Date().toISOString(),
        } as ErrorResponse,
      };
    }

    return this.maxclicks.post<SendTemplateResponse>(
      `/v1/template/${encodeURIComponent(id.trim())}/send`,
      request
    );
  }
}
