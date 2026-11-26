import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild, signal } from '@angular/core';

/**
 * Horizontal sliding container. Children are laid out in a scroll-snapping
 * track; arrow buttons slide one "page" at a time and also work with touch swipe.
 */
@Component({
  selector: 'rs-rail',
  standalone: true,
  template: `
    <div class="rail">
      <div class="rail__head">
        <ng-content select="[railTitle]"></ng-content>
        <div class="rail__arrows">
          <button type="button" class="rail__btn" (click)="slide(-1)" [disabled]="atStart()"
                  aria-label="Previous">&larr;</button>
          <button type="button" class="rail__btn" (click)="slide(1)" [disabled]="atEnd()"
                  aria-label="Next">&rarr;</button>
        </div>
      </div>
      <div class="rail__track" #track (scroll)="update()" [style.--item-width]="itemWidth">
        <ng-content></ng-content>
      </div>
      <div class="rail__progress"><span [style.width.%]="progress()"></span></div>
    </div>
  `,
  styles: [`
    .rail__head { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 28px; }
    .rail__arrows { display: flex; gap: 8px; flex-shrink: 0; }
    .rail__btn { width: 50px; height: 50px; border: 2px solid var(--ink); background: var(--paper); color: var(--ink);
      font-size: 1.2rem; cursor: pointer; box-shadow: 3px 3px 0 var(--ink);
      transition: background-color .2s, transform .18s var(--ease), box-shadow .18s var(--ease); }
    .rail__btn:hover:not(:disabled) { background: var(--lime); transform: translate(-2px, -2px); box-shadow: 5px 5px 0 var(--ink); }
    .rail__btn:active:not(:disabled) { transform: translate(2px, 2px); box-shadow: 1px 1px 0 var(--ink); }
    .rail__btn:disabled { opacity: .35; cursor: default; box-shadow: none; }
    .rail__track { display: grid; grid-auto-flow: column; grid-auto-columns: var(--item-width, 31%); gap: 18px;
      overflow-x: auto; scroll-snap-type: x mandatory; scroll-behavior: smooth; padding-bottom: 10px;
      scrollbar-width: none; overscroll-behavior-x: contain; }
    .rail__track::-webkit-scrollbar { display: none; }
    .rail__track > ::ng-deep * { scroll-snap-align: start; }
    .rail__progress { height: 6px; background: var(--paper); border: 2px solid var(--ink); margin-top: 18px; }
    .rail__progress span { display: block; height: 100%; background: var(--lime); transition: width .3s var(--ease); }
    @media (max-width: 960px) { .rail__track { grid-auto-columns: 46%; } }
    @media (max-width: 600px) { .rail__track { grid-auto-columns: 84%; gap: 16px; } }
  `],
})
export class RailComponent implements AfterViewInit, OnDestroy {
  /** Width of each item on desktop, e.g. "31%" for three per view. */
  @Input() itemWidth = '31%';
  @ViewChild('track', { static: true }) track!: ElementRef<HTMLDivElement>;

  readonly atStart = signal(true);
  readonly atEnd = signal(false);
  readonly progress = signal(0);
  private resizeObserver?: ResizeObserver;

  ngAfterViewInit(): void {
    this.update();
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.update());
      this.resizeObserver.observe(this.track.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  slide(direction: 1 | -1): void {
    const el = this.track.nativeElement;
    el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: 'smooth' });
  }

  update(): void {
    const el = this.track.nativeElement;
    const max = el.scrollWidth - el.clientWidth;
    this.atStart.set(el.scrollLeft <= 4);
    this.atEnd.set(el.scrollLeft >= max - 4);
    const visible = el.scrollWidth ? (el.clientWidth / el.scrollWidth) * 100 : 100;
    this.progress.set(max <= 0 ? 100 : visible + (100 - visible) * (el.scrollLeft / max));
  }
}
