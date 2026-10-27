import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SessionStore } from '../../core/session-store';

import { CompareComponent } from './compare.component';

describe('CompareComponent', () => {
  let fixture: ComponentFixture<CompareComponent>;
  let element: HTMLElement;
  let store: SessionStore;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [CompareComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    store = TestBed.inject(SessionStore);
    fixture = TestBed.createComponent(CompareComponent);
    element = fixture.nativeElement;
  });

  function options(): string[] {
    return Array.from(element.querySelectorAll('.option-name'), (it) =>
      it.textContent!.trim(),
    );
  }

  async function press(key: string) {
    document.dispatchEvent(new KeyboardEvent('keydown', { key }));
    await fixture.whenStable();
  }

  it('links to the config page without a session', async () => {
    await fixture.whenStable();
    expect(element.textContent).toContain('還沒有開始任何比較');
  });

  it('picks with clicks and arrow keys until finished', async () => {
    store.start('午餐', 'elimination', ['a', 'b', 'c'], false);
    await fixture.whenStable();
    expect(options()).toEqual(['b', 'c']);

    element.querySelectorAll<HTMLButtonElement>('.option')[0].click();
    await fixture.whenStable();
    expect(options()).toEqual(['a', 'b']);

    await press('ArrowRight');
    expect(element.textContent).toContain('比較完成');
    expect(element.querySelector('.winner')?.textContent?.trim()).toBe('b');
  });

  it('undoes the last pick with Backspace', async () => {
    store.start('午餐', 'insertion', ['a', 'b', 'c'], false);
    await fixture.whenStable();
    await press('ArrowLeft');
    expect(store.session()?.picks).toEqual([0]);
    await press('Backspace');
    expect(store.session()?.picks).toEqual([]);
    expect(options()).toEqual(['b', 'a']);
  });
});
