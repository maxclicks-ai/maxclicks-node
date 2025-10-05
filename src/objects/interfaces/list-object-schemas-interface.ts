import { ObjectSchema } from './object-schema';

export interface ListObjectSchemasResponse {
  readonly objects: readonly ObjectSchema[];
  readonly pagination: {
    readonly page: number;
    readonly per_page: number;
    readonly total_count: number;
    readonly total_pages: number;
  };
}
