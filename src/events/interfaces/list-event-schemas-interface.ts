import { EventSchema } from './event-schema';

export interface ListEventSchemasRequest {
  readonly page?: number;
  readonly per_page?: number;
}

export interface ListEventSchemasResponse {
  readonly events: readonly EventSchema[];
  readonly pagination: {
    readonly page: number;
    readonly per_page: number;
    readonly total_count: number;
    readonly total_pages: number;
  };
}
