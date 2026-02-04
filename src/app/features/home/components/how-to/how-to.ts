import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-how-to',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './how-to.html',
  styleUrls: ['./how-to.scss']
})
export class HowTo {

  steps = [
    {
      icon: '📋',
      title: 'Paste or Upload',
      desc: 'Paste JSON or drag & drop file'
    },
    {
      icon: '⚙️',
      title: 'Format or Validate',
      desc: 'Beautify or validate syntax'
    },
    {
      icon: '📥',
      title: 'Copy or Download',
      desc: 'Copy or download output'
    },
    {
      icon: '💾',
      title: 'Save for Later',
      desc: 'Save JSON locally'
    }
  ];

}

