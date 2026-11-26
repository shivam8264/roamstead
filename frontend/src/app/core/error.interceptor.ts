import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ApiError } from './models';

/**
 * Turns every failed HTTP call into a predictable ApiError so components can
 * show `error.message` without inspecting raw responses.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      let apiError: ApiError;
      if (err.status === 0) {
        apiError = {
          status: 0,
          code: 'NETWORK',
          message: "We can't reach Roamstead right now. Check your connection and try again.",
        };
      } else if (err.error && typeof err.error === 'object' && 'code' in err.error) {
        apiError = err.error as ApiError;
      } else {
        apiError = {
          status: err.status,
          code: 'UNKNOWN',
          message: 'Something went wrong. Please try again in a moment.',
        };
      }
      return throwError(() => apiError);
    }),
  );
