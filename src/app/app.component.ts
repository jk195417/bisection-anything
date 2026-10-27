import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, RouterLink, RouterLinkActive],
    template: `
    <h1 class="text-center">Bisection Anything</h1>
    <div class="d-flex">
      <nav class="nav nav-underline flex-column p-2">
        <a
          class="nav-link"
          routerLink="config"
          routerLinkActive="active"
          ariaCurrentWhenActive="page"
        >
          config
        </a>

        <a
          class="nav-link"
          routerLink="compare"
          routerLinkActive="active"
          ariaCurrentWhenActive="page"
        >
          compare
        </a>

        <a
          class="nav-link"
          routerLink="bracket-chart"
          routerLinkActive="active"
          ariaCurrentWhenActive="page"
        >
          bracket chart
        </a>
      </nav>
      <div class="container">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styles: ``
})
export class AppComponent {}
