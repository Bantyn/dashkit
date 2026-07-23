import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface FAQItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-faq-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faq-tabs.component.html',
  styleUrl: './faq-tabs.component.css'
})
export class FaqTabsComponent implements OnInit {
  @Input() title: string = 'FAQs';
  @Input() subtitle: string = 'Frequently Asked Questions';
  @Input() categories: { [key: string]: string } = {};
  @Input() faqData: { [key: string]: FAQItem[] } = {};

  categoryKeys: string[] = [];
  selectedCategory = signal<string>('');
  openFaqIndex = signal<number | null>(null);

  ngOnInit() {
    this.categoryKeys = Object.keys(this.categories);
    if (this.categoryKeys.length > 0) {
      this.selectedCategory.set(this.categoryKeys[0]);
    }
  }

  selectCategory(key: string) {
    this.selectedCategory.set(key);
    this.openFaqIndex.set(null); // Close any open FAQ item when switching categories
  }

  toggleFaq(index: number) {
    if (this.openFaqIndex() === index) {
      this.openFaqIndex.set(null);
    } else {
      this.openFaqIndex.set(index);
    }
  }
}
