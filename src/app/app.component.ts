import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="text-center my-3">
      <h1>Bisection Anything</h1>
      <div class="d-flex justify-content-center gap-2">
        @for (link of externalLinks; track link.href) {
          <a
            class="btn btn-sm btn-outline-secondary"
            [href]="link.href"
            target="_blank"
            rel="noopener"
          >
            {{ link.label }}
          </a>
        }
      </div>
    </header>
    <div class="d-flex flex-column flex-md-row">
      <nav class="nav nav-underline flex-md-column flex-shrink-0 px-3 pb-3">
        @for (link of links; track link.path) {
          <a
            class="nav-link"
            [routerLink]="link.path"
            routerLinkActive="active"
            ariaCurrentWhenActive="page"
          >
            {{ link.label }}
          </a>
        }
      </nav>
      <main class="container pb-4">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  protected readonly links = [
    { path: 'config', label: '設定' },
    { path: 'compare', label: '比較' },
    { path: 'bracket-chart', label: '結果' },
  ];

  protected readonly externalLinks = [
    { href: 'https://blog.yang-hong-xin.com/', label: 'Blog' },
    {
      href: 'https://github.com/jk195417/bisection-anything',
      label: 'GitHub',
    },
  ];
}
