import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JsonFormatterPage } from './json-formatter-page';

describe('JsonFormatterPage', () => {
  let component: JsonFormatterPage;
  let fixture: ComponentFixture<JsonFormatterPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JsonFormatterPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JsonFormatterPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
