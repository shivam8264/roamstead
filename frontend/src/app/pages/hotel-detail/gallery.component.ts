import { Component, Input, OnDestroy, OnInit, signal } from '@angular/core';
import { ImgFallbackDirective } from '../../shared/img-fallback.directive';

/** Sliding photo gallery with arrows, thumbnails, keyboard and swipe support. */
@Component({
  selector: 'rs-gallery',
  standalone: true,
  imports: [ImgFallbackDirective],
  template: `
    <div class="gallery" tabindex="0" (keydown.arrowLeft)="go(index() - 1)" (keydown.arrowRight)="go(index() + 1)"
         aria-roledescription="carousel" [attr.aria-label]="name + ' photos'">
      <div class="gallery__viewport" (pointerdown)="onDown($event)" (pointerup)="onUp($event)">
        <div class="gallery__track" [style.transform]="'translateX(-' + index() * 100 + '%)'">
          @for (src of images; track src; let i = $index) {
            <div class="gallery__slide">
              <img [src]="src" [alt]="name + ' photo ' + (i + 1)" [rsFallback]="name" draggable="false" />
            </div>
          }
        </div>
        @if (images.length > 1) {
          <button type="button" class="gallery__arrow gallery__arrow--prev" (click)="go(index() - 1)"
                  aria-label="Previous photo">&larr;</button>
          <button type="button" class="gallery__arrow gallery__arrow--next" (click)="go(index() + 1)"
                  aria-label="Next photo">&rarr;</button>
          <span class="gallery__count">{{ index() + 1 }} / {{ images.length }}</span>
        }
      </div>
      @if (images.length > 1) {
        <div class="gallery__thumbs">
          @for (src of images; track src; let i = $index) {
            <button type="button" [class.is-active]="i === index()" (click)="go(i)"
                    [attr.aria-label]="'Show photo ' + (i + 1)">
              <img [src]="src" alt="" [rsFallback]="name" />
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .gallery { outline: none; }
    .gallery__viewport { position: relative; overflow: hidden; aspect-ratio: 16 / 8; background: var(--cream-deep);
      border: 2px solid var(--ink); box-shadow: var(--hard-lg);
      touch-action: pan-y; cursor: grab; }
    .gallery__track { display: flex; height: 100%; transition: transform .7s var(--ease); }
    .gallery__slide { flex: 0 0 100%; height: 100%; overflow: hidden; }
    .gallery__slide img { width: 100%; height: 100%; object-fit: cover; user-select: none; }
    .gallery__arrow { position: absolute; top: 50%; transform: translateY(-50%); width: 52px; height: 52px; border: 2px solid var(--ink);
      background: var(--paper); color: var(--forest); font-size: 1.25rem; cursor: pointer; opacity: .92;
      transition: background-color .25s, color .25s, opacity .25s; }
    .gallery__arrow:hover { background: var(--lime); color: var(--ink); opacity: 1; }
    .gallery__arrow--prev { left: 0; }
    .gallery__arrow--next { right: 0; }
    .gallery__count { position: absolute; right: 0; bottom: 0; background: var(--forest); color: var(--paper);
      padding: 6px 14px; font-size: .85rem; font-weight: 700; }
    .gallery__thumbs { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 10px; margin-top: 18px; }
    .gallery__thumbs button { padding: 0; border: 3px solid transparent; background: none; cursor: pointer;
      aspect-ratio: 16 / 10; overflow: hidden; opacity: .6; transition: opacity .25s, border-color .25s; }
    .gallery__thumbs button.is-active, .gallery__thumbs button:hover { opacity: 1; border-color: var(--ink); }
    .gallery__thumbs img { width: 100%; height: 100%; object-fit: cover; }
    @media (max-width: 680px) { .gallery__viewport { aspect-ratio: 4 / 3; } .gallery__arrow { width: 42px; height: 42px; } }
  `],
})
export class GalleryComponent implements OnInit, OnDestroy {
  @Input({ required: true }) images: string[] = [];
  @Input() name = '';

  readonly index = signal(0);
  private startX: number | null = null;
  private timer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.restart();
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  go(i: number): void {
    const n = this.images.length;
    if (!n) return;
    this.index.set((i + n) % n);
    this.restart();
  }

  onDown(e: PointerEvent): void {
    this.startX = e.clientX;
  }

  onUp(e: PointerEvent): void {
    if (this.startX === null) return;
    const dx = e.clientX - this.startX;
    this.startX = null;
    if (Math.abs(dx) > 50) this.go(this.index() + (dx < 0 ? 1 : -1));
  }

  private restart(): void {
    if (this.timer) clearInterval(this.timer);
    if (this.images.length > 1) {
      this.timer = setInterval(() => this.index.set((this.index() + 1) % this.images.length), 7000);
    }
  }
}
