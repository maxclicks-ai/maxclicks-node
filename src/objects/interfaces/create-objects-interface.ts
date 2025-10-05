export interface CreateObjectRequest {
  id?: string | null;
  objectId?: string | null;
  notes?: string | null;
  tags?: string[];
  attributeValuesByKey?: Record<string, any>;
}

export interface CreateObjectResponse {
  objectId: string;
}
