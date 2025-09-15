import { Component, OnInit, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService, Deal } from '../../core/services/api.service';

@Component({
  selector: 'app-home',
  template: `
    <div class="home">
      <section class="hero">
        <h1>Find the Best Grocery Prices</h1>
        <p>Compare prices across your local stores and save money on your grocery shopping</p>
        <div class="cta-buttons">
          <button class="primary" routerLink="/products">Browse Products</button>
          <button class="secondary" routerLink="/compare">Compare Prices</button>
        </div>
      </section>

      <section class="featured-deals">
        <h2>Today's Best Deals</h2>
        @if (loading()) {
          <div class="loading">Loading deals...</div>
        } @else if (error()) {
          <div class="error">{{ error() }}</div>
        } @else {
          <div class="deals-grid">
            @for (deal of topDeals(); track deal.productId) {
              <div class="deal-card card">
                <h3>{{ deal.productName }}</h3>
                @if (deal.brand) {
                  <p class="brand">{{ deal.brand }}</p>
                }
                <p class="store">{{ deal.storeName }}</p>
                <div class="prices">
                  <span class="price regular">\${{ deal.regularPrice.toFixed(2) }}</span>
                  <span class="price sale">\${{ deal.salePrice.toFixed(2) }}</span>
                </div>
                <p class="discount">Save {{ deal.discount }}%</p>
                @if (deal.promotionDetails) {
                  <p class="promo-details">{{ deal.promotionDetails }}</p>
                }
              </div>
            }
          </div>
        }
      </section>
    </div>
  `,
  styles: [`
    .home {
      padding: 20px 0;
    }

    .hero {
      text-align: center;
      padding: 60px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px;
      margin-bottom: 40px;

      h1 {
        font-size: 2.5rem;
        margin-bottom: 20px;
      }

      p {
        font-size: 1.2rem;
        margin-bottom: 30px;
        opacity: 0.9;
      }
    }

    .cta-buttons {
      display: flex;
      gap: 20px;
      justify-content: center;

      button {
        padding: 12px 30px;
        font-size: 16px;
      }
    }

    .featured-deals {
      h2 {
        margin-bottom: 30px;
        text-align: center;
        font-size: 2rem;
      }
    }

    .deals-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }

    .deal-card {
      h3 {
        margin-bottom: 10px;
        color: #333;
      }

      .brand {
        color: #666;
        font-size: 0.9rem;
        margin-bottom: 5px;
      }

      .store {
        color: #4CAF50;
        font-weight: 600;
        margin-bottom: 15px;
      }

      .prices {
        display: flex;
        gap: 15px;
        align-items: center;
        margin-bottom: 10px;
      }

      .discount {
        background: #ff5722;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        display: inline-block;
        font-weight: bold;
        margin-bottom: 10px;
      }

      .promo-details {
        font-size: 0.9rem;
        color: #666;
        font-style: italic;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink]
})
export class HomeComponent implements OnInit {
  private apiService = inject(ApiService);

  topDeals = signal<Deal[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    this.loadTopDeals();
  }

  private loadTopDeals() {
    this.apiService.getDeals().subscribe({
      next: (deals) => {
        this.topDeals.set(deals.slice(0, 6));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load deals. Please try again later.');
        this.loading.set(false);
      }
    });
  }
}