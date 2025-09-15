import { Component, OnInit, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Product } from '../../core/services/api.service';

@Component({
  selector: 'app-product-list',
  template: `
    <div class="products">
      <h1>Products</h1>

      <div class="filters card">
        <input
          type="text"
          placeholder="Search products..."
          [(ngModel)]="searchTerm"
          (ngModelChange)="search()"
          class="search-input"
        />

        <select [(ngModel)]="selectedCategory" (ngModelChange)="filterByCategory()" class="category-select">
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
        <div class="loading">Loading products...</div>
      } @else if (error()) {
        <div class="error">{{ error() }}</div>
      } @else {
        <div class="products-grid">
          @for (product of filteredProducts(); track product.id) {
            <div class="product-card card">
              <h3>{{ product.name }}</h3>
              @if (product.brand) {
                <p class="brand">{{ product.brand }}</p>
              }
              @if (product.category) {
                <span class="category-badge">{{ product.category }}</span>
              }
              <div class="product-meta">
                @if (product.size) {
                  <span>{{ product.size }}</span>
                }
                @if (product.unit) {
                  <span>{{ product.unit }}</span>
                }
              </div>
              <button class="primary" (click)="compareProduct(product)">Compare Prices</button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .products {
      padding: 20px 0;

      h1 {
        margin-bottom: 30px;
      }
    }

    .filters {
      display: flex;
      gap: 20px;
      margin-bottom: 30px;

      .search-input {
        flex: 1;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 16px;
      }

      .category-select {
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 16px;
        min-width: 150px;
      }
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 20px;
    }

    .product-card {
      display: flex;
      flex-direction: column;

      h3 {
        margin-bottom: 10px;
        color: #333;
      }

      .brand {
        color: #666;
        font-size: 0.9rem;
        margin-bottom: 10px;
      }

      .category-badge {
        background: #e3f2fd;
        color: #1976d2;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.85rem;
        display: inline-block;
        margin-bottom: 10px;
      }

      .product-meta {
        display: flex;
        gap: 10px;
        color: #666;
        font-size: 0.9rem;
        margin-bottom: 15px;
        margin-top: auto;
      }

      button {
        width: 100%;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule]
})
export class ProductListComponent implements OnInit {
  private apiService = inject(ApiService);

  products = signal<Product[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  searchTerm = '';
  selectedCategory = '';

  filteredProducts = computed(() => {
    let filtered = this.products();

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.brand?.toLowerCase().includes(term)
      );
    }

    if (this.selectedCategory) {
      filtered = filtered.filter(p => p.category === this.selectedCategory);
    }

    return filtered;
  });

  ngOnInit() {
    this.loadProducts();
  }

  private loadProducts() {
    this.loading.set(true);
    this.apiService.getProducts().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load products. Please try again later.');
        this.loading.set(false);
      }
    });
  }

  search() {
    // Filtering is handled by the computed signal
  }

  filterByCategory() {
    // Filtering is handled by the computed signal
  }

  compareProduct(product: Product) {
    // Navigate to compare page with product ID
    window.location.href = `/compare?productId=${product.id}`;
  }
}