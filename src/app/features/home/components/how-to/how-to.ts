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
      icon: 'fa-regular fa-file-lines',
      title: 'Paste or Upload',
      desc: 'Paste your JSON directly or drag & drop a .json file into the input area.'
    },
    {
      icon: 'fa-solid fa-wand-magic-sparkles',
      title: 'Format or Validate',
      desc: 'Click Format to beautify, Minify to compress, or Validate to check syntax.'
    },
    {
      icon: 'fa-solid fa-clone',
      title: 'Copy or Download',
      desc: 'Copy the formatted output to clipboard or download as .json or .txt file.'
    },
    {
      icon: 'fa-regular fa-bookmark',
      title: 'Save for Later',
      desc: 'Use Save to store your JSON locally. Access recent history anytime.'
    }
  ];


}

