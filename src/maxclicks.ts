import type { ErrorResponse } from './interfaces';
import { version } from '../package.json';
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

const defaultBaseUrl = 'https://api.maxclicks.ai';
const defaultUserAgent = `maxclicks-node:${version}`;

const baseUrl =
  typeof process !== 'undefined' && process.env
    ? process.env.MAXCLICKS_BASE_URL || defaultBaseUrl
    : defaultBaseUrl;
const userAgent =
  typeof process !== 'undefined' && process.env
    ? process.env.MAXCLICKS_USER_AGENT || defaultUserAgent
    : defaultUserAgent;

export class Maxclicks {
  private readonly headers: Headers;
  readonly apiKeys = new ApiKeys(this);
  readonly events = new Events(this);
  readonly contacts = new Contacts(this);
  readonly objects = new Objects(this);
  readonly attributes = new Attributes(this);
  readonly templates = new Templates(this);

  constructor(readonly key?: string) {
    if (!key) {
      if (typeof process !== 'undefined' && process.env) {
        this.key = process.env.MAXCLICKS_API_KEY;
      }

      if (!this.key) {
        throw new Error(
          'Missing API key. Pass it to the constructor `new Maxclicks("80833935-7bd7-4822-bb69-717c455589b1")`'
        );
      }
    }

    this.headers = new Headers({
      Authorization: `Bearer ${this.key}`,
      'User-Agent': userAgent,
      'Content-Type': 'application/json',
    });
  }

  async fetchRequest<T>(
    path: string,
    options = {}
  ): Promise<{ data: T; error: null } | { data: null; error: ErrorResponse }> {
    try {
      const response = await fetch(`${baseUrl}${path}`, options);

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
