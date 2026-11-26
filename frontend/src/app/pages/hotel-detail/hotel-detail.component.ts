import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { addDays, isValidIso, stayProblem, todayIso } from '../../core/dates';
import { ApiError, HotelDetail, Quote } from '../../core/models';
import { AmenityIconPipe } from '../../shared/amenity-icon.pipe';
import { InrPipe } from '../../shared/inr.pipe';
import { RevealDirective } from '../../shared/reveal.directive';
import { FlexDatesComponent, StayRange } from './flex-dates.component';
import { GalleryComponent } from './gallery.component';

@Component({
  selector: 'rs-hotel-detail',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, GalleryComponent, FlexDatesComponent, AmenityIconPipe, InrPipe,
    RevealDirective],
  templateUrl: './hotel-detail.component.html',
  styleUrl: './hotel-detail.component.scss',
})
export class HotelDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly today = todayIso();
  readonly hotelId = signal(0);
  readonly hotel = signal<HotelDetail | null>(null);
  readonly loadError = signal<ApiError | null>(null);

  checkIn = '';
  checkOut = '';
  readonly quote = signal<Quote | null>(null);
  readonly quoting = signal(false);
  readonly dateError = signal<string | null>(null);

  readonly room = computed(() => this.hotel()?.rooms[0] ?? null);
  readonly starText = computed(() => '★'.repeat(this.hotel()?.starRating ?? 0));

  ngOnInit(): void {
    this.route.paramMap.subscribe((p) => {
      const id = Number(p.get('id'));
      this.hotelId.set(id);
      const q = this.route.snapshot.queryParamMap;
      this.checkIn = isValidIso(q.get('checkIn')) ? q.get('checkIn')! : '';
      this.checkOut = isValidIso(q.get('checkOut')) ? q.get('checkOut')! : '';
      this.loadHotel();
      this.refreshQuote(false);
    });
  }

  loadHotel(): void {
    this.loadError.set(null);
    this.api.hotel(this.hotelId()).subscribe({
      next: (h) => {
        this.hotel.set(h);
        if (this.route.snapshot.fragment === 'flex') setTimeout(() => this.scrollToFlex(), 300);
      },
      error: (err: ApiError) => this.loadError.set(err),
    });
  }

  minCheckOut(): string {
    return this.checkIn ? addDays(this.checkIn, 1) : addDays(this.today, 1);
  }

  onCheckInChange(): void {
    if (this.checkIn && (!this.checkOut || this.checkOut <= this.checkIn)) {
      this.checkOut = addDays(this.checkIn, 1);
    }
    this.refreshQuote(true);
  }

  /** Asks the backend for the price and rooms left. Prices are never computed in the browser. */
  refreshQuote(updateUrl: boolean): void {
    this.quote.set(null);
    if (!this.checkIn && !this.checkOut) {
      this.dateError.set(null);
      return;
    }
    const problem = stayProblem(this.checkIn, this.checkOut);
    this.dateError.set(problem);
    if (problem) return;

    if (updateUrl) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { checkIn: this.checkIn, checkOut: this.checkOut },
        replaceUrl: true,
        preserveFragment: true,
      });
    }
    this.quoting.set(true);
    this.api.quote(this.hotelId(), this.checkIn, this.checkOut).subscribe({
      next: (q) => {
        this.quote.set(q);
        this.quoting.set(false);
      },
      error: (err: ApiError) => {
        this.dateError.set(err.message);
        this.quoting.set(false);
      },
    });
  }

  applyRange(range: StayRange): void {
    this.checkIn = range.checkIn;
    this.checkOut = range.checkOut;
    this.refreshQuote(true);
    document.getElementById('booking-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  scrollToFlex(): void {
    document.getElementById('flex')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  reserve(): void {
    const q = this.quote();
    if (!q || !q.available) return;
    this.router.navigate(['/book', this.hotelId()], {
      queryParams: { checkIn: q.checkIn, checkOut: q.checkOut },
    });
  }
}
