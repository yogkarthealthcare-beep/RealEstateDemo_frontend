import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CompanySettingsService } from '../../services/company-settings.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './footer.component.html'
})
export class FooterComponent {
  private companySettingsService = inject(CompanySettingsService);
  readonly settings$ = this.companySettingsService.settings$;

  scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  onLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && img.src !== 'assets/mmr-logo.png') {
      img.src = 'assets/mmr-logo.png';
    }
  }

  cleanPhone(phone?: string | null): string {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
  }
}
