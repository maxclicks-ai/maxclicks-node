import type { HttpClient } from '../core/HttpClient'
import type { RedirectResult } from '../types'

/** Email recipient actions. These endpoints are unauthenticated. */
export class EmailsResource {
  constructor(private readonly http: HttpClient) {}

  /** Performs an RFC 8058 one-click unsubscribe for a sent email, following the redirect. */
  unsubscribeOneClick(emailId: string): Promise<RedirectResult> {
    return this.http.requestRedirect({
      method: 'POST',
      path: `/emails/${encodeURIComponent(emailId)}/unsubscribe`,
      formBody: { 'List-Unsubscribe': 'One-Click' },
      auth: false,
    })
  }
}
