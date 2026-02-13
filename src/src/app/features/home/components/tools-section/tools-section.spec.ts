import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolsSection } from './tools-section';

describe('ToolsSection', () => {
  let component: ToolsSection;
  let fixture: ComponentFixture<ToolsSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolsSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToolsSection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
