import { TestBed } from '@angular/core/testing';
import { TeePeeServices } from './tee-pee-services';

describe('TeePeeServices', () => {
  let service: TeePeeServices;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TeePeeServices);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
