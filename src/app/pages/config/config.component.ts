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

@Component({
  selector: 'app-config',
  imports: [FormsModule, RouterLink],
  template: `
    @if (store.session(); as session) {
      <div class="alert alert-secondary d-flex flex-wrap align-items-center gap-2">
        <span class="me-auto">
          {{ store.finished() ? '已完成' : '進行中' }}：<strong>{{ session.title || '未命名' }}</strong>
          （{{ store.progress().done }} / {{ store.progress().total }} 次比較）
        </span>
        <a class="btn btn-sm btn-primary" [routerLink]="store.finished() ? '/bracket-chart' : '/compare'">
          {{ store.finished() ? '看結果' : '繼續比較' }}
        </a>
        <button type="button" class="btn btn-sm btn-outline-danger" (click)="clear()">清除</button>
      </div>
    }

    <form (ngSubmit)="start()">
      <div class="mb-3">
        <label class="form-label" for="title">標題</label>
        <input id="title" name="title" class="form-control" placeholder="例如：最好吃的拉麵" [(ngModel)]="title" />
      </div>

      <div class="mb-3">
        <label class="form-label" for="items">要比較的項目（一行一個）</label>
        <textarea id="items" name="items" class="form-control" rows="10" [(ngModel)]="itemsText"></textarea>
        <div class="form-text">
          共 {{ parsed().items.length }} 項
          @if (parsed().duplicates.length) {
            <span class="text-warning-emphasis">，已略過重複：{{ parsed().duplicates.join('、') }}</span>
          }
        </div>
      </div>

      <fieldset class="mb-3">
        <legend class="form-label fs-6">模式</legend>
        <div class="form-check">
          <input class="form-check-input" type="radio" id="mode-elimination" name="mode" value="elimination" [(ngModel)]="mode" />
          <label class="form-check-label" for="mode-elimination">
            單淘汰：選出冠軍，人數不足 2 的次方時，前段種子第一輪輪空
          </label>
        </div>
        <div class="form-check">
          <input class="form-check-input" type="radio" id="mode-insertion" name="mode" value="insertion" [(ngModel)]="mode" />
          <label class="form-check-label" for="mode-insertion">
            完整排序：用二分插入排出所有名次
          </label>
        </div>
      </fieldset>

      <div class="form-check mb-3">
        <input class="form-check-input" type="checkbox" id="shuffled" name="shuffled" [(ngModel)]="shuffled" />
        <label class="form-check-label" for="shuffled">
          隨機打亂順序（不勾選時，清單越前面的項目種子越高）
        </label>
      </div>

      <div class="d-flex flex-wrap align-items-center gap-2">
        <button type="submit" class="btn btn-primary" [disabled]="parsed().items.length < 2">開始比較</button>
        <span class="text-body-secondary">{{ estimate() }}</span>
        <label class="btn btn-outline-secondary ms-auto mb-0">
          匯入 JSON
          <input type="file" accept=".json,application/json" hidden (change)="importFile($event)" />
        </label>
      </div>
    </form>

    @if (error()) {
      <div class="alert alert-danger mt-3" role="alert">{{ error() }}</div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigComponent {
  protected readonly store = inject(SessionStore);
  private readonly router = inject(Router);

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

  protected readonly estimate = computed(() => {
    const count = this.parsed().items.length;
    if (count < 2) return '至少需要 2 個項目';
    return this.mode() === 'elimination'
      ? `需要比較 ${count - 1} 次`
      : `最多需要比較 ${estimateInsertion(count)} 次`;
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
