import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { HotelSummary } from '../../core/models';
import { HotelCardComponent } from '../../shared/hotel-card.component';
import { ImgFallbackDirective } from '../../shared/img-fallback.directive';
import { InrPipe } from '../../shared/inr.pipe';
import { RailComponent } from '../../shared/rail.component';
import { RevealDirective } from '../../shared/reveal.directive';
import { SearchBarComponent } from '../../shared/search-bar.component';

interface Destination {
  city: string;
  region: string;
  image: string;
  fromPrice: number;
  count: number;
}

const SLIDE_MS = 6000;

@Component({
  selector: 'rs-home',
  standalone: true,
  imports: [RouterLink, SearchBarComponent, HotelCardComponent, RailComponent, RevealDirective,
    ImgFallbackDirective, InrPipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);

  readonly slideMs = SLIDE_MS;
  readonly hotels = signal<HotelSummary[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly active = signal(0);
  /** Changes on every slide change so the progress bar animation restarts. */
  readonly tick = signal(0);

  readonly slides = computed(() => this.hotels().slice(0, 5));
  readonly current = computed(() => this.slides()[this.active()] ?? null);
  readonly stateCount = computed(() => new Set(this.hotels().map((h) => h.region)).size);
  readonly fromPrice = computed(() =>
    this.hotels().length ? Math.min(...this.hotels().map((h) => h.pricePerNight)) : null);

  readonly destinations = computed<Destination[]>(() => {
    const byCity = new Map<string, Destination>();
    for (const h of this.hotels()) {
      const d = byCity.get(h.city);
      if (!d) {
        byCity.set(h.city, { city: h.city, region: h.region, image: h.coverImage, fromPrice: h.pricePerNight, count: 1 });
      } else {
        d.fromPrice = Math.min(d.fromPrice, h.pricePerNight);
        d.count++;
      }
    }
    return [...byCity.values()];
  });

  /** Illustration for the Flex Dates band: rooms left per night. */
  readonly sampleNights = [3, 2, 0, 0, 1, 3, 3, 2, 3, 1, 0, 2, 3, 3];

  private timer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.api.searchHotels().subscribe({
      next: (list) => {
        this.hotels.set(list);
        this.loading.set(false);
        this.startAutoPlay();
      },
      error: (err) => {
        this.loadError.set(err.message);
        this.loading.set(false);
      },
    });
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  go(index: number): void {
    const count = this.slides().length;
    if (!count) return;
    this.active.set((index + count) % count);
    this.tick.update((t) => t + 1);
    this.startAutoPlay();
  }

  next(): void { this.go(this.active() + 1); }
  prev(): void { this.go(this.active() - 1); }

  pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  private startAutoPlay(): void {
    this.stopAutoPlay();
    this.timer = setInterval(() => {
      const count = this.slides().length;
      if (count) {
        this.active.set((this.active() + 1) % count);
        this.tick.update((t) => t + 1);
      }
    }, SLIDE_MS);
  }

  private stopAutoPlay(): void {
    if (this.timer) clearInterval(this.timer);
  }
}
