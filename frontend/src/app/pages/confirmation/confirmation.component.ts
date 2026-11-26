import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { addDays } from '../../core/dates';
import { Booking } from '../../core/models';
import { BookingStateService } from '../../shared/booking-state.service';
import { ImgFallbackDirective } from '../../shared/img-fallback.directive';
import { InrPipe } from '../../shared/inr.pipe';

@Component({
  selector: 'rs-confirmation',
  standalone: true,
  imports: [RouterLink, DatePipe, InrPipe, ImgFallbackDirective],
  template: `
    <section class="wrap confirm">
      @if (booking(); as b) {
        <div class="confirm__hero">
          <div class="tick" aria-hidden="true">
            <svg viewBox="0 0 52 52"><path d="M14 27l8 8 16-18" /></svg>
          </div>
          <span class="eyebrow">Booking confirmed</span>
          <h1>You're all set, {{ firstName(b.guestName) }}.</h1>
          <p class="muted">A room is held for you at {{ b.hotelName }}. Keep your reference handy.</p>

          <div class="ref">
            <span class="ref__label">Booking reference</span>
            <span class="ref__code">{{ b.reference }}</span>
            <button type="button" class="btn btn--dark ref__copy" (click)="copy(b.reference)">
              {{ copied() ? 'Copied' : 'Copy' }}
            </button>
          </div>
        </div>

        <article class="ticket">
          <div class="ticket__media">
            <img [src]="b.coverImage" [alt]="b.hotelName" [rsFallback]="b.hotelName" />
          </div>
          <div class="ticket__body">
            <h2>{{ b.hotelName }}</h2>
            <p class="muted">{{ b.hotelAddress }}</p>
            <div class="ticket__grid">
              <div><span>Check-in</span><b>{{ b.checkIn | date: 'EEE, d MMM y' }}</b><small>from 2 PM</small></div>
              <div><span>Check-out</span><b>{{ b.checkOut | date: 'EEE, d MMM y' }}</b><small>by 11 AM</small></div>
              <div><span>Room</span><b>{{ b.roomTypeName }}</b><small>{{ b.nights }} night{{ b.nights === 1 ? '' : 's' }}</small></div>
              <div><span>Guest</span><b>{{ b.guestName }}</b><small>{{ b.guestEmail }}</small></div>
            </div>
            <div class="ticket__total">
              <span>{{ b.pricePerNight | inr }} &times; {{ b.nights }} night{{ b.nights === 1 ? '' : 's' }}</span>
              <b>{{ b.totalAmount | inr }}</b>
            </div>
          </div>
        </article>

        <div class="confirm__actions">
          <button type="button" class="btn btn--primary" (click)="downloadIcs(b)">Add to calendar</button>
          <a class="btn btn--outline" routerLink="/manage" [queryParams]="{ reference: b.reference }">Manage booking</a>
          <a class="btn btn--outline" routerLink="/hotels">Explore more stays</a>
        </div>
      } @else {
        <div class="missing">
          <h1>Booking {{ reference }}</h1>
          <p class="muted">For your privacy we don't keep booking details in the page address.
            Enter your email to view this booking.</p>
          <a class="btn btn--primary" routerLink="/manage" [queryParams]="{ reference }">Find my booking</a>
        </div>
      }
    </section>
  `,
  styles: [`
    .confirm { padding-top: 56px; padding-bottom: 88px; max-width: 920px; }
    .confirm__hero { text-align: center; margin-bottom: 40px; }
    .confirm__hero h1 { font-size: clamp(2rem, 4vw, 3rem); animation: fade-up .6s .3s var(--ease) both; }
    .tick { width: 84px; height: 84px; margin: 0 auto 22px; background: var(--leaf); display: grid; place-items: center;
      animation: pop .5s var(--ease) both; }
    .tick svg { width: 52px; height: 52px; fill: none; stroke: var(--paper); stroke-width: 5; stroke-linecap: square;
      stroke-dasharray: 48; stroke-dashoffset: 48; animation: draw .5s .35s var(--ease) forwards; }
    @keyframes pop { from { transform: scale(.4) rotate(-12deg); opacity: 0; } to { transform: none; opacity: 1; } }
    @keyframes draw { to { stroke-dashoffset: 0; } }
    .ref { display: inline-flex; align-items: center; gap: 18px; flex-wrap: wrap; justify-content: center;
      margin-top: 18px; padding: 16px 16px 16px 24px; background: var(--cream); animation: fade-up .6s .45s var(--ease) both; }
    .ref__label { font-size: .72rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); }
    .ref__code { font-family: 'Courier New', monospace; font-size: 1.7rem; font-weight: 700; letter-spacing: .08em; color: var(--forest); }
    .ref__copy { min-height: 40px; padding: 0 18px; }
    .ticket { display: grid; grid-template-columns: 300px 1fr; background: var(--paper); border: 2px solid var(--ink); box-shadow: var(--hard-lg);
      animation: fade-up .6s .55s var(--ease) both; }
    .ticket__media { overflow: hidden; min-height: 220px; }
    .ticket__media img { width: 100%; height: 100%; object-fit: cover; }
    .ticket__body { padding: 28px; }
    .ticket__body h2 { font-size: 1.7rem; margin-bottom: 4px; }
    .ticket__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin: 20px 0; }
    .ticket__grid div { display: flex; flex-direction: column; }
    .ticket__grid span { font-size: .72rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
    .ticket__grid small { color: var(--muted); word-break: break-all; }
    .ticket__total { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px;
      background: var(--forest); color: var(--paper); }
    .ticket__total b { font-family: var(--font-display); font-size: 1.5rem; }
    .confirm__actions { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-top: 32px;
      animation: fade-up .6s .65s var(--ease) both; }
    .missing { text-align: center; padding: 40px 0; }
    @media (max-width: 700px) {
      .ticket { grid-template-columns: 1fr; }
      .ticket__grid { grid-template-columns: 1fr; }
      .ref__code { font-size: 1.35rem; }
    }
  `],
})
export class ConfirmationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly state = inject(BookingStateService);

  reference = '';
  readonly booking = signal<Booking | null>(null);
  readonly copied = signal(false);

  ngOnInit(): void {
    this.reference = this.route.snapshot.paramMap.get('reference') ?? '';
    const last = this.state.lastBooking();
    if (last && last.reference === this.reference) {
      this.booking.set(last);
    }
  }

  firstName(name: string): string {
    return name.split(' ')[0];
  }

  copy(ref: string): void {
    navigator.clipboard?.writeText(ref).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  /** Small extra: an .ics file so the stay lands in the guest's calendar. */
  downloadIcs(b: Booking): void {
    const ymd = (iso: string) => iso.replace(/-/g, '');
    const lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Roamstead//Booking//EN', 'BEGIN:VEVENT',
      `UID:${b.reference}@roamstead`,
      `DTSTART;VALUE=DATE:${ymd(b.checkIn)}`,
      `DTEND;VALUE=DATE:${ymd(addDays(b.checkOut, 1))}`,
      `SUMMARY:Stay at ${b.hotelName}`,
      `LOCATION:${b.hotelAddress.replace(/,/g, '\\,')}`,
      `DESCRIPTION:Booking reference ${b.reference} - ${b.roomTypeName}`,
      'END:VEVENT', 'END:VCALENDAR',
    ];
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roamstead-${b.reference}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
