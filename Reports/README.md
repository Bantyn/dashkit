# Clothify - Clothing Store SaaS Platform

> A multi-tenant SaaS platform for clothing shop owners to manage billing, customers, employees, and their own branded online storefront.

## 🎯 Project Overview

Clothify enables clothing shop owners to:

- ✅ Create and manage invoices
- ✅ Build customer database
- ✅ Manage products and inventory
- ✅ Track employees and permissions
- ✅ Create their own SEO-optimized storefront
- ✅ View analytics and insights
- ✅ Manage subscriptions

## 🏗️ Architecture

```
clothify/
├── backend/          # Node.js + Express + Firebase
└── frontend/         # Angular + Tailwind + SSR
```

### Tech Stack

| Component    | Technology                                        |
| ------------ | ------------------------------------------------- |
| **Frontend** | Angular 19, Tailwind CSS, Angular Universal (SSR) |
| **Backend**  | Node.js, Express.js, TypeScript                   |
| **Database** | Firebase Firestore                                |
| **Auth**     | Firebase Authentication                           |
| **Storage**  | Firebase Storage                                  |
| **Hosting**  | Vercel (Frontend), Railway (Backend)              |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Firebase account
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Configure .env with Firebase credentials
npm run dev
```

Server runs on: `http://localhost:3000`

### Frontend Setup

```bash
cd frontend
npm install
# Update src/environments/environment.ts with Firebase config
npm start
```

App runs on: `http://localhost:4200`

## 📁 Project Structure

### Backend (`/backend`)

```
src/
├── config/          # Firebase & app configuration
├── middlewares/     # Auth, error handling, validation
├── routes/          # API route definitions
├── controllers/     # Request handlers
├── services/        # Business logic
├── models/          # TypeScript interfaces
├── validators/      # Request validation
└── utils/           # Helper functions
```

Key Files:

- `src/app.ts` - Express app setup
- `src/server.ts` - Server entry point
- `src/config/firebase.config.ts` - Firebase Admin SDK

### Frontend (`/frontend`)

```
src/app/
├── core/            # Singleton services
├── shared/          # Shared components
└── features/        # Feature modules
    ├── dashboard/   # Shop owner dashboard
    ├── invoices/    # Invoice management
    ├── products/    # Product management
    ├── customers/   # Customer management
    ├── employees/   # Employee management
    ├── storefront/  # Customer storefront (SSR)
    ├── analytics/   # Analytics & insights
    └── settings/    # Shop settings
```

## 🔥 Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable:
   - Authentication (Email/Password & Phone)
   - Firestore Database
   - Storage
3. Download service account key for backend
4. Get web app config for frontend

### Backend Configuration

In `backend/.env`:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

### Frontend Configuration

In `frontend/src/environments/environment.ts`:

```typescript
firebase: {
  apiKey: 'your-api-key',
  authDomain: 'your-app.firebaseapp.com',
  projectId: 'your-project-id',
  // ... other config
}
```

## 📋 Available Scripts

### Backend

- `npm run dev` - Development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production server

### Frontend

- `npm start` - Development server
- `npm run build` - Production build (SPA)
- `npm run build:ssr` - Production build with SSR
- `npm run serve:ssr:frontend` - Serve SSR app

## 🎨 Features

### Phase 1 (Current)

- [x] Project structure setup
- [x] Firebase integration
- [ ] Authentication system
- [ ] Shop owner dashboard
- [ ] Invoice management
- [ ] Product management
- [ ] Customer management
- [ ] SEO-optimized storefront
- [ ] Subscription system

### Phase 2 (Future)

- [ ] Employee payroll
- [ ] Inventory alerts
- [ ] Customer login portal
- [ ] Mobile app

### Phase 3 (Future)

- [ ] AI sales insights
- [ ] Custom domains
- [ ] Multi-language support

## 💰 Subscription Plans

| Plan      | Price   | Features                                    |
| --------- | ------- | ------------------------------------------- |
| **Free**  | ₹0      | 50 invoices, 1 employee                     |
| **Basic** | ₹499/mo | Unlimited invoices, Storefront, 3 employees |
| **Pro**   | ₹999/mo | Everything + Analytics + SEO + 10 employees |

## 📚 Documentation

- [Implementation Plan](./implementation_plan.md) - Full system architecture
- [Backend README](./backend/README.md) - Backend setup guide
- [Frontend README](./frontend/README.md) - Frontend setup guide

## 🔐 Security

- JWT-based authentication
- Firebase Security Rules for data isolation
- Multi-tenant architecture
- Role-based access control

## 📞 Support

For questions or issues, please open an issue on GitHub.

## 📄 License

MIT

---

**Built with ❤️ for clothing shop owners across India**
