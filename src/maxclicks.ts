import type { ErrorResponse } from './interfaces';
import { version } from '../package.json';
import { createLogger, type ILogger, type LogLevel } from './common/logger';
import { ApiKeys } from './api-keys/api-keys';
import { Events } from './events/events';
import { Contacts } from './contacts/contacts';
import { Objects } from './objects/objects';
import { Attributes } from './attributes/attributes';
import { Templates } from './templates/templates';
import { PostOptions } from './common/post-option.interface';
import { GetOptions } from './common/get-option.interface';
import { PutOptions } from './common/put-option.interface';
import { PatchOptions } from './common/patch-option.interface';

/**
 * Configuration options for the Maxclicks SDK
 */
export interface MaxclicksConfig {
  /**
   * API key for authentication (required)
   * Get your API key from https://app.maxclicks.ai/settings/developers
   */
  apiKey: string;

  /**
   * Base URL for the Maxclicks API
   * @default 'https://api.maxclicks.ai'
   */
  baseUrl?: string;

  /**
   * Custom User-Agent header
   * @default 'maxclicks-node:{version}'
   */
  userAgent?: string;

  /**
   * Log level for SDK operations
   * @default 'silent'
   */
  logLevel?: LogLevel;
}

const DEFAULT_BASE_URL = 'https://api.maxclicks.ai';
const DEFAULT_USER_AGENT = `maxclicks-node:${version}`;

export class Maxclicks {
  private readonly headers: Record<string, string>;
  public baseUrl: string;
  public readonly logger: ILogger;
  public readonly key: string;
  readonly apiKeys = new ApiKeys(this);
  readonly events = new Events(this);
  readonly contacts = new Contacts(this);
  readonly objects = new Objects(this);
  readonly attributes = new Attributes(this);
  readonly templates = new Templates(this);

  /**
   * Create a new Maxclicks SDK instance
   *
   * @param apiKeyOrConfig - API key string or configuration object
   * @example
   * ```typescript
   * // Simple initialization with API key
   * const maxclicks = new Maxclicks('max_your_api_key');
   *
   * // Advanced initialization with configuration
   * const maxclicks = new Maxclicks({
   *   apiKey: 'max_your_api_key',
   *   baseUrl: 'https://api.maxclicks.ai',
   *   logLevel: 'debug'
   * });
   * ```
   */
  constructor(apiKeyOrConfig: string | MaxclicksConfig) {
    // Parse configuration
    const config: MaxclicksConfig =
      typeof apiKeyOrConfig === 'string' ? { apiKey: apiKeyOrConfig } : apiKeyOrConfig;

    // Validate API key
    if (!config.apiKey) {
      throw new Error(
        'Maxclicks API key is required. Pass it to the constructor: new Maxclicks("max_your_api_key") or get one at https://app.maxclicks.ai/settings/developers'
      );
    }

    this.key = config.apiKey;
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;

    const userAgent = config.userAgent || DEFAULT_USER_AGENT;

    this.headers = {
      Authorization: `Bearer ${this.key}`,
      'User-Agent': userAgent,
      'Content-Type': 'application/json',
    };

    this.logger = createLogger(config.logLevel || 'silent');
  }

  /**
   * Configure the SDK logger level programmatically
   * Levels: 'silent' | 'error' | 'warn' | 'info' | 'debug'
   */
  setLogLevel(level: LogLevel) {
    this.logger.setLevel(level);
  }

  async fetchRequest<T>(
    path: string,
    options = {}
  ): Promise<{ data: T; error: null } | { data: null; error: ErrorResponse }> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, options);

      if (!response.ok) {
        try {
          const rawError = await response.text();
          const parsedError = JSON.parse(rawError) as ErrorResponse;

          return {
            data: null,
            error: parsedError,
          };
        } catch (err) {
          if (err instanceof SyntaxError) {
            this.logger.error('Failed to parse error response JSON', err);
            return {
              data: null,
              error: {
                success: false,
                error: {
                  code: 'application_error',
                  message:
                    'Internal server error. We are unable to process your request right now, please try again later.',
                },
                requestId: '',
                timestamp: new Date().toISOString(),
              } as ErrorResponse,
            };
          }

          const errorResponse: ErrorResponse = {
            success: false,
            error: {
              code: 'application_error',
              message: response.statusText || 'Network error occurred',
            },
            requestId: '',
            timestamp: new Date().toISOString(),
          };

          if (err instanceof Error) {
            this.logger.error('Fetch error', err);
            errorResponse.error.message = err.message;
          }

          return { data: null, error: errorResponse };
        }
      }

      const responseData = (await response.json()) as any;

      // Handle standardized success response format
      if (responseData.success === true && 'data' in responseData) {
        return { data: responseData.data as T, error: null };
      }

      // Assume direct data response for endpoints that return data directly
      return { data: responseData as T, error: null };
    } catch (e) {
      this.logger.error('Network or fetch request error', e);
      return {
        data: null,
        error: {
          success: false,
          error: {
            code: 'application_error',
            message: 'Unable to fetch data. The request could not be resolved.',
          },
          requestId: '',
          timestamp: new Date().toISOString(),
        } as ErrorResponse,
      };
    }
  }

  async post<T>(path: string, entity?: unknown, options: PostOptions = {}) {
    const headers = { ...this.headers, ...options.headers };
    const requestOptions = {
      method: 'POST',
      body: JSON.stringify(entity),
      ...options,
      headers,
    };

    return this.fetchRequest<T>(path, requestOptions);
  }
  async get<T>(path: string, options: GetOptions = {}) {
    const headers = { ...this.headers, ...options.headers };
    const requestOptions = {
      method: 'GET',
      ...options,
      headers,
    };

    return this.fetchRequest<T>(path, requestOptions);
  }
  async put<T>(path: string, entity: unknown, options: PutOptions = {}) {
    const headers = { ...this.headers, ...options.headers };
    const requestOptions = {
      method: 'PUT',
      body: JSON.stringify(entity),
      ...options,
      headers,
    };

    return this.fetchRequest<T>(path, requestOptions);
  }

  async patch<T>(path: string, entity: unknown, options: PatchOptions = {}) {
    const headers = { ...this.headers, ...options.headers };
    const requestOptions = {
      method: 'PATCH',
      body: JSON.stringify(entity),
      ...options,
      headers,
    };

    return this.fetchRequest<T>(path, requestOptions);
  }

  async delete<T>(path: string, query?: unknown) {
    const requestOptions: any = {
      method: 'DELETE',
      headers: this.headers,
    };

    // Only include body if query is provided and not undefined
    if (query !== undefined && query !== null) {
      requestOptions.body = JSON.stringify(query);
    }

    return this.fetchRequest<T>(path, requestOptions);
  }
}
