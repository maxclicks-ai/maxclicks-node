import { AttributeTarget } from './attribute';

// Based on DELETE /v1/attributes/:id endpoint
export interface DeleteAttributeRequest {
  readonly target: AttributeTarget;
}

// Based on AttributeService.Delete.Response from shared
export interface DeleteAttributeResponse {
  // Empty response object as per public API
}
