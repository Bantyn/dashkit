# Clothify Backend

Backend API for Clothify - Clothing Store SaaS Platform

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** Firebase Firestore
- **Auth:** Firebase Authentication
- **Storage:** Firebase Storage

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
```

3. Configure Firebase:
   - Create a Firebase project
   - Download service account JSON
   - Add credentials to `.env`

4. Run development server:

```bash
npm run dev
```

5. Build for production:

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── config/          # Configuration files
├── middlewares/     # Express middlewares
├── routes/          # API routes
├── controllers/     # Request handlers
├── services/        # Business logic
├── models/          # TypeScript interfaces
├── validators/      # Request validation
├── utils/           # Utility functions
├── app.ts           # Express app setup
└── server.ts        # Server entry point
```

## API Endpoints

### Health Check

- `GET /health` - Server health status

### Authentication (Coming Soon)

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`

### Shops (Coming Soon)

- `GET /api/v1/shops/:shopId`
- `PUT /api/v1/shops/:shopId`

## Environment Variables

See `.env.example` for required environment variables.

## Development

- Hot reload with nodemon
- TypeScript compilation
- Error handling and logging
