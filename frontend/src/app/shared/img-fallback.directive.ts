import { Directive, ElementRef, HostListener, Input, inject } from '@angular/core';

const SOLID_COLOURS = ['#1e4d3b', '#2a6650', '#121212', '#3d6b56', '#24493a'];

/**
 * If a remote photo fails to load, swap in a solid-colour tile with the
 * hotel's initials so the layout never shows a broken image icon.
 */
@Directive({
  selector: 'img[rsFallback]',
  standalone: true,
})
export class ImgFallbackDirective {
  @Input('rsFallback') label = 'Roamstead';

  private readonly el = inject(ElementRef<HTMLImageElement>);
  private failed = false;

  @HostListener('error')
  onError(): void {
    if (this.failed) return;
    this.failed = true;
    const initials = this.label
      .split(/\s+/)
      .filter((w) => /^[A-Za-z]/.test(w))
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');
    const colour = SOLID_COLOURS[this.label.length % SOLID_COLOURS.length];
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">` +
      `<rect width="800" height="600" fill="${colour}"/>` +
      `<text x="50%" y="54%" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="800" font-size="140" fill="#c9f24d">${initials}</text>` +
      `</svg>`;
    (this.el.nativeElement as HTMLImageElement).src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }
}
