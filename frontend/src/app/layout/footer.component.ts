import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'rs-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="footer">
      <div class="footer__ticker" aria-hidden="true">
        <div class="footer__ticker-track">
          @for (n of [1, 2]; track n) {
            <span>Havelis</span><i></i><span>Beach villas</span><i></i><span>Mountain cabins</span><i></i>
            <span>Backwater cottages</span><i></i><span>Lake palaces</span><i></i><span>Sea-facing rooms</span><i></i>
          }
        </div>
      </div>
      <div class="wrap footer__grid">
        <div>
          <div class="footer__brand">Roamstead</div>
          <p class="footer__lead">Characterful stays across India, with live availability, honest prices and
            instant confirmation.</p>
          <a routerLink="/hotels" class="btn btn--primary">Find a stay</a>
        </div>
        <div>
          <h4>Explore</h4>
          <a routerLink="/hotels" [queryParams]="{ location: 'Rajasthan' }">Rajasthan</a>
          <a routerLink="/hotels" [queryParams]="{ location: 'Goa' }">Goa</a>
          <a routerLink="/hotels" [queryParams]="{ location: 'Kerala' }">Kerala</a>
          <a routerLink="/hotels" [queryParams]="{ location: 'Himachal' }">Himachal Pradesh</a>
        </div>
        <div>
          <h4>Your trip</h4>
          <a routerLink="/hotels">Search stays</a>
          <a routerLink="/manage">Find my booking</a>
          <a routerLink="/manage">Cancel a booking</a>
        </div>
        <div>
          <h4>House rules</h4>
          <p class="footer__small">Check-in from 2 PM<br>Check-out by 11 AM<br>Free cancellation until check-in day</p>
        </div>
      </div>
      <div class="wrap footer__base">
        <span>&copy; {{ year }} Roamstead</span>
        <span>Go further. Stay somewhere worth it.</span>
      </div>
    </footer>
  `,
  styles: [`
    .footer { background: var(--forest); color: rgba(245, 240, 230, .82); margin-top: auto; border-top: 2px solid var(--ink); }
    .footer__ticker { overflow: hidden; background: var(--lime); color: var(--ink); border-bottom: 2px solid var(--ink); }
    .footer__ticker-track { display: flex; align-items: center; gap: 28px; width: max-content; padding: 14px 0;
      animation: marquee 28s linear infinite; font-family: var(--font-display); font-weight: 700; font-size: 1.25rem; }
    .footer__ticker-track i { width: 12px; height: 12px; background: var(--ink); flex-shrink: 0; }
    .footer__grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1.2fr; gap: 40px; padding-top: 64px; }
    .footer__brand { font-family: var(--font-display); font-weight: 800; font-size: 2.2rem; letter-spacing: -.03em;
      color: var(--paper); margin-bottom: 10px; }
    .footer__lead { max-width: 340px; margin-bottom: 22px; }
    h4 { color: var(--lime); font-family: var(--font-mono); font-size: .75rem; font-weight: 600; letter-spacing: .08em;
      text-transform: uppercase; margin-bottom: 16px; }
    a:not(.btn) { display: block; text-decoration: none; padding: 4px 0; transition: color .2s, transform .2s; }
    a:not(.btn):hover { color: var(--lime); transform: translateX(6px); }
    .footer__small { line-height: 1.9; }
    .footer__base { display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-top: 56px;
      padding-top: 22px; padding-bottom: 22px; border-top: 1px solid var(--forest-2); font-size: .85rem; }
    @media (max-width: 860px) { .footer__grid { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 520px) { .footer__grid { grid-template-columns: 1fr; } }
  `],
})
export class FooterComponent {
  readonly year = new Date().getFullYear();
}
