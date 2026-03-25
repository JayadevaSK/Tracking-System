# Employee Work Tracker - Backend API

A Node.js/Express backend API for the Employee Work Tracker system, built with TypeScript.

## Features

- RESTful API for work entry management
- JWT-based authentication and authorization
- PostgreSQL database integration
- Automatic work tracking capabilities
- Email notification system
- Comprehensive validation and error handling

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Testing**: Jest with fast-check for property-based testing

## Project Structure

```
src/
├── services/      # Business logic and service layer
├── models/        # Data models and database operations
├── routes/        # API route definitions
├── middleware/    # Express middleware functions
└── utils/         # Utility functions and helpers
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Set up the database:
```bash
# Create the database and run migrations (to be implemented)
```

### Development

Run the development server with hot reload:
```bash
npm run dev
```

### Building

Build the TypeScript code:
```bash
npm run build
```

### Running in Production

```bash
npm run build
npm start
```

### Testing

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/validate` - Validate token

### Work Entries
- `POST /api/work-entries` - Create work entry
- `GET /api/work-entries/:id` - Get work entry by ID
- `PUT /api/work-entries/:id` - Update work entry
- `DELETE /api/work-entries/:id` - Delete work entry
- `GET /api/work-entries/employee/:employeeId/date/:date` - Get entries by date
- `GET /api/work-entries/employee/:employeeId/range` - Get entries by date range
- `GET /api/work-entries/search` - Search work entries

### Dashboard
- `GET /api/dashboard/summary/:employeeId/:date` - Get daily summary
- `GET /api/dashboard/team/:managerId/:date` - Get team overview
- `GET /api/dashboard/metrics/:employeeId` - Get work metrics

### Tracking
- `POST /api/tracking/:employeeId/enable` - Enable automatic tracking
- `POST /api/tracking/:employeeId/disable` - Disable automatic tracking
- `GET /api/tracking/:employeeId/status` - Get tracking status

### Notifications
- `PUT /api/notifications/preferences` - Update notification preferences
- `GET /api/notifications/preferences/:userId` - Get notification preferences

## Environment Variables

See `.env.example` for all required environment variables.

## License

ISC
