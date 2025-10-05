import { Object } from './object';

export interface ListObjectsOptions {
  page?: number;
  per_page?: number;
}

export interface ListObjectsResponse {
  readonly objects: readonly Object[];
  readonly pagination: {
    readonly page: number;
    readonly per_page: number;
    readonly total_count: number;
    readonly total_pages: number;
  };
}
