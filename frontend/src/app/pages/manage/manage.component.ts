import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { ApiError, Booking } from '../../core/models';
import { ImgFallbackDirective } from '../../shared/img-fallback.directive';
import { InrPipe } from '../../shared/inr.pipe';

/** Look up a booking by reference + email, and cancel it. */
@Component({
  selector: 'rs-manage',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe, InrPipe, ImgFallbackDirective],
  templateUrl: './manage.component.html',
  styleUrl: './manage.component.scss',
})
export class ManageComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    reference: ['', [Validators.required, Validators.pattern(/^\s*RS-?[A-Za-z0-9]{8}\s*$/)]],
    email: ['', [Validators.required, Validators.email]],
  });

  readonly booking = signal<Booking | null>(null);
  readonly searching = signal(false);
  readonly error = signal<ApiError | null>(null);
  readonly confirmOpen = signal(false);
  readonly cancelling = signal(false);
  readonly justCancelled = signal(false);

  ngOnInit(): void {
    const ref = this.route.snapshot.queryParamMap.get('reference');
    if (ref) this.form.controls.reference.setValue(ref);
  }

  invalid(name: 'reference' | 'email'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  find(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const { reference, email } = this.form.getRawValue();
    this.searching.set(true);
    this.error.set(null);
    this.booking.set(null);
    this.justCancelled.set(false);
    this.api.findBooking(this.normalise(reference), email).subscribe({
      next: (b) => {
        this.booking.set(b);
        this.searching.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err);
        this.searching.set(false);
      },
    });
  }

  cancel(): void {
    const b = this.booking();
    if (!b) return;
    this.cancelling.set(true);
    this.api.cancelBooking(b.reference, this.form.getRawValue().email).subscribe({
      next: (updated) => {
        this.booking.set(updated);
        this.cancelling.set(false);
        this.confirmOpen.set(false);
        this.justCancelled.set(true);
      },
      error: (err: ApiError) => {
        this.cancelling.set(false);
        this.confirmOpen.set(false);
        this.error.set(err);
      },
    });
  }

  /** Accepts "rs k7q4m9px", "RSK7Q4M9PX" or "RS-K7Q4M9PX". */
  private normalise(ref: string): string {
    const compact = ref.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    return compact.startsWith('RS') ? `RS-${compact.slice(2)}` : compact;
  }
}
