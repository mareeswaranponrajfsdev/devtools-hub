import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JsonToolbar } from './json-toolbar';

describe('JsonToolbar', () => {
  let component: JsonToolbar;
  let fixture: ComponentFixture<JsonToolbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JsonToolbar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JsonToolbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
