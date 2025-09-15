import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product {
  id: number;
  name: string;
  brand?: string;
  category?: string;
  unit?: string;
  size?: string;
}

export interface Store {
  id: number;
  name: string;
  location?: string;
  address?: string;
}

export interface Price {
  id: number;
  productId: number;
  storeId: number;
  regularPrice: number;
  salePrice?: number;
  promotionType?: string;
  promotionDetails?: string;
  validFrom: Date;
  validTo: Date;
}

export interface PriceComparison {
  storeId: number;
  storeName: string;
  regularPrice: number;
  salePrice?: number;
  currentPrice: number;
  promotionType?: string;
  promotionDetails?: string;
}

export interface Deal {
  productId: number;
  productName: string;
  brand?: string;
  category?: string;
  storeId: number;
  storeName: string;
  regularPrice: number;
  salePrice: number;
  discount: number;
  promotionType?: string;
  promotionDetails?: string;
  validUntil: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);

  getProducts(category?: string, search?: string): Observable<Product[]> {
    const params: any = {};
    if (category) params.category = category;
    if (search) params.search = search;
    return this.http.get<Product[]>('/api/products', { params });
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`/api/products/${id}`);
  }

  getStores(): Observable<Store[]> {
    return this.http.get<Store[]>('/api/stores');
  }

  comparePrices(productId: number, storeIds?: number[]): Observable<PriceComparison[]> {
    const params: any = { productId };
    if (storeIds?.length) params.storeIds = storeIds.join(',');
    return this.http.get<PriceComparison[]>('/api/prices/compare', { params });
  }

  getPriceHistory(productId: number, storeId: number, days = 30): Observable<any[]> {
    return this.http.get<any[]>('/api/prices/history', {
      params: { productId, storeId, days }
    });
  }

  getDeals(storeId?: number, category?: string): Observable<Deal[]> {
    const params: any = {};
    if (storeId) params.storeId = storeId;
    if (category) params.category = category;
    return this.http.get<Deal[]>('/api/prices/deals', { params });
  }
}