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
  searchingUsers: boolean = false;
  loadingOrders: boolean = false;

  // Search Results for dropdown (loaded strictly on-demand as user types)
  filteredUsers: DropdownUser[] = [];

  // Selected User & Bookings
  selectedUser: DropdownUser | null = null;
  orders: PlotOrderItem[] = [];
  financialSummary: any = null;

  // Modal dialog for Installments / EMI schedule
  activeModalOrder: PlotOrderItem | null = null;

  // Actions state
  downloadingPdf: { [key: string]: boolean } = {};
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any = null;
  private searchDebounceTimer: any = null;

  constructor(
    private api: ApiService,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    // Initial state: Clean page, NO default data loaded upfront.
    this.selectedUser = null;
    this.orders = [];
    this.financialSummary = null;
    this.filteredUsers = [];
    this.isDropdownOpen = false;
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
   * Called as user types in the search bar.
   * Debounced API query fetches only matching records (scalable for 1000s of users).
   */
  onSearchInput(): void {
    const q = (this.searchQuery || '').trim();

    if (q.length < 1) {
      this.filteredUsers = [];
      this.isDropdownOpen = false;
      return;
    }

    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    this.searchingUsers = true;
    this.isDropdownOpen = true;

    this.searchDebounceTimer = setTimeout(() => {
      this.api.get('/api/admin/plot-orders/search-invoices', { q, limit: 50 }, true).subscribe({
        next: (res: any) => {
          this.searchingUsers = false;
          if (res?.success) {
            this.filteredUsers = res.data?.users || [];
            this.isDropdownOpen = true;
          } else {
            this.filteredUsers = [];
          }
        },
        error: (err: any) => {
          this.searchingUsers = false;
          console.error('[SearchInvoices] Error searching users:', err);
        }
      });
    }, 250);
  }

  /**
   * User clicks on a candidate in the searchable dropdown
   */
  selectUser(user: DropdownUser): void {
    this.selectedUser = user;
    this.searchQuery = this.formatUserDisplay(user);
    this.isDropdownOpen = false;
    this.loadUserOrders(user.user_id);
  }

  /**
   * Format display string for search input
   */
  formatUserDisplay(user: DropdownUser | null): string {
    if (!user) return '';
    const phone = user.mobile_no ? ` (${user.mobile_no})` : '';
    const code = user.member_id ? ` - ${user.member_id}` : '';
    return `${user.full_name}${code}${phone}`;
  }

  /**
   * Trigger search on Submit button click or Enter key
   */
  onSubmitSearch(): void {
    const q = (this.searchQuery || '').trim();

    if (!q) {
      this.showToast('Please type a name, mobile number, email, or member ID', 'error');
      return;
    }

    this.isDropdownOpen = false;

    // If currently filtered list has matching user, select first match
    if (this.filteredUsers.length > 0) {
      this.selectUser(this.filteredUsers[0]);
      return;
    }

    // Direct search query
    this.loadingOrders = true;
    this.api.get('/api/admin/plot-orders/search-invoices', { q }, true).subscribe({
      next: (res: any) => {
        this.loadingOrders = false;
        if (res?.success && res.data?.users?.length > 0) {
          const matched = res.data.users[0];
          this.selectUser(matched);
        } else {
          this.selectedUser = null;
          this.orders = [];
          this.financialSummary = null;
          this.showToast(`No associate, team member, or customer found matching "${q}"`, 'error');
        }
      },
      error: () => {
        this.loadingOrders = false;
        this.showToast('Error searching user records', 'error');
      }
    });
  }

  /**
   * Clear the search bar and reset page
   */
  clearSearch(): void {
    this.searchQuery = '';
    this.selectedUser = null;
    this.orders = [];
    this.financialSummary = null;
    this.filteredUsers = [];
    this.isDropdownOpen = false;
    this.activeModalOrder = null;
  }

  /**
   * Load Plot Orders & Invoices for selected user
   */
  loadUserOrders(userId: number): void {
    this.loadingOrders = true;
    this.api.get('/api/admin/plot-orders/search-invoices', { selected_user_id: userId }, true).subscribe({
      next: (res: any) => {
        this.loadingOrders = false;
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
        this.loadingOrders = false;
        console.error('[SearchInvoices] Error fetching user orders:', err);
        this.showToast('Failed to load user plot orders and invoices', 'error');
      }
    });
  }

  /**
   * Open Installments Modal for an order
   */
  openInstallmentsModal(order: PlotOrderItem): void {
    this.activeModalOrder = order;
  }

  /**
   * Close Installments Modal
   */
  closeInstallmentsModal(): void {
    this.activeModalOrder = null;
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
