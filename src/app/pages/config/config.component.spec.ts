import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { SessionStore } from '../../core/session-store';

import { ConfigComponent } from './config.component';

describe('ConfigComponent', () => {
  let fixture: ComponentFixture<ConfigComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ConfigComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigComponent);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  function startButton() {
    return element.querySelector<HTMLButtonElement>('button[type=submit]')!;
  }

  async function typeItems(text: string) {
    const textarea = element.querySelector('textarea')!;
    textarea.value = text;
    textarea.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  it('needs at least two items to start', async () => {
    expect(startButton().disabled).toBe(true);
    await typeItems('a\nb\nc');
    expect(startButton().disabled).toBe(false);
    expect(element.textContent).toContain('需要比較 2 次');
  });

  it('starts a session and goes to the compare page', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl');
    await typeItems('a\nb\na');
    expect(element.textContent).toContain('已略過重複：a');

    startButton().click();
    await fixture.whenStable();

    expect(TestBed.inject(SessionStore).session()).toMatchObject({
      mode: 'elimination',
      items: ['a', 'b'],
      picks: [],
    });
    expect(navigate).toHaveBeenCalledWith('/compare');
  });

  it('labels the saved session as in progress or finished', async () => {
    const store = TestBed.inject(SessionStore);
    store.start('午餐', 'elimination', ['a', 'b'], false);
    await fixture.whenStable();
    expect(element.querySelector('.session-banner')?.textContent).toContain('進行中');

    store.pick(0);
    await fixture.whenStable();
    expect(element.querySelector('.session-banner')?.textContent).toContain('已完成');
  });
});
