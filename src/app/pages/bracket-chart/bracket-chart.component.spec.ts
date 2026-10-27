import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SessionStore } from '../../core/session-store';

import { BracketChartComponent } from './bracket-chart.component';

describe('BracketChartComponent', () => {
  let fixture: ComponentFixture<BracketChartComponent>;
  let element: HTMLElement;
  let store: SessionStore;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [BracketChartComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    store = TestBed.inject(SessionStore);
    fixture = TestBed.createComponent(BracketChartComponent);
    element = fixture.nativeElement;
  });

  it('draws the bracket with byes and the champion', async () => {
    store.start('午餐', 'elimination', ['a', 'b', 'c'], false);
    store.pick(1);
    store.pick(0);
    await fixture.whenStable();

    expect(element.querySelectorAll('.match').length).toBe(2 + 1 + 1);
    expect(element.textContent).toContain('輪空');
    expect(element.textContent).toContain('四強');
    expect(element.textContent).toContain('🏆 a');
    expect(element.textContent).not.toContain('進行中');
  });

  it('lists the ranking and the items still pending', async () => {
    store.start('午餐', 'insertion', ['a', 'b', 'c'], false);
    store.pick(0);
    await fixture.whenStable();

    const ranked = Array.from(element.querySelectorAll('ol li'), (it) =>
      it.textContent!.trim(),
    );
    expect(ranked).toEqual(['b', 'a']);
    expect(element.textContent).toContain('尚未排入');
    expect(element.textContent).toContain('進行中');
  });

  it('copies the result as text', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    store.start('午餐', 'insertion', ['a', 'b'], false);
    store.pick(1);
    await fixture.whenStable();

    Array.from(element.querySelectorAll('button'))
      .find((it) => it.textContent?.includes('複製結果文字'))!
      .click();
    await fixture.whenStable();

    expect(writeText).toHaveBeenCalledWith('午餐\n1. a\n2. b');
    expect(element.textContent).toContain('已複製結果文字');
  });
});
