import { Component, HostListener, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'rs-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="header" [class.header--scrolled]="scrolled()">
      <div class="wrap header__inner">
        <a routerLink="/" class="brand" (click)="menuOpen.set(false)" aria-label="Roamstead home">
          <span class="brand__mark" aria-hidden="true">
            <svg viewBox="0 0 64 64" width="40" height="40">
              <rect width="64" height="64" fill="#1e4d3b" />
              <path d="M10 50 L26 22 L36 38 L42 30 L54 50 Z" fill="#c9f24d" stroke="#121212" stroke-width="3" />
              <rect x="40" y="10" width="10" height="10" fill="#c9f24d" class="brand__sun" />
            </svg>
          </span>
          <span class="brand__word">Roamstead</span>
        </a>

        <nav class="nav" [class.nav--open]="menuOpen()">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }"
             (click)="menuOpen.set(false)"><span>01</span>Home</a>
          <a routerLink="/hotels" routerLinkActive="active" (click)="menuOpen.set(false)"><span>02</span>Stays</a>
          <a routerLink="/manage" routerLinkActive="active" (click)="menuOpen.set(false)"><span>03</span>My trip</a>
          <a routerLink="/hotels" class="btn btn--primary nav__cta" (click)="menuOpen.set(false)">Start roaming &nearr;</a>
        </nav>

        <button class="burger" type="button" (click)="menuOpen.set(!menuOpen())"
                [attr.aria-expanded]="menuOpen()" aria-label="Toggle menu">
          <span [class.open]="menuOpen()"></span>
        </button>
      </div>
    </header>
  `,
  styles: [`
    .header { position: fixed; inset: 0 0 auto 0; z-index: 50; height: var(--header-h);
      background: var(--cream); border-bottom: 2px solid var(--ink); transition: background-color .3s var(--ease); }
    .header--scrolled { background: var(--paper); }
    .header__inner { height: 100%; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
    .brand { display: flex; align-items: center; gap: 12px; text-decoration: none; }
    .brand__mark { display: block; border: 2px solid var(--ink); box-shadow: 3px 3px 0 var(--ink);
      transition: transform .3s var(--ease), box-shadow .3s var(--ease); }
    .brand__mark svg { display: block; }
    .brand__sun { transition: transform .6s var(--ease); transform-origin: 45px 15px; }
    .brand:hover .brand__mark { transform: translate(-2px, -2px); box-shadow: 5px 5px 0 var(--ink); }
    .brand:hover .brand__sun { transform: rotate(45deg); }
    .brand__word { font-family: var(--font-display); font-weight: 800; font-size: 1.55rem; letter-spacing: -0.03em; }
    .nav { display: flex; align-items: center; gap: 6px; }
    .nav a:not(.btn) { display: flex; align-items: baseline; gap: 6px; padding: 8px 14px; text-decoration: none;
      font-weight: 600; border: 2px solid transparent; transition: background-color .2s, border-color .2s; }
    .nav a:not(.btn) span { font-family: var(--font-mono); font-size: .68rem; color: var(--forest-2); }
    .nav a:not(.btn):hover { border-color: var(--ink); background: var(--paper); }
    .nav a.active { background: var(--forest); color: var(--paper); border-color: var(--ink); }
    .nav a.active span { color: var(--lime); }
    .nav__cta { margin-left: 10px; min-height: 44px; }
    .burger { display: none; width: 48px; height: 48px; background: var(--lime); border: 2px solid var(--ink);
      box-shadow: 3px 3px 0 var(--ink); cursor: pointer; position: relative; }
    .burger span, .burger span::before, .burger span::after { position: absolute; left: 11px; width: 22px; height: 3px;
      background: var(--ink); transition: transform .3s var(--ease), background-color .3s; content: ''; }
    .burger span { top: 20px; }
    .burger span::before { left: 0; top: -7px; }
    .burger span::after { left: 0; top: 7px; }
    .burger span.open { background: transparent; }
    .burger span.open::before { transform: translateY(7px) rotate(45deg); }
    .burger span.open::after { transform: translateY(-7px) rotate(-45deg); }

    @media (max-width: 860px) {
      .burger { display: block; }
      .nav { position: fixed; top: var(--header-h); left: 0; right: 0; flex-direction: column; align-items: stretch;
        gap: 8px; background: var(--cream); padding: 18px; border-bottom: 2px solid var(--ink);
        clip-path: inset(0 0 100% 0); visibility: hidden;
        transition: clip-path .45s var(--ease), visibility 0s .45s; }
      .nav--open { clip-path: inset(0 0 0 0); visibility: visible; transition: clip-path .45s var(--ease); }
      .nav a:not(.btn) { padding: 14px; border-color: var(--ink); background: var(--paper); font-size: 1.1rem; }
      .nav__cta { margin: 8px 0 0; }
      .brand__word { font-size: 1.35rem; }
    }
  `],
})
export class HeaderComponent {
  readonly scrolled = signal(false);
  readonly menuOpen = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 10);
  }
}
