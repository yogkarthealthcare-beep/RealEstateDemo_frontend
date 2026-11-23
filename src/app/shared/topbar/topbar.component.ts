import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LanguageService, SiteLanguage } from '../../services/language.service';
import { CompanySettingsService } from '../../services/company-settings.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css']
})
export class TopbarComponent {
  readonly languageService = inject(LanguageService);
  readonly companySettingsService = inject(CompanySettingsService);
  readonly settings$ = this.companySettingsService.settings$;

  onLanguageChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    if (select && select.value) {
      this.languageService.setLanguage(select.value as SiteLanguage);
    }
  }
}
