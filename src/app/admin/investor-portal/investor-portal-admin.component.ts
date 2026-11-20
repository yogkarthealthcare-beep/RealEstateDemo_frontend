import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AdminTableContainerComponent } from '../../shared/admin-table-container/admin-table-container.component';
import { AdminPaginationComponent } from '../../shared/admin-pagination/admin-pagination.component';
import { VerifiedBadgeComponent } from '../../shared/verified-badge/verified-badge.component';

@Component({
  selector: 'app-investor-portal-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminTableContainerComponent, AdminPaginationComponent, VerifiedBadgeComponent],
  templateUrl: './investor-portal-admin.component.html',
  styleUrls: ['./investor-portal-admin.component.css']
})
export class AdminInvestorPortalComponent implements OnInit {
  activeTab = 'investors'; // 'investors', 'deposits', 'withdrawals', 'transactions'

  investors: any[] = [];
  deposits: any[] = [];
  withdrawals: any[] = [];
  transactions: any[] = [];

  loading = true;
  message = '';
  error = '';

  // Showcase Condition Settings (Home Screen Visibility)
  minShowcaseAmount: number = 50000;
  isShowcaseMinEnabled: boolean = true;
  savingSettings: boolean = false;
  showSettingsBar: boolean = true;

  // Investor Financial Overview Stats
  stats = {
    total_investment: 0,
    total_investor_credit: 0,
    total_deposits: 0,
    total_withdrawals: 0,
    total_investors: 0,
    active_investors: 0
  };
  loadingStats: boolean = false;

  page = 1;
  pageSize = 10;

  get pagedInvestors(): any[] {
    const start = (this.page - 1) * this.pageSize;
    return this.investors.slice(start, start + this.pageSize);
  }

  get pagedDeposits(): any[] {
    const start = (this.page - 1) * this.pageSize;
    return this.deposits.slice(start, start + this.pageSize);
  }

  get pagedWithdrawals(): any[] {
    const start = (this.page - 1) * this.pageSize;
    return this.withdrawals.slice(start, start + this.pageSize);
  }

  get pagedTransactions(): any[] {
    const start = (this.page - 1) * this.pageSize;
    return this.transactions.slice(start, start + this.pageSize);
  }

  onPageChange(p: number) {
    this.page = p;
  }

  onPageSizeChange(s: number) {
    this.pageSize = s;
    this.page = 1;
  }

  // Investor Search/Filter
  investorSearch = '';
  investorStatusFilter = 'all';

  // Modal State for Remarks / Confirmation
  selectedItem: any = null;
  actionType: 'approve_deposit' | 'reject_deposit' | 'approve_withdrawal' | 'reject_withdrawal' | 'toggle_status' | null = null;
  adminRemarks = '';
  processingAction = false;
  previewImageUrl: string | null = null;

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  getInvestorStatus(inv: any): string {
    return String(inv?.status || inv?.account_status || 'pending').trim().toLowerCase();
  }

  isInvestorActive(inv: any): boolean {
    if (!inv) return false;
    const isFree = inv.is_free === true || inv.isFree === true || inv.user_type === 'Free';
    if (isFree) return false;
    const status = this.getInvestorStatus(inv);
    return status === 'active' || status === 'approved';
  }

  isFreeOrDisabled(inv: any): boolean {
    if (!inv) return false;
    return !this.isInvestorActive(inv);
  }

  onRowClick(inv: any, event: MouseEvent) {
    if (this.isFreeOrDisabled(inv)) {
      event.stopPropagation();
      event.preventDefault();
      return;
    }
  }

  onRowDblClick(inv: any, event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    return;
  }

  ngOnInit() {
    this.loadSettings();
    this.loadStats();
    this.route.queryParams.subscribe(params => {
      if (params['tab'] && ['investors', 'deposits', 'withdrawals', 'transactions'].includes(params['tab'])) {
        this.activeTab = params['tab'];
      }
      this.loadData();
    });
  }

  loadStats() {
    this.loadingStats = true;
    this.api.adminGetInvestorPortalStats().subscribe({
      next: (res: any) => {
        this.loadingStats = false;
        if (res?.success && res?.data) {
          this.stats = {
            total_investment: Number(res.data.total_investment || 0),
            total_investor_credit: Number(res.data.total_investor_credit || 0),
            total_deposits: Number(res.data.total_deposits || 0),
            total_withdrawals: Number(res.data.total_withdrawals || 0),
            total_investors: Number(res.data.total_investors || 0),
            active_investors: Number(res.data.active_investors || 0)
          };
        }
      },
      error: () => {
        this.loadingStats = false;
      }
    });
  }

  loadSettings() {
    this.api.adminGetInvestorPortalSettings().subscribe({
      next: (res: any) => {
        if (res?.success && res?.data) {
          this.minShowcaseAmount = Number(res.data.min_showcase_amount) || 50000;
          this.isShowcaseMinEnabled = res.data.is_showcase_min_enabled !== false;
        }
      },
      error: () => {}
    });
  }

  saveSettings() {
    this.savingSettings = true;
    this.api.adminUpdateInvestorPortalSettings({
      min_showcase_amount: this.minShowcaseAmount,
      is_showcase_min_enabled: this.isShowcaseMinEnabled
    }).subscribe({
      next: (res: any) => {
        this.savingSettings = false;
        if (res?.success) {
          this.message = `Showcase condition updated: Investors with < ₹${Number(this.minShowcaseAmount).toLocaleString('en-IN')} wallet/investment will be hidden from the Home Screen.`;
          setTimeout(() => this.message = '', 6000);
        }
      },
      error: (e: any) => {
        this.savingSettings = false;
        this.error = e?.error?.message || 'Failed to update showcase condition.';
        setTimeout(() => this.error = '', 5000);
      }
    });
  }

  loadData() {
    this.loading = true;
    this.message = '';
    this.error = '';

    if (this.activeTab === 'investors') {
      this.api.adminGetInvestorsPortal({ search: this.investorSearch, status: this.investorStatusFilter }).subscribe({
        next: (res: any) => {
          this.loading = false;
          if (res.success) {
            this.investors = res.data?.items || [];
            if (res.data?.stats) {
              this.stats = { ...this.stats, ...res.data.stats };
            }
          }
        },
        error: (err: any) => {
          this.loading = false;
          this.error = err.error?.message || 'Failed to load investors.';
        }
      });
    } else if (this.activeTab === 'deposits') {
      this.api.adminGetInvestorPortalDeposits().subscribe({
        next: (res: any) => {
          this.loading = false;
          if (res.success) this.deposits = res.data || [];
        },
        error: (err: any) => {
          this.loading = false;
          this.error = err.error?.message || 'Failed to load deposits.';
        }
      });
    } else if (this.activeTab === 'withdrawals') {
      this.api.adminGetInvestorPortalWithdrawals().subscribe({
        next: (res: any) => {
          this.loading = false;
          if (res.success) this.withdrawals = res.data || [];
        },
        error: (err: any) => {
          this.loading = false;
          this.error = err.error?.message || 'Failed to load withdrawals.';
        }
      });
    } else if (this.activeTab === 'transactions') {
      this.api.adminGetInvestorPortalTransactions().subscribe({
        next: (res: any) => {
          this.loading = false;
          if (res.success) this.transactions = res.data || [];
        },
        error: (err: any) => {
          this.loading = false;
          this.error = err.error?.message || 'Failed to load transactions.';
        }
      });
    }
  }

  switchTab(tab: string) {
    this.activeTab = tab;
    this.page = 1;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
    this.loadData();
  }

  openProofImage(url: string) {
    this.previewImageUrl = this.api.url(url);
  }

  closeProofImage() {
    this.previewImageUrl = null;
  }

  // Action Modals
  openActionModal(item: any, type: 'approve_deposit' | 'reject_deposit' | 'approve_withdrawal' | 'reject_withdrawal') {
    this.selectedItem = item;
    this.actionType = type;
    this.adminRemarks = '';
  }

  closeActionModal() {
    this.selectedItem = null;
    this.actionType = null;
    this.adminRemarks = '';
  }

  confirmAction() {
    if (!this.selectedItem || !this.actionType) return;

    this.processingAction = true;
    this.error = '';
    this.message = '';

    if (this.actionType === 'approve_deposit' || this.actionType === 'reject_deposit') {
      const status = this.actionType === 'approve_deposit' ? 'approved' : 'rejected';
      this.api.adminUpdateInvestorPortalDepositStatus(this.selectedItem.id, {
        status,
        admin_remarks: this.adminRemarks
      }).subscribe({
        next: (res: any) => {
          this.processingAction = false;
          this.message = res.message || `Deposit ${status} successfully.`;
          this.closeActionModal();
          this.loadData();
        },
        error: (err: any) => {
          this.processingAction = false;
          this.error = err.error?.message || 'Action failed.';
        }
      });
    } else if (this.actionType === 'approve_withdrawal' || this.actionType === 'reject_withdrawal') {
      const status = this.actionType === 'approve_withdrawal' ? 'approved' : 'rejected';
      this.api.adminUpdateInvestorPortalWithdrawalStatus(this.selectedItem.id, {
        status,
        admin_remarks: this.adminRemarks
      }).subscribe({
        next: (res: any) => {
          this.processingAction = false;
          this.message = res.message || `Withdrawal ${status} successfully.`;
          this.closeActionModal();
          this.loadData();
        },
        error: (err: any) => {
          this.processingAction = false;
          this.error = err.error?.message || 'Action failed.';
        }
      });
    }
  }

  toggleInvestorStatus(investor: any, newStatus: string) {
    const cleanStatus = String(newStatus || '').trim().toLowerCase();
    const actionLabel = (cleanStatus === 'active' || cleanStatus === 'approved') ? 'activate / enable' : cleanStatus;
    if (!confirm(`Are you sure you want to ${actionLabel} account for ${investor.full_name}?`)) return;

    const payload: any = { status: cleanStatus };
    if (cleanStatus === 'active' || cleanStatus === 'approved') {
      payload.is_verified = true;
    }

    this.api.adminUpdateInvestorPortalStatus(investor.id, payload).subscribe({
      next: (res: any) => {
        this.message = res.message || 'Investor status updated.';
        this.loadData();
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Status update failed.';
      }
    });
  }

  getStatusBadge(status: string): string {
    switch (status?.toLowerCase()) {
      case 'approved': case 'active': return 'bg-success text-white';
      case 'rejected': case 'inactive': case 'suspended': case 'disabled': return 'bg-danger text-white';
      default: return 'bg-warning text-dark';
    }
  }

  loginAsInvestor(investor: any) {
    const status = String(investor.status || '').toLowerCase();
    const isActive = status === 'active' || status === 'approved';
    if (!isActive) {
      alert(`Cannot login: investor status is '${investor.status}' (must be Active/Approved)`);
      return;
    }
    this.api.adminLoginAsUser(investor.id, 'Investor').subscribe({
      next: (res: any) => {
        if (res?.success && res?.data?.token) {
          const { token, refresh_token, user, redirect_url } = res.data;
          const userPayload = user || { id: investor.id, full_name: investor.full_name, email: investor.email, user_type: 'Investor', account_status: 'Active' };
          const url = `/auth/impersonate-login?token=${encodeURIComponent(token)}&refresh_token=${encodeURIComponent(refresh_token || token)}&user=${encodeURIComponent(JSON.stringify(userPayload))}&type=Investor&redirectUrl=${encodeURIComponent(redirect_url || '/investor/dashboard')}`;
          window.open(url, '_blank');
        } else {
          alert(res?.message || 'Login failed');
        }
      },
      error: (e: any) => alert(e?.error?.message || 'Failed to login as investor')
    });
  }

  deleteInvestor(inv: any) {
    if (!inv || !inv.id) return;
    const name = inv.full_name || 'this investor';
    if (!confirm(`Are you sure you want to permanently delete investor ${name}? All associated enrollments, deposits, withdrawals, documents, images, and signatures will be permanently deleted.`)) {
      return;
    }
    this.api.adminDeleteInvestorEnrollment(String(inv.id)).subscribe({
      next: (res: any) => {
        if (res.success || res.status === 'success') {
          this.message = 'Investor and all related data deleted successfully.';
          setTimeout(() => this.message = '', 4000);
          this.loadStats();
          this.loadData();
        } else {
          this.error = res.message || 'Failed to delete investor.';
          setTimeout(() => this.error = '', 4000);
        }
      },
      error: (e: any) => {
        this.error = e?.error?.message || 'Delete failed.';
        setTimeout(() => this.error = '', 4000);
      }
    });
  }
}
