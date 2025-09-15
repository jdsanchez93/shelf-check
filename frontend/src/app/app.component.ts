import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  template: `
    <header class="header">
      <nav class="container nav">
        <h1 class="logo">Grocery Price Comparison</h1>
        <ul class="nav-links">
          <li>
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Home</a>
          </li>
          <li>
            <a routerLink="/products" routerLinkActive="active">Products</a>
          </li>
          <li>
            <a routerLink="/compare" routerLinkActive="active">Compare</a>
          </li>
          <li>
            <a routerLink="/deals" routerLinkActive="active">Deals</a>
          </li>
        </ul>
      </nav>
    </header>
    <main class="container main">
      <router-outlet />
    </main>
  `,
  styles: [`
    .header {
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }

    .nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 0;
    }

    .logo {
      font-size: 1.5rem;
      color: #4CAF50;
    }

    .nav-links {
      display: flex;
      list-style: none;
      gap: 2rem;

      a {
        text-decoration: none;
        color: #333;
        font-weight: 500;
        transition: color 0.3s;

        &:hover {
          color: #4CAF50;
        }

        &.active {
          color: #4CAF50;
          border-bottom: 2px solid #4CAF50;
          padding-bottom: 2px;
        }
      }
    }

    .main {
      min-height: calc(100vh - 100px);
      padding: 20px 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive]
})
export class AppComponent {}