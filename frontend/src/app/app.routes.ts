import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'products',
    loadComponent: () => import('./features/products/product-list.component').then(m => m.ProductListComponent)
  },
  {
    path: 'compare',
    loadComponent: () => import('./features/compare/price-compare.component').then(m => m.PriceCompareComponent)
  },
  {
    path: 'deals',
    loadComponent: () => import('./features/deals/deals.component').then(m => m.DealsComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];