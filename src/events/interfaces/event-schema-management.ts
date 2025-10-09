import { Json } from '../helpers/json-schema-helper';

export interface UpdateEventSchemaByIdRequest {
  readonly id: string;
  readonly schemaUpdates: {
    readonly name?: string;
    readonly slug?: string;
    readonly description?: string | null;
    readonly payloadJsonSchema?: Json;
  };
}

export interface UpdateEventSchemaByIdResponse {
  readonly schemaUpdatedAt: number;
}
