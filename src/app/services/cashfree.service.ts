import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, from } from 'rxjs';
import { CashfreeCheckoutDetails, VerifyResponse } from './payment.types';

declare var Cashfree: any;

@Injectable({
  providedIn: 'root'
})
export class CashfreeService {
  private scriptLoaded = false;

  constructor(private api: ApiService) {}

  /**
   * Dynamically loads the Cashfree v3 SDK script if not already present.
   */
  loadScript(): Observable<boolean> {
    if (this.scriptLoaded || typeof window === 'undefined') {
      return from(Promise.resolve(true));
    }

    if ((window as any).Cashfree) {
      this.scriptLoaded = true;
      return from(Promise.resolve(true));
    }

    return new Observable<boolean>((observer) => {
      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.async = true;
      script.onload = () => {
        this.scriptLoaded = true;
        observer.next(true);
        observer.complete();
      };
      script.onerror = () => {
        observer.error(new Error('Failed to load Cashfree checkout SDK. Check your internet connection.'));
      };
      document.body.appendChild(script);
    });
  }

  /**
   * Triggers Cashfree checkout session in modal popup mode.
   * Resolves when payment completes or returns error on dismissal/failure.
   */
  pay(details: CashfreeCheckoutDetails): Observable<any> {
    return new Observable<any>((observer) => {
      this.loadScript().subscribe({
        next: () => {
          try {
            // mode accepts: 'sandbox' or 'production'
            const cashfree = Cashfree({ mode: details.environment || 'sandbox' });
            
            cashfree.checkout({
              paymentSessionId: details.payment_session_id,
              redirectTarget: '_modal'
            }).then((result: any) => {
              if (result?.error) {
                observer.error(new Error(result.error.message || 'Cashfree checkout was cancelled.'));
              } else {
                observer.next(result);
                observer.complete();
              }
            }).catch((err: any) => {
              observer.error(new Error(err?.message || 'Cashfree checkout widget error.'));
            });
          } catch (e: any) {
            observer.error(new Error('Failed to instantiate Cashfree Checkout: ' + e.message));
          }
        },
        error: (err) => observer.error(err)
      });
    });
  }

  /**
   * Verifies Cashfree payment via backend.
   */
  verifyPayment(orderId: string): Observable<VerifyResponse> {
    return this.api.post('/api/payment/cashfree/verify', { order_id: orderId });
  }
}
