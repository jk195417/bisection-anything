import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Match, roundLabel } from '../../core/elimination';
import { SessionStore } from '../../core/session-store';

@Component({
  selector: 'app-bracket-chart',
  imports: [RouterLink],
  template: `
    @if (store.session(); as session) {
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <h2 class="h4 mb-0 me-auto">
          {{ session.title || '未命名' }}
          @if (!store.finished()) {
            <span class="badge text-bg-secondary align-middle fs-6">進行中</span>
          }
        </h2>
        <button type="button" class="btn btn-sm btn-outline-primary" (click)="copyShareLink()">複製分享連結</button>
        <button type="button" class="btn btn-sm btn-outline-primary" (click)="copyResult()">複製結果文字</button>
        <button type="button" class="btn btn-sm btn-outline-secondary" (click)="downloadJson()">匯出 JSON</button>
      </div>
      @if (message()) {
        <div class="alert alert-info py-2" role="status">{{ message() }}</div>
      }

      @if (store.elimination(); as bracket) {
        <div class="bracket d-flex gap-3 overflow-x-auto pb-2">
          @for (round of bracket.rounds; track $index; let r = $index) {
            <div class="d-flex flex-column">
              <div class="text-center small text-body-secondary mb-2">
                {{ label(r, bracket.rounds.length) }}
              </div>
              <div class="d-flex flex-column justify-content-around flex-grow-1 gap-2">
                @for (match of round; track $index; let m = $index) {
                  <div
                    class="match card"
                    [class.border-primary]="isCurrent(r, m)"
                    [class.border-2]="isCurrent(r, m)"
                    [class.opacity-50]="match.bye"
                  >
                    @for (side of [match.a, match.b]; track $index) {
                      <div
                        class="px-2 py-1 text-truncate"
                        [class.border-top]="$index === 1"
                        [class.fw-bold]="side !== null && side === match.winner"
                        [class.bg-success-subtle]="side !== null && side === match.winner && !match.bye"
                        [class.text-body-secondary]="isLoser(match, side)"
                        [class.text-decoration-line-through]="isLoser(match, side)"
                      >
                        @if (side !== null) {
                          {{ session.items[side] }}
                        } @else if (match.bye) {
                          <em class="text-body-secondary">輪空</em>
                        } @else {
                          <span class="text-body-secondary">—</span>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }
          <div class="d-flex flex-column">
            <div class="text-center small text-body-secondary mb-2">冠軍</div>
            <div class="d-flex flex-column justify-content-around flex-grow-1">
              <div class="match card border-warning border-2 px-2 py-1 fw-bold text-truncate">
                @if (bracket.champion !== null) {
                  🏆 {{ session.items[bracket.champion] }}
                } @else {
                  <span class="text-body-secondary">—</span>
                }
              </div>
            </div>
          </div>
        </div>
      }

      @if (store.insertion(); as sort) {
        @if (!store.finished()) {
          <p class="text-body-secondary">排序進行中，以下是目前已排好的 {{ sort.ranking.length }} 項。</p>
        }
        <ol class="list-group list-group-numbered mb-3">
          @for (index of sort.ranking; track index) {
            <li class="list-group-item" [class.fw-bold]="$first && store.finished()">{{ session.items[index] }}</li>
          }
        </ol>
        @if (sort.current) {
          <h3 class="h6">尚未排入</h3>
          <ul class="list-inline">
            @for (index of [sort.current.item].concat(sort.pending); track index) {
              <li class="list-inline-item badge text-bg-light border">{{ session.items[index] }}</li>
            }
          </ul>
        }
      }

      @if (!store.finished()) {
        <a class="btn btn-primary" routerLink="/compare">繼續比較</a>
      }
    } @else {
      <p>還沒有開始任何比較。</p>
      <a class="btn btn-primary" routerLink="/config">前往設定</a>
    }
  `,
  styles: `
    .match {
      width: 12rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BracketChartComponent {
  protected readonly store = inject(SessionStore);
  protected readonly message = signal('');
  protected readonly label = roundLabel;

  /** Plain-text summary for pasting into a chat. */
  private readonly resultText = computed(() => {
    const session = this.store.session();
    if (!session) return '';
    const lines = [session.title || '未命名'];
    if (!this.store.finished()) lines.push('（尚未完成）');
    const champion = this.store.elimination()?.champion;
    if (champion !== undefined && champion !== null) {
      lines.push(`🏆 冠軍：${session.items[champion]}`);
    }
    this.store.insertion()?.ranking.forEach((index, rank) => {
      lines.push(`${rank + 1}. ${session.items[index]}`);
    });
    return lines.join('\n');
  });

  protected isCurrent(round: number, match: number): boolean {
    const current = this.store.elimination()?.current;
    return current?.round === round && current.match === match;
  }

  protected isLoser(match: Match, side: number | null): boolean {
    return side !== null && match.winner !== null && side !== match.winner;
  }

  protected async copyShareLink() {
    await this.copy(await this.store.shareLink(), '已複製分享連結');
  }

  protected async copyResult() {
    await this.copy(this.resultText(), '已複製結果文字');
  }

  protected downloadJson() {
    const blob = new Blob([this.store.exportJson()], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.store.session()?.title || 'bisection-anything'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private async copy(text: string, done: string) {
    try {
      await navigator.clipboard.writeText(text);
      this.message.set(done);
    } catch {
      this.message.set('無法存取剪貼簿，請檢查瀏覽器權限');
    }
  }
}
