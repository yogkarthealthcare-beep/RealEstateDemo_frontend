import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { CompanySettings, DEFAULT_COMPANY_SETTINGS } from '../models/company-settings.model';

@Injectable({
  providedIn: 'root'
})
export class CompanySettingsService {
  private settingsSubject = new BehaviorSubject<CompanySettings>(DEFAULT_COMPANY_SETTINGS);
  public settings$: Observable<CompanySettings> = this.settingsSubject.asObservable().pipe(shareReplay(1));

  private loaded = false;
  private loading = false;

  constructor(private api: ApiService) {}

  get currentSettings(): CompanySettings {
    return this.settingsSubject.getValue();
  }

  /**
   * Loads public company settings from backend.
   * Caches results so multiple subscribers share a single HTTP request.
   */
  loadSettings(forceRefresh = false): Observable<CompanySettings> {
    if (this.loaded && !forceRefresh) {
      return of(this.currentSettings);
    }
    if (this.loading && !forceRefresh) {
      return this.settings$;
    }

    this.loading = true;
    return this.api.get('/api/company-settings').pipe(
      map((res: any) => {
        const raw = res?.data || res || {};
        const logoUrl = raw.company_logo_url?.trim()
          ? this.getLogoUrl(raw.company_logo_url)
          : DEFAULT_COMPANY_SETTINGS.company_logo_url;

        const merged: CompanySettings = {
          ...DEFAULT_COMPANY_SETTINGS,
          ...raw,
          company_name: raw.company_name?.trim() || DEFAULT_COMPANY_SETTINGS.company_name,
          company_tagline: raw.company_tagline?.trim() || DEFAULT_COMPANY_SETTINGS.company_tagline,
          company_description: raw.company_description?.trim() || DEFAULT_COMPANY_SETTINGS.company_description,
          company_logo_url: logoUrl,
          company_address: raw.company_address?.trim() || DEFAULT_COMPANY_SETTINGS.company_address,
          company_phone: raw.company_phone?.trim() || DEFAULT_COMPANY_SETTINGS.company_phone,
          company_whatsapp: raw.company_whatsapp?.trim() || DEFAULT_COMPANY_SETTINGS.company_whatsapp,
          company_email: raw.company_email?.trim() || DEFAULT_COMPANY_SETTINGS.company_email,
          support_email: raw.support_email?.trim() || DEFAULT_COMPANY_SETTINGS.support_email,
          support_phone: raw.support_phone?.trim() || DEFAULT_COMPANY_SETTINGS.support_phone,
          company_website: raw.company_website?.trim() || DEFAULT_COMPANY_SETTINGS.company_website,
          cin_number: raw.cin_number?.trim() || DEFAULT_COMPANY_SETTINGS.cin_number,
          gst_number: raw.gst_number?.trim() || DEFAULT_COMPANY_SETTINGS.gst_number,
          pan_number: raw.pan_number?.trim() || DEFAULT_COMPANY_SETTINGS.pan_number,
          facebook_url: raw.facebook_url?.trim() || '',
          instagram_url: raw.instagram_url?.trim() || '',
          youtube_url: raw.youtube_url?.trim() || '',
          twitter_url: raw.twitter_url?.trim() || '',
          linkedin_url: raw.linkedin_url?.trim() || '',
          copyright_text: raw.copyright_text?.trim() || DEFAULT_COMPANY_SETTINGS.copyright_text
        };
        return merged;
      }),
      catchError(err => {
        console.warn('[CompanySettingsService] Using fallback settings due to API error:', err);
        return of(DEFAULT_COMPANY_SETTINGS);
      }),
      tap((settings: CompanySettings) => {
        this.loaded = true;
        this.loading = false;
        this.settingsSubject.next(settings);
      })
    );
  }

  /**
   * Updates in-memory settings cache so any updates immediately propagate across the site.
   */
  updateCachedSettings(newSettings: Partial<CompanySettings>): void {
    const current = this.currentSettings;
    const logoUrl = newSettings.company_logo_url?.trim()
      ? this.getLogoUrl(newSettings.company_logo_url)
      : (newSettings.company_logo_url === null ? DEFAULT_COMPANY_SETTINGS.company_logo_url : current.company_logo_url);

    const updated: CompanySettings = {
      ...current,
      ...newSettings,
      company_logo_url: logoUrl
    };
    this.settingsSubject.next(updated);
  }

  /**
   * Safe logo URL resolver with fallback to assets/mmr-logo.png.
   */
  getLogoUrl(url?: string | null): string {
    if (!url || !url.trim()) {
      return DEFAULT_COMPANY_SETTINGS.company_logo_url || 'assets/mmr-logo.png';
    }
    const clean = url.trim();
    if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:') || clean.startsWith('assets/')) {
      return clean;
    }
    return this.api.getFileUrl(clean);
  }
}
