// Export all contact-related interfaces
export type {
  Contact,
  ContactInput,
  ContactInputWithId,
  PublicAttributeValuesByKey,
} from './contact';
export type {
  CreateContactRequest,
  CreateContactResponse,
  CreateContactsBatchResponse,
} from './create-contacts-interface';
export type { UpdateContactRequest, UpdateContactResponse } from './update-contact-interface';
export type {
  DeleteContactRequest,
  DeleteContactResponse,
  DeleteContactByIdResponse,
} from './delete-contacts-interface';
export type { ListContactsOptions, ListContactsResponse } from './list-contacts-interface';
