# Clothify Frontend

Frontend application for Clothify - Clothing Store SaaS Platform

## Tech Stack

- **Framework:** Angular 19+
- **Styling:** Tailwind CSS
- **Rendering:** Angular Universal (SSR)
- **Auth:** Firebase Authentication
- **Database:** Firebase Firestore
- **Storage:** Firebase Storage

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment:
   - Update `src/environments/environment.ts` with your Firebase config
   - Set API URL to your backend

3. Run development server:

```bash
npm start
```

4. Build for production:

```bash
npm run build
```

5. Run SSR server:

```bash
npm run serve:ssr:frontend
```

## Project Structure

```
src/
├── app/
│   ├── core/              # Singleton services (Auth, API)
│   ├── shared/            # Shared components & utilities
│   ├── features/          # Feature modules
│   │   ├── dashboard/     # Shop owner dashboard
│   │   ├── invoices/      # Invoice management
│   │   ├── products/      # Product management
│   │   ├── customers/     # Customer management
│   │   ├── employees/     # Employee management
│   │   ├── storefront/    # Customer-facing storefront
│   │   └── settings/      # Shop settings
│   ├── app.ts             # Root component
│   ├── app.config.ts      # App configuration
│   └── app.routes.ts      # Routing
├── environments/          # Environment configs
├── styles.css             # Global styles
└── index.html             # Entry HTML

## Available Scripts

- `npm start` - Development server
- `npm run build` - Production build
- `npm run build:ssr` - SSR build
- `npm test` - Run tests
- `npm run serve:ssr:frontend` - Serve SSR app

## Features

### Shop Owner Dashboard
- Invoice management
- Product catalog
- Customer database
- Employee management
- Analytics & insights
- SEO settings

### Customer Storefront (SSR)
- SEO-optimized product pages
- Shop customization
- Contact forms
- Responsive design

## Environment Variables

Configure in `src/environments/environment.ts`:
- `apiUrl` - Backend API URL
- `firebase` - Firebase configuration object
```
