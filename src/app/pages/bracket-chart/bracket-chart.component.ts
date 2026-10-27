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
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-bracket-chart',
  imports: [IconComponent, RouterLink],
  template: `
    @if (store.session(); as session) {
      <div class="page-header">
        <h2>{{ session.title || '未命名' }}</h2>
        @if (store.finished()) {
          <span class="badge rounded-pill text-bg-success">已完成</span>
        } @else {
          <span class="badge rounded-pill text-bg-secondary">進行中</span>
        }
        <div class="ms-auto d-flex flex-wrap gap-2">
          <button type="button" class="btn btn-sm btn-outline-secondary" (click)="copyShareLink()">
            <app-icon name="link-45deg" class="me-1" />複製分享連結
          </button>
          <button type="button" class="btn btn-sm btn-outline-secondary" (click)="copyResult()">
            <app-icon name="clipboard" class="me-1" />複製結果文字
          </button>
          <button type="button" class="btn btn-sm btn-outline-secondary" (click)="downloadJson()">
            <app-icon name="download" class="me-1" />匯出 JSON
          </button>
        </div>
      </div>

      @if (store.elimination(); as bracket) {
        <div class="panel">
          <div class="bracket">
            @for (round of bracket.rounds; track $index; let r = $index) {
              <div class="round">
                <div class="round-label">{{ label(r, bracket.rounds.length) }}</div>
                <div class="round-body">
                  @for (pair of pairs(round); track $index; let p = $index) {
                    <div class="pair" [class.joined]="pair.length === 2">
                      @for (match of pair; track $index; let k = $index) {
                        <div class="slot" [class.has-input]="r > 0">
                          <div class="match" [class.bye]="match.bye" [class.current]="isCurrent(r, p * 2 + k)">
                            @for (side of [match.a, match.b]; track $index) {
                              <div class="side" [class.win]="side !== null && side === match.winner && !match.bye" [class.lose]="isLoser(match, side)">
                                @if (side !== null) {
                                  <span class="text-truncate">{{ session.items[side] }}</span>
                                } @else if (match.bye) {
                                  <span class="fst-italic">輪空</span>
                                } @else {
                                  <span>—</span>
                                }
                              </div>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            }
            <div class="round final">
              <div class="round-label">冠軍</div>
              <div class="round-body">
                <div class="pair">
                  <div class="slot" [class.has-input]="bracket.rounds.length > 0">
                    <div class="match champion">
                      <app-icon name="trophy-fill" />
                      @if (bracket.champion !== null) {
                        <span class="text-truncate">{{ session.items[bracket.champion] }}</span>
                      } @else {
                        <span class="text-body-tertiary">待定</span>
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      @if (store.insertion(); as sort) {
        @if (!store.finished()) {
          <p class="text-body-secondary">排序進行中，以下是目前已排好的 {{ sort.ranking.length }} 項。</p>
        }
        <ol class="ranking panel p-0 mb-4" [class.finished]="store.finished()">
          @for (index of sort.ranking; track index) {
            <li>{{ session.items[index] }}</li>
          }
        </ol>
        @if (sort.current) {
          <h3 class="h6 text-body-secondary">尚未排入</h3>
          <div class="d-flex flex-wrap gap-2 mb-4">
            @for (index of [sort.current.item].concat(sort.pending); track index) {
              <span class="badge rounded-pill text-bg-light border fw-normal fs-6">{{ session.items[index] }}</span>
            }
          </div>
        }
      }

      @if (!store.finished()) {
        <a class="btn btn-primary mt-3" routerLink="/compare">
          繼續比較<app-icon name="arrow-right" class="ms-1" />
        </a>
      }

      @if (message()) {
        <div class="toast-message" role="status">
          <app-icon name="check2" class="me-1" />{{ message() }}
        </div>
      }
    } @else {
      <div class="panel text-center py-5">
        <app-icon name="inbox" class="fs-1 text-body-tertiary" />
        <p class="mt-2 text-body-secondary">還沒有開始任何比較。</p>
        <a class="btn btn-primary" routerLink="/config">前往設定</a>
      </div>
    }
  `,
  styles: `
    .bracket {
      --gap: 2rem;
      --line: var(--bs-border-color);
      display: flex;
      gap: var(--gap);
      overflow-x: auto;
      padding-bottom: 0.25rem;
    }

    .round {
      display: flex;
      flex: 0 0 10.5rem;
      flex-direction: column;
    }

    .round-label {
      margin-bottom: 0.5rem;
      color: var(--bs-secondary-color);
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-align: center;
    }

    .round-body,
    .pair {
      display: flex;
      flex: 1;
      flex-direction: column;
    }

    .pair {
      position: relative;
    }

    /* Bracket lines: ┐┘ joining each pair, ─ into the next match. */
    .pair.joined::after,
    .round:not(.final) .pair:not(.joined)::after,
    .slot.has-input::before {
      content: '';
      position: absolute;
      border: 0 solid var(--line);
    }

    .pair.joined::after {
      top: 25%;
      bottom: 25%;
      right: calc(var(--gap) / -2);
      width: calc(var(--gap) / 2);
      border-width: 2px 2px 2px 0;
      border-radius: 0 6px 6px 0;
    }

    .round:not(.final) .pair:not(.joined)::after {
      top: 50%;
      right: calc(var(--gap) / -2);
      width: calc(var(--gap) / 2);
      border-top-width: 2px;
    }

    .slot {
      position: relative;
      display: flex;
      flex: 1;
      align-items: center;
      padding: 0.3rem 0;
    }

    .slot.has-input::before {
      top: 50%;
      left: calc(var(--gap) / -2);
      width: calc(var(--gap) / 2);
      border-top-width: 2px;
    }

    .match {
      width: 100%;
      overflow: hidden;
      background: var(--bs-body-bg);
      border: 1px solid var(--bs-border-color);
      border-radius: var(--bs-border-radius);
      font-size: 0.875rem;
    }

    .match.bye {
      border-style: dashed;
      opacity: 0.6;
    }

    .match.current {
      border-color: var(--bs-primary);
      box-shadow: 0 0 0 3px rgba(var(--bs-primary-rgb), 0.2);
    }

    .side {
      display: flex;
      min-height: 2rem;
      align-items: center;
      padding: 0.3rem 0.6rem;

      & + & {
        border-top: 1px solid var(--bs-border-color-translucent);
      }

      &.win {
        background: var(--bs-primary-bg-subtle);
        color: var(--bs-primary-text-emphasis);
        font-weight: 600;
      }

      &.lose {
        color: var(--bs-tertiary-color);
      }
    }

    .match.champion {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 0.75rem;
      background: #fffbeb;
      border: 2px solid #f59e0b;
      font-size: 1rem;
      font-weight: 700;

      app-icon {
        color: #d97706;
      }
    }

    .ranking {
      counter-reset: rank;
      list-style: none;
      overflow: hidden;

      li {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        counter-increment: rank;

        & + li {
          border-top: 1px solid var(--bs-border-color-translucent);
        }

        &::before {
          content: counter(rank);
          display: inline-grid;
          flex: none;
          place-items: center;
          width: 1.75rem;
          height: 1.75rem;
          border-radius: 50%;
          background: var(--bs-tertiary-bg);
          color: var(--bs-secondary-color);
          font-size: 0.8rem;
          font-weight: 700;
        }
      }

      &.finished li:nth-child(-n + 3) {
        font-weight: 600;
      }

      &.finished li:nth-child(1)::before {
        background: #fde68a;
        color: #92400e;
      }

      &.finished li:nth-child(2)::before {
        background: #e5e7eb;
        color: #374151;
      }

      &.finished li:nth-child(3)::before {
        background: #fed7aa;
        color: #9a3412;
      }
    }

    .toast-message {
      position: fixed;
      bottom: 1.5rem;
      left: 50%;
      z-index: 1080;
      transform: translateX(-50%);
      padding: 0.5rem 1rem;
      border-radius: 999px;
      background: #1f2937;
      color: #fff;
      font-size: 0.875rem;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.2);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BracketChartComponent {
  protected readonly store = inject(SessionStore);
  protected readonly message = signal('');
  private messageTimer?: ReturnType<typeof setTimeout>;
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

  protected pairs(round: Match[]): Match[][] {
    const pairs: Match[][] = [];
    for (let i = 0; i < round.length; i += 2) {
      pairs.push(round.slice(i, i + 2));
    }
    return pairs;
  }

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
    clearTimeout(this.messageTimer);
    this.messageTimer = setTimeout(() => this.message.set(''), 2500);
  }
}
