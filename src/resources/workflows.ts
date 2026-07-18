import type { HttpClient } from '../core/HttpClient'
import { fetchFirstPage, Page, type PageFetcher } from '../pagination'
import type { Deleted, ListParams, Workflow, WorkflowRun } from '../types'

/** Trigger workflows through their incoming-webhook steps and inspect workflows and their runs. */
export class WorkflowsResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Starts a workflow run from an incoming-webhook step. `body` is validated
   * server-side against the step's configured JSON schema.
   */
  trigger(workflowStepReference: string, body: unknown = {}): Promise<void> {
    return this.http.requestVoid({
      method: 'POST',
      path: `/workflows/${encodeURIComponent(workflowStepReference)}`,
      body,
    })
  }

  /** Lists the space's workflows. Paginated. */
  list(params: ListParams = {}): Promise<Page<Workflow>> {
    const fetcher: PageFetcher<Workflow> = ({ limit, offset }) =>
      this.http.requestPage<Workflow>({ method: 'GET', path: '/workflows', query: { limit, offset } })
    return fetchFirstPage(fetcher, params)
  }

  /** Fetches a workflow by id. */
  get(id: string): Promise<Workflow> {
    return this.http.request<Workflow>({ method: 'GET', path: `/workflows/${encodeURIComponent(id)}` })
  }

  /** Permanently deletes a workflow. */
  delete(id: string): Promise<Deleted> {
    return this.http.request<Deleted>({ method: 'DELETE', path: `/workflows/${encodeURIComponent(id)}` })
  }

  /** Pauses a workflow so no new runs start; in-flight runs finish. Returns the updated workflow. */
  pause(id: string): Promise<Workflow> {
    return this.http.request<Workflow>({ method: 'POST', path: `/workflows/${encodeURIComponent(id)}/pause` })
  }

  /** Unpauses a workflow so new runs can start again. Returns the updated workflow. */
  unpause(id: string): Promise<Workflow> {
    return this.http.request<Workflow>({ method: 'POST', path: `/workflows/${encodeURIComponent(id)}/unpause` })
  }

  /** Lists a workflow's runs. Paginated. */
  listRuns(id: string, params: ListParams = {}): Promise<Page<WorkflowRun>> {
    const fetcher: PageFetcher<WorkflowRun> = ({ limit, offset }) =>
      this.http.requestPage<WorkflowRun>({
        method: 'GET',
        path: `/workflows/${encodeURIComponent(id)}/runs`,
        query: { limit, offset },
      })
    return fetchFirstPage(fetcher, params)
  }

  /** Fetches a single run of a workflow by run id. */
  getRun(id: string, runId: string): Promise<WorkflowRun> {
    return this.http.request<WorkflowRun>({
      method: 'GET',
      path: `/workflows/${encodeURIComponent(id)}/runs/${encodeURIComponent(runId)}`,
    })
  }
}
