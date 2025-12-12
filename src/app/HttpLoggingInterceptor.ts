import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { Observable, pipe, tap } from 'rxjs';

export function loggingInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const started = Date.now();
  
  // Log request details
  console.groupCollapsed(`[HTTP ${req.method}] ${req.urlWithParams}`);
  console.log('Headers:', req.headers.keys());
  console.log('Params:', req.params.toString());
  if (req.body) {
    console.log('Body:', req.body);
  }
  console.groupEnd();

  return next(req).pipe(
    tap({
      next: (event) => console.log(`[HTTP RESPONSE] ${req.method} ${req.urlWithParams}`),
      error: (error) => {
        const elapsed = Date.now() - started;
        console.error(`[HTTP ERROR] ${req.method} ${req.urlWithParams} (${elapsed}ms)`, error);
      },
      complete: () => {
        const elapsed = Date.now() - started;
        console.log(`[HTTP COMPLETE] ${req.method} ${req.urlWithParams} (${elapsed}ms)`);
      }
    })
  );
}
