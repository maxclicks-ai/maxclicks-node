import type { Maxclicks } from '../maxclicks';
import type { ApiKeyCheck } from './interfaces/api-key';

/**
 * API Keys resource for validating and managing API keys
 */
export class ApiKeys {
  constructor(private readonly maxclicks: Maxclicks) {}

  /**
   * Validate the current API key
   * @returns Promise with validation result and space information
   * @example
   * ```typescript
   * const maxclicks = new Maxclicks('max_123');
   * const result = await maxclicks.apiKeys.check();
   *
   * if (result.error) {
   *   console.error('API key validation failed:', result.error.message);
   * } else {
   *   console.log('API key is valid for space:', result.data.spaceName);
   * }
   * ```
   */
  async check() {
    return this.maxclicks.get<ApiKeyCheck>('/v1/misc/api-key/check');
  }
}
