import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../core/api.service';
import { addDays, nightsBetween, stayProblem, todayIso } from '../core/dates';

/** Location + dates search form, used in the home hero and on the results page. */
@Component({
  selector: 'rs-search-bar',
  standalone: true,
  imports: [FormsModule],
  template: `
    <form class="search" [class.search--compact]="compact" (ngSubmit)="submit()" novalidate>
      <div class="field search__where">
        <label for="sb-location">Where to?</label>
        <input id="sb-location" class="input" type="text" name="location" list="sb-cities"
               placeholder="City or region, e.g. Goa" autocomplete="off" [(ngModel)]="location" />
        <datalist id="sb-cities">
          @for (city of cities(); track city) { <option [value]="city"></option> }
        </datalist>
      </div>
      <div class="field">
        <label for="sb-in">Check-in</label>
        <input id="sb-in" class="input" type="date" name="checkIn" [min]="today"
               [(ngModel)]="checkIn" (ngModelChange)="onCheckInChange()" />
      </div>
      <div class="field">
        <label for="sb-out">Check-out</label>
        <input id="sb-out" class="input" type="date" name="checkOut" [min]="minCheckOut()"
               [(ngModel)]="checkOut" />
      </div>
      <button class="btn btn--primary search__go" type="submit">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"
             aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
        Find stays
      </button>
      @if (nights() > 0) {
        <p class="search__hint">{{ nights() }} night{{ nights() === 1 ? '' : 's' }} selected</p>
      }
      @if (error()) {
        <p class="field-error search__error">{{ error() }}</p>
      }
    </form>
  `,
  styles: [`
    .search { display: grid; grid-template-columns: 1.6fr 1fr 1fr auto; gap: 14px; align-items: end;
      background: var(--paper); padding: 22px; border: 2px solid var(--ink); box-shadow: var(--hard-lg); }
    .search--compact { box-shadow: var(--hard); padding: 18px; }
    .search__go { min-height: 52px; }
    .search__hint, .search__error { grid-column: 1 / -1; margin: 0; font-size: .85rem; }
    .search__hint { font-family: var(--font-mono); color: var(--forest-2); }
    @media (max-width: 860px) {
      .search { grid-template-columns: 1fr 1fr; }
      .search__where, .search__go { grid-column: 1 / -1; }
    }
    @media (max-width: 460px) { .search { grid-template-columns: 1fr; } }
  `],
})
export class SearchBarComponent implements OnInit {
  @Input() location = '';
  @Input() checkIn = '';
  @Input() checkOut = '';
  @Input() compact = false;

  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly today = todayIso();
  readonly cities = signal<string[]>([]);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.api.locations().subscribe({ next: (c) => this.cities.set(c), error: () => this.cities.set([]) });
  }

  minCheckOut(): string {
    return this.checkIn ? addDays(this.checkIn, 1) : addDays(this.today, 1);
  }

  nights(): number {
    return this.checkIn && this.checkOut && this.checkOut > this.checkIn ? nightsBetween(this.checkIn, this.checkOut) : 0;
  }

  onCheckInChange(): void {
    if (this.checkIn && (!this.checkOut || this.checkOut <= this.checkIn)) {
      this.checkOut = addDays(this.checkIn, 1);
    }
    this.error.set(null);
  }

  submit(): void {
    const hasDates = !!this.checkIn || !!this.checkOut;
    if (hasDates) {
      const problem = stayProblem(this.checkIn, this.checkOut);
      if (problem) {
        this.error.set(problem);
        return;
      }
    }
    this.error.set(null);
    this.router.navigate(['/hotels'], {
      queryParams: {
        location: this.location.trim() || null,
        checkIn: this.checkIn || null,
        checkOut: this.checkOut || null,
      },
    });
  }
}
