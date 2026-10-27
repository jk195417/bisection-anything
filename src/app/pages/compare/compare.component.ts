import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Pick } from '../../core/session';
import { SessionStore } from '../../core/session-store';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-compare',
  imports: [IconComponent, RouterLink],
  host: { '(document:keydown)': 'onKeydown($event)' },
  template: `
    @if (!store.session()) {
      <div class="panel text-center py-5">
        <app-icon name="inbox" class="fs-1 text-body-tertiary" />
        <p class="mt-2 text-body-secondary">還沒有開始任何比較。</p>
        <a class="btn btn-primary" routerLink="/config">前往設定</a>
      </div>
    } @else if (store.comparison(); as comparison) {
      <div class="page-header mb-3">
        <h2>{{ store.session()?.title || '未命名' }}</h2>
        <span class="badge rounded-pill text-bg-primary">{{ comparison.label }}</span>
        <span class="ms-auto small text-body-secondary">第 {{ store.progress().done + 1 }} 次，共 {{ store.progress().total }} 次</span>
      </div>
      <div class="progress mb-4" role="progressbar" [attr.aria-valuenow]="percent()" aria-valuemin="0" aria-valuemax="100">
        <div class="progress-bar" [style.width.%]="percent()"></div>
      </div>

      <p class="text-center fs-5 fw-semibold mb-3">你比較喜歡哪一個？</p>
      <div class="duel mb-4">
        <button type="button" class="option" (click)="pick(0)">
          <span class="option-name">{{ comparison.left }}</span>
          <kbd class="d-none d-md-inline">←</kbd>
        </button>
        <span class="versus">VS</span>
        <button type="button" class="option" (click)="pick(1)">
          <span class="option-name">{{ comparison.right }}</span>
          <kbd class="d-none d-md-inline">→</kbd>
        </button>
      </div>

      <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
        <button type="button" class="btn btn-sm btn-outline-secondary" [disabled]="!store.session()?.picks?.length" (click)="store.undo()">
          <app-icon name="arrow-counterclockwise" class="me-1" />復原上一步
        </button>
        <span class="small text-body-secondary d-none d-md-inline">
          快速鍵：<kbd>←</kbd> <kbd>→</kbd> 選擇，<kbd>Backspace</kbd> 復原
        </span>
      </div>
    } @else {
      <div class="panel text-center py-5">
        <div class="trophy mb-3"><app-icon name="trophy-fill" /></div>
        <p class="text-body-secondary mb-1">{{ store.session()?.title || '未命名' }}・比較完成</p>
        @if (winner()) {
          <p class="winner fs-2 fw-bold mb-4">{{ winner() }}</p>
        }
        <div class="d-flex justify-content-center gap-2">
          <button type="button" class="btn btn-outline-secondary" (click)="store.undo()">
            <app-icon name="arrow-counterclockwise" class="me-1" />復原上一步
          </button>
          <a class="btn btn-primary" routerLink="/bracket-chart">
            看完整結果<app-icon name="arrow-right" class="ms-1" />
          </a>
        </div>
      </div>
    }
  `,
  styles: `
    .progress {
      height: 0.5rem;
    }

    .duel {
      position: relative;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;

      /* Stack the options on phones so long names never run into VS. */
      @media (max-width: 575.98px) {
        grid-template-columns: 1fr;

        .option {
          min-height: 7rem;
        }
      }
    }

    .option {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      min-height: 12rem;
      padding: 1.5rem 1rem;
      background: var(--bs-body-bg);
      border: 1px solid var(--bs-border-color-translucent);
      border-radius: var(--bs-border-radius-lg);
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
      transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;

      &:hover,
      &:focus-visible {
        transform: translateY(-3px);
        border-color: var(--bs-primary);
        box-shadow: 0 10px 24px rgba(79, 70, 229, 0.15);
        outline: none;
      }

      &:active {
        transform: translateY(0);
      }
    }

    .option-name {
      font-size: 1.6rem;
      font-weight: 600;
      color: var(--bs-emphasis-color);
      word-break: break-word;
    }

    .versus {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: grid;
      place-items: center;
      width: 2.75rem;
      height: 2.75rem;
      border-radius: 50%;
      background: var(--bs-primary);
      color: #fff;
      font-size: 0.8rem;
      font-weight: 700;
      box-shadow: 0 0 0 5px #f5f6fa;
      pointer-events: none;
    }

    .trophy {
      display: inline-grid;
      place-items: center;
      width: 4.5rem;
      height: 4.5rem;
      border-radius: 50%;
      background: #fef3c7;
      color: #d97706;
      font-size: 2rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompareComponent {
  protected readonly store = inject(SessionStore);

  protected readonly percent = computed(() => {
    const { done, total } = this.store.progress();
    return total ? Math.round((done / total) * 100) : 0;
  });

  /** The champion, or the top of the ranking once finished. */
  protected readonly winner = computed(() => {
    const items = this.store.session()?.items ?? [];
    const index =
      this.store.elimination()?.champion ?? this.store.insertion()?.ranking[0];
    return index === undefined || index === null ? null : items[index];
  });

  protected pick(index: number) {
    this.store.pick(index as Pick);
  }

  protected onKeydown(event: KeyboardEvent) {
    // Leave browser shortcuts such as Alt+← (back) alone.
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowLeft') {
      this.store.pick(0);
    } else if (event.key === 'ArrowRight') {
      this.store.pick(1);
    } else if (event.key === 'Backspace') {
      this.store.undo();
    } else {
      return;
    }
    event.preventDefault();
  }
}
