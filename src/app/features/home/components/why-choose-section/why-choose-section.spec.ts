import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhyChooseSection } from './why-choose-section';

describe('WhyChooseSection', () => {
  let component: WhyChooseSection;
  let fixture: ComponentFixture<WhyChooseSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhyChooseSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WhyChooseSection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
