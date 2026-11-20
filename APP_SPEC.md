# MMR CONSTRUCTIONS & DEVELOPERS — MASTER APPLICATION SPECIFICATION (`APP_SPEC.md`)

> **Document Status**: Production Complete Specification  
> **Master Reference Source**: `mmrconstructions-main` (Angular 17 Web Platform)  
> **Backend API**: `mmrconstructionsApi` (`https://api.mmrconstructions.in`)  
> **Target Mobile Implementation**: `mmr_constructionsApp` (Flutter / Cross-Platform Mobile)  
> **Purpose**: A comprehensive, 100% exhaustive technical blueprint detailing all architecture, routes, page behaviors, form validations, data tables, API endpoints, design tokens, business rules, and CAD plot mapping logic required to reconstruct an exact mobile replica without requiring direct source code inspection.

---

## 1. PROJECT OVERVIEW

### 1.1 Technical Stack & Core Packages
| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Framework** | Angular | `^17.3.0` | Modern Standalone Component Architecture with signal-ready RxJS streams |
| **Language** | TypeScript | `~5.4.2` | Strict typings across models, DTOs, and event payloads |
| **UI Framework** | Bootstrap + Custom CSS | `5.3.2` | Responsive grid, utilities, flex layouts with bespoke real estate stylesheets |
| **State Management** | NgRx + RxJS Services | `@ngrx/store ^17.2.0`, `rxjs ~7.8.0` | Global state, effect side-effects, behavior-subject auth services |
| **CAD / Vector Engine** | `dxf-parser` + Custom SVG/Canvas | `^1.1.2` | AutoCAD DXF blueprint parsing, polygon rendering, interactive plot coordinate detection |
| **Icons & Typography** | FontAwesome 6/7 Free + Google Fonts | `@fortawesome/fontawesome-free ^7.2.0` | `Playfair Display`, `Inter`, `Poppins` typographic system |
| **Alerts & Modals** | SweetAlert2 | `^11.26.25` | Modern confirmation dialogs, success alerts, and validation toasts |
| **Backend & Hosting** | Node/Express + Firebase | `firebase ^12.12.0` | REST API, PostgreSQL database, Firebase Storage for documents & CDN hosting |

### 1.2 Architecture Pattern & Directory Structure
The platform utilizes **Angular 17 Standalone Components** with functional routing and lazy loading (`loadComponent` & `loadChildren`).

```
mmrconstructions-main/src/
├── app/
│   ├── admin/                      # Admin Executive ERP Portal
│   │   ├── layout/                 # Admin sidebar, header, breadcrumbs
│   │   ├── dashboard/              # Executive KPI console & turnover metrics
│   │   ├── approvals/              # Multi-tier booking & KYC approval workflow
│   │   ├── booking-management/     # Plot orders & allocation queue
│   │   ├── booking-workflow/       # Stage-based booking transitions
│   │   ├── customers/              # Customer master directory
│   │   ├── associates/             # Associate directory & hierarchy
│   │   ├── team-members/           # Team member staff directory
│   │   ├── investor-enrollments/   # Investor applications & ledger
│   │   ├── sites-mgmt/             # Project sites manager
│   │   ├── plot-detector-tool/     # Interactive CAD / DXF plot vector detection
│   │   ├── plot-map-editor/        # Vector boundary manipulation & coordinates
│   │   ├── sales-map/              # Bird's eye visual plot availability map
│   │   ├── receipts/               # Payment vouchers, PDF invoice generator
│   │   ├── commissions/            # MLM commission plan settings & payout release
│   │   ├── wallet-transactions/    # Admin treasury & withdrawal approvals
│   │   ├── whatsapp/               # CRM WhatsApp gateway logs & broadcast
│   │   └── database-backup/        # On-demand SQL dumps & disaster recovery
│   ├── associate/                  # Associate Portal
│   │   ├── approvals/              # Team member booking approval queue
│   │   ├── team-sales/             # Downline sales attribution & velocity
│   │   └── team-member-enrollment/ # Downline team onboarding form
│   ├── investor/                   # Dedicated Investor Portal
│   │   ├── investor-layout/        # Top navigation & investor brand styling
│   │   ├── investor-dashboard/     # Capital metrics, returns, referral banner
│   │   ├── investor-wallet/        # Available liquid balance & fund logs
│   │   ├── investor-deposit/       # Capital infusion (Bank Transfer / UTR upload)
│   │   ├── investor-withdrawal/    # Payout request & ledger
│   │   ├── investor-settlement/    # ROI frequency configuration (Monthly/Annual)
│   │   └── investor-documents/     # Investor agreements & KYC compliance
│   ├── pages/                      # Public & Marketing Pages
│   │   ├── home/                   # Hero slider, 4 registration cards, EMI calculator
│   │   ├── all-sites/              # Filterable property catalogue
│   │   ├── login/                  # Multi-role unified authentication
│   │   ├── signup/                 # Role-specific registration (Customer/Assoc/TM/Inv)
│   │   ├── verify-otp/             # 6-Digit 2FA mobile verification
│   │   ├── forgot-password/        # Password recovery workflow
│   │   └── city-landing/           # Regional SEO corridors (Kanpur, Unnao, Lucknow)
│   ├── services/                   # Core Singleton Services & API
│   │   ├── api.service.ts          # Central HTTP client (765 lines, 100+ endpoints)
│   │   ├── auth.service.ts         # Multi-scope auth, midnight next-day auto logout
│   │   ├── auth.interceptor.ts     # Token injection (Admin / Investor / User scopes)
│   │   ├── booking-attribution.ts  # 3-Way attribution (Self / Direct / TM)
│   │   └── language.service.ts     # Bilingual Hindi/English translation strings
│   ├── shared/                     # Reusable UI Components
│   │   ├── book-plot/              # Universal plot booking engine (CAD Map driven)
│   │   ├── mlm-tree/               # Visual hierarchy genealogical network tree
│   │   ├── verified-badge/         # Trust tick indicator widget
│   │   └── upi-qr-payment/         # Dynamic UPI QR generator with copy UPI ID
│   ├── team-member/                # Team Member Sub-Role Portal
│   └── user/                       # Customer / General User Portal
```

---

## 2. ROUTES & NAVIGATION ARCHITECTURE

### 2.1 Complete Route Matrix

| Route Path | Component | Guard / Middleware | Access Level | Description |
|---|---|---|---|---|
| `/` | `HomeComponent` | None | Public | Landing homepage with hero sliders, trust strip, cards, and plots |
| `/login` | `LoginComponent` | None | Public | Multi-role phone/password or OTP login |
| `/register` | `SignupComponent` | None | Public | 4-Role selector hub |
| `/register/:role` | `SignupComponent` | None | Public | Role registration (`customer`, `associate`, `investor`, `team-member`) |
| `/verify-otp` | `VerifyOtpComponent` | None | Public | 6-Digit OTP verification with auto countdown |
| `/forgot-password` | `ForgotPasswordComponent` | None | Public | Mobile recovery & PIN reset |
| `/admin-login` | `AdminLoginComponent` | None | Public | Executive console credentials form |
| `/investor-login` | `LoginComponent` | None | Public | Direct investor sign-in entry |
| `/investors` | `AllInvestorsComponent` | None | Public | Investor showcase & returns explanation |
| `/sites` / `/all-sites` | `AllSitesComponent` | None | Public | Interactive project gallery with real-time plot stats |
| `/invoice/:id` | `BookingInvoiceComponent` | None | Public / Auth | Printable customer property voucher |
| `/property-dealer-in-:city` | `CityLandingComponent` | None | Public | Local SEO landing for 7 regional corridors |
| `/investor/dashboard` | `InvestorDashboardComponent` | `investorGuard` | Investor | Investor portfolio overview & metrics |
| `/investor/wallet` | `InvestorWalletComponent` | `investorGuard` | Investor | Liquid balance & transaction history |
| `/investor/deposit` | `InvestorDepositComponent` | `investorGuard` | Investor | Bank transfer capital deposit & UTR slip upload |
| `/investor/withdrawal` | `InvestorWithdrawalComponent` | `investorGuard` | Investor | Fund withdrawal request submission |
| `/investor/settlement` | `InvestorSettlementComponent` | `investorGuard` | Investor | Payout ROI frequency settings |
| `/investor/documents` | `InvestorDocumentsComponent` | `investorGuard` | Investor | KYC ID, Pan card & signed agreement upload |
| `/investor/profile` | `InvestorProfileComponent` | `investorGuard` | Investor | Profile settings & payout bank details |
| `/customer/dashboard` | `UserDashboardComponent` | `customerGuard` | Customer | Customer plot allocations & active EMIs |
| `/customer/my-plots` | `MyPlotsComponent` | `customerGuard` | Customer | Allocated plots, possession status, documents |
| `/customer/book-plot` | `BookPlotComponent` | `customerGuard` | Customer | CAD map-driven plot booking |
| `/customer/emi-history` | `EmiHistoryComponent` | `customerGuard` | Customer | Monthly installment schedule, due dates, payments |
| `/customer/documents` | `DocumentsComponent` | `customerGuard` | Customer | Aadhaar, PAN & Bank passbook KYC verification |
| `/customer/enrollment` | `CustomerEnrollmentComponent` | `userGuard` | Customer | Detailed KYC & legal applicant onboarding form |
| `/associate/dashboard` | `UserDashboardComponent` | `associateGuard` | Associate | Sales metrics, commission ledger, referral hub |
| `/associate/network-tree` | `MlmTreeComponent` | `associateGuard` | Associate | Visual multi-level downline genealogy tree |
| `/associate/commission` | `CommissionTrackerComponent`| `associateGuard` | Associate | Level-by-level commission breakdown & payout logs |
| `/associate/team-sales` | `AssociateTeamSalesComponent`| `associateGuard` | Associate | Attributed team bookings & sales volume |
| `/associate/approvals` | `AssociateApprovalsComponent`| `associateGuard` | Associate | First-line booking approval queue |
| `/associate/team-member-enrollment` | `TeamMemberEnrollmentComponent` | `associateGuard` | Associate | Onboard downline team member with direct password rules |
| `/team-member/dashboard` | `TeamMemberDashboardComponent`| `teamMemberGuard` | Team Member | Attributed customer sales, personal commission |
| `/team-member/customers` | `TeamMemberCustomersComponent`| `teamMemberGuard` | Team Member | List of attributed customers & verification status |
| `/team-member/book-plot` | `BookPlotComponent` | `teamMemberGuard` | Team Member | Map-based booking on behalf of assigned customers |
| `/admin/dashboard` | `AdminDashboardComponent` | `adminGuard` | SuperAdmin | Executive ERP dashboard, live turnover, inventory |
| `/admin/approvals` | `ApprovalsComponent` | `adminGuard` | SuperAdmin | Universal approval queue (Bookings, KYC, Withdrawals) |
| `/admin/booking-management`| `AdminBookingManagementComponent`| `adminGuard`| SuperAdmin | Comprehensive plot booking state machine |
| `/admin/booking-workflow` | `AdminBookingWorkflowComponent` | `adminGuard`| SuperAdmin | 5-stage booking transition tracker |
| `/admin/sites` | `SitesMgmtComponent` | `adminGuard` | SuperAdmin | Project sites, layout plan uploads, pricing rules |
| `/admin/plot-detector-tool`| `PlotDetectorToolComponent` | `adminGuard` | SuperAdmin | CAD Blueprint polygon vector detection engine |
| `/admin/plot-map-editor` | `PlotMapEditorComponent` | `adminGuard` | SuperAdmin | Drag-and-drop plot coordinate boundary editor |
| `/admin/sales-map` | `AdminSalesMapComponent` | `adminGuard` | SuperAdmin | Live interactive site occupancy overview |
| `/admin/receipts` | `AdminReceiptsComponent` | `adminGuard` | SuperAdmin | Financial receipt ledger & PDF generator |
| `/admin/commissions` | `AdminCommissionsComponent` | `adminGuard` | SuperAdmin | MLM commission batch approvals & disbursements |
| `/admin/withdrawal-requests`| `AdminWithdrawalRequestsComponent`| `adminGuard`| SuperAdmin | Treasury fund payout approvals |
| `/admin/control` | `AdminControlComponent` | `adminGuard` | SuperAdmin | Platform feature toggles & maintenance switches |

---

## 3. PAGE-BY-PAGE DETAILED SPECIFICATIONS

### 3.1 Public Landing Page (`/`)
- **Header**: Top contact strip (`+91 8299209905`, `info@mmrconstructions.in`), bilingual language toggle (English / Hindi), Login / Portal button.
- **Hero Slider**: Auto-rotating promotional banner displaying current offers (e.g. "25% Discount on Lucknow Site", "Buyback Guarantee 1.4X", "Earn 10.5 Lacs/Month").
- **Information Trust Strip**: CIN (`U68200UP2025PTC229203`), GSTIN (`09AATCM6753A1Z5`), Bank Approved, 100% Clear Title.
- **4-Role Registration Cards**: 
  - Customer Card (`/register/customer`): Buy Plots, Flexible EMI.
  - Associate Card (`/register/associate`): 12-Year Commission Flow, MLM Tree.
  - Team Member Card (`/register/team-member`): Direct Onboarding, Attributed Sales.
  - Investor Card (`/register/investor`): Guaranteed ROI, Fixed Capital Returns.
- **Interactive EMI Calculator**:
  - Inputs: Plot Area (Gaj) slider/input, Total Price (auto-computes at ₹5,000/Gaj default), Tenure (12 to 60 Months).
  - Formulas: Down Payment = ₹50,000 + (Area × ₹1,000); Monthly EMI = (Total Price - Down Payment) / Tenure.
- **Featured Sites Carousel**: Displays 5 flagship projects (e.g., Green Valley, Royal City) with Available / Sold plot counters.

---

### 3.2 Authentication & OTP Verification (`/login`, `/register`, `/verify-otp`)
- **Login Screen**:
  - Fields: Mobile Number (10 digits, numeric), Password (obscured with eye toggle) OR Login via OTP button.
  - Validations: Mobile must match `/^[6-9]\d{9}$/`.
  - Actions: Submit checks credentials, issues JWT token and role metadata (`Customer`, `Associate`, `Team Member`, `Investor`, `SuperAdmin`).
- **Registration Screen**:
  - Fields: Full Name, 10-Digit Mobile, Email Address, Password, Confirm Password, Sponsor Referral Code (auto-populated with `MMR-ASC-0001` if empty, hidden for Investor).
  - Checkboxes: Terms & Conditions and Privacy Policy (must default to **CHECKED** `true`).
  - Actions: Emits 6-digit OTP via SMS gateway, redirects to `/verify-otp`.
- **OTP Screen**:
  - 6 individual digit input boxes with auto-focus advance and backspace reverse.
  - 60-second resend countdown timer.

---

### 3.3 Investor Portal (`/investor/*`)
- **Investor Dashboard (`/investor/dashboard`)**:
  - **4-Card Metric Grid (Compact 2x2 layout)**:
    1. `WALLET BALANCE`: Available liquid capital, with quick `+ Add Fund` and `↑ Withdraw` action links.
    2. `TOTAL INVESTMENT`: Capital deposited into projects.
    3. `TOTAL EARNINGS`: Disbursed settlement profits & yield earned.
    4. `TOTAL WITHDRAWALS`: Approved payouts processed to verified bank.
  - **Referral Banner**: Displays unique Investor Referral Code, 1-click Copy Link button, and direct Share on WhatsApp button.
  - **Settlement Schedule Card**: Shows payout frequency (`Monthly`, `Quarterly`, `Annual`).
  - **Recent Transactions Ledger**: Displays last 5 transactions with Date, Transaction ID, Type (Credit/Debit), Amount, Method, and Status Badge (`Approved`, `Pending`, `Rejected`).
- **Investor Deposit (`/investor/deposit`)**:
  - Form: Deposit Amount (min ₹10,000), Payment Mode (`Bank Transfer / NEFT`, `UPI`, `Cheque`), Transaction Reference / UTR Number, Screenshot File Attachment.
  - Displays official Company Bank Details (Bank Name: HDFC Bank, Account Name: M.M.R. Constructions & Developers Pvt. Ltd., Account Number, IFSC, UPI ID).
- **Investor Withdrawal (`/investor/withdrawal`)**:
  - Form: Amount (must be ≤ Available Wallet Balance, min ₹1,000), Payout Bank selection, Remarks.

---

### 3.4 Plot Booking Engine (`/customer/book-plot`, `/associate/book-plot`, `/team-member/book-plot`)
> **CRITICAL ARCHITECTURAL RULE**: Plot selection MUST be strictly map-based CAD polygon selection. Dropdown selection of plot numbers is prohibited.

- **Booking Flow**:
  1. **Select Project Site**: Dropdown of active sites (Kanpur, Unnao, Lucknow).
  2. **Interactive CAD Blueprint Stage**:
     - Visual canvas/SVG blueprint of the project site.
     - Vectors color-coded by real-time status:
       * **Green (`#16A34A`)**: Available (Tappable).
       * **Red (`#DC2626`)**: Booked / Sold (Non-tappable, shows sold tooltip).
       * **Yellow (`#D97706`)**: On Hold / Reservation.
       * **Blue (`#2563EB`)**: In Process.
     - Features: Pinch-to-zoom, 2-finger pan, reset zoom button.
     - Tapping a green plot highlights it with an emerald pulse and selects it.
  3. **Selected Plot Summary Card**:
     - Plot Number, Dimensions, Area in Sq.Ft and Gaj.
     - Rate per Sq.Ft, Total Valuation.
     - "Change Plot (CAD Map)" button to pick another plot.
  4. **Attribution Selector (Associate / Team Member only)**:
     - Associate: Booking Target Mode (`Direct Customer`, `Team Member Customer`, `Self`).
     - Search & select customer or "Add New Customer" modal.
  5. **Payment Scheme**:
     - Scheme Chips: `Full Payment`, `Part Payment`, `EMI Installment`.
     - Advance Booking Amount (min ₹10,000).
     - Payment Method: `Bank Transfer / NEFT`, `UPI QR Code`, `Payment Gateway`.
     - When UPI QR is chosen, renders dynamic QR code with exact amount and 1-tap copyable UPI ID.

---

### 3.5 Associate MLM Tree & Commission Tracker (`/associate/*`)
- **Network Tree (`/associate/network-tree`)**:
  - Visual hierarchical tree showing direct referrals (Level 1) and sub-referrals (Level 2+).
  - Node Details: Member ID, Full Name, Join Date, Status (`Active`/`Inactive`), Personal Business Volume (PBV), Team Business Volume (TBV).
  - Tapping a node expands downline branches smoothly.
- **Commission Tracker (`/associate/commission`)**:
  - Metrics: Total Earned, Available Commission Balance, TDS Deducted (5%), Net Disbursed.
  - Table Columns: Date, Source Booking #, Customer Name, Plot Details, Level (Direct / Downline L1-L5), Rate %, Gross Amount, TDS, Net Payable, Payout Status.

---

### 3.6 Admin Executive Console (`/admin/*`)
- **Dashboard (`/admin/dashboard`)**:
  - Executive Cards: Total Lifetime Turnover, Total Booked Units, Available Plot Inventory, Total Verified Associates, Pending Approval Queue.
- **Universal Approvals Queue (`/admin/approvals`)**:
  - Tabs: `Bookings (X)`, `KYC Documents (Y)`, `Withdrawals (Z)`.
  - Actions: 1-click Approve with confirmation dialog, Reject with mandatory reason input modal.
- **Plot Detector & Map Editor (`/admin/plot-detector-tool`, `/admin/plot-map-editor`)**:
  - Allows uploading a CAD DXF or high-resolution layout PNG.
  - Detects closed polygonal loops and generates JSON coordinates `[{x, y}]`.
  - Allows assigning plot numbers, areas, rates, and baseline orientation.
- **Receipts Generator (`/admin/receipts/create`)**:
  - Search booking by ID or customer name.
  - Select installment or milestone.
  - Generates downloadable official PDF receipt with company seal, QR verification code, and legal disclaimer.

---

## 4. API LAYER & DATA CONTRACTS

### 4.1 Base Configuration
- **Base URL**: `https://api.mmrconstructions.in`
- **Headers**:
  ```http
  Content-Type: application/json
  Authorization: Bearer <JWT_TOKEN>
  ```

### 4.2 Comprehensive Endpoint Directory

#### Authentication & Profiles
| Method | Endpoint | Request Body | Response Shape |
|---|---|---|---|
| `POST` | `/api/auth/login` | `{ mobile_number, password, otp_code }` | `{ success: true, token, user: { user_id, member_id, role, full_name, email } }` |
| `POST` | `/api/auth/register` | `{ full_name, mobile_number, email, password, role, sponsor_code }` | `{ success: true, message: "OTP sent", user_id }` |
| `POST` | `/api/auth/verify-otp` | `{ user_id, otp_code }` | `{ success: true, token, user }` |
| `GET` | `/api/profile` | None | `{ success: true, data: { user_id, full_name, phone, email, kyc_status } }` |
| `PUT` | `/api/profile` | `{ full_name, email, address, city, nominee_name, nominee_relation }` | `{ success: true, message: "Profile updated" }` |
| `GET` | `/api/profile/documents`| None | `{ success: true, data: [ { document_id, document_type, file_path, is_verified, review_status } ] }` |
| `POST` | `/api/profile/upload-doc`| `FormData: { document: File, document_type: string }` | `{ success: true, message: "Document uploaded" }` |

#### Sites, CAD Maps & Plots
| Method | Endpoint | Request Body | Response Shape |
|---|---|---|---|
| `GET` | `/api/sites` | None | `{ success: true, data: [ { site_id, site_name, location, total_plots, available_plots, map_image_url } ] }` |
| `GET` | `/api/sites/:id/plots` | Query: `{ status, search }` | `{ success: true, data: [ { plot_id, plot_number, plot_area, size_sqft, rate_per_sqft, total_price, status, polygon_coordinates } ] }` |
| `GET` | `/api/sites/:id/map` | None | `{ success: true, data: { layout_image_url, canvas_width, canvas_height, plots: [...] } }` |
| `POST` | `/api/admin/sites/:id/plot-map-config` | `{ canvas_width, canvas_height, plots: [...] }` | `{ success: true, message: "Map layout saved" }` |

#### Plot Booking & Attribution
| Method | Endpoint | Request Body | Response Shape |
|---|---|---|---|
| `POST` | `/api/booking/initiate` | `{ plot_id, site_id, payment_type, advance_amount, payment_method, buyer_type, customer_id, team_member_user_id }` | `{ success: true, booking_id, booking_serial, amount_due }` |
| `GET` | `/api/bookings` | None (User scoped) | `{ success: true, data: [ { booking_id, booking_serial, plot_number, site_name, advance_paid, status, booking_date } ] }` |
| `GET` | `/api/bookings/:id/detail`| None | `{ success: true, data: { booking, plot, payments, emi_schedule, documents } }` |
| `POST` | `/api/booking/:id/online/verify` | `{ razorpay_payment_id, razorpay_order_id, razorpay_signature }` | `{ success: true, message: "Payment verified" }` |

#### Investor Subsystem
| Method | Endpoint | Request Body | Response Shape |
|---|---|---|---|
| `GET` | `/api/investor/dashboard`| None | `{ success: true, data: { investor: {...}, summary: { available_balance, total_investment, total_earnings, total_withdrawals }, recent_transactions: [...] } }` |
| `GET` | `/api/investor/wallet` | None | `{ success: true, data: { current_balance, total_deposits, total_settlements, total_withdrawals } }` |
| `POST` | `/api/investor/deposits` | `FormData: { amount, payment_mode, reference_number, screenshot: File, remarks }` | `{ success: true, message: "Deposit submitted for review" }` |
| `POST` | `/api/investor/withdrawals`| `{ amount, bank_account_id, remarks }` | `{ success: true, message: "Withdrawal request submitted" }` |
| `GET` | `/api/investor/settlements`| None | `{ success: true, data: { frequency, payout_method, total_yield_credited } }` |
| `PUT` | `/api/investor/settlements/preference` | `{ frequency: "MONTHLY"|"QUARTERLY"|"YEARLY" }` | `{ success: true, message: "Settlement preference updated" }` |

#### Associate & MLM Network
| Method | Endpoint | Request Body | Response Shape |
|---|---|---|---|
| `GET` | `/api/associate/network/tree` | None | `{ success: true, data: { user_id, full_name, member_id, rank, children: [...] } }` |
| `GET` | `/api/associate/commissions` | Query: `{ date_from, date_to, status }` | `{ success: true, data: [ { commission_id, source_booking, level, gross_amount, tds, net_amount, status } ] }` |
| `GET` | `/api/associate/team-members` | None | `{ success: true, data: [ { user_id, member_id, full_name, phone, active_bookings, total_sales } ] }` |
| `POST` | `/api/associate/team-members` | `{ full_name, mobile_number, email, password, pan_number, aadhar_number }` | `{ success: true, message: "Team member enrolled" }` |

---

## 5. AUTHENTICATION, AUTHORIZATION & SESSION LIFECYCLE

### 5.1 Multi-Scope Token Management
The app uses 3 isolated token namespaces:
1. `mmr_admin_token` & `mmr_admin_user`: SuperAdmin console.
2. `mmr_investor_token` & `mmr_investor_user`: Investor portal.
3. `mmr_user_token` & `mmr_user`: Customer, Associate, and Team Member roles.

### 5.2 Next-Day Midnight Auto-Logout Policy
- Sessions expire at **00:00:00 (Midnight)** of the following day, regardless of inactivity.
- On every route navigation and app resume from background:
  ```typescript
  if (storedLoginDate !== getLocalDateString(new Date()) || Date.now() >= storedMidnightTimestamp) {
    performGracefulAutoLogout();
  }
  ```

### 5.3 Route Guard Hierarchy
- `adminGuard`: Checks `isAdminLoggedIn()` and role `SuperAdmin`.
- `investorGuard`: Checks `isInvestorLoggedIn()` and role `Investor`.
- `associateGuard`: Checks `isUserLoggedIn()` and role `Associate`.
- `teamMemberGuard`: Checks `isUserLoggedIn()` and role `Team Member`.
- `customerGuard`: Checks `isUserLoggedIn()` and role `Customer`.
- `enrollmentGuard`: Redirects user to `/enrollment` if KYC status is incomplete.

---

## 6. DESIGN SYSTEM & VISUAL TOKENS

### 6.1 Color Palette
```css
/* Core Brand Colors */
--clr-primary:       #1A5C3A; /* Forest Green - Primary Branding */
--clr-primary-lt:    #2E7D52; /* Emerald Green - Hover / Active */
--clr-primary-dk:    #0F3D27; /* Deep Pine - Headers & Hero Cards */
--clr-primary-bg:    #EAF4EE; /* Soft Tint - Badges & Light Cards */

/* Gold Luxury Accents */
--clr-gold:          #C9A84C; /* Warm Royal Gold - CTA Highlights */
--clr-gold-lt:       #E8C97A; /* Pale Gold - Card Accents & Borders */
--clr-gold-dk:       #7C5E10; /* Deep Antique Gold - Text on Light */
--clr-gold-bg:       #FDF8EC; /* Champagne Cream - Hero Backgrounds */

/* Plot & Operational Statuses */
--status-vacant:     #15803D; /* Green - Available Plot / Approved */
--status-booked:     #DC2626; /* Crimson Red - Sold Plot / Rejected */
--status-hold:       #D97706; /* Amber - Reserved Plot / Pending */
--status-process:    #2563EB; /* Royal Blue - Under Approval Process */

/* Neutral Surfaces & Typographic Slate */
--bg-page:           #FFFFFF;
--bg-surface-subtle: #F8F9FA;
--txt-heading:       #111827;
--txt-body:          #374151;
--txt-muted:         #6B7280;
--clr-border:        #E2E8F0;
```

### 6.2 Typography Specifications
- **Headings & Brand Title**: `Playfair Display`, serif (Font weight: `700`, `900`).
- **Body & Data Grid**: `Inter`, sans-serif (Font weights: `400` Regular, `500` Medium, `600` SemiBold, `700` Bold).
- **Navigation & Labels**: `Poppins`, sans-serif.

### 6.3 Elevation & Shadows
- Card standard: `box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);`
- Floating modal / Drawer: `box-shadow: 0 16px 56px rgba(0, 0, 0, 0.16);`
- Gold highlight: `box-shadow: 0 6px 24px rgba(201, 168, 76, 0.25);`
- Border Radius tokens: Cards (`14px` or `16px`), Buttons (`10px`), Badges & Pills (`9999px`).

---

## 7. SPECIALIZED BUSINESS LOGIC & SUBSYSTEMS

### 7.1 Interactive Vector Plot Engine (CAD / Blueprint)
1. **Coordinate Structure**: Plots are defined by normalized polygon vertices `[{x: number, y: number}, ...]`.
2. **Ray-Casting Algorithm**: When the user taps at coordinates `(tapX, tapY)`, the app casts a horizontal ray across polygon edges. If the number of edge crossings is odd, the point lies inside that plot polygon.
3. **Collision & Status Enforcement**: Tapping a Red (Sold) or Yellow (Hold) plot triggers an alert snackbar with its current status and prevents booking initiation.

### 7.2 Multi-Tier MLM Commission Computation
- Direct Associate earns primary booking commission (`X%` of plot base value).
- Upline Level 1 sponsor receives override (`Y%`).
- Standard Indian Tax Deduction: 5% Section 194H TDS deducted automatically on ledger credit.

### 7.3 Multi-Page PDF Voucher Engine
- 3-Page compact layout:
  - **Page 1**: Personal Identification, Passport Photo, Nominee Details (ensuring 6pt vertical separation to prevent photo/banner overlapping).
  - **Page 2**: Banking Details, Plot Identification, Pricing Matrix & Terms.
  - **Page 3**: Commission Schedule, Signatures, and Verified Legal Declaration.

---

## 8. MOBILE APP REPLICATION & UX ENHANCEMENTS

### 8.1 Key Mobile Transformations
1. **Interactive CAD Blueprint Touch Experience**:
   - Replace desktop mouse hover tooltips with a responsive **Bottom Sheet modal** showing plot number, area, rate, and a prominent "Confirm & Proceed to Booking" button upon tap.
2. **Bottom Navigation Architecture**:
   - 4 primary tabs: `Home`, `Projects & CAD`, `Wallet`, `Profile & KYC`.
3. **Camera & Gallery KYC Integration**:
   - Native camera trigger with crop preview for Aadhaar Card, PAN Card, and Bank Cheque.
4. **Biometric Security**:
   - Fingerprint / Face ID unlock replacing PIN re-entry on app resume.
5. **Offline Data Caching**:
   - Cache site metadata and plot layouts in SQLite / Hive so blueprints render instantly (0ms) even with spotty connectivity.

---
*End of Master Application Specification (`APP_SPEC.md`)*

