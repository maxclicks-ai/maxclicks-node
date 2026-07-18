import type { HttpClient } from '../core/HttpClient'
import type { FormSubmission, FormSubmissionResult, RedirectResult } from '../types'

/** Submit public forms and confirm double opt-ins. These endpoints are unauthenticated. */
export class FormsResource {
  constructor(private readonly http: HttpClient) {}

  /** Submits a public form. Returns the created contact id, or a pending double opt-in status. */
  submit(formId: string, submission: FormSubmission): Promise<FormSubmissionResult> {
    return this.http.request<FormSubmissionResult>({
      method: 'POST',
      path: `/forms/${encodeURIComponent(formId)}/submit`,
      body: submission,
      auth: false,
    })
  }

  /** Redeems a double opt-in confirmation token, following the redirect to its landing page. */
  confirmDoubleOptIn(formId: string, token: string): Promise<RedirectResult> {
    return this.http.requestRedirect({
      method: 'GET',
      path: `/forms/${encodeURIComponent(formId)}/confirm/${encodeURIComponent(token)}`,
      auth: false,
    })
  }
}
