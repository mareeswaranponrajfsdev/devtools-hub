import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import emailjs from 'emailjs-com';
import { environment } from '../../../../../environments/environment.prod';

@Component({
  selector: 'app-contact-section',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './contact-section.html',
  styleUrls: ['./contact-section.scss']
})
export class ContactSection implements OnInit {

  form!: FormGroup;

  submitting = false;
  successMsg = false;
  errorMsg = false;

  // EmailJS Config
  private readonly PUBLIC_KEY = environment.emailJs.publicKey;
  private readonly SERVICE_ID = environment.emailJs.serviceId;
  private readonly TEMPLATE_ID = environment.emailJs.templateId;


  constructor(private fb: FormBuilder) {}


  ngOnInit(): void {

    // Init EmailJS
    emailjs.init(this.PUBLIC_KEY);

    this.form = this.fb.group({

      name: [
        '',
        [Validators.required, Validators.minLength(3)]
      ],

      email: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
        ]
      ],

      subject: [
        '',
        [Validators.required, Validators.minLength(3)]
      ],

      message: [
        '',
        [Validators.required, Validators.minLength(10)]
      ]

    });

  }


  // Easy Access
  get f() {
    return this.form.controls;
  }


  // ================= SUBMIT =================
  submit(): void {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.successMsg = false;
    this.errorMsg = false;


    const data = this.form.value;


    // EmailJS Params
    const params = {
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
      date: new Date().toLocaleString()
    };


    // Send Email
    emailjs.send(
      this.SERVICE_ID,
      this.TEMPLATE_ID,
      params
    )

    .then(() => {

      this.onSuccess();

    })

    .catch((err) => {

      console.error('EmailJS Error:', err);

      this.onError();

    });

  }


  // ================= SUCCESS =================
  private onSuccess() {

    this.submitting = false;
    this.successMsg = true;
    this.errorMsg = false;

    this.form.reset();

    setTimeout(() => {
      this.successMsg = false;
    }, 4000);

  }


  // ================= ERROR =================
  private onError() {

    this.submitting = false;
    this.successMsg = false;
    this.errorMsg = true;

    setTimeout(() => {
      this.errorMsg = false;
    }, 4000);

  }

}
