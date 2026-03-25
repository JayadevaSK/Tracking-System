# Employee Work Tracker - Frontend

React-based frontend application for the Employee Work Tracker system.

## Technology Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **React Router** - Navigation
- **Axios** - API communication
- **Chart.js** - Data visualization
- **React-ChartJS-2** - React wrapper for Chart.js

## Project Structure

```
frontend/
├── public/              # Static files
├── src/
│   ├── components/      # React components
│   ├── services/        # API service layer
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── App.tsx          # Main application component
│   ├── App.css          # Global styles
│   ├── index.tsx        # Application entry point
│   └── index.css        # Base styles
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your API URL if different from default

### Development

Start the development server:
```bash
npm start
```

The application will open at [http://localhost:3000](http://localhost:3000)

### Building for Production

Create a production build:
```bash
npm run build
```

### Running Tests

Run the test suite:
```bash
npm test
```

## Features

### Employee Dashboard
- Manual work entry interface
- View daily work summary
- Edit work entries (within 7-day window)

### Manager Dashboard
- Team overview with completion metrics
- Individual employee daily reports
- Historical data access
- Work entry search

## API Integration

The frontend communicates with the backend API through the service layer:

- **authService** - Authentication operations
- **workEntryService** - Work entry CRUD operations
- **dashboardService** - Dashboard data retrieval

All API calls include automatic JWT token handling and error interceptors.

## Available Scripts

- `npm start` - Start development server
- `npm build` - Create production build
- `npm test` - Run tests
- `npm eject` - Eject from Create React App (one-way operation)
