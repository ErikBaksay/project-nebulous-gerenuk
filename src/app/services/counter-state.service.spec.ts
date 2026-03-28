import { TestBed } from '@angular/core/testing';
import { CounterStateService } from './counter-state.service';

describe('CounterStateService', () => {
  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('persists counter updates for synced windows', () => {
    const service = TestBed.inject(CounterStateService);

    service.adjust(100);
    service.adjust(-10);

    expect(service.count()).toBe(90);
    expect(localStorage.getItem('project-nebulous-gerenuk:counter')).toBe('{"count":90}');
  });
});
