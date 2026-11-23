import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CompanySettingsService } from '../../services/company-settings.service';
import { CompanySettings, DEFAULT_COMPANY_SETTINGS } from '../../models/company-settings.model';

@Component({
  selector: 'app-company-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './company-settings.component.html',
  styleUrls: ['./company-settings.component.css']
})
export class CompanySettingsComponent implements OnInit {
  private api = inject(ApiService);
  private companySettingsService = inject(CompanySettingsService);

  loading = true;
  saving = false;
  uploadingLogo = false;

  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  logoPreviewUrl = '';

  form: CompanySettings = {
    ...DEFAULT_COMPANY_SETTINGS
  };

  ngOnInit(): void {
    this.fetchSettings();
  }

  fetchSettings(): void {
    this.loading = true;
    this.api.adminGetCompanySettings().subscribe({
      next: (res: any) => {
        this.loading = false;
        const data = res?.data || res || {};
        this.form = {
          ...DEFAULT_COMPANY_SETTINGS,
          ...data
        };
        this.logoPreviewUrl = this.form.company_logo_url
          ? this.companySettingsService.getLogoUrl(this.form.company_logo_url)
          : 'assets/mmr-logo.png';
      },
      error: (err: any) => {
        this.loading = false;
        this.showToast(err?.error?.message || 'Failed to load company settings from server.', 'error');
        this.logoPreviewUrl = 'assets/mmr-logo.png';
      }
    });
  }

  onLogoFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.uploadLogoFile(file);
    // Reset file input value so re-selecting same file triggers change
    input.value = '';
  }

  onLogoDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      this.uploadLogoFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  uploadLogoFile(file: File): void {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      this.showToast('Invalid file format. Please upload PNG, JPG, WEBP, or SVG.', 'error');
      return;
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      this.showToast('File size exceeds 2MB limit. Please choose a smaller image.', 'error');
      return;
    }

    // Local instant preview
    const reader = new FileReader();
    reader.onload = () => {
      this.logoPreviewUrl = reader.result as string;
    };
    reader.readAsDataURL(file);

    // Upload to backend
    this.uploadingLogo = true;
    const formData = new FormData();
    formData.append('file', file);

    this.api.adminUploadCompanyLogo(formData).subscribe({
      next: (res: any) => {
        this.uploadingLogo = false;
        const updated = res?.data || res || {};
        const newLogoUrl = updated.company_logo_url || this.logoPreviewUrl;
        this.form.company_logo_url = newLogoUrl;
        this.logoPreviewUrl = this.companySettingsService.getLogoUrl(newLogoUrl);

        // Instantly sync frontend cached state
        this.companySettingsService.updateCachedSettings({ company_logo_url: newLogoUrl });
        this.showToast('Company logo uploaded successfully!', 'success');
      },
      error: (err: any) => {
        this.uploadingLogo = false;
        this.showToast(err?.error?.message || 'Failed to upload logo to server.', 'error');
        // Reset preview to saved URL
        this.logoPreviewUrl = this.form.company_logo_url
          ? this.companySettingsService.getLogoUrl(this.form.company_logo_url)
          : 'assets/mmr-logo.png';
      }
    });
  }

  removeCustomLogo(): void {
    this.form.company_logo_url = null;
    this.logoPreviewUrl = 'assets/mmr-logo.png';
    this.companySettingsService.updateCachedSettings({ company_logo_url: null });
    this.showToast('Logo reset to default MMR logo. Click "Save Changes" to commit.', 'success');
  }

  saveSettings(): void {
    if (!this.form.company_name || !this.form.company_name.trim()) {
      this.showToast('Company Name is required.', 'error');
      return;
    }

    this.saving = true;
    const payload = {
      ...this.form,
      company_name: this.form.company_name.trim(),
      company_tagline: this.form.company_tagline?.trim() || null,
      company_description: this.form.company_description?.trim() || null,
      company_address: this.form.company_address?.trim() || null,
      company_phone: this.form.company_phone?.trim() || null,
      company_whatsapp: this.form.company_whatsapp?.trim() || null,
      company_email: this.form.company_email?.trim() || null,
      support_email: this.form.support_email?.trim() || null,
      support_phone: this.form.support_phone?.trim() || null,
      company_website: this.form.company_website?.trim() || null,
      cin_number: this.form.cin_number?.trim() || null,
      gst_number: this.form.gst_number?.trim() || null,
      pan_number: this.form.pan_number?.trim() || null,
      facebook_url: this.form.facebook_url?.trim() || null,
      instagram_url: this.form.instagram_url?.trim() || null,
      youtube_url: this.form.youtube_url?.trim() || null,
      twitter_url: this.form.twitter_url?.trim() || null,
      linkedin_url: this.form.linkedin_url?.trim() || null,
      copyright_text: this.form.copyright_text?.trim() || null
    };

    this.api.adminUpdateCompanySettings(payload).subscribe({
      next: (res: any) => {
        this.saving = false;
        const updated = res?.data || res || payload;
        this.form = { ...this.form, ...updated };

        // Synchronize in-memory cache so Navbar, Footer, etc. update without page reload
        this.companySettingsService.updateCachedSettings(this.form);
        this.showToast('Company Branding & Settings saved successfully!', 'success');
      },
      error: (err: any) => {
        this.saving = false;
        this.showToast(err?.error?.message || 'Failed to save company settings.', 'error');
      }
    });
  }

  showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    setTimeout(() => {
      if (this.toastMessage === message) {
        this.toastMessage = '';
      }
    }, 5000);
  }

  onLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && img.src !== 'assets/mmr-logo.png') {
      img.src = 'assets/mmr-logo.png';
    }
  }
}
