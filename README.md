# Hostel Management System

A modern, comprehensive hostel management system built with React, TypeScript, and Supabase. Features a luxury UI design with complaint management workflow and role-based access control.

## Features

- 🏠 **Multi-Hostel Support** - Manage multiple hostels from a single dashboard
- 📝 **Complaint Management** - Streamlined complaint submission and tracking
- 👥 **Role-Based Access** - Warden, Campus Coordinator, and Admin roles
- 💰 **Cost Management** - Cost estimation and approval workflow
- 📊 **Analytics Dashboard** - Real-time statistics and insights
- 🎨 **Modern UI** - Luxury design with glassmorphism effects
- 📱 **Responsive Design** - Works on all devices

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Routing**: React Router v7
- **Forms**: React Hook Form + Zod validation
- **State Management**: TanStack Query

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/sciawebdev/hostel.git
cd hostel/hostel-management
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. The `vercel.json` configuration is already included
3. Deploy automatically on every push to main

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Netlify

1. Connect your GitHub repository to Netlify
2. The `netlify.toml` configuration is already included
3. Deploy automatically on every push to main

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

### Manual Build

```bash
npm run build
```

The built files will be in the `dist` directory.

## Database Configuration

The application uses Supabase as the backend. The database schema includes:

- **Hostels** - Hostel information and configuration
- **Rooms** - Room details and capacity
- **Complaints** - Complaint tracking and workflow
- **Users** - Role-based user management
- **Staff Members** - Maintenance staff directory
- **Cost Approvals** - Financial workflow management

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and configurations
├── types/              # TypeScript type definitions
└── assets/             # Static assets
```

## Documentation

- **[Implementation Plan](./docs/IMPLEMENTATION_PLAN.md)** - Detailed project roadmap and features
- **[Role-Based Implementation](./docs/ROLE_BASED_IMPLEMENTATION.md)** - User roles and permissions system

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
