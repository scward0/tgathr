export interface ServiceSuccessResponse<T = any> {
  success: true;
  data?: T;
  [key: string]: any;
}

export interface ServiceErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: any;
  status: number;
}

export type ServiceResponse<T = any> = ServiceSuccessResponse<T> | ServiceErrorResponse;

export function isErrorResponse(response: ServiceResponse): response is ServiceErrorResponse {
  return !response.success;
}

export function createErrorResponse(
  error: string,
  status: number = 500,
  details?: any
): ServiceErrorResponse {
  return {
    success: false,
    error,
    message: error,
    status,
    details
  };
}

export function createSuccessResponse<T = any>(data?: T, additionalProps?: Record<string, any>): ServiceSuccessResponse<T> {
  return {
    success: true,
    data,
    ...additionalProps
  };
}