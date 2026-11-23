import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-investors',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './investors.component.html',
  styleUrls: ['./investors.component.css']
})
export class InvestorsComponent implements OnInit, OnDestroy {
  @ViewChild('carouselTrack') carouselTrack?: ElementRef<HTMLDivElement>;

  investors: any[] = [];
  totalCount = 0;
  loading = true;
  selectedInvestor: any = null;

  autoSlideTimer: any = null;
  isPaused = false;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getInvestors().subscribe({
      next: (r: any) => {
        const rawList = Array.isArray(r?.data) ? r.data : [];
        const uniqueList: any[] = [...rawList];

        // Sort descending by investment amount (highest investment first)
        uniqueList.sort((a, b) => (Number(b.investment_amount || 0) - Number(a.investment_amount || 0)));

        this.totalCount = uniqueList.length;
        // Limit preview on homepage to max 50 cards
        this.investors = uniqueList.slice(0, 50);
        this.loading = false;
        this.startAutoSlide();
      },
      error: () => (this.loading = false)
    });
  }

  ngOnDestroy() {
    this.stopAutoSlide();
  }

  startAutoSlide() {
    this.stopAutoSlide();
    this.autoSlideTimer = setInterval(() => {
      if (!this.isPaused && !this.selectedInvestor) {
        this.scrollNext();
      }
    }, 3000);
  }

  stopAutoSlide() {
    if (this.autoSlideTimer) {
      clearInterval(this.autoSlideTimer);
      this.autoSlideTimer = null;
    }
  }

  pauseCarousel() {
    this.isPaused = true;
  }

  resumeCarousel() {
    this.isPaused = false;
  }

  scrollPrev() {
    if (!this.carouselTrack?.nativeElement) return;
    const el = this.carouselTrack.nativeElement;
    const cardWidth = this.getCardScrollWidth();
    if (el.scrollLeft <= 10) {
      el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
    } else {
      el.scrollBy({ left: -cardWidth, behavior: 'smooth' });
    }
  }

  scrollNext() {
    if (!this.carouselTrack?.nativeElement) return;
    const el = this.carouselTrack.nativeElement;
    const cardWidth = this.getCardScrollWidth();
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 15) {
      el.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      el.scrollBy({ left: cardWidth, behavior: 'smooth' });
    }
  }

  private getCardScrollWidth(): number {
    if (!this.carouselTrack?.nativeElement) return 240;
    const firstCard = this.carouselTrack.nativeElement.querySelector('.investor-carousel-card') as HTMLElement;
    return firstCard ? firstCard.offsetWidth + 16 : 240;
  }

  openInvestorProfile(investor: any, event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.selectedInvestor = investor;
  }

  closeInvestorProfile() {
    this.selectedInvestor = null;
  }

  getImageUrl(investor: any): string {
    const url = investor?.profile_image_url;
    if (!url) {
      const name = encodeURIComponent(investor?.name || 'Investor');
      return `https://ui-avatars.com/api/?name=${name}&background=0A192F&color=D4AF37&size=200&bold=true`;
    }
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    return this.api.url(url);
  }

  imageError(e: Event) {
    (e.target as HTMLImageElement).src = 'assets/favicon-192x192.png';
  }
}
