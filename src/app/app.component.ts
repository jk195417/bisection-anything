import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { IconComponent } from './shared/icon.component';

@Component({
  selector: 'app-root',
  imports: [IconComponent, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="app-header sticky-top">
      <div class="shell d-flex flex-wrap align-items-center gap-2 py-2">
        <a class="brand d-flex align-items-center gap-2 me-md-4" routerLink="/config">
          <svg class="logo" viewBox="0 0 32 32" aria-hidden="true">
            <rect width="32" height="32" rx="8" />
            <path d="M8 9h6v14H8M14 16h5M19 12v8h5" />
          </svg>
          <h1 class="h6 mb-0 fw-semibold">Bisection Anything</h1>
        </a>

        <nav class="steps order-last order-md-0" aria-label="步驟">
          @for (link of links; track link.path; let i = $index) {
            <a
              class="step"
              [routerLink]="link.path"
              routerLinkActive="active"
              ariaCurrentWhenActive="page"
            >
              <span class="step-number">{{ i + 1 }}</span>
              {{ link.label }}
            </a>
          }
        </nav>

        <div class="ms-auto d-flex gap-1">
          @for (link of externalLinks; track link.href) {
            <a
              class="external"
              [href]="link.href"
              target="_blank"
              rel="noopener"
              [title]="link.label"
            >
              <app-icon [name]="link.icon" />
              <span class="d-none d-sm-inline">{{ link.label }}</span>
            </a>
          }
        </div>
      </div>
    </header>

    <main class="shell py-4">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: `
    .app-header {
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid var(--bs-border-color-translucent);
    }

    .shell {
      max-width: 960px;
      margin: 0 auto;
      padding-left: 1rem;
      padding-right: 1rem;
    }

    .brand {
      color: var(--bs-emphasis-color);
    }

    .logo {
      width: 1.75rem;
      height: 1.75rem;

      rect {
        fill: var(--bs-primary);
      }

      path {
        fill: none;
        stroke: #fff;
        stroke-width: 2.25;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
    }

    .steps {
      display: flex;
      gap: 0.25rem;
      padding: 0.25rem;
      background: var(--bs-tertiary-bg);
      border-radius: 999px;

      @media (max-width: 767.98px) {
        width: 100%;
      }
    }

    .step {
      display: flex;
      flex: 1;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      padding: 0.3rem 0.9rem;
      border-radius: 999px;
      color: var(--bs-secondary-color);
      font-size: 0.9rem;
      white-space: nowrap;
      transition: background-color 0.15s, color 0.15s;

      &:hover {
        color: var(--bs-emphasis-color);
      }

      &.active {
        background: var(--bs-body-bg);
        color: var(--bs-primary);
        font-weight: 600;
        box-shadow: 0 1px 3px rgba(15, 23, 42, 0.12);
      }
    }

    .step-number {
      display: inline-grid;
      place-items: center;
      width: 1.25rem;
      height: 1.25rem;
      border-radius: 50%;
      background: var(--bs-secondary-bg);
      font-size: 0.7rem;
      font-weight: 600;

      .active & {
        background: var(--bs-primary);
        color: #fff;
      }
    }

    .external {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.6rem;
      border-radius: var(--bs-border-radius);
      color: var(--bs-secondary-color);
      font-size: 0.9rem;
      transition: background-color 0.15s, color 0.15s;

      app-icon {
        font-size: 1.1rem;
      }

      &:hover {
        background: var(--bs-tertiary-bg);
        color: var(--bs-emphasis-color);
      }
    }
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
    {
      href: 'https://blog.yang-hong-xin.com/',
      label: 'Blog',
      icon: 'journal-text' as const,
    },
    {
      href: 'https://github.com/jk195417/bisection-anything',
      label: 'GitHub',
      icon: 'github' as const,
    },
  ];
}
