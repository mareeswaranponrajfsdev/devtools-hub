import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { JsonTools } from '../../../json-formatter/containers/json-tools/json-tools';
import { HowTo } from '../../components/how-to/how-to';
import { AboutSection } from '../../components/about-section/about-section';
import { FaqSection } from '../../components/faq-section/faq-section';
import { FooterSection } from '../../components/footer-section/footer-section';
import { ToolsSection } from '../../components/tools-section/tools-section';
import { WhyChooseSection } from '../../components/why-choose-section/why-choose-section';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink, JsonTools, HowTo, AboutSection, FaqSection, FooterSection, ToolsSection, WhyChooseSection],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {}
