// Json type - matching API's Json payload type
type Json = null | string | number | boolean | readonly Json[] | { readonly [key: string]: Json };

export interface CreateEventRequest {
  eventId?: string;
  name: string;
  slug: string;
  userId?: string;
  payload: Json;
}

export interface CreateEventResponse {}
