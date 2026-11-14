import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { PaymentService } from '../../services/payment.service';
import { RazorpayService } from '../../services/razorpay.service';
import { CashfreeService } from '../../services/cashfree.service';
import { BankDetailsComponent } from '../../shared/components/bank-details/bank-details.component';

@Component({
  selector: 'app-investor-deposit',
  standalone: true,
  imports: [CommonModule, FormsModule, BankDetailsComponent],
  templateUrl: './investor-deposit.component.html',
  styleUrls: ['./investor-deposit.component.css']
})
export class InvestorDepositComponent implements OnInit {
  deposits: any[] = [];
  loading = true;
  submitting = false;
  errorMessage = '';
  successMessage = '';

  form = {
    amount: null,
    payment_method: 'manual_upi',
    gateway: 'razorpay',
    transaction_reference: '',
    payment_screenshot_url: ''
  };

  // Payment methods: controlled dynamically by Admin Settings (enable_payment_gateway)
  paymentMethods: { value: string; label: string }[] = [
    { value: 'manual_upi', label: 'UPI Payment (QR Code / UPI ID)' },
    { value: 'bank_transfer', label: 'Bank Transfer (IMPS / NEFT / RTGS)' },
    { value: 'offline_cash', label: 'Cheque / DD / Cash (Office Deposit)' }
  ];
  onlineGatewayEnabled = false;

  // Active payment gateways from admin panel
  gateways: any[] = [];

  // Dynamic UPI QR configs fetched from backend
  activeQrs: any[] = [];
  selectedQrKey: string = 'qr1';
  companyUpiId = 'mmrconstructions@hdfcbank';
  companyQrUrl = '/assets/images/qr/mmr_qr1.png';
  companyQrLabel = 'Primary UPI QR (HDFC Bank)';
  copiedUpi = false;

  // Screenshot / Camera photo selection
  selectedScreenshot?: File;
  screenshotPreviewUrl: string = '';

  // Lightbox preview for deposit history
  previewDocUrl: string | null = null;

  constructor(
    public api: ApiService,
    private auth: AuthService,
    private paymentService: PaymentService,
    private razorpayService: RazorpayService,
    private cashfreeService: CashfreeService,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.checkUrlPaymentCallback();
    this.loadDeposits();
    this.loadActiveUpiQrs();
    this.loadActiveGateways();
    this.loadCompanyBankSettings();
  }

  checkUrlPaymentCallback() {
    if (typeof window === 'undefined') return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const status = urlParams.get('status');
      const orderId = urlParams.get('order_id');
      const gateway = urlParams.get('gateway') || 'online';
      const amount = urlParams.get('amount');
      const reason = urlParams.get('reason');

      if (status === 'success' && orderId) {
        this.successMessage = `Deposit${amount ? ' of ₹' + Number(amount).toLocaleString('en-IN') : ''} via ${gateway.toUpperCase()} verified and credited successfully!`;
        window.history.replaceState({}, document.title, window.location.pathname);
        this.loadDeposits();
      } else if (status === 'failed') {
        this.errorMessage = `Payment via ${gateway.toUpperCase()} failed: ${reason || 'Transaction could not be completed.'}`;
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (_) {}
  }

  loadCompanyBankSettings() {
    this.api.get('/api/payment/company-bank-details').subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.onlineGatewayEnabled = res.data.enable_payment_gateway === true;
          this.updatePaymentMethods();
        }
      },
      error: () => {}
    });
  }

  loadActiveGateways() {
    this.api.get('/api/payment/gateways').subscribe({
      next: (res: any) => {
        if (res.success && Array.isArray(res.data)) {
          this.gateways = res.data;
          if (this.gateways.length > 0) {
            const defaultGw = this.gateways.find((g: any) => g.is_default) || this.gateways[0];
            this.form.gateway = defaultGw.gateway_name || 'razorpay';
          }
          this.updatePaymentMethods();
        }
      },
      error: () => {}
    });
  }

  updatePaymentMethods() {
    const methods: { value: string; label: string }[] = [
      { value: 'manual_upi', label: 'UPI Payment (QR Code / UPI ID)' },
      { value: 'bank_transfer', label: 'Bank Transfer (IMPS / NEFT / RTGS)' },
      { value: 'offline_cash', label: 'Cheque / DD / Cash (Office Deposit)' }
    ];

    // Show "Pay Online" ONLY when the Admin Toggle is enabled AND active gateways exist
    if (this.onlineGatewayEnabled && this.gateways && this.gateways.length > 0) {
      const activeGwLabels = this.gateways
        .map((g: any) => g.display_name || (g.gateway_name ? g.gateway_name.toUpperCase() : ''))
        .filter(Boolean)
        .join(' / ');
      methods.push({
        value: 'online',
        label: `Pay Online (${activeGwLabels || 'Payment Gateway'})`
      });
    }

    this.paymentMethods = methods;

    // If online was previously selected but is now disabled, fallback safely to manual_upi
    if ((!this.onlineGatewayEnabled || !this.gateways || this.gateways.length === 0) && this.form.payment_method === 'online') {
      this.form.payment_method = 'manual_upi';
    }
  }

  loadActiveUpiQrs() {
    this.api.get('/api/payment/active-upi-qrs').subscribe({
      next: (res: any) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          this.activeQrs = res.data;
          const primary = res.data.find((q: any) => q.is_primary) || res.data[0];
          if (primary) {
            this.applyQrConfig(primary);
          }
        }
      },
      error: () => {}
    });
  }

  applyQrConfig(qr: any) {
    this.selectedQrKey = qr.qr_code_key || 'qr1';
    if (qr.upi_id) this.companyUpiId = qr.upi_id;
    if (qr.qr_image_url) this.companyQrUrl = this.api.getFileUrl(qr.qr_image_url);
    if (qr.label) this.companyQrLabel = qr.label;
  }

  selectQr(qr: any) {
    this.applyQrConfig(qr);
  }

  copyUpiId() {
    navigator.clipboard.writeText(this.companyUpiId).then(() => {
      this.copiedUpi = true;
      setTimeout(() => this.copiedUpi = false, 2500);
    }).catch(() => {});
  }

  loadDeposits() {
    this.loading = true;
    this.api.getInvestorDeposits().subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.deposits = res.data || [];
        }
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onScreenshotChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'फाइल 5 MB से कम होनी चाहिए (Screenshot/file must be 5 MB or less).';
      input.value = '';
      return;
    }

    this.selectedScreenshot = file;
    this.errorMessage = '';

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.screenshotPreviewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      this.screenshotPreviewUrl = '';
    }
  }

  clearScreenshot(cameraInput?: HTMLInputElement, fileInput?: HTMLInputElement) {
    this.selectedScreenshot = undefined;
    this.screenshotPreviewUrl = '';
    if (cameraInput) cameraInput.value = '';
    if (fileInput) fileInput.value = '';
  }

  submitDeposit() {
    if (!this.form.amount || Number(this.form.amount) <= 0) {
      this.errorMessage = 'Please enter a valid deposit amount greater than zero.';
      return;
    }

    // ── If Online Payment Gateway is chosen, launch real checkout popup ──
    if (this.form.payment_method === 'online') {
      if (!this.onlineGatewayEnabled || !this.gateways || this.gateways.length === 0) {
        this.errorMessage = 'Online payment gateway is currently disabled by administrator.';
        return;
      }
      this.payWithOnlineGateway();
      return;
    }

    if (!this.form.transaction_reference.trim()) {
      const isCheque = this.form.payment_method === 'offline_cash';
      this.errorMessage = isCheque 
        ? 'Please enter Cheque Number / DD Number / Receipt Slip Number.'
        : 'Transaction Reference / UTR Number is required.';
      return;
    }
    if (this.selectedScreenshot && this.selectedScreenshot.size > 5 * 1024 * 1024) {
      this.errorMessage = 'Payment screenshot must be 5 MB or less.';
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = new FormData();
    payload.append('amount', String(this.form.amount));
    payload.append('payment_method', this.form.payment_method);
    payload.append('gateway', this.form.gateway || 'razorpay');
    if (this.form.transaction_reference) {
      payload.append('transaction_reference', this.form.transaction_reference.trim());
    }
    if (this.selectedScreenshot) {
      payload.append('payment_screenshot', this.selectedScreenshot);
    }

    this.api.submitInvestorDepositForm(payload).subscribe({
      next: (res: any) => {
        this.submitting = false;
        if (res.success) {
          this.successMessage = 'Deposit request submitted successfully! Status set to Pending awaiting admin approval.';
          this.form = {
            amount: null,
            payment_method: 'manual_upi',
            gateway: 'razorpay',
            transaction_reference: '',
            payment_screenshot_url: ''
          };
          this.selectedScreenshot = undefined;
          this.screenshotPreviewUrl = '';
          this.loadDeposits();
        } else {
          this.errorMessage = res.message || 'Deposit submission failed.';
        }
      },
      error: (err: any) => {
        this.submitting = false;
        this.errorMessage = err.error?.message || 'Failed to submit deposit request.';
      }
    });
  }

  // ── Multi-Gateway Online Checkout (Razorpay, Cashfree, PayU) ──
  payWithOnlineGateway() {
    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const selectedGw = (this.form.gateway || 'razorpay').toLowerCase();
    const amountVal = Number(this.form.amount);
    const orderId = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const user = this.auth.getInvestorUser();
    const customerName = (user?.full_name || user?.name || 'Investor').trim();
    const rawEmail = (user?.email || '').trim();
    const customerEmail = (rawEmail && rawEmail.includes('@')) ? rawEmail : 'investor@mmrconstructions.in';
    let customerMobile = (user?.mobile_number || user?.mobile_no || user?.phone || '9999999999').toString().replace(/\D/g, '');
    if (customerMobile.length < 10) {
      customerMobile = '9999999999';
    } else if (customerMobile.length > 10) {
      customerMobile = customerMobile.slice(-10);
    }

    const initiatePayload = {
      order_id: orderId,
      amount: amountVal,
      gateway_name: selectedGw,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_mobile: customerMobile
    };

    this.paymentService.initiatePayment(initiatePayload as any).subscribe({
      next: (res: any) => {
        if (!res.success || !res.data) {
          this.submitting = false;
          this.errorMessage = res.message || 'Failed to initiate online payment.';
          return;
        }

        const details = res.data.checkout_details;
        const activeGw = (res.data.gateway_name || selectedGw).toLowerCase();

        if (activeGw === 'razorpay') {
          this.handleRazorpayCheckout(details, orderId, amountVal);
        } else if (activeGw === 'cashfree') {
          this.handleCashfreeCheckout(details, orderId, amountVal);
        } else if (activeGw === 'payu') {
          this.handlePayUCheckout(details, orderId, amountVal);
        } else {
          this.submitting = false;
          this.errorMessage = `Gateway '${activeGw}' is not supported yet.`;
        }
      },
      error: (err: any) => {
        this.submitting = false;
        this.errorMessage = err?.error?.message || err?.message || 'Server error initiating payment.';
      }
    });
  }

  private handleRazorpayCheckout(details: any, orderId: string, amount: number) {
    this.razorpayService.pay(details).subscribe({
      next: (verifyRes) => {
        this.ngZone.run(() => {
          if (verifyRes.success) {
            const vData = (verifyRes.data || {}) as any;
            this.api.verifyInvestorOnlineDeposit({
              order_id: orderId,
              gateway_name: 'razorpay',
              razorpay_order_id: vData.razorpay_order_id || vData.gateway_order_id || orderId,
              razorpay_payment_id: vData.gateway_payment_id || vData.razorpay_payment_id || orderId,
              razorpay_signature: vData.gateway_signature || vData.razorpay_signature || ''
            }).subscribe({
              next: () => {
                this.submitting = false;
                this.successMessage = `Deposit of ₹${amount.toLocaleString('en-IN')} via Razorpay verified and credited successfully!`;
                this.form.amount = null;
                this.loadDeposits();
              },
              error: () => {
                this.submitting = false;
                this.successMessage = `Deposit of ₹${amount.toLocaleString('en-IN')} via Razorpay received. Refreshing balance...`;
                this.form.amount = null;
                this.loadDeposits();
              }
            });
          } else {
            this.errorMessage = verifyRes.message || 'Razorpay payment verification failed.';
            this.submitting = false;
          }
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.submitting = false;
          if (err?.cancelled) {
            this.errorMessage = 'Payment window was dismissed.';
          } else {
            this.errorMessage = err?.message || 'Razorpay payment failed.';
          }
        });
      }
    });
  }

  private handleCashfreeCheckout(details: any, orderId: string, amount: number) {
    this.cashfreeService.pay(details).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.api.verifyInvestorOnlineDeposit({
            order_id: orderId,
            gateway_name: 'cashfree'
          }).subscribe({
            next: () => {
              this.submitting = false;
              this.successMessage = `Deposit of ₹${amount.toLocaleString('en-IN')} via Cashfree verified and credited successfully!`;
              this.form.amount = null;
              this.loadDeposits();
            },
            error: () => {
              this.paymentService.verifyCashfreePayment(orderId).subscribe({
                next: () => {
                  this.submitting = false;
                  this.successMessage = `Deposit of ₹${amount.toLocaleString('en-IN')} via Cashfree verified and credited successfully!`;
                  this.form.amount = null;
                  this.loadDeposits();
                },
                error: (err) => {
                  this.submitting = false;
                  this.errorMessage = err?.error?.message || 'Cashfree verification completed. Please check your deposit list.';
                  this.loadDeposits();
                }
              });
            }
          });
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.submitting = false;
          this.errorMessage = err?.message || 'Cashfree checkout failed to launch.';
        });
      }
    });
  }

  private handlePayUCheckout(details: any, orderId: string, amount: number) {
    try {
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = details.action;
      const params = details.fields || details.params || {};
      Object.keys(params).forEach((key) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = params[key];
        form.appendChild(input);
      });
      document.body.appendChild(form);
      // Submit form directly; backend callback auto-credits upon redirect back to /investor/deposit
      form.submit();
    } catch (e: any) {
      this.submitting = false;
      this.errorMessage = 'Failed to launch PayU: ' + e.message;
    }
  }

  private recordOnlineDeposit(amount: number, gateway: string, reference: string) {
    const payload = new FormData();
    payload.append('amount', String(amount));
    payload.append('payment_method', 'online');
    payload.append('gateway', gateway);
    payload.append('transaction_reference', reference);

    this.api.submitInvestorDepositForm(payload).subscribe({
      next: (res: any) => {
        this.submitting = false;
        if (res.success) {
          this.successMessage = `Deposit of ₹${amount.toLocaleString('en-IN')} via ${gateway.toUpperCase()} submitted successfully!`;
          this.form.amount = null;
          this.loadDeposits();
        } else {
          this.errorMessage = res.message || 'Deposit submission failed.';
        }
      },
      error: (err: any) => {
        this.submitting = false;
        this.errorMessage = err?.error?.message || 'Deposit recording failed.';
      }
    });
  }

  getProofUrl(dep: any): string {
    if (!dep) return '';
    if (dep.payment_screenshot_url) {
      return this.api.getFileUrl(dep.payment_screenshot_url);
    }
    return `${this.api.getFileUrl(`/api/investor/deposits/${dep.id}/screenshot`)}`;
  }

  openPreview(url: string) {
    this.previewDocUrl = url;
  }

  closePreview() {
    this.previewDocUrl = null;
  }

  getStatusBadge(status: string): string {
    switch (status?.toLowerCase()) {
      case 'approved': return 'bg-success-subtle text-success border-success';
      case 'rejected': return 'bg-danger-subtle text-danger border-danger';
      default: return 'bg-warning-subtle text-warning border-warning';
    }
  }
}
