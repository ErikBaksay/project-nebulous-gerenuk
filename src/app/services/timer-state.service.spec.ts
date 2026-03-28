import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { TimerStateService } from './timer-state.service';

describe('TimerStateService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-28T12:00:00Z'));

    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('persists timer snapshots using the clearer field names', async () => {
    const service = TestBed.inject(TimerStateService);

    service.start();
    await vi.advanceTimersByTimeAsync(1200);
    service.pause();

    expect(localStorage.getItem('project-nebulous-gerenuk:timer')).toBe(
      '{"runStartedAtMs":null,"accumulatedElapsedMs":1200}',
    );
  });

  it('hydrates timer state from legacy snapshot field names', () => {
    localStorage.setItem(
      'project-nebulous-gerenuk:timer',
      '{"startedAtMs":null,"elapsedBeforeStartMs":8200}',
    );

    const service = TestBed.inject(TimerStateService);

    expect(service.elapsedMs()).toBe(8200);
    expect(service.isRunning()).toBe(false);
  });
});
