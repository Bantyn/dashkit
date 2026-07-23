import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface FaqItem {
  question: string;
  answer: string;
  open: boolean;
}

@Component({
  selector: 'app-shipping-help',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex-1 overflow-y-auto bg-gray-50 h-full">
      <main class="p-6 md:p-8 max-w-full mx-auto space-y-8">
        <!-- Header -->
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Shipping Help</h2>
          <p class="text-sm text-gray-500 mt-1">
            Learn how to connect and use Shiprocket for your shop.
          </p>
        </div>

        <!-- Setup Guide -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
            <div class="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
              <i class="bi bi-journal-text text-indigo-600"></i>
            </div>
            <h3 class="font-bold text-gray-900">Setup Guide</h3>
          </div>

          <div class="divide-y divide-gray-50">
            @for (step of steps; track step.number) {
              <div class="flex gap-4 p-6">
                <div
                  class="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center"
                >
                  {{ step.number }}
                </div>
                <div class="flex-1">
                  <h4 class="font-semibold text-gray-900 text-sm">{{ step.title }}</h4>
                  <p class="text-sm text-gray-500 mt-1">{{ step.description }}</p>
                  @if (step.link) {
                    <a
                      [href]="step.link"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center gap-1 mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      {{ step.linkLabel }}
                      <i class="bi bi-box-arrow-up-right text-xs"></i>
                    </a>
                  }
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Info Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-blue-50 border border-blue-100 rounded-2xl p-5">
            <div class="flex items-center gap-2 mb-2">
              <i class="bi bi-shield-check text-blue-600 text-lg"></i>
              <h4 class="font-semibold text-blue-900 text-sm">Your credentials are secure</h4>
            </div>
            <p class="text-xs text-blue-700">
              Your Shiprocket password is used only once to generate a temporary token. The token is
              encrypted with AES-256 before being stored — your password is never saved.
            </p>
          </div>
          <div class="bg-amber-50 border border-amber-100 rounded-2xl p-5">
            <div class="flex items-center gap-2 mb-2">
              <i class="bi bi-clock-history text-amber-600 text-lg"></i>
              <h4 class="font-semibold text-amber-900 text-sm">Token refresh</h4>
            </div>
            <p class="text-xs text-amber-700">
              Shiprocket tokens expire every 24 hours. If you see a "Token Expired" badge, simply
              re-enter your credentials in the Setup tab to reconnect.
            </p>
          </div>
        </div>

        <!-- FAQ -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
            <div class="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
              <i class="bi bi-question-circle text-purple-600"></i>
            </div>
            <h3 class="font-bold text-gray-900">Frequently Asked Questions</h3>
          </div>

          <div class="divide-y divide-gray-50">
            @for (faq of faqs; track faq.question) {
              <div>
                <button
                  (click)="faq.open = !faq.open"
                  class="w-full text-left px-6 py-4 flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors"
                >
                  <span class="text-sm font-medium text-gray-900">{{ faq.question }}</span>
                  <i
                    class="bi text-gray-400 flex-shrink-0 mt-0.5 transition-transform"
                    [class.bi-chevron-down]="!faq.open"
                    [class.bi-chevron-up]="faq.open"
                  ></i>
                </button>
                @if (faq.open) {
                  <div class="px-6 pb-5 text-sm text-gray-600 leading-relaxed -mt-1">
                    {{ faq.answer }}
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Support CTA -->
        <div
          class="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 flex items-center justify-between gap-4"
        >
          <div class="text-white">
            <h4 class="font-bold">Still need help?</h4>
            <p class="text-sm text-indigo-200 mt-1">
              Reach out to our support team and we'll get back to you shortly.
            </p>
          </div>
          <a
            href="mailto:support@clothify.com"
            class="flex-shrink-0 px-4 py-2 bg-white text-indigo-700 font-semibold rounded-xl text-sm hover:bg-indigo-50 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </main>
    </div>
  `,
})
export class ShippingHelpComponent {
  steps = [
    {
      number: 1,
      title: 'Create a Shiprocket Account',
      description:
        'Visit the Shiprocket website and sign up for a free account using your business email address.',
      link: 'https://app.shiprocket.in/register',
      linkLabel: 'Create account on Shiprocket →',
    },
    {
      number: 2,
      title: 'Complete KYC Verification',
      description:
        'Log in to your Shiprocket dashboard, go to Settings → KYC, and upload the required business documents. Verification usually takes 1–2 business days.',
      link: null,
      linkLabel: null,
    },
    {
      number: 3,
      title: 'Add a Pickup Location',
      description:
        'In Shiprocket, go to Settings → Manage Pickup Addresses and add the location where couriers will collect your orders. Make sure the pin code is serviceable.',
      link: null,
      linkLabel: null,
    },
    {
      number: 4,
      title: 'Note Your Login Credentials',
      description:
        'The email and password you used to sign up on Shiprocket are the credentials you will use to connect your account here. You do not need to generate a separate API key.',
      link: null,
      linkLabel: null,
    },
    {
      number: 5,
      title: 'Connect to Your Shop',
      description:
        'Go to Shipping → Setup in this dashboard, enter your Shiprocket email and password, and click "Connect Account". Once connected, select your default pickup location.',
      link: null,
      linkLabel: null,
    },
  ];

  faqs: FaqItem[] = [
    {
      question: 'Is my Shiprocket password stored?',
      answer:
        'No. Your password is sent securely to our backend, which exchanges it for a temporary token. Only the encrypted token is stored — your password is discarded immediately.',
      open: false,
    },
    {
      question: "Why does it say 'Token Expired'?",
      answer:
        'Shiprocket authentication tokens are valid for 24 hours. After that, you need to reconnect. Go to Shipping → Setup and enter your credentials again to generate a fresh token.',
      open: false,
    },
    {
      question: 'Can I have multiple pickup locations?',
      answer:
        'Yes. All pickup locations registered in your Shiprocket account will appear in the dropdown. You can set one as the default — it will be used automatically when orders are shipped.',
      open: false,
    },
    {
      question: 'What happens if the token expires during an order?',
      answer:
        'The system will detect the expired token and return an error. The order will not be pushed to Shiprocket until you reconnect. You will see a "Token Expired" badge on the setup page.',
      open: false,
    },
    {
      question: 'Do I need a paid Shiprocket plan?',
      answer:
        "Shiprocket offers a free tier for small volumes. For higher order volumes, a paid plan may be required. Refer to Shiprocket's pricing page for current details.",
      open: false,
    },
    {
      question: 'What couriers does Shiprocket support?',
      answer:
        'Shiprocket integrates with 25+ courier partners including Delhivery, FedEx, Ekart, Bluedart, and more. The best courier is selected automatically based on your pickup and delivery pin codes.',
      open: false,
    },
  ];
}
