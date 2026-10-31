export type ApiErrorCode =
  | 'INVALID_COORDINATE'
  | 'NO_WALKING_ROUTE'
  | 'ROUTING_UNAVAILABLE'
  | 'OUTSIDE_SERVICE_AREA';

export class ApiError extends Error {
  constructor(public code: ApiErrorCode) {
    super(code);
  }
}
