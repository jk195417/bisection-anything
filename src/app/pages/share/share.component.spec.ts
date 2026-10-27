import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { createSession } from '../../core/session';
import { SessionStore } from '../../core/session-store';
import { encodeSession } from '../../core/share-codec';

import { ShareComponent } from './share.component';

@Component({ template: '' })
class BlankComponent {}

describe('ShareComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'share', component: ShareComponent },
          { path: 'compare', component: BlankComponent },
          { path: 'bracket-chart', component: BlankComponent },
        ]),
      ],
    });
  });

  it('loads the shared session and continues comparing', async () => {
    const session = createSession('午餐', 'elimination', ['a', 'b', 'c']);
    session.picks = [1];
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl(`/share#${await encodeSession(session)}`);
    await harness.fixture.whenStable();

    expect(TestBed.inject(SessionStore).session()).toEqual(session);
    expect(TestBed.inject(Router).url).toBe('/compare');
  });

  it('shows an error for a broken link', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/share#broken');
    await harness.fixture.whenStable();

    expect(harness.routeNativeElement?.textContent).toContain('無法開啟分享連結');
    expect(TestBed.inject(SessionStore).session()).toBeNull();
  });
});
