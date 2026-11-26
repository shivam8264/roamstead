import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { isValidIso, stayProblem } from '../../core/dates';
import { ApiError, HotelDetail, Quote } from '../../core/models';
import { BookingStateService } from '../../shared/booking-state.service';
import { ImgFallbackDirective } from '../../shared/img-fallback.directive';
import { InrPipe } from '../../shared/inr.pipe';

type Step = 1 | 2;

@Component({
  selector: 'rs-booking',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe, InrPipe, ImgFallbackDirective],
  templateUrl: './booking.component.html',
  styleUrl: './booking.component.scss',
})
export class BookingComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly state = inject(BookingStateService);
  private readonly fb = inject(FormBuilder);

  readonly hotelId = signal(0);
  readonly hotel = signal<HotelDetail | null>(null);
  readonly quote = signal<Quote | null>(null);
  readonly loading = signal(true);
  readonly fatal = signal<string | null>(null);
  readonly step = signal<Step>(1);
  readonly submitting = signal(false);
  readonly submitError = signal<ApiError | null>(null);

  readonly form = this.fb.nonNullable.group({
    guestName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100),
      Validators.pattern(/^[\p{L} .'-]+$/u)]],
    guestEmail: ['', [Validators.required, Validators.email, Validators.maxLength(160)]],
  });

  /** Server-side messages per field, shown under the matching input. */
  readonly serverErrors = signal<Record<string, string>>({});

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('hotelId'));
    const q = this.route.snapshot.queryParamMap;
    const checkIn = q.get('checkIn');
    const checkOut = q.get('checkOut');
    this.hotelId.set(id);

    if (!isValidIso(checkIn) || !isValidIso(checkOut)) {
      this.fail('Your stay dates are missing. Pick dates on the hotel page first.');
      return;
    }
    const problem = stayProblem(checkIn, checkOut);
    if (problem) {
      this.fail(problem);
      return;
    }
    this.api.hotel(id).subscribe({ next: (h) => this.hotel.set(h), error: () => {} });
    this.api.quote(id, checkIn, checkOut).subscribe({
      next: (quote) => {
        this.quote.set(quote);
        this.loading.set(false);
        if (!quote.available) {
          this.submitError.set({ status: 409, code: 'ROOM_UNAVAILABLE',
            message: 'Sorry, there are no rooms left for every night of this stay.' });
        }
      },
      error: (err: ApiError) => this.fail(err.message),
    });
  }

  fieldError(name: 'guestName' | 'guestEmail'): string | null {
    const server = this.serverErrors()[name];
    if (server) return server;
    const c = this.form.controls[name];
    if (!c.invalid || !(c.touched || c.dirty)) return null;
    if (c.hasError('required')) return name === 'guestName' ? "Enter the guest's full name." : 'Enter an email address.';
    if (c.hasError('minlength')) return 'Name must be at least 2 characters.';
    if (c.hasError('maxlength')) return 'That is a little too long.';
    if (c.hasError('pattern')) return 'Use letters, spaces, apostrophes, dots and hyphens only.';
    if (c.hasError('email')) return 'Enter a valid email address, e.g. name@example.com.';
    return null;
  }

  clearServerError(name: string): void {
    if (this.serverErrors()[name]) {
      const { [name]: _, ...rest } = this.serverErrors();
      this.serverErrors.set(rest);
    }
  }

  toReview(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.step.set(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  confirm(): void {
    const q = this.quote();
    if (!q || this.submitting()) return;
    this.submitting.set(true);
    this.submitError.set(null);
    const { guestName, guestEmail } = this.form.getRawValue();

    this.api.createBooking({
      hotelId: q.hotelId,
      roomTypeId: q.roomTypeId,
      checkIn: q.checkIn,
      checkOut: q.checkOut,
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim(),
    }).subscribe({
      next: (booking) => {
        this.state.lastBooking.set(booking);
        this.router.navigate(['/booking', booking.reference, 'confirmed']);
      },
      error: (err: ApiError) => {
        this.submitting.set(false);
        this.submitError.set(err);
        if (err.fieldErrors?.length) {
          const map: Record<string, string> = {};
          err.fieldErrors.forEach((f) => (map[f.field] = f.message));
          this.serverErrors.set(map);
          this.step.set(1);
        }
      },
    });
  }

  private fail(message: string): void {
    this.fatal.set(message);
    this.loading.set(false);
  }
}
