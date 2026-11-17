import { Component, OnInit, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

export interface DropdownUser {
  user_id: number;
  member_id: string;
  full_name: string;
  mobile_no: string;
  email: string;
  user_type: string;
  status: string;
  total_plot_orders: number;
  total_plots: number;
  total_booking_amount: number;
  total_paid_amount: number;
  total_pending_amount: number;
}

export interface PlotOrderInvoice {
  invoice_id: number;
  invoice_number: string;
  invoice_date: string;
  invoice_amount: number;
  paid_amount: number;
  balance_amount: number;
  payment_status: string;
  payment_method: string;
  transaction_id: string;
}

export interface PlotOrderInstallment {
  emi_id: number;
  installment_no: number;
  due_date: string;
  emi_amount: number;
  paid_amount: number;
  pending_amount: number;
  paid_date: string | null;
  payment_status: 'Paid' | 'Partially Paid' | 'Pending' | 'Overdue';
  invoice_number: string | null;
  transaction_id: string;
}

export interface PlotOrderItem {
  booking_id: number;
  booking_serial: string;
  site_name: string;
  plot_number: string;
  plot_area: string;
  booking_date: string;
  final_plot_price: number;
  payment_type: 'One-Time' | 'Installment';
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  booking_status: string;
  invoices: PlotOrderInvoice[];
  installments: PlotOrderInstallment[];
  total_installments_count: number;
}

@Component({
  selector: 'app-admin-search-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './search-invoices.component.html',
  styleUrls: ['./search-invoices.component.css']
})
export class AdminSearchInvoicesComponent implements OnInit {
  // Search state
  searchQuery: string = '';
  isDropdownOpen: boolean = false;
  loading: boolean = false;
  searchingUsers: boolean = false;

  // Users for searchable dropdown
  allUsers: DropdownUser[] = [];
  filteredUsers: DropdownUser[] = [];

  // Selected User and Bookings
  selectedUser: DropdownUser | null = null;
  orders: PlotOrderItem[] = [];
  financialSummary: any = null;

  // Actions state
  downloadingPdf: { [key: string]: boolean } = {};
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any = null;
  private searchTimer: any = null;

  constructor(
    private api: ApiService,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.loadAllUsers();
  }

  /**
   * Close dropdown on outside click
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen = false;
    }
  }

  /**
   * Initial load of all registered associates, team members, and customers
   */
  loadAllUsers(): void {
    this.searchingUsers = true;
    this.api.get('/api/admin/plot-orders/search-invoices', { limit: 500 }, true).subscribe({
      next: (res: any) => {
        this.searchingUsers = false;
        if (res?.success) {
          this.allUsers = res.data?.users || [];
          this.filteredUsers = [...this.allUsers];

          // If there is an active selection or default user with orders, load them
          if (res.data?.selected_user) {
            this.selectedUser = res.data.selected_user;
            this.orders = res.data.orders || [];
            this.financialSummary = res.data.financial_summary || null;
            this.searchQuery = this.formatUserDisplay(this.selectedUser);
          }
        }
      },
      error: (err: any) => {
        this.searchingUsers = false;
        console.error('[SearchInvoices] Error loading users:', err);
      }
    });
  }

  /**
   * Format display string for user input
   */
  formatUserDisplay(user: DropdownUser | null): string {
    if (!user) return '';
    const phone = user.mobile_no ? ` (${user.mobile_no})` : '';
    const code = user.member_id ? ` - ${user.member_id}` : '';
    return `${user.full_name}${code}${phone}`;
  }

  /**
   * Open dropdown on focus or click
   */
  onFocusSearch(): void {
    this.filterUsers();
    this.isDropdownOpen = true;
  }

  /**
   * Handle user typing in the single search bar
   */
  onSearchInput(): void {
    this.isDropdownOpen = true;
    this.filterUsers();

    // Debounced remote search in case of large directory
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.fetchUsersFromApi(this.searchQuery.trim());
    }, 300);
  }

  /**
   * Local filtering of users list for instant responsiveness
   */
  filterUsers(): void {
    const q = (this.searchQuery || '').trim().toLowerCase();
    if (!q) {
      this.filteredUsers = [...this.allUsers];
      return;
    }
    this.filteredUsers = this.allUsers.filter(u => {
      const name = (u.full_name || '').toLowerCase();
      const phone = (u.mobile_no || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const memberId = (u.member_id || '').toLowerCase();
      const userId = String(u.user_id || '');
      return name.includes(q) || phone.includes(q) || email.includes(q) || memberId.includes(q) || userId.includes(q);
    });
  }

  /**
   * Remote user search
   */
  fetchUsersFromApi(q: string): void {
    if (!q) return;
    this.api.get('/api/admin/plot-orders/search-invoices', { q }, true).subscribe({
      next: (res: any) => {
        if (res?.success && res.data?.users) {
          const apiUsers = res.data.users as DropdownUser[];
          // Merge unique users into allUsers
          const existingIds = new Set(this.allUsers.map(u => u.user_id));
          for (const u of apiUsers) {
            if (!existingIds.has(u.user_id)) {
              this.allUsers.push(u);
            }
          }
          this.filterUsers();
        }
      }
    });
  }

  /**
   * When user selects a person from the dropdown
   */
  selectUser(user: DropdownUser): void {
    this.selectedUser = user;
    this.searchQuery = this.formatUserDisplay(user);
    this.isDropdownOpen = false;
    this.loadUserInvoices(user.user_id);
  }

  /**
   * Trigger search on Submit button click or Enter key
   */
  onSubmitSearch(): void {
    this.isDropdownOpen = false;
    const q = (this.searchQuery || '').trim().toLowerCase();

    if (!q) {
      this.showToast('Please enter a name, mobile, email, or member ID to search', 'error');
      return;
    }

    // 1. If currently filtered list has an exact or single match, select them
    if (this.filteredUsers.length === 1) {
      this.selectUser(this.filteredUsers[0]);
      return;
    }

    const exactMatch = this.filteredUsers.find(u => 
      (u.full_name || '').toLowerCase() === q ||
      (u.mobile_no || '').toLowerCase() === q ||
      (u.email || '').toLowerCase() === q ||
      (u.member_id || '').toLowerCase() === q ||
      String(u.user_id) === q
    );

    if (exactMatch) {
      this.selectUser(exactMatch);
      return;
    }

    // 2. Query backend for the search query and pick top match
    this.loading = true;
    this.api.get('/api/admin/plot-orders/search-invoices', { q }, true).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res?.success) {
          const matched = res.data?.users || [];
          if (matched.length > 0) {
            this.selectUser(matched[0]);
          } else {
            this.selectedUser = null;
            this.orders = [];
            this.financialSummary = null;
            this.showToast(`No customer, associate, or team member found for "${q}"`, 'error');
          }
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.showToast('Error searching user records', 'error');
      }
    });
  }

  /**
   * Clear the search bar and reset
   */
  clearSearch(): void {
    this.searchQuery = '';
    this.selectedUser = null;
    this.orders = [];
    this.financialSummary = null;
    this.filteredUsers = [...this.allUsers];
    this.isDropdownOpen = true;
  }

  /**
   * Load Plot Orders & Invoices for selected user
   */
  loadUserInvoices(userId: number): void {
    this.loading = true;
    this.api.get('/api/admin/plot-orders/search-invoices', { selected_user_id: userId }, true).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res?.success) {
          this.orders = res.data?.orders || [];
          this.financialSummary = res.data?.financial_summary || null;
          if (res.data?.selected_user) {
            this.selectedUser = res.data.selected_user;
          }
        } else {
          this.showToast(res?.message || 'Failed to load user plot orders', 'error');
        }
      },
      error: (err: any) => {
        this.loading = false;
        console.error('[SearchInvoices] Error fetching user orders:', err);
        this.showToast('Failed to load user plot orders and invoices', 'error');
      }
    });
  }

  /**
   * View Invoice in new tab
   */
  viewInvoice(invoiceNumber: string | number | null): void {
    if (!invoiceNumber) {
      this.showToast('Invoice number not available for this record', 'error');
      return;
    }
    window.open(`/invoice/${encodeURIComponent(String(invoiceNumber))}`, '_blank');
  }

  /**
   * Print Invoice
   */
  printInvoice(invoiceNumber: string | number | null): void {
    if (!invoiceNumber) {
      this.showToast('Invoice number not available for this record', 'error');
      return;
    }
    window.open(`/invoice/${encodeURIComponent(String(invoiceNumber))}?print=true`, '_blank');
  }

  /**
   * Download Invoice PDF
   */
  downloadInvoicePdf(invoiceNumber: string | number | null): void {
    if (!invoiceNumber) {
      this.showToast('Invoice number not available for download', 'error');
      return;
    }
    const invKey = String(invoiceNumber);
    this.downloadingPdf[invKey] = true;

    this.api.getBlob(`/api/invoice/${encodeURIComponent(invKey)}/pdf`, true).subscribe({
      next: (blob: Blob) => {
        this.downloadingPdf[invKey] = false;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${invKey}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showToast(`Invoice ${invKey} downloaded successfully`, 'success');
      },
      error: () => {
        this.downloadingPdf[invKey] = false;
        window.open(`/invoice/${encodeURIComponent(invKey)}?print=true`, '_blank');
      }
    });
  }

  getUserTypeBadgeClass(type: string): string {
    const t = String(type || '').toLowerCase();
    if (t.includes('customer')) return 'badge-customer';
    if (t.includes('associate')) return 'badge-associate';
    if (t.includes('team')) return 'badge-team';
    if (t.includes('investor')) return 'badge-investor';
    return 'badge-neutral';
  }

  getPaymentStatusBadgeClass(status: string): string {
    const s = String(status || '').toLowerCase();
    if (s === 'paid' || s === 'completed' || s === 'approved') return 'badge-paid';
    if (s === 'partially paid' || s === 'partial') return 'badge-partial';
    if (s === 'overdue') return 'badge-overdue';
    return 'badge-pending';
  }

  showToast(message: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMessage = '';
    }, 3500);
  }
}
