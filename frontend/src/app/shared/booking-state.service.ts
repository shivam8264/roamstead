import { Injectable, signal } from '@angular/core';
import { Booking } from '../core/models';

/**
 * Holds the booking just made so the confirmation page can show it without
 * putting the guest's email in the URL. A refresh falls back to the lookup page.
 */
@Injectable({ providedIn: 'root' })
export class BookingStateService {
  readonly lastBooking = signal<Booking | null>(null);
}
