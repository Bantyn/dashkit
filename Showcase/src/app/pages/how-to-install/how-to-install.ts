import { Component } from '@angular/core';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';

@Component({
  selector: 'app-how-to-install',
  imports: [ScrollRevealDirective],
  templateUrl: './how-to-install.html',
  styleUrl: './how-to-install.css',
})
export class HowToInstall {
  tabs = ['PC', 'Android', 'iOS'];
  activeTab = 'PC';
  openStepIndex = 0;

  pcSteps = [
    {
      title: 'Log in / Register',
      description: 'Start your journey by creating a new account or logging into your existing DashKit profile. Simply enter your registered email and password. If you are new, click on \'Register\', fill in your basic store details, and verify your email to access the platform.',
      placeholder: 'Login / Register Image Placeholder'
    },
    {
      title: 'After Login Dashboard',
      description: 'Once you successfully log in, you will be redirected to the main admin dashboard. This is your command center where you can view a quick summary of your store\'s performance, recent sales, and quick links to manage your entire business operations.',
      placeholder: 'Dashboard Image Placeholder'
    },
    {
      title: 'Set up Image Storage',
      description: 'Before uploading products, you need to configure your image storage settings. Navigate to the settings tab to connect your preferred cloud storage or use DashKit\'s default secure storage. This ensures all your product photos, banners, and logos are saved securely and load quickly for your customers.',
      placeholder: 'Image Storage Settings Placeholder'
    },
    {
      title: 'Product Categories, Brand, Variant',
      description: 'Organize your store by defining a clear hierarchy. Create broad \'Categories\' (e.g., Men, Women, Accessories), add the \'Brands\' you sell, and set up \'Variants\' (e.g., Sizes like S/M/L or Colors). This proper structure helps in easy filtering and provides a better shopping experience for your customers.',
      placeholder: 'Categories, Brand & Variant Placeholder'
    },
    {
      title: 'Product Creation',
      description: 'Now it\'s time to populate your store! Go to the \'Products\' section and click \'Add New\'. Fill in essential details such as product name, description, price, available stock, and assign them to the categories and brands you created earlier. Don\'t forget to upload high-quality images for each variant.',
      placeholder: 'Product Creation Placeholder'
    },
    {
      title: 'Storefront: Enable Website',
      description: 'Ready to go online? Navigate to the Storefront settings and toggle the \'Enable Website\' button. This action makes your e-commerce store live and accessible to the public. Note: This specific storefront feature might require an active subscription on a supported pricing plan.',
      placeholder: 'Enable Website Placeholder'
    },
    {
      title: 'Page Section',
      description: 'Customize the layout and content of your website\'s pages. You can edit the \'About Us\', \'Contact\', \'Terms and Conditions\', and \'Privacy Policy\' pages. A well-documented page section builds trust with your customers and provides them with essential information about your business.',
      placeholder: 'Page Section Placeholder'
    },
    {
      title: 'Store Image Section',
      description: 'Enhance your brand\'s identity by uploading images related to your physical store presence. You can add pictures of your storefront, interior, or team members. This helps in bridging the gap between your online and offline presence, giving your business a more authentic feel.',
      placeholder: 'Store Image Placeholder'
    },
    {
      title: 'Website Image Section',
      description: 'Design your online store\'s visual appeal. Here you can configure the main homepage banners, promotional sliders, and featured collections images. Engaging visual content is crucial for capturing your customers\' attention as soon as they land on your website.',
      placeholder: 'Website Image Placeholder'
    },
    {
      title: 'Razorpay Section',
      description: 'Set up a seamless checkout experience by integrating your Razorpay account. Go to the payment settings, enter your Razorpay API keys (Key ID and Key Secret), and enable online payments. This allows your customers to securely pay using credit/debit cards, UPI, and net banking.',
      placeholder: 'Razorpay Integration Placeholder'
    },
    {
      title: 'Register Branch',
      description: 'If you operate from multiple locations, you can add them here. Register each physical branch, define its specific address, and allocate inventory. You can also assign specific staff members or managers to handle operations for each individual branch directly from the dashboard.',
      placeholder: 'Register Branch Placeholder'
    }
  ];

  toggleStep(index: number) {
    this.openStepIndex = this.openStepIndex === index ? -1 : index;
  }
}
