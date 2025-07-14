# Zappy Health Dashboard

Zappy Health Dashboard is a modern web application for managing healthcare operations, supporting both patients and staff. It features a clean landing page, secure authentication, and a comprehensive dashboard for various healthcare workflows.

## Features
- Landing page with floating login options for patients and staff
- Secure authentication for different user roles
- Patient and staff dashboards
- Management of patients, orders, invoices, pharmacy, providers, and more
- Messaging, notifications, and audit logs
- Responsive UI with Tailwind CSS
- Built with React and Vite for fast development

## Tech Stack
- React
- Vite
- Tailwind CSS
- React Router
- Supabase (for backend services)

## Getting Started

### Prerequisites
- Node.js (v18 or later recommended)
- npm or yarn

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/Zappy-Dashboard.git
   cd Zappy-Dashboard
   ```
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production
```bash
npm run build
# or
yarn build
```

## Project Structure
- `src/pages/` — Main app pages (LandingPage, Dashboard, Auth, etc.)
- `src/components/` — Reusable UI components
- `src/layouts/` — Layout wrappers (e.g., MainLayout)
- `src/constants/` — Route and config constants
- `src/apis/` — API hooks and service logic
- `public/` — Static assets and HTML template

## Contribution
Pull requests are welcome! Please see the issues and TODO files for areas needing improvement.

## License
This project is for internal use. Contact the maintainers for licensing details.
