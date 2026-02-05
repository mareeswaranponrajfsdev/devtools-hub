import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HowTo } from '../../components/how-to/how-to';
import { AboutSection } from '../../components/about-section/about-section';
import { FaqSection } from '../../components/faq-section/faq-section';
import { FooterSection } from '../../components/footer-section/footer-section';
import { ToolsSection } from '../../components/tools-section/tools-section';
import { WhyChooseSection } from '../../components/why-choose-section/why-choose-section';
import { ContactSection } from '../../../contact/pages/contact-section/contact-section';
import { JsonFormatterPage } from '../../../json-formatter/pages/json-formatter-page/json-formatter-page';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink, HowTo, AboutSection, FaqSection, JsonFormatterPage, FooterSection, ToolsSection, WhyChooseSection, ContactSection],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {}
