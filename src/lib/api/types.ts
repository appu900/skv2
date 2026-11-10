// Envelope every backend endpoint answers with.
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  error?: string;
  details?: Record<string, string>;
}
