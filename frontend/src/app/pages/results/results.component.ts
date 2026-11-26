import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { ApiError, HotelSummary } from '../../core/models';
import { ImgFallbackDirective } from '../../shared/img-fallback.directive';
import { InrPipe } from '../../shared/inr.pipe';
import { SearchBarComponent } from '../../shared/search-bar.component';

type SortKey = 'recommended' | 'price-asc' | 'price-desc' | 'rating';

@Component({
  selector: 'rs-results',
  standalone: true,
  imports: [FormsModule, RouterLink, SearchBarComponent, ImgFallbackDirective, InrPipe],
  templateUrl: './results.component.html',
  styleUrl: './results.component.scss',
})
export class ResultsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  readonly location = signal('');
  readonly checkIn = signal('');
  readonly checkOut = signal('');
  readonly hotels = signal<HotelSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal<ApiError | null>(null);
  readonly sort = signal<SortKey>('recommended');
  readonly onlyAvailable = signal(false);

  readonly hasDates = computed(() => !!this.checkIn() && !!this.checkOut());

  readonly visible = computed(() => {
    let list = [...this.hotels()];
    if (this.onlyAvailable() && this.hasDates()) {
      list = list.filter((h) => (h.availableRooms ?? 0) > 0);
    }
    switch (this.sort()) {
      case 'price-asc': list.sort((a, b) => a.pricePerNight - b.pricePerNight); break;
      case 'price-desc': list.sort((a, b) => b.pricePerNight - a.pricePerNight); break;
      case 'rating': list.sort((a, b) => b.starRating - a.starRating); break;
      default:
        // Available first, then alphabetical (the API order).
        if (this.hasDates()) list.sort((a, b) => Number((b.availableRooms ?? 0) > 0) - Number((a.availableRooms ?? 0) > 0));
    }
    return list;
  });

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.location.set(params.get('location') ?? '');
      this.checkIn.set(params.get('checkIn') ?? '');
      this.checkOut.set(params.get('checkOut') ?? '');
      this.load();
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.searchHotels(this.location(), this.checkIn(), this.checkOut()).subscribe({
      next: (list) => {
        this.hotels.set(list);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err);
        this.hotels.set([]);
        this.loading.set(false);
      },
    });
  }

  stars(n: number): string {
    return '★'.repeat(n);
  }

  availabilityLabel(h: HotelSummary): { text: string; css: string } {
    const left = h.availableRooms ?? 0;
    if (left === 0) return { text: 'Sold out', css: 'badge--out' };
    if (left <= 2) return { text: `Only ${left} left`, css: 'badge--low' };
    return { text: `${left} rooms left`, css: 'badge--ok' };
  }

  dateParams(): Record<string, string> | null {
    return this.hasDates() ? { checkIn: this.checkIn(), checkOut: this.checkOut() } : null;
  }
}
