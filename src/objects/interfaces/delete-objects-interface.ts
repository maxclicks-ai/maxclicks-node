export interface DeleteObjectRequest {
  id?: string;
  objectId?: string;
}

export interface DeleteObjectResponse {
  id: string | null;
}

export type DeleteObjectByIdResponse = Record<string, never>;
