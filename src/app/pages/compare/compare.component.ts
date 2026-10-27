import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Pick } from '../../core/session';
import { SessionStore } from '../../core/session-store';

@Component({
  selector: 'app-compare',
  imports: [RouterLink],
  host: { '(document:keydown)': 'onKeydown($event)' },
  template: `
    @if (!store.session()) {
      <p>還沒有開始任何比較。</p>
      <a class="btn btn-primary" routerLink="/config">前往設定</a>
    } @else if (store.comparison(); as comparison) {
      <h2 class="h4">{{ store.session()?.title }}</h2>
      <div class="d-flex justify-content-between text-body-secondary small mb-1">
        <span>{{ comparison.label }}</span>
        <span>{{ store.progress().done }} / {{ store.progress().total }}</span>
      </div>
      <div class="progress mb-4" role="progressbar" [attr.aria-valuenow]="percent()" aria-valuemin="0" aria-valuemax="100">
        <div class="progress-bar" [style.width.%]="percent()"></div>
      </div>

      <p class="text-center fs-5">你比較喜歡哪一個？</p>
      <div class="row g-3 mb-4">
        @for (option of [comparison.left, comparison.right]; track $index) {
          <div class="col-6">
            <button type="button" class="option btn btn-outline-primary w-100 h-100 fs-4 text-break" (click)="pick($index)">
              {{ option }}
            </button>
          </div>
        }
      </div>

      <div class="d-flex align-items-center gap-2">
        <button type="button" class="btn btn-outline-secondary" [disabled]="!store.session()?.picks?.length" (click)="store.undo()">
          復原上一步
        </button>
        <span class="text-body-secondary small">快速鍵：← 選左邊，→ 選右邊，Backspace 復原</span>
      </div>
    } @else {
      <h2 class="h4">比較完成！</h2>
      @if (winner()) {
        <p class="fs-3">🏆 {{ winner() }}</p>
      }
      <div class="d-flex gap-2">
        <a class="btn btn-primary" routerLink="/bracket-chart">看完整結果</a>
        <button type="button" class="btn btn-outline-secondary" (click)="store.undo()">復原上一步</button>
      </div>
    }
  `,
  styles: `
    .option {
      min-height: 10rem;
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
