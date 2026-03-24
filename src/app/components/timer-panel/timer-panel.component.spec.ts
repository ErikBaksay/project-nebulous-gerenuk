import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { TimerPanelComponent } from './timer-panel.component';

describe('TimerPanelComponent', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-23T12:00:00Z'));

    await TestBed.configureTestingModule({
      imports: [TimerPanelComponent],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('tracks elapsed time and preserves it when paused', async () => {
    const fixture = TestBed.createComponent(TimerPanelComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();
    component['start']();
    await vi.advanceTimersByTimeAsync(2400);
    fixture.detectChanges();

    expect(component['displayTime']()).toContain('00:00:02');

    component['pause']();
    const pausedTime = component['displayTime']();
    await vi.advanceTimersByTimeAsync(1600);
    fixture.detectChanges();

    expect(component['displayTime']()).toBe(pausedTime);
  });
});
