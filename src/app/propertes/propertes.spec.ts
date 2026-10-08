import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Propertes } from './propertes';

describe('Propertes', () => {
  let component: Propertes;
  let fixture: ComponentFixture<Propertes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Propertes],
    }).compileComponents();

    fixture = TestBed.createComponent(Propertes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
