import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

export interface SearchUserItem {
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

export interface FinancialSummary {
  total_orders: number;
  total_plots: number;
  total_invoice_count: number;
  total_invoice_amount: number;
  total_paid_amount: number;
  total_pending_amount: number;
  paid_installments: number;
  pending_installments: number;
  overdue_installments: number;
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
  // Search & Filter State
  searchQuery: string = '';
  userTypeFilter: string = 'All';
  statusFilter: string = 'All';
  paymentTypeFilter: string = 'All';
  fromDate: string = '';
  toDate: string = '';
  sortOrder: 'latest' | 'oldest' = 'latest';

  // Results State
  loading: boolean = false;
  matchedUsers: SearchUserItem[] = [];
  selectedUser: SearchUserItem | null = null;
  orders: PlotOrderItem[] = [];
  financialSummary: FinancialSummary | null = null;

  // Accordion state
  expandedOrders: { [key: number]: boolean } = {};

  // Action states
  downloadingPdf: { [key: string]: boolean } = {};
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any = null;
  private searchDebounceTimer: any = null;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  /**
   * Fetch data from the Search Invoices backend API
   */
  loadData(selectedUserId?: number): void {
    this.loading = true;
    const qStr = (this.searchQuery || '').trim();
    const params: any = {
      q: qStr,
      search: qStr,
      user_type: this.userTypeFilter || 'All',
      status: this.statusFilter || 'All',
      status_filter: this.statusFilter || 'All',
      payment_type: this.paymentTypeFilter || 'All',
      payment_type_filter: this.paymentTypeFilter || 'All',
      sort: this.sortOrder || 'latest'
    };

    if (this.fromDate) params.from_date = this.fromDate;
    if (this.toDate) params.to_date = this.toDate;
    if (selectedUserId) {
      params.selected_user_id = selectedUserId;
    } else if (this.selectedUser?.user_id) {
      params.selected_user_id = this.selectedUser.user_id;
    }

    this.api.get('/api/admin/plot-orders/search-invoices', params, true).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res && res.success) {
          this.matchedUsers = res.data?.users || [];
          this.selectedUser = res.data?.selected_user || null;
          this.orders = res.data?.orders || [];
          this.financialSummary = res.data?.financial_summary || null;

          // Expand orders by default if 3 or fewer
          this.expandedOrders = {};
          if (this.orders.length > 0) {
            this.orders.forEach((ord, index) => {
              this.expandedOrders[ord.booking_id] = index < 3;
            });
          }
        } else {
          this.showToast(res?.message || 'Failed to fetch search results', 'error');
        }
      },
      error: (err: any) => {
        this.loading = false;
        console.error('[SearchInvoices] Error fetching data:', err);
        const msg = err?.error?.message || err?.message || 'Failed to connect to invoice search service';
        this.showToast(msg, 'error');
      }
    });
  }

  /**
   * Realtime search with 350ms debounce
   */
  onSearchInput(): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    this.searchDebounceTimer = setTimeout(() => {
      // Clear current selected user if searching a new query to find best match
      this.selectedUser = null;
      this.loadData();
    }, 350);
  }

  /**
   * Direct search trigger on Enter or Search button click
   */
  onSearch(): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    this.selectedUser = null;
    this.loadData();
  }

  /**
   * Filter change triggers
   */
  onFilterChange(): void {
    this.loadData();
  }

  /**
   * Select a specific user from search results list
   */
  selectUser(user: SearchUserItem): void {
    if (this.selectedUser?.user_id === user.user_id) return;
    this.selectedUser = user;
    this.loadData(user.user_id);
  }

  /**
   * Reset all filter parameters
   */
  resetFilters(): void {
    this.searchQuery = '';
    this.userTypeFilter = 'All';
    this.statusFilter = 'All';
    this.paymentTypeFilter = 'All';
    this.fromDate = '';
    this.toDate = '';
    this.sortOrder = 'latest';
    this.selectedUser = null;
    this.loadData();
  }

  /**
   * Toggle order card accordion
   */
  toggleOrder(bookingId: number): void {
    this.expandedOrders[bookingId] = !this.expandedOrders[bookingId];
  }

  expandAll(): void {
    this.orders.forEach(o => {
      this.expandedOrders[o.booking_id] = true;
    });
  }

  collapseAll(): void {
    this.expandedOrders = {};
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
   * Print Invoice directly
   */
  printInvoice(invoiceNumber: string | number | null): void {
    if (!invoiceNumber) {
      this.showToast('Invoice number not available for this record', 'error');
      return;
    }
    window.open(`/invoice/${encodeURIComponent(String(invoiceNumber))}?print=true`, '_blank');
  }

  /**
   * Download Invoice PDF via backend or browser view
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
        // Fallback to view page with automatic print/save
        window.open(`/invoice/${encodeURIComponent(invKey)}?print=true`, '_blank');
      }
    });
  }

  /**
   * Export Selected User Orders and Invoices to CSV
   */
  exportToCsv(): void {
    if (!this.selectedUser) {
      this.showToast('No user selected to export', 'error');
      return;
    }

    const rows: string[][] = [];
    
    // Header block
    rows.push(['MMR CONSTRUCTIONS - PLOT ORDERS & INVOICE DOSSIER']);
    rows.push(['Generated On', new Date().toLocaleString()]);
    rows.push([]);
    rows.push(['USER PROFILE SUMMARY']);
    rows.push(['Name', this.selectedUser.full_name || 'N/A']);
    rows.push(['User Type', this.selectedUser.user_type || 'N/A']);
    rows.push(['User / Member ID', this.selectedUser.member_id || String(this.selectedUser.user_id)]);
    rows.push(['Mobile', this.selectedUser.mobile_no || 'N/A']);
    rows.push(['Email', this.selectedUser.email || 'N/A']);
    rows.push(['Total Plot Orders', String(this.financialSummary?.total_orders || this.orders.length)]);
    rows.push(['Total Plots', String(this.financialSummary?.total_plots || 0)]);
    rows.push(['Total Booking Amount (INR)', String(this.financialSummary?.total_invoice_amount || 0)]);
    rows.push(['Total Paid Amount (INR)', String(this.financialSummary?.total_paid_amount || 0)]);
    rows.push(['Total Pending Amount (INR)', String(this.financialSummary?.total_pending_amount || 0)]);
    rows.push(['Paid Installments Count', String(this.financialSummary?.paid_installments || 0)]);
    rows.push(['Pending Installments Count', String(this.financialSummary?.pending_installments || 0)]);
    rows.push(['Overdue Installments Count', String(this.financialSummary?.overdue_installments || 0)]);
    rows.push([]);

    // Table Header
    rows.push([
      'Order Serial',
      'Site Name',
      'Plot Number',
      'Plot Area',
      'Booking Date',
      'Final Plot Price (INR)',
      'Payment Type',
      'Order Status',
      'Item Type',
      'Installment / Inv #',
      'Due / Invoice Date',
      'Amount (INR)',
      'Paid Amount (INR)',
      'Pending Amount (INR)',
      'Payment Date',
      'Payment Status',
      'Transaction Ref'
    ]);

    // Data rows
    for (const ord of this.orders) {
      if (ord.payment_type === 'One-Time') {
        if (ord.invoices && ord.invoices.length > 0) {
          for (const inv of ord.invoices) {
            rows.push([
              ord.booking_serial,
              ord.site_name,
              ord.plot_number,
              ord.plot_area,
              ord.booking_date || '',
              String(ord.final_plot_price),
              ord.payment_type,
              ord.booking_status,
              'Invoice',
              inv.invoice_number,
              inv.invoice_date || '',
              String(inv.invoice_amount),
              String(inv.paid_amount),
              String(inv.balance_amount),
              inv.invoice_date || '',
              inv.payment_status,
              inv.transaction_id || ''
            ]);
          }
        } else {
          rows.push([
            ord.booking_serial,
            ord.site_name,
            ord.plot_number,
            ord.plot_area,
            ord.booking_date || '',
            String(ord.final_plot_price),
            ord.payment_type,
            ord.booking_status,
            'One-Time Payment',
            'Pending Generation',
            ord.booking_date || '',
            String(ord.total_amount),
            String(ord.paid_amount),
            String(ord.pending_amount),
            '',
            ord.pending_amount === 0 ? 'Paid' : 'Pending',
            ord.booking_serial
          ]);
        }
      } else {
        // Installments
        for (const emi of ord.installments) {
          rows.push([
            ord.booking_serial,
            ord.site_name,
            ord.plot_number,
            ord.plot_area,
            ord.booking_date || '',
            String(ord.final_plot_price),
            ord.payment_type,
            ord.booking_status,
            'Installment #' + emi.installment_no,
            emi.invoice_number || 'Pending Generation',
            emi.due_date || '',
            String(emi.emi_amount),
            String(emi.paid_amount),
            String(emi.pending_amount),
            emi.paid_date || '',
            emi.payment_status,
            emi.transaction_id || ''
          ]);
        }
      }
    }

    const csvContent = rows
      .map(r => r.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = (this.selectedUser.full_name || 'user').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.href = url;
    link.download = `MMR_Invoices_${safeName}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    this.showToast('Invoices report exported to CSV', 'success');
  }

  /**
   * Status and badge styling helpers
   */
  getUserTypeBadgeClass(type: string): string {
    const t = String(type || '').toLowerCase();
    if (t.includes('customer')) return 'badge-customer';
    if (t.includes('associate')) return 'badge-associate';
    if (t.includes('investor')) return 'badge-investor';
    return 'badge-neutral';
  }

  getPaymentStatusBadgeClass(status: string): string {
    const s = String(status || '').toLowerCase();
    if (s === 'paid' || s === 'completed' || s === 'approved') return 'badge-status-paid';
    if (s === 'partially paid' || s === 'partial') return 'badge-status-partial';
    if (s === 'overdue') return 'badge-status-overdue';
    if (s === 'pending' || s === 'submitted') return 'badge-status-pending';
    return 'badge-status-neutral';
  }

  getBookingStatusBadgeClass(status: string): string {
    const s = String(status || '').toLowerCase();
    if (s === 'approved' || s === 'confirmed') return 'badge-booking-approved';
    if (s === 'rejected' || s === 'cancelled') return 'badge-booking-rejected';
    return 'badge-booking-pending';
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
