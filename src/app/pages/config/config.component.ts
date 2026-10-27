import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { estimateInsertion } from '../../core/insertion';
import { Mode, parseItems } from '../../core/session';
import { SessionStore } from '../../core/session-store';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-config',
  imports: [IconComponent, FormsModule, RouterLink],
  template: `
    @if (store.session(); as session) {
      <div class="session-banner panel d-flex flex-wrap align-items-center gap-3 mb-4">
        @if (store.finished()) {
          <app-icon name="check-circle-fill" class="fs-4 text-success" />
        } @else {
          <app-icon name="hourglass-split" class="fs-4 text-primary" />
        }
        <div class="me-auto">
          <div class="small text-body-secondary">{{ store.finished() ? '已完成' : '進行中' }}</div>
          <div class="fw-semibold">
            {{ session.title || '未命名' }}
            <span class="fw-normal text-body-secondary small ms-1">{{ store.progress().done }} / {{ store.progress().total }} 次比較</span>
          </div>
        </div>
        <button type="button" class="btn btn-sm btn-link link-danger text-decoration-none" (click)="clear()">清除</button>
        <a class="btn btn-sm btn-primary" [routerLink]="store.finished() ? '/bracket-chart' : '/compare'">
          {{ store.finished() ? '看結果' : '繼續比較' }}
          <app-icon name="arrow-right" class="ms-1" />
        </a>
      </div>
    }

    <div class="page-header">
      <h2>建立新的比較</h2>
      <label class="btn btn-sm btn-outline-secondary ms-auto mb-0">
        <app-icon name="upload" class="me-1" />匯入 JSON
        <input type="file" accept=".json,application/json" hidden (change)="importFile($event)" />
      </label>
    </div>

    @if (error()) {
      <div class="alert alert-danger" role="alert">{{ error() }}</div>
    }

    <form class="panel" (ngSubmit)="start()">
      <div class="mb-4">
        <label class="form-label fw-semibold" for="title">標題</label>
        <input id="title" name="title" class="form-control" placeholder="例如：最好吃的拉麵" [(ngModel)]="title" />
      </div>

      <div class="mb-4">
        <div class="d-flex align-items-baseline mb-2">
          <label class="form-label fw-semibold mb-0" for="items">項目</label>
          <span class="small text-body-secondary ms-2">一行一個</span>
          <span class="badge rounded-pill text-bg-light border ms-auto">{{ parsed().items.length }} 項</span>
        </div>
        <textarea id="items" name="items" class="form-control" rows="8" [placeholder]="placeholder" [(ngModel)]="itemsText"></textarea>
        @if (parsed().duplicates.length) {
          <div class="form-text text-warning-emphasis">
            <app-icon name="exclamation-triangle" class="me-1" />已略過重複：{{ parsed().duplicates.join('、') }}
          </div>
        }
      </div>

      <fieldset class="mb-4">
        <legend class="form-label fw-semibold fs-6">模式</legend>
        <div class="row g-3">
          @for (option of modes(); track option.value) {
            <div class="col-md-6">
              <input class="btn-check" type="radio" name="mode" [id]="'mode-' + option.value" [value]="option.value" [(ngModel)]="mode" />
              <label class="mode-card" [for]="'mode-' + option.value">
                <app-icon class="fs-3" [name]="option.icon" />
                <span>
                  <span class="d-block fw-semibold">{{ option.title }}</span>
                  <span class="d-block small text-body-secondary">{{ option.description }}</span>
                  @if (option.cost) {
                    <span class="badge rounded-pill text-bg-light border mt-2">{{ option.cost }}</span>
                  }
                </span>
              </label>
            </div>
          }
        </div>
      </fieldset>

      <div class="form-check form-switch mb-4">
        <input class="form-check-input" type="checkbox" role="switch" id="shuffled" name="shuffled" [(ngModel)]="shuffled" />
        <label class="form-check-label" for="shuffled">隨機打亂順序</label>
        <div class="form-text mt-0">關閉時，清單越前面的項目種子越高。</div>
      </div>

      <button type="submit" class="btn btn-primary btn-lg w-100" [disabled]="parsed().items.length < 2">
        <app-icon name="play-fill" class="me-1" />開始比較
      </button>
      @if (parsed().items.length < 2) {
        <div class="form-text text-center">至少需要 2 個項目</div>
      }
    </form>
  `,
  styles: `
    .mode-card {
      display: flex;
      gap: 0.75rem;
      height: 100%;
      padding: 1rem;
      border: 1px solid var(--bs-border-color);
      border-radius: var(--bs-border-radius-lg);
      cursor: pointer;
      transition: border-color 0.15s, background-color 0.15s, box-shadow 0.15s;

      app-icon {
        color: var(--bs-secondary-color);
      }

      &:hover {
        border-color: var(--bs-primary-border-subtle);
      }
    }

    .btn-check:checked + .mode-card {
      border-color: var(--bs-primary);
      background: var(--bs-primary-bg-subtle);
      box-shadow: 0 0 0 1px var(--bs-primary);

      app-icon {
        color: var(--bs-primary);
      }
    }

    .btn-check:focus-visible + .mode-card {
      box-shadow: 0 0 0 0.25rem rgba(var(--bs-primary-rgb), 0.25);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigComponent {
  protected readonly store = inject(SessionStore);
  private readonly router = inject(Router);

  protected readonly placeholder = '一蘭\n一風堂\n鬼金棒\n…';
  protected readonly title = signal(this.store.session()?.title ?? '');
  protected readonly itemsText = signal(
    this.store.session()?.items.join('\n') ?? '',
  );
  protected readonly mode = signal<Mode>(
    this.store.session()?.mode ?? 'elimination',
  );
  protected readonly shuffled = signal(false);
  protected readonly error = signal('');

  protected readonly parsed = computed(() => parseItems(this.itemsText()));

  protected readonly modes = computed(() => {
    const count = this.parsed().items.length;
    const enough = count >= 2;
    return [
      {
        value: 'elimination' as const,
        icon: 'trophy' as const,
        title: '單淘汰',
        description: '選出冠軍。人數不是 2 的次方時，前段種子第一輪輪空。',
        cost: enough ? `需要比較 ${count - 1} 次` : '',
      },
      {
        value: 'insertion' as const,
        icon: 'list-ol' as const,
        title: '完整排序',
        description: '用二分插入排出所有名次，比較次數較多。',
        cost: enough ? `最多比較 ${estimateInsertion(count)} 次` : '',
      },
    ];
  });

  protected start() {
    if (!this.confirmReplace()) return;
    this.store.start(
      this.title().trim(),
      this.mode(),
      this.parsed().items,
      this.shuffled(),
    );
    this.router.navigateByUrl('/compare');
  }

  protected clear() {
    if (confirm('確定要清除目前的比較進度嗎？')) {
      this.store.clear();
    }
  }

  protected async importFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !this.confirmReplace()) return;
    try {
      this.store.importJson(await file.text());
    } catch (error) {
      this.error.set(`匯入失敗：${(error as Error).message}`);
      return;
    }
    this.router.navigateByUrl(
      this.store.finished() ? '/bracket-chart' : '/compare',
    );
  }

  /** Asks before discarding a session that already has picks. */
  private confirmReplace(): boolean {
    this.error.set('');
    return (
      !this.store.session()?.picks.length ||
      confirm('這會取代目前的比較進度，確定嗎？')
    );
  }
}
