import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from './layout/footer.component';
import { HeaderComponent } from './layout/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    <rs-header></rs-header>
    <main class="main">
      <router-outlet></router-outlet>
    </main>
    <rs-footer></rs-footer>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; min-height: 100vh; }
    .main { flex: 1; padding-top: var(--header-h); }
  `],
})
export class AppComponent {}
