import { Component, OnInit, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Product, Store, PriceComparison } from '../../core/services/api.service';

@Component({
  selector: 'app-price-compare',
  template: `
    <div class="compare">
      <h1>Compare Prices</h1>

      <div class="selection card">
        <div class="form-group">
          <label>Select Product:</label>
          <select [(ngModel)]="selectedProductId" (ngModelChange)="onProductChange()">
            <option value="">Choose a product...</option>
            @for (product of products(); track product.id) {
              <option [value]="product.id">{{ product.name }} {{ product.brand ? '- ' + product.brand : '' }}</option>
            }
          </select>
        </div>

        <div class="form-group">
          <label>Select Stores (optional):</label>
          <div class="store-checkboxes">
            @for (store of stores(); track store.id) {
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  [value]="store.id"
                  (change)="toggleStore(store.id)"
                />
                {{ store.name }}
              </label>
            }
          </div>
        </div>

        <button class="primary" (click)="comparePrices()" [disabled]="!selectedProductId">
          Compare Prices
        </button>
      </div>

      @if (loading()) {
        <div class="loading">Loading price comparison...</div>
      } @else if (comparison().length > 0) {
        <div class="comparison-results">
          <h2>Price Comparison Results</h2>
          <div class="comparison-grid">
            @for (price of comparison(); track price.storeId) {
              <div class="price-card card" [class.best-price]="$index === 0">
                @if ($index === 0) {
                  <span class="best-badge">Best Price!</span>
                }
                <h3>{{ price.storeName }}</h3>
                <div class="prices">
                  @if (price.salePrice) {
                    <span class="price regular">\${{ price.regularPrice.toFixed(2) }}</span>
                    <span class="price sale">\${{ price.salePrice.toFixed(2) }}</span>
                  } @else {
                    <span class="price current">\${{ price.regularPrice.toFixed(2) }}</span>
                  }
                </div>
                @if (price.promotionType) {
                  <p class="promotion">{{ price.promotionType }}</p>
                }
                @if (price.promotionDetails) {
                  <p class="promo-details">{{ price.promotionDetails }}</p>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .compare {
      padding: 20px 0;

      h1 {
        margin-bottom: 30px;
      }
    }

    .selection {
      margin-bottom: 40px;

      .form-group {
        margin-bottom: 20px;

        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
        }

        select {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
        }
      }

      .store-checkboxes {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 10px;

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;

          input {
            cursor: pointer;
          }
        }
      }

      button {
        margin-top: 20px;
      }
    }

    .comparison-results {
      h2 {
        margin-bottom: 20px;
      }
    }

    .comparison-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 20px;
    }

    .price-card {
      position: relative;

      &.best-price {
        border: 2px solid #4CAF50;
      }

      .best-badge {
        position: absolute;
        top: -10px;
        right: 10px;
        background: #4CAF50;
        color: white;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 0.85rem;
        font-weight: bold;
      }

      h3 {
        margin-bottom: 15px;
        color: #333;
      }

      .prices {
        display: flex;
        gap: 15px;
        align-items: center;
        margin-bottom: 10px;

        .current {
          font-size: 1.5rem;
        }
      }

      .promotion {
        background: #fff3e0;
        color: #e65100;
        padding: 4px 8px;
        border-radius: 4px;
        display: inline-block;
        margin-bottom: 8px;
      }

      .promo-details {
        font-size: 0.9rem;
        color: #666;
        font-style: italic;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule]
})
export class PriceCompareComponent implements OnInit {
  private apiService = inject(ApiService);

  products = signal<Product[]>([]);
  stores = signal<Store[]>([]);
  comparison = signal<PriceComparison[]>([]);
  loading = signal(false);
  selectedProductId = '';
  selectedStoreIds = new Set<number>();

  ngOnInit() {
    this.loadProducts();
    this.loadStores();
  }

  private loadProducts() {
    this.apiService.getProducts().subscribe({
      next: (products) => this.products.set(products),
      error: (err) => console.error('Failed to load products', err)
    });
  }

  private loadStores() {
    this.apiService.getStores().subscribe({
      next: (stores) => this.stores.set(stores),
      error: (err) => console.error('Failed to load stores', err)
    });
  }

  onProductChange() {
    this.comparison.set([]);
  }

  toggleStore(storeId: number) {
    if (this.selectedStoreIds.has(storeId)) {
      this.selectedStoreIds.delete(storeId);
    } else {
      this.selectedStoreIds.add(storeId);
    }
  }

  comparePrices() {
    if (!this.selectedProductId) return;

    this.loading.set(true);
    const storeIds = Array.from(this.selectedStoreIds);

    this.apiService.comparePrices(parseInt(this.selectedProductId), storeIds).subscribe({
      next: (comparison) => {
        this.comparison.set(comparison.sort((a, b) => a.currentPrice - b.currentPrice));
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to compare prices', err);
        this.loading.set(false);
      }
    });
  }
}