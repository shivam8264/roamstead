import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'rs-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="wrap nf">
      <span class="nf__code">404</span>
      <h1>This road doesn't lead anywhere</h1>
      <p class="muted">The page you're looking for has moved or never existed.</p>
      <a routerLink="/" class="btn btn--primary">Back to Roamstead</a>
    </section>
  `,
  styles: [`
    .nf { padding: 110px 24px; text-align: center; }
    .nf__code { display: block; font-family: var(--font-display); font-size: 7rem; line-height: 1; color: var(--lime);
      animation: fade-up .6s var(--ease) both; }
  `],
})
export class NotFoundComponent {}
