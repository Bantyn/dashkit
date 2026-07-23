import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../models/product.model';
import { isPlatformBrowser } from '@angular/common';

export interface CartItem {
  product: Product;
  quantity: number;
  variant?: {
    size?: string;
    color?: string;
    price: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  public cartItems$ = this.cartItemsSubject.asObservable();

  private cartTotalSubject = new BehaviorSubject<number>(0);
  public cartTotal$ = this.cartTotalSubject.asObservable();

  private cartCountSubject = new BehaviorSubject<number>(0);
  public cartCount$ = this.cartCountSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.loadCart();
  }

  private loadCart() {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem('shop_cart');
      if (stored) {
        try {
          const items = JSON.parse(stored);
          this.cartItemsSubject.next(items);
          this.calculateTotals(items);
        } catch (e) {
          console.error('Failed to parse cart', e);
        }
      }
    }
  }

  private saveCart(items: CartItem[]) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('shop_cart', JSON.stringify(items));
    }
    this.cartItemsSubject.next(items);
    this.calculateTotals(items);
  }

  private calculateTotals(items: CartItem[]) {
    const count = items.reduce((acc, item) => acc + item.quantity, 0);
    const total = items.reduce((acc, item) => {
      const price = item.variant ? item.variant.price : item.product.variants[0]?.price || 0;
      return acc + price * item.quantity;
    }, 0);

    this.cartCountSubject.next(count);
    this.cartTotalSubject.next(total);
  }

  addToCart(product: Product, quantity: number = 1, variant?: any) {
    const currentItems = this.cartItemsSubject.value;

    // Check if item already exists (matching product ID and variant)
    const existingIndex = currentItems.findIndex(
      (item) =>
        item.product.id === product.id && JSON.stringify(item.variant) === JSON.stringify(variant),
    );

    if (existingIndex > -1) {
      currentItems[existingIndex].quantity += quantity;
    } else {
      currentItems.push({ product, quantity, variant });
    }

    this.saveCart(currentItems);
  }

  removeFromCart(index: number) {
    const currentItems = this.cartItemsSubject.value;
    if (index >= 0 && index < currentItems.length) {
      currentItems.splice(index, 1);
      this.saveCart(currentItems);
    }
  }

  updateQuantity(index: number, quantity: number) {
    const currentItems = this.cartItemsSubject.value;
    if (index >= 0 && index < currentItems.length) {
      if (quantity <= 0) {
        this.removeFromCart(index);
        return;
      }
      currentItems[index].quantity = quantity;
      this.saveCart(currentItems);
    }
  }

  clearCart() {
    this.saveCart([]);
  }

  getCurrentItems(): CartItem[] {
    return this.cartItemsSubject.value;
  }

  getCurrentTotal(): number {
    return this.cartTotalSubject.value;
  }
}
