export interface CompanySettings {
  id?: number;
  company_name: string;
  company_tagline?: string | null;
  company_description?: string | null;
  company_logo_url?: string | null;
  company_address?: string | null;
  company_phone?: string | null;
  company_whatsapp?: string | null;
  company_email?: string | null;
  support_email?: string | null;
  support_phone?: string | null;
  company_website?: string | null;
  cin_number?: string | null;
  gst_number?: string | null;
  pan_number?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  youtube_url?: string | null;
  twitter_url?: string | null;
  linkedin_url?: string | null;
  favicon_url?: string | null;
  copyright_text?: string | null;
  is_active?: boolean;
}

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  company_name: 'M.M.R. Construction & Developers',
  company_tagline: 'Developers Pvt. Ltd.',
  company_description: 'Premium affordable plots in Kanpur, Unnao & Lucknow with complete trust and 12-year commission program.',
  company_logo_url: 'assets/mmr-logo.png',
  company_address: 'Tribhuvan Kheda, Sheshpur, Unnao, Uttar Pradesh, India, 209801',
  company_phone: '+91 95111 19879',
  company_whatsapp: '+91 95111 19879',
  company_email: 'official@mmrconstructions.in',
  support_email: 'official@mmrconstructions.in',
  support_phone: '+91 95111 19879',
  company_website: 'https://mmrconstructions.in',
  cin_number: 'U68200UP2025PTC229203',
  gst_number: '09AATCM6753A1Z5',
  pan_number: '',
  facebook_url: '',
  instagram_url: '',
  youtube_url: '',
  twitter_url: '',
  linkedin_url: '',
  favicon_url: '',
  copyright_text: '© 2025 M.M.R. Construction & Developers Pvt. Ltd. All Rights Reserved.',
  is_active: true
};
