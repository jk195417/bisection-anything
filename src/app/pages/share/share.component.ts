import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  PendingTasks,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SessionStore } from '../../core/session-store';
import { decodeSession } from '../../core/share-codec';

/** Opens a /share#<code> link and hands the session to the store. */
@Component({
  selector: 'app-share',
  imports: [RouterLink],
  template: `
    @if (error()) {
      <div class="alert alert-danger" role="alert">{{ error() }}</div>
      <a class="btn btn-primary" routerLink="/config">前往設定</a>
    } @else {
      <p>正在載入分享的比較…</p>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareComponent implements OnInit {
  private readonly store = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly pendingTasks = inject(PendingTasks);
  protected readonly error = signal('');

  ngOnInit() {
    // Tracked so that the app (and tests) are not stable until it is done.
    this.pendingTasks.run(() => this.open());
  }

  private async open() {
    const code = this.route.snapshot.fragment;
    if (!code) {
      this.error.set('分享連結缺少資料');
      return;
    }
    try {
      const session = await decodeSession(code);
      const current = this.store.session();
      const same = JSON.stringify(current) === JSON.stringify(session);
      if (
        !same &&
        current?.picks.length &&
        !confirm('分享連結會取代你目前的比較進度，確定嗎？')
      ) {
        this.router.navigateByUrl('/config', { replaceUrl: true });
        return;
      }
      this.store.load(session);
    } catch (error) {
      this.error.set(`無法開啟分享連結：${(error as Error).message}`);
      return;
    }
    this.router.navigateByUrl(
      this.store.finished() ? '/bracket-chart' : '/compare',
      { replaceUrl: true },
    );
  }
}
