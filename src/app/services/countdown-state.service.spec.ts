import { TestBed } from '@angular/core/testing';
import { CountdownStateService } from './countdown-state.service';

describe('CountdownStateService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('persists countdown snapshots using the clearer field names', () => {
    const service = TestBed.inject(CountdownStateService);

    service.setMinutes('10');

    expect(localStorage.getItem('project-nebulous-gerenuk:countdown')).toBe(
      '{"hours":0,"minutes":10,"seconds":0,"runStartedAtMs":null,"remainingWhenStartedMs":600000,"completed":false}',
    );
  });

  it('hydrates countdown state from legacy snapshot field names', () => {
    localStorage.setItem(
      'project-nebulous-gerenuk:countdown',
      '{"hours":0,"minutes":5,"seconds":0,"startedAtMs":null,"remainingAtStartMs":180000,"completed":false}',
    );

    const service = TestBed.inject(CountdownStateService);

    expect(service.remainingMs()).toBe(180000);
    expect(service.countdownState()).toBe('Paused');
  });
});
