export interface Object {
  id: string;
  createdAt: string;
  updatedAt: string;
  objectId: string | null;
  notes: string | null;
  tags: string[];
  [key: string]: any;
}
