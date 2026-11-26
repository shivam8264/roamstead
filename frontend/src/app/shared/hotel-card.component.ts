import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HotelSummary } from '../core/models';
import { ImgFallbackDirective } from './img-fallback.directive';
import { InrPipe } from './inr.pipe';

/** Hotel card used in the sliding rails on the home page. */
@Component({
  selector: 'rs-hotel-card',
  standalone: true,
  imports: [RouterLink, ImgFallbackDirective, InrPipe],
  template: `
    <a class="card" [routerLink]="['/hotels', hotel.id]">
      <div class="card__media">
        <img [src]="hotel.coverImage" [alt]="hotel.name" [rsFallback]="hotel.name" loading="lazy" />
        <span class="card__price">{{ hotel.pricePerNight | inr }}<small>/night</small></span>
      </div>
      <div class="card__body">
        <div class="card__meta">
          <span>{{ hotel.city }}</span>
          <span class="stars" [attr.aria-label]="hotel.starRating + ' star hotel'">{{ stars }}</span>
        </div>
        <h3>{{ hotel.name }}</h3>
        <p class="muted">{{ hotel.tagline }}</p>
        <span class="card__cta">View stay <b aria-hidden="true">&rarr;</b></span>
      </div>
    </a>
  `,
  styles: [`
    :host { display: block; height: 100%; padding: 0 10px 10px 0; }
    .card { display: flex; flex-direction: column; height: 100%; background: var(--paper); text-decoration: none;
      color: inherit; border: 2px solid var(--ink); box-shadow: var(--hard);
      transition: transform .25s var(--ease), box-shadow .25s var(--ease); }
    .card:hover { transform: translate(-4px, -4px); box-shadow: var(--hard-lg); }
    .card__media { position: relative; overflow: hidden; aspect-ratio: 5 / 4; background: var(--cream-deep);
      border-bottom: 2px solid var(--ink); }
    .card__media img { width: 100%; height: 100%; object-fit: cover; transition: transform .9s var(--ease); }
    .card:hover .card__media img { transform: scale(1.08); }
    .card__price { position: absolute; right: 12px; bottom: 12px; background: var(--lime); color: var(--ink);
      border: 2px solid var(--ink); padding: 4px 10px; font-weight: 700; font-size: 1.05rem; }
    .card__price small { font-weight: 500; font-size: .75rem; margin-left: 2px; }
    .card__body { padding: 18px 20px 20px; display: flex; flex-direction: column; flex: 1; }
    .card__meta { display: flex; justify-content: space-between; align-items: center; font-family: var(--font-mono);
      font-size: .72rem; text-transform: uppercase; letter-spacing: .06em; color: var(--forest-2); }
    .card__body h3 { margin: 10px 0 6px; font-size: 1.35rem; }
    .card__body p { font-size: .95rem; flex: 1; }
    .card__cta { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; margin-top: 6px; }
    .card__cta b { display: grid; place-items: center; width: 30px; height: 30px; background: var(--forest);
      color: var(--paper); transition: transform .3s var(--ease), background-color .3s, color .3s; }
    .card:hover .card__cta b { transform: translateX(6px); background: var(--lime); color: var(--ink); }
  `],
})
export class HotelCardComponent {
  @Input({ required: true }) hotel!: HotelSummary;

  get stars(): string {
    return '★'.repeat(this.hotel.starRating);
  }
}
