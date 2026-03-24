import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { CountdownPanelComponent } from './countdown-panel.component';

describe('CountdownPanelComponent', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-23T12:00:00Z'));

    await TestBed.configureTestingModule({
      imports: [CountdownPanelComponent],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('finishes a short countdown and marks it complete', async () => {
    const fixture = TestBed.createComponent(CountdownPanelComponent);
    fixture.detectChanges();

    const rootElement = fixture.nativeElement as HTMLElement;
    const inputs = Array.from(rootElement.querySelectorAll('input')) as HTMLInputElement[];
    const startButton = rootElement.querySelector('.tool-button') as HTMLButtonElement | null;

    inputs[0].value = '0';
    inputs[0].dispatchEvent(new Event('input'));
    inputs[1].value = '0';
    inputs[1].dispatchEvent(new Event('input'));
    inputs[2].value = '3';
    inputs[2].dispatchEvent(new Event('input'));
    fixture.detectChanges();

    startButton?.click();
    await vi.advanceTimersByTimeAsync(3100);
    fixture.detectChanges();

    expect(rootElement.textContent).toContain('Complete');
    expect(fixture.componentInstance['displayTime']()).toBe('00:00:00.0');
  });
});
