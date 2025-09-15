import { Component, OnInit, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Deal, Store } from '../../core/services/api.service';

@Component({
  selector: 'app-deals',
  template: `
    <div class="deals">
      <h1>Current Deals</h1>

      <div class="filters card">
        <select [(ngModel)]="selectedStoreId" (ngModelChange)="filterDeals()">
          <option value="">All Stores</option>
          @for (store of stores(); track store.id) {
            <option [value]="store.id">{{ store.name }}</option>
          }
        </select>

        <select [(ngModel)]="selectedCategory" (ngModelChange)="filterDeals()">
          <option value="">All Categories</option>
          <option value="Produce">Produce</option>
          <option value="Dairy">Dairy</option>
          <option value="Meat">Meat</option>
          <option value="Bakery">Bakery</option>
          <option value="Frozen">Frozen</option>
          <option value="Pantry">Pantry</option>
        </select>
      </div>

      @if (loading()) {
        <div class="loading">Loading deals...</div>
      } @else if (error()) {
        <div class="error">{{ error() }}</div>
      } @else if (deals().length === 0) {
        <div class="no-deals">No deals found matching your criteria.</div>
      } @else {
        <div class="deals-grid">
          @for (deal of deals(); track deal.productId + '-' + deal.storeId) {
            <div class="deal-card card">
              <div class="discount-badge">{{ deal.discount }}% OFF</div>
              <h3>{{ deal.productName }}</h3>
              @if (deal.brand) {
                <p class="brand">{{ deal.brand }}</p>
              }
              <p class="store">{{ deal.storeName }}</p>
              @if (deal.category) {
                <span class="category">{{ deal.category }}</span>
              }
              <div class="prices">
                <span class="price regular">\${{ deal.regularPrice.toFixed(2) }}</span>
                <span class="price sale">\${{ deal.salePrice.toFixed(2) }}</span>
              </div>
              <div class="savings">Save \${{ (deal.regularPrice - deal.salePrice).toFixed(2) }}</div>
              @if (deal.promotionType) {
                <p class="promotion-type">{{ deal.promotionType }}</p>
              }
              @if (deal.promotionDetails) {
                <p class="promo-details">{{ deal.promotionDetails }}</p>
              }
              <p class="valid-until">Valid until {{ formatDate(deal.validUntil) }}</p>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .deals {
      padding: 20px 0;

      h1 {
        margin-bottom: 30px;
      }
    }

    .filters {
      display: flex;
      gap: 20px;
      margin-bottom: 30px;

      select {
        flex: 1;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 16px;
      }
    }

    .no-deals {
      text-align: center;
      padding: 40px;
      color: #666;
      font-size: 1.1rem;
    }

    .deals-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    .deal-card {
      position: relative;
      padding-top: 30px;

      .discount-badge {
        position: absolute;
        top: -10px;
        left: 20px;
        background: linear-gradient(135deg, #ff5722, #ff7043);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-weight: bold;
        font-size: 1.1rem;
        box-shadow: 0 2px 8px rgba(255, 87, 34, 0.3);
      }

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
        margin-bottom: 10px;
      }

      .category {
        background: #e3f2fd;
        color: #1976d2;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.85rem;
        display: inline-block;
        margin-bottom: 15px;
      }

      .prices {
        display: flex;
        gap: 15px;
        align-items: center;
        margin-bottom: 10px;
      }

      .savings {
        background: #e8f5e9;
        color: #2e7d32;
        padding: 8px 12px;
        border-radius: 4px;
        font-weight: bold;
        margin-bottom: 10px;
        text-align: center;
      }

      .promotion-type {
        background: #fff3e0;
        color: #e65100;
        padding: 4px 8px;
        border-radius: 4px;
        display: inline-block;
        margin-bottom: 8px;
        font-size: 0.9rem;
      }

      .promo-details {
        font-size: 0.9rem;
        color: #666;
        font-style: italic;
        margin-bottom: 10px;
      }

      .valid-until {
        font-size: 0.85rem;
        color: #999;
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid #eee;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule]
})
export class DealsComponent implements OnInit {
  private apiService = inject(ApiService);

  deals = signal<Deal[]>([]);
  stores = signal<Store[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  selectedStoreId = '';
  selectedCategory = '';

  ngOnInit() {
    this.loadStores();
    this.loadDeals();
  }

  private loadStores() {
    this.apiService.getStores().subscribe({
      next: (stores) => this.stores.set(stores),
      error: (err) => console.error('Failed to load stores', err)
    });
  }

  private loadDeals() {
    this.loading.set(true);
    const storeId = this.selectedStoreId ? parseInt(this.selectedStoreId) : undefined;

    this.apiService.getDeals(storeId, this.selectedCategory).subscribe({
      next: (deals) => {
        this.deals.set(deals);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load deals. Please try again later.');
        this.loading.set(false);
      }
    });
  }

  filterDeals() {
    this.loadDeals();
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}