// Envelope every backend endpoint answers with.
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Backend error code: a training partner whose application is not approved (pending or rejected).
export const APPLICATION_NOT_APPROVED = "ApplicationNotApproved";

export interface ApiErrorBody {
  success: false;
  message: string;
  error?: string;
  details?: Record<string, string>;
}
