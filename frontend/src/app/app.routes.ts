import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Roamstead | Handpicked stays across India',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'hotels',
    title: 'Find a stay | Roamstead',
    loadComponent: () => import('./pages/results/results.component').then((m) => m.ResultsComponent),
  },
  {
    path: 'hotels/:id',
    title: 'Stay details | Roamstead',
    loadComponent: () =>
      import('./pages/hotel-detail/hotel-detail.component').then((m) => m.HotelDetailComponent),
  },
  {
    path: 'book/:hotelId',
    title: 'Book your stay | Roamstead',
    loadComponent: () => import('./pages/booking/booking.component').then((m) => m.BookingComponent),
  },
  {
    path: 'booking/:reference/confirmed',
    title: 'Booking confirmed | Roamstead',
    loadComponent: () =>
      import('./pages/confirmation/confirmation.component').then((m) => m.ConfirmationComponent),
  },
  {
    path: 'manage',
    title: 'My trip | Roamstead',
    loadComponent: () => import('./pages/manage/manage.component').then((m) => m.ManageComponent),
  },
  {
    path: '**',
    title: 'Page not found | Roamstead',
    loadComponent: () => import('./pages/not-found.component').then((m) => m.NotFoundComponent),
  },
];
