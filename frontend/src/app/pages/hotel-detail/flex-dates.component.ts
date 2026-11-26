import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { addDays, fromIso, todayIso } from '../../core/dates';
import { FlexDates, NightAvailability } from '../../core/models';
import { InrPipe } from '../../shared/inr.pipe';

export interface StayRange {
  checkIn: string;
  checkOut: string;
}

/**
 * Surprise feature UI: a night-by-night availability calendar the guest can
 * click to pick dates, plus "closest dates that still work" suggestions.
 */
@Component({
  selector: 'rs-flex-dates',
  standalone: true,
  imports: [DatePipe, InrPipe],
  template: `
    <section class="flex" id="flex">
      <div class="flex__head">
        <div>
          <span class="eyebrow">Flex Dates</span>
          <h2>Rooms left, night by night</h2>
          <p class="muted">Tap a night to set check-in, then tap another to set check-out.</p>
        </div>
        <div class="flex__nav">
          <button type="button" (click)="shift(-14)" [disabled]="from() <= today" aria-label="Earlier dates">&larr;</button>
          <button type="button" (click)="shift(14)" aria-label="Later dates">&rarr;</button>
        </div>
      </div>

      <div class="legend">
        <span><i class="ok"></i>Plenty</span>
        <span><i class="low"></i>1&ndash;2 left</span>
        <span><i class="out"></i>Full</span>
        <span><i class="sel"></i>Your stay</span>
      </div>

      @if (calendarError()) {
        <p class="notice notice--error">{{ calendarError() }}</p>
      }

      <div class="cal" [class.cal--loading]="loadingCalendar()">
        @for (n of nights(); track n.date) {
          <button type="button" class="cal__cell {{ cellClass(n) }}"
                  [class.is-selected]="isInStay(n.date)"
                  [class.is-edge]="n.date === checkIn"
                  [disabled]="n.availableRooms === 0 && !pickingCheckOut()"
                  (click)="pick(n)"
                  [attr.aria-label]="(n.date | date: 'EEE d MMM') + ': ' + n.availableRooms + ' rooms left'">
            <span class="cal__dow">{{ n.date | date: 'EEE' }}</span>
            <span class="cal__day">{{ n.date | date: 'd' }}</span>
            <span class="cal__mon">{{ n.date | date: 'MMM' }}</span>
            <span class="cal__left">{{ n.availableRooms === 0 ? 'Full' : n.availableRooms + ' left' }}</span>
          </button>
        }
      </div>
      @if (pickingCheckOut()) {
        <p class="notice notice--info">Check-in set to {{ pendingCheckIn() | date: 'EEE d MMM' }}. Now pick your check-out night.</p>
      }

      @if (flex(); as f) {
        <div class="suggest" [class.suggest--alert]="!f.requestedAvailable">
          <h3>
            @if (f.requestedAvailable) { Flexible? These {{ f.nights }}-night stays also work }
            @else { Your dates are full. These are the closest {{ f.nights }}-night stays with a room }
          </h3>
          @if (f.options.length === 0) {
            <p class="muted">Nothing free within a week either side. Try another hotel or different dates.</p>
          }
          <div class="suggest__list">
            @for (o of f.options; track o.checkIn; let i = $index) {
              <button type="button" class="option" [style.animation-delay.ms]="i * 80" (click)="choose.emit(o)">
                <span class="option__shift">{{ shiftLabel(o.offsetDays) }}</span>
                <span class="option__dates">{{ o.checkIn | date: 'EEE d MMM' }} &ndash; {{ o.checkOut | date: 'EEE d MMM' }}</span>
                <span class="option__meta">{{ o.availableRooms }} left &middot; {{ o.totalAmount | inr }}</span>
                <span class="option__go">Choose &rarr;</span>
              </button>
            }
          </div>
        </div>
      }
    </section>
  `,
  styles: [`
    .flex { padding-top: 12px; scroll-margin-top: calc(var(--header-h) + 20px); }
    .flex__head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; }
    .flex__head h2 { font-size: 1.8rem; }
    .flex__nav { display: flex; gap: 8px; }
    .flex__nav button { width: 44px; height: 44px; border: 2px solid var(--forest); background: var(--paper); color: var(--forest);
      cursor: pointer; font-size: 1.1rem; transition: background-color .2s, color .2s; }
    .flex__nav button:hover:not(:disabled) { background: var(--forest); color: var(--paper); }
    .flex__nav button:disabled { opacity: .3; cursor: default; }
    .legend { display: flex; flex-wrap: wrap; gap: 18px; margin: 12px 0 16px; font-size: .85rem; font-weight: 600; }
    .legend span { display: inline-flex; align-items: center; gap: 6px; }
    .legend i { width: 14px; height: 14px; display: inline-block; }
    .legend .ok { background: var(--lime); } .legend .low { background: var(--sun); }
    .legend .out { background: var(--berry); } .legend .sel { background: var(--forest); }
    .cal { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; transition: opacity .3s; }
    .cal--loading { opacity: .45; }
    .cal__cell { display: flex; flex-direction: column; align-items: flex-start; padding: 8px 10px; min-height: 92px;
      border: 2px solid var(--ink); cursor: pointer; text-align: left; font-family: inherit; color: var(--paper);
      animation: fade-up .45s var(--ease) both; transition: transform .2s var(--ease), background-color .2s, box-shadow .2s; }
    .cal__cell:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 4px 4px 0 var(--ink); }
    .cal__cell:disabled { cursor: not-allowed; }
    .cal__cell.ok { background: var(--lime); color: var(--ink); }
    .cal__cell.low { background: var(--sun); color: var(--forest); }
    .cal__cell.out { background: var(--berry); opacity: .85; }
    .cal__cell.is-selected { background: var(--forest); color: var(--paper); }
    .cal__cell.is-edge { box-shadow: inset 0 0 0 3px var(--lime); }
    .cal__dow, .cal__mon { font-size: .7rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; opacity: .85; }
    .cal__day { font-family: var(--font-display); font-size: 1.5rem; line-height: 1.1; }
    .cal__left { margin-top: auto; font-size: .72rem; font-weight: 700; }
    .suggest { margin-top: 28px; padding: 24px; background: var(--paper); border: 2px solid var(--ink); box-shadow: var(--hard); animation: fade-up .5s var(--ease); }
    .suggest--alert { background: #fbe3e6; }
    .suggest h3 { font-size: 1.15rem; }
    .suggest__list { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
    .option { display: flex; flex-direction: column; gap: 4px; text-align: left; padding: 16px; background: var(--paper);
      border: 2px solid var(--ink); cursor: pointer; font-family: inherit; color: var(--text); box-shadow: 3px 3px 0 var(--ink);
      animation: slide-in-right .45s var(--ease) both; transition: background-color .25s, color .25s, transform .25s var(--ease); }
    .option:hover { background: var(--lime); color: var(--ink); transform: translate(-3px, -3px); box-shadow: 6px 6px 0 var(--ink); }
    .option__shift { font-size: .72rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--forest-2); }
    .option__dates { font-weight: 700; }
    .option__meta { font-size: .88rem; opacity: .8; }
    .option__go { margin-top: 6px; font-weight: 700; font-size: .85rem; }
    @media (max-width: 560px) {
      .cal { grid-template-columns: repeat(4, 1fr); }
      .flex__head { flex-direction: column; align-items: flex-start; }
    }
  `],
})
export class FlexDatesComponent implements OnChanges {
  @Input({ required: true }) hotelId!: number;
  @Input() checkIn: string | null = null;
  @Input() checkOut: string | null = null;
  /** Bumped by the parent after a booking-related change to force a reload. */
  @Input() refreshKey = 0;
  @Output() choose = new EventEmitter<StayRange>();

  private readonly api = inject(ApiService);

  readonly today = todayIso();
  readonly from = signal(this.today);
  readonly nights = signal<NightAvailability[]>([]);
  readonly flex = signal<FlexDates | null>(null);
  readonly loadingCalendar = signal(false);
  readonly calendarError = signal<string | null>(null);
  readonly pickingCheckOut = signal(false);
  readonly pendingCheckIn = signal<string | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['checkIn'] && this.checkIn) {
      // Start the calendar a few days before check-in so alternatives are visible.
      const start = addDays(this.checkIn, -3);
      this.from.set(start < this.today ? this.today : start);
    }
    this.loadCalendar();
    this.loadFlex();
  }

  shift(days: number): void {
    const next = addDays(this.from(), days);
    this.from.set(next < this.today ? this.today : next);
    this.loadCalendar();
  }

  pick(n: NightAvailability): void {
    const pending = this.pendingCheckIn();
    if (this.pickingCheckOut() && pending && n.date > pending) {
      this.pickingCheckOut.set(false);
      this.pendingCheckIn.set(null);
      this.choose.emit({ checkIn: pending, checkOut: n.date });
      return;
    }
    if (n.availableRooms === 0) return;
    this.pendingCheckIn.set(n.date);
    this.pickingCheckOut.set(true);
  }

  isInStay(date: string): boolean {
    if (this.pickingCheckOut()) return date === this.pendingCheckIn();
    return !!this.checkIn && !!this.checkOut && date >= this.checkIn && date < this.checkOut;
  }

  cellClass(n: NightAvailability): string {
    if (n.availableRooms === 0) return 'out';
    if (n.availableRooms <= 2) return 'low';
    return 'ok';
  }

  shiftLabel(offset: number): string {
    const days = Math.abs(offset);
    const unit = days === 1 ? 'day' : 'days';
    return offset < 0 ? `${days} ${unit} earlier` : `${days} ${unit} later`;
  }

  private loadCalendar(): void {
    if (!this.hotelId) return;
    this.loadingCalendar.set(true);
    this.calendarError.set(null);
    this.api.calendar(this.hotelId, this.from(), 28).subscribe({
      next: (c) => {
        this.nights.set(c.nights);
        this.loadingCalendar.set(false);
      },
      error: (err) => {
        this.calendarError.set(err.message);
        this.loadingCalendar.set(false);
      },
    });
  }

  private loadFlex(): void {
    if (!this.hotelId || !this.checkIn || !this.checkOut || this.checkOut <= this.checkIn
        || fromIso(this.checkIn) < fromIso(this.today)) {
      this.flex.set(null);
      return;
    }
    this.api.flexDates(this.hotelId, this.checkIn, this.checkOut).subscribe({
      next: (f) => this.flex.set(f),
      error: () => this.flex.set(null),
    });
  }
}
