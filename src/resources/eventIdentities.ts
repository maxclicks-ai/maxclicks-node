import type { HttpClient } from '../core/HttpClient'
import type { EventIdentityInput, EventIdentityResult } from '../types'

/** Links anonymous browser identities to contacts. Call it from your authenticated server, never the browser. */
export class EventIdentitiesResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Binds an anonymous browser identity to a contact, or unbinds it with `contactId: null`. Retry with the same
   * `operationId` and body; a stale `expectedAliasRevision` is refused so concurrent changes cannot overwrite each other.
   */
  identify(input: EventIdentityInput): Promise<EventIdentityResult> {
    return this.http.request<EventIdentityResult>({ method: 'POST', path: '/event-identities', body: input })
  }
}
