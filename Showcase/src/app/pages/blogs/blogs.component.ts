import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeoService } from '../../services/seo.service';

interface BlogPost {
  id: number;
  title: string;
  category: 'Retail Tips' | 'Fashion Trends' | 'Tech Upgrades' | 'Success Stories';
  date: string;
  readTime: string;
  summary: string;
  content: string[];
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  image: string;
}

import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';

@Component({
  selector: 'app-blogs',
  standalone: true,
  imports: [CommonModule, FormsModule, ScrollRevealDirective],
  templateUrl: './blogs.component.html',
})
export class BlogsComponent {
  categories: string[] = ['All', 'Retail Tips', 'Fashion Trends', 'Tech Upgrades', 'Success Stories'];
  activeCategory = 'All';
  searchQuery = '';
  selectedBlog: BlogPost | null = null;
  private seoService = inject(SeoService);

  selectBlog(blog: BlogPost) {
    this.selectedBlog = blog;
    
    // Update SEO meta tags for specific blog post
    this.seoService.applySeo({
      title: `${blog.title} | DashKit Blog`,
      description: blog.summary,
      keywords: `Dashkit blog, boutique management, ${blog.category.toLowerCase()}, ${blog.title.toLowerCase()}`,
      ogTitle: `${blog.title} | DashKit Blog`,
      ogDescription: blog.summary,
      ogType: 'article'
    });

    // Format publish date into standard ISO format
    let isoDate = new Date().toISOString().split('T')[0];
    try {
      if (blog.date) {
        isoDate = new Date(blog.date).toISOString().split('T')[0];
      }
    } catch (e) {}

    // Inject structured Article Schema
    this.seoService.setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': blog.title,
      'description': blog.summary,
      'datePublished': isoDate,
      'author': {
        '@type': 'Person',
        'name': blog.author.name,
        'jobTitle': blog.author.role
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'DashKit',
        'logo': 'https://Dashkit.co/favicon.png'
      },
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': `https://Dashkit.co/blogs#${blog.id}`
      },
      'articleBody': blog.content.join(' ')
    }, 'blog-article-schema');
  }

  deselectBlog() {
    this.selectedBlog = null;
    this.seoService.clearJsonLd('blog-article-schema');
    
    // Reapply default blogs route metadata
    this.seoService.applySeo({
      title: 'Retail Boutique Growth Tips, Trends & Success Stories | DashKit Blog',
      description: 'Explore expert insights, how-to guides, boutique inventory matrix strategies, and success stories on scaling your clothing store operations and boosting sales.',
      keywords: 'apparel retail blog, boutique business tips, how to grow fashion boutique, cloud pos software guide'
    });
  }

  blogs: BlogPost[] = [
    {
      id: 1,
      title: '5 Ways to Streamline Inventory in Your Boutique',
      category: 'Retail Tips',
      date: 'June 25, 2026',
      readTime: '5 min',
      summary:
        'Managing clothing inventory across various sizing matrix grids and color shades is a core retail challenge. Discover five actionable tactics to save time and reduce capital locks.',
      content: [
        'For clothing store owners, inventory management can quickly become a complex web of SKUs, sizes, colors, and design variants. An item in a medium size and navy color is a completely different inventory unit than the same item in large and red. Keeping track of all these combinations manually often leads to stock-outs of popular sizes or excess stock of slow-moving ones.',
        'Here are five actionable tactics to streamline your boutique inventory:',
        '1. Implement Size Matrix Tracking: Move away from generic inventories and group items dynamically. Size-color grid management allows you to track Levi’s jeans by both 32" waist and Slim Fit style directly.',
        '2. Automate Low-Stock Alerts: Do not wait for a customer to ask for a size before realizing you are out. Set threshold triggers that alert you when inventory falls below 5 units, letting you reorder proactively.',
        '3. Unify Offline and Online Stock: If you run a physical shop and an e-commerce website, sync your inventory database. This avoids selling the same pair of shoes on your site while a customer is buying it in-store.',
        '4. Perform Weekly Spot Audits: Instead of waiting for yearly stock counting, spot check 10 random items every week. This ensures your computer logs match reality and catches inventory leaks early.',
        '5. Liquidate Slow-Moving Stock: Use sales reports to identify items that have not sold in 45 days. Run promotions or bundle packages to clear these racks and free up cash flow for fresher styles.',
      ],
      author: {
        name: 'Banty Patel',
        role: 'Founder',
        avatar: '',
      },
      image: '',
    },
    {
      id: 2,
      title: 'Why Cloud POS is the Future of Fashion Retail',
      category: 'Tech Upgrades',
      date: 'May 18, 2026',
      readTime: '4 min',
      summary:
        'Legacy desktop systems limit your visibility and lock operations to the store counter. Learn how moving billing and management to the cloud lets you scale and adapt.',
      content: [
        'The era of the heavy, terminal-style cash register is coming to an end. Modern boutiques require flexibility, speed, and real-time operations. This is where Cloud POS systems come in, replacing offline terminals with scalable cloud networks accessible from anywhere.',
        'First and foremost, cloud systems offer absolute accessibility. Whether you are at a trade show, traveling to purchase new inventory, or at home, you can view live sales, edit product prices, and approve customer refunds directly from your mobile phone or browser.',
        'Secondly, cloud-based POS tools connect with integrations like Shiprocket, Razorpay, or automated SMS tools without expensive server installations. When a sale is made in Bangalore, the invoice is saved instantly, and your online inventory updates in seconds.',
        'Finally, security and data safety are built-in. If your shop terminal suffers a power surge, water leak, or theft, your transactions data, supplier records, and customer directories remain perfectly safe on secure cloud servers. Upgrade to cloud POS to secure your retail operations.',
      ],
      author: {
        name: 'Banty Patel',
        role: 'Founder',
        avatar: '',
      },
      image: '',
    },
    {
      id: 3,
      title: 'How "Vastram Boutique" Multiplied Profits by 40%',
      category: 'Success Stories',
      date: 'April 09, 2026',
      readTime: '6 min',
      summary:
        'Discover how a traditional apparel outlet transitioned from paper ledgers to digital billing and multi-branch inventory tracking with DashKit.',
      content: [
        'Vastram Boutique began in a small 400 sq. ft. room in Bangalore, selling handloom sarees and ethnic wear. As the shop gained popularity, the owner, Priya Rao, expanded to a second outlet. However, managing two physical locations using spreadsheets and paper ledgers quickly became a management nightmare.',
        'Stock transfers between stores were recorded on paper slips, leading to discrepancies, missing garments, and customer frustrations. Billing took several minutes per client, causing long queues during festive weekends.',
        'Priya decided to integrate DashKit across both outlets. The results were transformational:',
        '- Inventory Control: The shared size-color inventory matrix allowed Priya to instantly check if a specific handloom saree size was available in store B, facilitating immediate customer deliveries.',
        '- Billing Speed: Checkout times dropped from 3 minutes per customer to under 30 seconds, improving holiday peak sales throughput.',
        '- CRM Campaigns: Vastram utilized the SMS marketing tool, sending tailored offers during Diwali. This single campaign generated a 25% repeat purchase rate.',
        'Within 12 months, Vastram Boutique reduced operational wastage and increased sales by 40%. digital transformation is no longer a luxury; it is the core growth driver for modern retail.',
      ],
      author: {
        name: 'Banty Patel',
        role: 'Founder',
        avatar: '',
      },
      image: '',
    },
  ];

  getIcon(cat: string): string {
    switch (cat) {
      case 'Retail Tips':
        return 'bi-shop';
      case 'Tech Upgrades':
        return 'bi-cpu';
      case 'Success Stories':
        return 'bi-trophy';
      case 'Fashion Trends':
        return 'bi-tags';
      default:
        return 'bi-journal-text';
    }
  }

  get filteredBlogs(): BlogPost[] {
    return this.blogs.filter((blog) => {
      const matchesCat = this.activeCategory === 'All' || blog.category === this.activeCategory;
      const q = this.searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        blog.title.toLowerCase().includes(q) ||
        blog.summary.toLowerCase().includes(q) ||
        blog.category.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }
}
