import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AvailabilityCalendar,
  Booking,
  CreateBookingRequest,
  FlexDates,
  HotelDetail,
  HotelSummary,
  Quote,
} from './models';

/** Thin, typed wrapper around the REST API. Components never build URLs themselves. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  searchHotels(location?: string, checkIn?: string, checkOut?: string): Observable<HotelSummary[]> {
    return this.http.get<HotelSummary[]>(`${this.base}/hotels`, {
      params: this.params({ location, checkIn, checkOut }),
    });
  }

  locations(): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/hotels/locations`);
  }

  hotel(id: number, checkIn?: string, checkOut?: string): Observable<HotelDetail> {
    return this.http.get<HotelDetail>(`${this.base}/hotels/${id}`, {
      params: this.params({ checkIn, checkOut }),
    });
  }

  quote(hotelId: number, checkIn: string, checkOut: string): Observable<Quote> {
    return this.http.get<Quote>(`${this.base}/hotels/${hotelId}/quote`, {
      params: this.params({ checkIn, checkOut }),
    });
  }

  calendar(hotelId: number, from: string, days = 28): Observable<AvailabilityCalendar> {
    return this.http.get<AvailabilityCalendar>(`${this.base}/hotels/${hotelId}/calendar`, {
      params: this.params({ from, days: String(days) }),
    });
  }

  flexDates(hotelId: number, checkIn: string, checkOut: string): Observable<FlexDates> {
    return this.http.get<FlexDates>(`${this.base}/hotels/${hotelId}/flex-dates`, {
      params: this.params({ checkIn, checkOut }),
    });
  }

  createBooking(request: CreateBookingRequest): Observable<Booking> {
    return this.http.post<Booking>(`${this.base}/bookings`, request);
  }

  findBooking(reference: string, email: string): Observable<Booking> {
    return this.http.get<Booking>(`${this.base}/bookings/${encodeURIComponent(reference.trim())}`, {
      params: this.params({ email: email.trim() }),
    });
  }

  cancelBooking(reference: string, email: string): Observable<Booking> {
    return this.http.post<Booking>(`${this.base}/bookings/${encodeURIComponent(reference.trim())}/cancel`, {
      email: email.trim(),
    });
  }

  private params(values: Record<string, string | undefined | null>): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(values)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value);
      }
    }
    return params;
  }
}
