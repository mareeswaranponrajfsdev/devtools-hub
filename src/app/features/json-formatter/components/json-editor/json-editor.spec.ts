import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JsonEditor } from './json-editor';

describe('JsonEditor', () => {
  let component: JsonEditor;
  let fixture: ComponentFixture<JsonEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JsonEditor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JsonEditor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
