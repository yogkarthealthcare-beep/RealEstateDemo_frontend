import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import Swal from 'sweetalert2';

export interface MasterTableInfo {
  tableName: string;
  rowCount: number;
  columnCount: number;
  category: string;
}

export interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  isPk: boolean;
  default: string | null;
}

export interface EntityTableDef {
  tableName: string;
  label: string;
  description: string;
  icon: string;
}

export interface EntityConfig {
  key: string;
  title: string;
  hindiTitle: string;
  icon: string;
  badgeClass: string;
  description: string;
  userType?: string;
  primaryTable: string;
  tables: EntityTableDef[];
}

@Component({
  selector: 'app-master-data',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './master-data.component.html',
  styleUrls: ['./master-data.component.css']
})
export class MasterDataComponent implements OnInit, OnDestroy {
  // Loading & Error States
  loadingTables = false;
  loadingData = false;
  savingRow = false;
  deletingRow = false;
  errorMessage = '';
  successMessage = '';

  // In-table row inspection
  expandedRowId: any = null;


  // ── 4 CORE ENTITIES + ALL TABLES CONFIGURATION ──────────────────
  entities: EntityConfig[] = [
    {
      key: 'associate',
      title: 'Associate',
      hindiTitle: 'एसोसिएट',
      icon: 'fas fa-handshake',
      badgeClass: 'badge-associate',
      description: 'Manage associate registrations, sponsorships, KYC, nominee, bank accounts, and payout requests.',
      userType: 'associate',
      primaryTable: 'users',
      tables: [
        { tableName: 'users', label: 'Associates Accounts', description: 'Filtered users with Associate role', icon: 'fas fa-user-group' },
        { tableName: 'associate_enrollment', label: 'KYC & Enrollment', description: 'Personal, KYC, and document verification records', icon: 'fas fa-id-card' },
        { tableName: 'user_documents', label: 'Documents', description: 'Uploaded KYC proofs, agreements, and identity documents', icon: 'fas fa-folder-open' },
        { tableName: 'associate_sponsor', label: 'Sponsors & Tree', description: 'Associate sponsor links and tree placements', icon: 'fas fa-sitemap' },
        { tableName: 'associate_nominee', label: 'Nominees', description: 'Registered nominee details', icon: 'fas fa-users' },
        { tableName: 'associate_bank_details', label: 'Bank Accounts', description: 'Verified bank accounts and IFSC details', icon: 'fas fa-building-columns' },
        { tableName: 'associate_address', label: 'Addresses', description: 'Permanent and correspondence addresses', icon: 'fas fa-location-dot' },
        { tableName: 'associate_referral_links', label: 'Referral Links', description: 'Active and legacy referral codes', icon: 'fas fa-link' },
        { tableName: 'associate_ranks', label: 'Ranks & Levels', description: 'Rank promotions and badges', icon: 'fas fa-award' },
        { tableName: 'associate_payout_requests', label: 'Payout Requests', description: 'Withdrawal and commission payouts', icon: 'fas fa-receipt' },
        { tableName: 'referral_registrations', label: 'Referral Signups', description: 'Direct referral registration tracking', icon: 'fas fa-user-plus' },
        { tableName: 'user_wallets', label: 'Associate Wallets', description: 'E-wallet balance and commissions', icon: 'fas fa-wallet' }
      ]
    },
    {
      key: 'team_member',
      title: 'Team Member',
      hindiTitle: 'टीम मेंबर',
      icon: 'fas fa-users-gear',
      badgeClass: 'badge-teammember',
      description: 'Manage team member registry (UID MMR-TM-0001), parent associate slot allocations, and user accounts.',
      userType: 'team_member',
      primaryTable: 'team_members',
      tables: [
        { tableName: 'team_members', label: 'Team Members Registry', description: 'Core team members table with UID, associate ID & status', icon: 'fas fa-id-badge' },
        { tableName: 'users', label: 'Team Member Accounts', description: 'Filtered users with Team Member role', icon: 'fas fa-users-gear' },
        { tableName: 'user_wallets', label: 'Team Member Wallets', description: 'Team member wallet ledger and transactions', icon: 'fas fa-wallet' },
        { tableName: 'bookings', label: 'Member Bookings', description: 'Bookings sold or attributed to team members', icon: 'fas fa-clipboard-check' }
      ]
    },
    {
      key: 'customer',
      title: 'Customer',
      hindiTitle: 'कस्टमर',
      icon: 'fas fa-user-check',
      badgeClass: 'badge-customer',
      description: 'Manage plot buyers, customer profiles, KYC submissions, bookings, receipts, invoices, and EMI schedules.',
      userType: 'customer',
      primaryTable: 'users',
      tables: [
        { tableName: 'users', label: 'Customer Accounts', description: 'Filtered users with Customer role', icon: 'fas fa-user' },
        { tableName: 'customer_enrollment_submissions', label: 'Customer KYC', description: 'Customer KYC forms and identity proof', icon: 'fas fa-file-lines' },
        { tableName: 'user_documents', label: 'Customer Documents', description: 'Identity proofs and verification documents', icon: 'fas fa-folder-open' },
        { tableName: 'customer_nominees', label: 'Customer Nominees', description: 'Nominees declared for plot ownership', icon: 'fas fa-users' },
        { tableName: 'bookings', label: 'Plot Bookings', description: 'Customer plot reservations and sales', icon: 'fas fa-map-location-dot' },
        { tableName: 'receipts', label: 'Receipts', description: 'Issued payment receipts', icon: 'fas fa-receipt' },
        { tableName: 'invoices', label: 'Invoices', description: 'Customer billing invoices', icon: 'fas fa-file-invoice-dollar' },
        { tableName: 'emi_schedules', label: 'EMI Schedules', description: 'Monthly EMI installment plans', icon: 'fas fa-calendar-check' },
        { tableName: 'inquiries', label: 'Inquiries', description: 'General customer inquiries and requests', icon: 'fas fa-circle-question' },
        { tableName: 'book_plot_leads', label: 'Plot Leads', description: 'Direct website plot booking inquiries', icon: 'fas fa-bullhorn' }
      ]
    },
    {
      key: 'investor',
      title: 'Investor',
      hindiTitle: 'इन्वेस्टर',
      icon: 'fas fa-piggy-bank',
      badgeClass: 'badge-investor',
      description: 'Manage investor master profiles, credentials, deposits, transaction ledgers, withdrawal requests, and legal documents.',
      userType: 'investor',
      primaryTable: 'investors',
      tables: [
        { tableName: 'investors', label: 'Investors Master', description: 'Core investor profiles and investment tiers', icon: 'fas fa-briefcase' },
        { tableName: 'investor_users', label: 'Investor Logins', description: 'Investor portal credentials and authentication', icon: 'fas fa-key' },
        { tableName: 'users', label: 'Investor Accounts (Users)', description: 'Filtered platform users with Investor role', icon: 'fas fa-user-tie' },
        { tableName: 'investor_enrollments', label: 'Enrollments', description: 'Investor application submissions', icon: 'fas fa-file-signature' },
        { tableName: 'investor_transactions', label: 'Transactions Ledger', description: 'Financial credits and debits', icon: 'fas fa-money-check-dollar' },
        { tableName: 'investor_deposits', label: 'Deposits', description: 'Capital deposits received', icon: 'fas fa-wallet' },
        { tableName: 'investor_withdrawals', label: 'Withdrawals', description: 'Returns and fund withdrawal requests', icon: 'fas fa-hand-holding-dollar' },
        { tableName: 'investor_documents', label: 'Documents & KYC', description: 'Agreements, PAN, and KYC proofs', icon: 'fas fa-file-contract' },
        { tableName: 'investor_notifications', label: 'Notifications', description: 'Investor alerts and logs', icon: 'fas fa-bell' }
      ]
    },
    {
      key: 'all',
      title: 'All Database Tables',
      hindiTitle: 'सभी डेटाबेस टेबल्स',
      icon: 'fas fa-database',
      badgeClass: 'badge-all',
      description: 'Complete direct database console across all public database tables with category filtering.',
      primaryTable: 'users',
      tables: []
    }
  ];

  selectedEntity = 'associate';

  // Tables List & Categorization
  tables: MasterTableInfo[] = [];
  categories: string[] = [];
  selectedCategory = 'ALL';
  tableFilterQuery = '';
  selectedTable = 'users';

  // Table Data & Schema
  columns: TableColumn[] = [];
  primaryKey = 'id';
  records: any[] = [];

  // Search & Pagination
  searchQuery = '';
  currentPage = 1;
  pageSize = 25;
  totalRecords = 0;
  totalPages = 1;
  sortBy = '';
  sortOrder: 'ASC' | 'DESC' = 'DESC';

  // Edit Modal State
  isEditModalOpen = false;
  editingRow: any = null;
  editFormData: Record<string, any> = {};

  // Delete Confirmation State
  isDeleteModalOpen = false;
  deletingRecordId: any = null;
  deletingRecordSummary = '';
  forceCascadeDelete = true;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadTablesList();
  }

  // ── ENTITY SELECTION ─────────────────────────────────────────────
  get activeEntity(): EntityConfig {
    return this.entities.find(e => e.key === this.selectedEntity) || this.entities[0];
  }

  onEntityChange(newKey: string): void {
    this.selectedEntity = newKey;
    this.searchQuery = '';
    this.sortBy = '';
    this.sortOrder = 'DESC';
    this.currentPage = 1;

    const ent = this.activeEntity;
    if (ent.key !== 'all' && ent.tables.length > 0) {
      this.selectedTable = ent.primaryTable;
    } else if (!this.selectedTable) {
      this.selectedTable = 'users';
    }
    this.loadTableData(this.selectedTable, 1);
  }

  getTableRowCount(tableName: string): number | null {
    const found = this.tables.find(t => t.tableName === tableName);
    return found ? found.rowCount : null;
  }

  // ── 1. LOAD TABLES LIST ──────────────────────────────────────────
  loadTablesList(): void {
    this.loadingTables = true;
    this.errorMessage = '';
    this.api.adminGetMasterTables().subscribe({
      next: (res: any) => {
        this.loadingTables = false;
        if (res?.success && res?.data) {
          this.tables = res.data.tables || [];
          this.categories = ['ALL', ...(res.data.categories || [])];

          // Auto-select initial table for currently selected entity
          if (this.activeEntity.tables.length > 0) {
            this.selectedTable = this.activeEntity.primaryTable;
          } else if (this.tables.length > 0) {
            const hasUsers = this.tables.some(t => t.tableName === 'users');
            this.selectedTable = hasUsers ? 'users' : this.tables[0].tableName;
          }
          this.loadTableData(this.selectedTable, 1);
        }
      },
      error: (err: any) => {
        this.loadingTables = false;
        this.errorMessage = err?.error?.message || 'Failed to load master tables catalog.';
      }
    });
  }

  // Filtered tables based on Category and Search text (for "All Tables" view)
  get filteredTables(): MasterTableInfo[] {
    return this.tables.filter(t => {
      const matchCat = this.selectedCategory === 'ALL' || t.category === this.selectedCategory;
      const matchSearch = !this.tableFilterQuery || t.tableName.toLowerCase().includes(this.tableFilterQuery.toLowerCase().trim());
      return matchCat && matchSearch;
    });
  }

  // ── 2. LOAD DATA FOR SELECTED TABLE ─────────────────────────────
  selectTable(tableName: string): void {
    if (this.selectedTable === tableName && this.records.length > 0) return;
    this.selectedTable = tableName;
    this.searchQuery = '';
    this.sortBy = '';
    this.sortOrder = 'DESC';
    this.currentPage = 1;
    this.loadTableData(tableName, 1);
  }

  loadTableData(tableName: string, page = 1): void {
    this.loadingData = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.currentPage = page;

    const params: any = {
      page: this.currentPage,
      limit: this.pageSize
    };
    if (this.searchQuery.trim()) {
      params.search = this.searchQuery.trim();
    }
    if (this.sortBy) {
      params.sortBy = this.sortBy;
      params.sortOrder = this.sortOrder;
    }

    // Apply userType filtering if viewing within an entity
    if (this.selectedEntity !== 'all' && this.activeEntity.userType) {
      params.userType = this.activeEntity.userType;
    }

    this.api.adminGetMasterTableRecords(tableName, params).subscribe({
      next: (res: any) => {
        this.loadingData = false;
        if (res?.success && res?.data) {
          const rawCols: TableColumn[] = res.data.columns || [];
          // Filter out binary data columns (e.g. file_data, payment_screenshot_data, bytea)
          // to keep table light, clean, and prevent any browser freezing
          this.columns = rawCols.filter(c => {
            const n = (c.name || '').toLowerCase();
            const dt = (c.type || '').toLowerCase();
            return n !== 'file_data' && n !== 'payment_screenshot_data' && dt !== 'bytea';
          });
          this.primaryKey = res.data.primaryKey || 'id';
          this.records = res.data.records || [];
          this.totalRecords = res.data.pagination?.total || 0;
          this.totalPages = res.data.pagination?.totalPages || 1;
          this.currentPage = res.data.pagination?.page || 1;
        }
      },
      error: (err: any) => {
        this.loadingData = false;
        this.errorMessage = err?.error?.message || `Failed to load records for table "${tableName}".`;
      }
    });
  }

  // ── 3. SEARCH & SORT ─────────────────────────────────────────────
  onSearch(): void {
    this.currentPage = 1;
    this.loadTableData(this.selectedTable, 1);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.currentPage = 1;
    this.loadTableData(this.selectedTable, 1);
  }

  toggleSort(columnName: string): void {
    if (this.sortBy === columnName) {
      this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = columnName;
      this.sortOrder = 'ASC';
    }
    this.loadTableData(this.selectedTable, this.currentPage);
  }

  changePageSize(newSize: number): void {
    this.pageSize = newSize;
    this.currentPage = 1;
    this.loadTableData(this.selectedTable, 1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.loadTableData(this.selectedTable, page);
  }

  // ── IN-TABLE ROW INSPECTION (EXPAND ROW INSIDE TABLE) ───────────
  toggleRowExpand(row: any): void {
    const pkVal = row[this.primaryKey];
    if (this.expandedRowId === pkVal) {
      this.expandedRowId = null;
    } else {
      this.expandedRowId = pkVal;
    }
  }

  // ── 4. MODIFY / EDIT ROW ─────────────────────────────────────────
  openEditModal(row: any): void {
    // Release focus immediately to eliminate table row :focus-within stacking bug
    (document.activeElement as HTMLElement)?.blur();
    document.body.classList.add('has-active-modal');

    this.editingRow = row;
    this.editFormData = {};

    // Clone row values into form data (skip binary fields)
    for (const col of this.columns) {
      const colName = (col.name || '').toLowerCase();
      if (colName === 'file_data' || colName === 'payment_screenshot_data') continue;
      const val = row[col.name];
      if (val instanceof Date) {
        this.editFormData[col.name] = val.toISOString().slice(0, 19);
      } else if (typeof val === 'object' && val !== null) {
        if (val?.type === 'Buffer' || Array.isArray(val?.data)) continue;
        this.editFormData[col.name] = JSON.stringify(val);
      } else {
        this.editFormData[col.name] = val !== null && val !== undefined ? val : '';
      }
    }
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    document.body.classList.remove('has-active-modal');
    this.isEditModalOpen = false;
    this.editingRow = null;
    this.editFormData = {};
  }

  saveEdit(): void {
    if (!this.editingRow || !this.selectedTable) return;
    const pkVal = this.editingRow[this.primaryKey];
    if (pkVal === undefined || pkVal === null) {
      alert(`Primary key (${this.primaryKey}) missing for selected row.`);
      return;
    }

    this.savingRow = true;
    this.api.adminUpdateMasterRecord(this.selectedTable, pkVal, this.editFormData).subscribe({
      next: (res: any) => {
        this.savingRow = false;
        this.closeEditModal();
        this.showToast('success', `Record #${pkVal} updated successfully in "${this.selectedTable}".`);
        this.loadTableData(this.selectedTable, this.currentPage);
      },
      error: (err: any) => {
        this.savingRow = false;
        alert(err?.error?.message || 'Failed to update record.');
      }
    });
  }

  // ── 5. DELETE ROW (SWEETALERT2 INTELLIGENT DELETION & AUDIT) ─────
  confirmDelete(row: any): void {
    const pkVal = row[this.primaryKey];
    if (pkVal === undefined || pkVal === null) return;

    // Release focus immediately
    (document.activeElement as HTMLElement)?.blur();

    const currentTable = (this.selectedTable || '').toLowerCase();
    const currentEntity = (this.selectedEntity || '').toLowerCase();
    const userType = String(row['user_type'] || row['user_role'] || '').trim();
    const fullName = row['full_name'] || row['name'] || row['applicant_name'] || `Record #${pkVal}`;
    const memberId = row['member_id'] || row['team_member_uid'] || '';
    const mobileNo = row['mobile_no'] || row['mobile_1'] || row['mobile'] || '';

    // ─────────────────────────────────────────────────────────────
    // 🛡️ 1. SURAJ KUMAR VERMA (ROOT ASSOCIATE) STRICT PROTECTION
    // ─────────────────────────────────────────────────────────────
    const isSuraj = (currentTable === 'users' || currentEntity === 'associate') && (
      String(fullName).toLowerCase().includes('suraj') ||
      String(memberId).toUpperCase() === 'MMR00001' ||
      String(memberId).toUpperCase() === 'MMR-ASC-0001' ||
      Number(pkVal) === 1
    );

    if (isSuraj) {
      Swal.fire({
        icon: 'error',
        title: '🛡️ सुरक्षित खाता (Protected Account)',
        html: `
          <div style="text-align: left; font-size: 13.5px; line-height: 1.6; color: #374151;">
            <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; border-radius: 6px; margin-bottom: 12px;">
              <strong style="color: #991b1b; display: block; font-size: 14px;">सूरज कुमार वर्मा (MMR00001)</strong>
              <span style="font-size: 12px; color: #b91c1c;">यह खाता सिस्टम द्वारा पूरी तरह सुरक्षित (Locked) है।</span>
            </div>
            <p style="margin-bottom: 8px;">
              सूरज कुमार वर्मा कंपनी के पूरे <strong>MLM नेटवर्क का मुख्य रूट नोड (Root Associate)</strong> है।
            </p>
            <p style="margin-bottom: 0; color: #6b7280; font-size: 12px;">
              सिस्टम ट्री स्ट्रक्चर और डेटा स्थिरता बनाए रखने के लिए इस अकाउंट को डिलीट नहीं किया जा सकता।
            </p>
          </div>
        `,
        confirmButtonColor: '#10b981',
        confirmButtonText: 'समझ गया'
      });
      return;
    }

    // ─────────────────────────────────────────────────────────────
    // 🟢 2. CUSTOMER DELETION ALERT (ROLLBACK BOOKINGS & RESET PLOTS)
    // ─────────────────────────────────────────────────────────────
    if (userType === 'Customer' || currentEntity === 'customer' || currentTable === 'customer_enrollment_submissions') {
      Swal.fire({
        title: '⚠️ क्या आप इस Customer को डिलीट करना चाहते हैं?',
        html: `
          <div style="text-align: left; font-size: 13px; line-height: 1.6; color: #374151;">
            <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 10px 12px; border-radius: 6px; margin-bottom: 12px;">
              <strong style="color: #991b1b; display: block; font-size: 14px;">कस्टमर: ${fullName} ${memberId ? '(' + memberId + ')' : ''}</strong>
              <span style="font-size: 12px; color: #6b7280;">मोबाइल: ${mobileNo || '—'} • यूजर ID: #${pkVal}</span>
            </div>

            <div style="margin-bottom: 12px;">
              <strong style="color: #111827; font-size: 13px; display: block; margin-bottom: 4px;">
                🟢 सिस्टम पर क्या-क्या प्रभाव पड़ेगा (Rollback & Reset):
              </strong>
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>प्लॉट स्टेटस (Rollback):</strong> इस ग्राहक द्वारा बुक किया गया प्लॉट तुरंत <strong>'Vacant' (हरा / Green)</strong> हो जाएगा और दोबारा बुकिंग के लिए लाइव खुल जाएगा।</li>
                <li><strong>बुकिंग और इनवॉइस:</strong> इसके सभी ऑर्डर्स, बिल/इनवॉइस, EMI किश्तें व पेमेंट प्रूफ हमेशा के लिए हट जाएंगे।</li>
                <li><strong>कमीशन व वॉलेट:</strong> इस बुकिंग से जुड़े कमीशन रिकॉर्ड्स और पेमेंट्स पूरी तरह साफ हो जाएंगे।</li>
                <li><strong>KYC व प्रोफाइल:</strong> कस्टमर का एनरोलमेंट फॉर्म, नॉमिनी, आधार/पैन डॉक्यूमेंट्स व वॉलेट लेजर डिलीट हो जाएंगे।</li>
              </ul>
            </div>

            <div style="background: #f3f4f6; padding: 8px 12px; border-radius: 6px; font-family: monospace; font-size: 11px; color: #4b5563;">
              <strong style="color: #1f2937;">प्रभावित डेटाबेस टेबल्स:</strong><br>
              <code>bookings</code>, <code>plots (Status → Vacant)</code>, <code>invoices</code>, <code>booking_invoices</code>, <code>booking_payment_proofs</code>, <code>emi_schedules</code>, <code>commission_transactions</code>, <code>customer_enrollment_submissions</code>, <code>user_documents</code>, <code>user_wallets</code>, <code>users</code>
            </div>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: '<i class="fas fa-trash-alt me-1"></i> हाँ, डिलीट और रोलबैक करें',
        cancelButtonText: 'रद्द करें',
        reverseButtons: true,
        focusCancel: true
      }).then((res) => {
        if (res.isConfirmed) {
          this.performConfirmedDelete(pkVal);
        }
      });
      return;
    }

    // ─────────────────────────────────────────────────────────────
    // 👥 3. TEAM MEMBER DELETION ALERT (REMOVE MEMBER & ATTRIBUTED BOOKINGS)
    // ─────────────────────────────────────────────────────────────
    if (userType === 'Team Member' || currentEntity === 'team_member' || currentTable === 'team_members') {
      Swal.fire({
        title: '⚠️ टीम मेंबर और संबंधित डेटा डिलीट करें?',
        html: `
          <div style="text-align: left; font-size: 13px; line-height: 1.6; color: #374151;">
            <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 10px 12px; border-radius: 6px; margin-bottom: 12px;">
              <strong style="color: #991b1b; display: block; font-size: 14px;">टीम मेंबर: ${fullName} ${memberId ? '(' + memberId + ')' : ''}</strong>
              <span style="font-size: 12px; color: #6b7280;">मोबाइल: ${mobileNo || '—'} • ID: #${pkVal}</span>
            </div>

            <div style="margin-bottom: 12px;">
              <strong style="color: #111827; font-size: 13px; display: block; margin-bottom: 4px;">
                🟢 सिस्टम पर क्या-क्या प्रभाव पड़ेगा:
              </strong>
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>प्लॉट स्टेटस (Rollback):</strong> इसके या इसके द्वारा जोड़े गए कस्टमर्स के प्लॉट दोबारा <strong>'Vacant' (हरा / Green)</strong> होकर उपलब्ध हो जाएंगे।</li>
                <li><strong>कस्टमर्स और बुकिंग्स:</strong> इस टीम मेंबर द्वारा रेफर किए गए कस्टमर्स, उनकी बुकिंग्स और इनवॉइस हटा दिए जाएंगे।</li>
                <li><strong>फाइलें और हस्ताक्षर:</strong> अपलोड की गई फोटो, आवेदक हस्ताक्षर, एसोसिएट हस्ताक्षर और KYC फाइल्स हट जाएंगी।</li>
                <li><strong>रजिस्ट्री से हटाना:</strong> <code>team_members</code> स्लॉट और <code>users</code> अकाउंट से यह मेंबर पूरी तरह हट जाएगा।</li>
              </ul>
            </div>

            <div style="background: #f3f4f6; padding: 8px 12px; border-radius: 6px; font-family: monospace; font-size: 11px; color: #4b5563;">
              <strong style="color: #1f2937;">प्रभावित डेटाबेस टेबल्स:</strong><br>
              <code>team_members</code>, <code>bookings</code>, <code>plots (Status → Vacant)</code>, <code>invoices</code>, <code>customer_enrollment_submissions</code>, <code>commission_transactions</code>, <code>user_documents</code>, <code>users</code>
            </div>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: '<i class="fas fa-trash-alt me-1"></i> हाँ, पूरी तरह रिमूव करें',
        cancelButtonText: 'रद्द करें',
        reverseButtons: true,
        focusCancel: true
      }).then((res) => {
        if (res.isConfirmed) {
          this.performConfirmedDelete(pkVal);
        }
      });
      return;
    }

    // ─────────────────────────────────────────────────────────────
    // 🤝 4. ASSOCIATE DELETION ALERT (EXCEPT SURAJ KUMAR VERMA)
    // ─────────────────────────────────────────────────────────────
    if (userType === 'Associate' || currentEntity === 'associate') {
      Swal.fire({
        title: '⚠️ एसोसिएट और उसकी पूरी डाउनलाइन डिलीट करें?',
        html: `
          <div style="text-align: left; font-size: 13px; line-height: 1.6; color: #374151;">
            <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 10px 12px; border-radius: 6px; margin-bottom: 12px;">
              <strong style="color: #991b1b; display: block; font-size: 14px;">एसोसिएट: ${fullName} ${memberId ? '(' + memberId + ')' : ''}</strong>
              <span style="font-size: 12px; color: #6b7280;">मोबाइल: ${mobileNo || '—'} • यूजर ID: #${pkVal}</span>
            </div>

            <div style="margin-bottom: 12px;">
              <strong style="color: #111827; font-size: 13px; display: block; margin-bottom: 4px;">
                🟢 सिस्टम पर क्या-क्या प्रभाव पड़ेगा:
              </strong>
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>प्लॉट स्टेटस (Rollback):</strong> इस एसोसिएट व इसकी टीम द्वारा बुक सभी प्लॉट वापस <strong>'Vacant' (हरा / Green)</strong> हो जाएंगे।</li>
                <li><strong>MLM ट्री व डाउनलाइन:</strong> इसके नीचे जुड़े टीम मेंबर्स, कस्टमर्स और नेटवर्क ट्री लिंक्स पूरी तरह साफ हो जाएंगे।</li>
                <li><strong>कमीशन व वॉलेट:</strong> सेल्स ट्रैकर, पेआउट रिक्वेस्ट्स, रेफरल लिंक्स और वॉलेट्स हटा दिए जाएंगे।</li>
              </ul>
            </div>

            <div style="background: #f3f4f6; padding: 8px 12px; border-radius: 6px; font-family: monospace; font-size: 11px; color: #4b5563;">
              <strong style="color: #1f2937;">प्रभावित डेटाबेस टेबल्स:</strong><br>
              <code>users</code>, <code>team_members</code>, <code>bookings</code>, <code>plots (Status → Vacant)</code>, <code>mlm_network</code>, <code>mlm_tree_closure</code>, <code>associate_sales_tracker</code>, <code>commission_transactions</code>
            </div>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: '<i class="fas fa-trash-alt me-1"></i> हाँ, एसोसिएट व डाउनलाइन हटाएं',
        cancelButtonText: 'रद्द करें',
        reverseButtons: true,
        focusCancel: true
      }).then((res) => {
        if (res.isConfirmed) {
          this.performConfirmedDelete(pkVal);
        }
      });
      return;
    }

    // ─────────────────────────────────────────────────────────────
    // 🗺️ 5. PLOT BOOKINGS TABLE ALERT
    // ─────────────────────────────────────────────────────────────
    if (currentTable === 'bookings') {
      const bSerial = row['booking_serial'] || `ID #${pkVal}`;
      const plotNum = row['plot_number'] || row['plot_id'] || '';
      Swal.fire({
        title: '⚠️ प्लॉट बुकिंग ऑर्डर डिलीट करें?',
        html: `
          <div style="text-align: left; font-size: 13px; line-height: 1.6; color: #374151;">
            <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 10px 12px; border-radius: 6px; margin-bottom: 12px;">
              <strong style="color: #991b1b; display: block; font-size: 14px;">बुकिंग: #${bSerial} ${plotNum ? '(Plot ' + plotNum + ')' : ''}</strong>
              <span style="font-size: 12px; color: #6b7280;">बुकिंग ID: #${pkVal}</span>
            </div>
            <div style="margin-bottom: 12px;">
              <strong style="color: #111827; font-size: 13px; display: block; margin-bottom: 4px;">🟢 सिस्टम पर क्या प्रभाव पड़ेगा:</strong>
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>प्लॉट स्टेटस (Green):</strong> यह प्लॉट तुरंत <strong>'Vacant' (हरा)</strong> हो जाएगा और दोबारा नई बुकिंग के लिए तुरंत उपलब्ध हो जाएगा।</li>
                <li><strong>इनवॉइस व EMI:</strong> इस बुकिंग का इनवॉइस, EMI शेड्यूल, पेमेंट्स और कमीशन रिकॉर्ड्स स्थायी रूप से हट जाएंगे।</li>
              </ul>
            </div>
            <div style="background: #f3f4f6; padding: 8px 12px; border-radius: 6px; font-family: monospace; font-size: 11px; color: #4b5563;">
              <strong>प्रभावित टेबल्स:</strong><br>
              <code>bookings</code>, <code>plots (Status → Vacant)</code>, <code>invoices</code>, <code>booking_invoices</code>, <code>emi_schedules</code>, <code>commission_transactions</code>
            </div>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: '<i class="fas fa-trash-alt me-1"></i> हाँ, बुकिंग हटाएं और प्लॉट ग्रीन करें',
        cancelButtonText: 'रद्द करें',
        reverseButtons: true,
        focusCancel: true
      }).then((res) => {
        if (res.isConfirmed) {
          this.performConfirmedDelete(pkVal);
        }
      });
      return;
    }

    // ─────────────────────────────────────────────────────────────
    // ⚙️ 6. ALL OTHER MASTER TABLES (GENERIC CASCADE ALERT)
    // ─────────────────────────────────────────────────────────────
    Swal.fire({
      title: `टेबल "${this.selectedTable}" से रिकॉर्ड #${pkVal} हटाएं?`,
      html: `
        <div style="text-align: left; font-size: 13px; line-height: 1.6; color: #374151;">
          <p style="margin-bottom: 8px;">क्या आप इस रिकॉर्ड और इससे जुड़े सभी चाइल्ड रिकॉर्ड्स को स्थायी रूप से हटाना चाहते हैं?</p>
          <div style="background: #f3f4f6; padding: 8px 12px; border-radius: 6px; font-family: monospace; font-size: 11px; color: #4b5563;">
            टेबल: <strong>${this.selectedTable}</strong> • ${this.primaryKey} = <strong>${pkVal}</strong>
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'हाँ, डिलीट करें',
      cancelButtonText: 'रद्द करें',
      reverseButtons: true
    }).then((res) => {
      if (res.isConfirmed) {
        this.performConfirmedDelete(pkVal);
      }
    });
  }

  // ── 6. EXECUTE CONFIRMED DELETE WITH SWEETALERT PROGRESS & FEEDBACK ─
  performConfirmedDelete(pkVal: any): void {
    Swal.fire({
      title: 'डेटा डिलीट हो रहा है...',
      html: '<p style="font-size: 13px; color: #6b7280; margin: 0;">कृपया प्रतीक्षा करें, संबंधित रिकॉर्ड्स हटाए जा रहे हैं और प्लॉट स्टेटस रीसेट हो रहा है...</p>',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Only enable cascade for curated user/member/booking tables that have dedicated rollback transactions.
    // For arbitrary master tables, disable cascade to prevent cross-table foreign key deletions.
    const isCuratedTable = ['users', 'team_members', 'bookings'].includes((this.selectedTable || '').toLowerCase());
    this.api.adminDeleteMasterRecord(this.selectedTable, pkVal, isCuratedTable, this.primaryKey).subscribe({
      next: (res: any) => {
        const msg = res?.message || `रिकॉर्ड #${pkVal} सफलतापूर्वक डिलीट कर दिया गया है।`;
        Swal.fire({
          icon: 'success',
          title: 'सफलतापूर्वक हटाया गया!',
          html: `<p style="font-size: 13.5px; color: #374151; line-height: 1.5; margin: 0;">${msg}</p>`,
          confirmButtonColor: '#10b981',
          confirmButtonText: 'ठीक है'
        });
        this.loadTableData(this.selectedTable, this.currentPage);
      },
      error: (err: any) => {
        const errMsg = err?.error?.message || err?.message || 'रिकॉर्ड डिलीट करने में त्रुटि आई।';
        Swal.fire({
          icon: 'error',
          title: 'डिलीशन विफल!',
          html: `<p style="font-size: 13.5px; color: #ef4444; line-height: 1.5; margin: 0;">${errMsg}</p>`,
          confirmButtonColor: '#ef4444',
          confirmButtonText: 'बंद करें'
        });
      }
    });
  }

  // Legacy modal close helper
  closeDeleteModal(): void {
    document.body.classList.remove('has-active-modal');
    this.isDeleteModalOpen = false;
    this.deletingRecordId = null;
    this.deletingRecordSummary = '';
    this.forceCascadeDelete = true;
  }

  executeDelete(): void {
    if (this.deletingRecordId) {
      this.closeDeleteModal();
      this.performConfirmedDelete(this.deletingRecordId);
    }
  }

  // Restore default sliders & investors if cleared
  restoreSystemDefaults(): void {
    Swal.fire({
      title: 'डिफ़ॉल्ट सिस्टम डेटा रीस्टोर करें?',
      html: '<p style="font-size: 13px; color: #4b5563; line-height: 1.5;">यदि होमपेज के डिफॉल्ट स्लाइडर्स या इन्वेस्टर प्रोफाइल हट गए हैं, तो यह उन्हें सुरक्षित रूप से डेटाबेस में वापस रीस्टोर कर देगा। क्या आप आगे बढ़ना चाहते हैं?</p>',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'हाँ, रीस्टोर करें',
      cancelButtonText: 'रद्द करें'
    }).then((res) => {
      if (res.isConfirmed) {
        Swal.fire({
          title: 'डेटा रीस्टोर हो रहा है...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });
        this.api.post('/api/admin/master-data/restore-system-defaults', {}, true).subscribe({
          next: (resp: any) => {
            Swal.fire({
              icon: 'success',
              title: 'सफलतापूर्वक रीस्टोर किया गया!',
              text: resp?.message || 'डिफ़ॉल्ट सिस्टम डेटा सफलतापूर्वक रीस्टोर हो गया है।',
              confirmButtonColor: '#10b981'
            });
            this.loadTableData(this.selectedTable, 1);
          },
          error: (err: any) => {
            Swal.fire({
              icon: 'error',
              title: 'रीस्टोर विफल',
              text: err?.error?.message || 'सिस्टम डेटा रीस्टोर नहीं हो सका।'
            });
          }
        });
      }
    });
  }

  ngOnDestroy(): void {
    document.body.classList.remove('has-active-modal');
  }


  // Helper for UI notifications
  showToast(type: 'success' | 'danger', msg: string): void {
    if (type === 'success') {
      this.successMessage = msg;
      setTimeout(() => this.successMessage = '', 4500);
    } else {
      this.errorMessage = msg;
    }
  }

  // Helper to format cell values cleanly in table
  formatCell(row: any, col: TableColumn): string {
    const colName = (col.name || '').toLowerCase();
    if (colName === 'file_data' || colName === 'payment_screenshot_data') {
      return '📁 [Binary File]';
    }
    const val = row[col.name];
    if (val === null || val === undefined) return '—';
    if (typeof val === 'boolean') return val ? '✓ True' : '✗ False';
    if (colName.includes('password') || colName.includes('hash')) return '••••••••';
    if (typeof val === 'object') {
      if (val && (val.type === 'Buffer' || Array.isArray(val.data))) {
        return '📁 [Binary Buffer]';
      }
      return JSON.stringify(val);
    }
    const str = String(val);
    return str.length > 50 ? str.slice(0, 47) + '...' : str;
  }

  isPill(colName: string): boolean {
    const c = colName.toLowerCase();
    return c.includes('status') || c.includes('role') || c.includes('type');
  }

  getPillClass(val: any): string {
    const s = String(val || '').toLowerCase();
    if (s.includes('active') || s.includes('approved') || s.includes('success') || s.includes('true')) return 'pill-success';
    if (s.includes('pending') || s.includes('hold') || s.includes('inquiry')) return 'pill-warning';
    if (s.includes('reject') || s.includes('suspend') || s.includes('block') || s.includes('false')) return 'pill-danger';
    return 'pill-info';
  }

  // ── FORM HELPERS FOR EDIT MODAL ──────────────────────────────────
  formatColLabel(name: string): string {
    if (!name) return '';
    const acronyms: Record<string, string> = {
      id: 'ID',
      uid: 'UID',
      pk: 'PK',
      kyc: 'KYC',
      dob: 'DOB',
      pan: 'PAN',
      ifsc: 'IFSC',
      url: 'URL',
      emi: 'EMI',
      otp: 'OTP'
    };
    return name
      .split('_')
      .map(part => acronyms[part.toLowerCase()] || (part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()))
      .join(' ');
  }

  getSimplifiedType(rawType: string): string {
    const t = (rawType || '').toLowerCase();
    if (t.includes('int')) return 'Integer';
    if (t.includes('numeric') || t.includes('decimal') || t.includes('double') || t.includes('real')) return 'Decimal';
    if (t.includes('timestamp')) return 'DateTime';
    if (t === 'date') return 'Date';
    if (t.includes('bool')) return 'Boolean';
    if (t.includes('json')) return 'JSON';
    if (t.includes('char') || t.includes('text')) return 'Text';
    if (t.includes('user-defined')) return 'Custom';
    return rawType || 'Text';
  }

  getTypeBadgeClass(rawType: string): string {
    const t = (rawType || '').toLowerCase();
    if (t.includes('int') || t.includes('numeric')) return 'type-number';
    if (t.includes('time') || t.includes('date')) return 'type-date';
    if (t.includes('bool')) return 'type-bool';
    if (t.includes('json')) return 'type-json';
    return 'type-text';
  }

  isTextArea(colName: string, rawType: string): boolean {
    const n = (colName || '').toLowerCase();
    const t = (rawType || '').toLowerCase();
    return t.includes('json') || n.includes('address') || n.includes('description') || n.includes('remarks') || n.includes('notes') || n.includes('details');
  }

  isSelectField(colName: string): boolean {
    const n = (colName || '').toLowerCase();
    return ['user_type', 'gender', 'status', 'user_role', 'role'].includes(n);
  }

  getSelectOptions(colName: string): string[] {
    const n = (colName || '').toLowerCase();
    if (n === 'gender') return ['Male', 'Female', 'Other'];
    if (n === 'user_type') return ['Associate', 'Team Member', 'Customer', 'Investor', 'Admin', 'SuperAdmin'];
    if (n === 'user_role') return ['Associate', 'Team Member', 'Customer', 'Investor', 'Admin'];
    if (n === 'status') return ['Active', 'Pending', 'Approved', 'Rejected', 'Hold', 'Inactive'];
    return [];
  }
}
