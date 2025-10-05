import { EventSchemaWithDetails } from './event-schema';

export interface GetEventSchemaRequest {
  readonly slug: string;
}

export interface GetEventSchemaResponse extends EventSchemaWithDetails {}
