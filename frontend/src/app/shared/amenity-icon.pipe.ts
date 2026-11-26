import { Pipe, PipeTransform } from '@angular/core';

/** Maps an amenity name to a small SVG path (24x24 viewBox) for the amenity grid. */
const ICONS: [RegExp, string][] = [
  [/wi-?fi/i, 'M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01'],
  [/pool|plunge|swim/i, 'M2 18c2 0 2-1.5 4-1.5S8 18 10 18s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5M7 15V5a2 2 0 0 1 4 0M13 15V5a2 2 0 0 1 4 0M7 9h6'],
  [/beach|sea|lake|boat|cruise|jetty/i, 'M2 17c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2M12 3v10M12 3l6 7H6z'],
  [/café|cafe|dining|breakfast|cooking|room service/i, 'M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 9h1.5a2.5 2.5 0 0 1 0 5H17M7 3v2M11 3v2'],
  [/spa|ayurved/i, 'M12 21c-5 0-8-3.5-8-8 3 0 6 1.5 8 5 2-3.5 5-5 8-5 0 4.5-3 8-8 8zM12 13c-2-2-2-6 0-9 2 3 2 7 0 9z'],
  [/gym/i, 'M3 10v4M6 7v10M18 7v10M21 10v4M6 12h12'],
  [/mountain/i, 'M2 20l7-12 4 6 3-4 6 10z'],
  [/fire/i, 'M12 22a7 7 0 0 0 7-7c0-4-4-6-4-11-3 2-5 5-5 8-1-1-2-2-2-4-2 2-3 4-3 7a7 7 0 0 0 7 7z'],
  [/parking|transfer/i, 'M5 17h14M6 17V9l2-4h8l2 4v8M6 13h12M8 17v2M16 17v2'],
  [/bicycle/i, 'M5.5 17.5a3.5 3.5 0 1 0 0-.01M18.5 17.5a3.5 3.5 0 1 0 0-.01M5.5 17.5L9 9h6l3.5 8.5M9 9l3 8.5'],
  [/air/i, 'M3 8h12a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h8'],
  [/desk|work/i, 'M3 9h18M5 9v11M19 9v11M8 9V5h8v4'],
  [/walk|trek|heritage/i, 'M13 4a1.5 1.5 0 1 0 0-.01M10 21l2-7 3 3v4M8 12l3-4 4 2 2 3'],
  [/lounge|rooftop/i, 'M4 18v-6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6M4 14h16M6 18v2M18 18v2'],
];
const DEFAULT_ICON = 'M5 12l4 4L19 6';

@Pipe({ name: 'amenityIcon', standalone: true })
export class AmenityIconPipe implements PipeTransform {
  transform(amenity: string): string {
    return ICONS.find(([pattern]) => pattern.test(amenity))?.[1] ?? DEFAULT_ICON;
  }
}
