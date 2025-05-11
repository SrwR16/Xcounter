# XCounter Frontend

This is the frontend application for the XCounter Movie Event Booking System, built with Next.js and modern web technologies.

## Features

- Modern React application with Next.js 14
- TypeScript for type safety
- Responsive design with Tailwind CSS
- Authentication system with JWT
- Data fetching with React Query
- Form validation with React Hook Form and Zod
- Interactive UI components
- Dashboard for admin and moderator roles

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Query, React Context
- **Form Handling**: React Hook Form, Zod
- **HTTP Client**: Axios
- **Charts**: Chart.js, React-Chartjs-2
- **UI Components**: Headless UI, Heroicons
- **Animation**: Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the frontend directory
3. Install dependencies:

```bash
cd frontend
npm install
# or
yarn install
```

### Development

Start the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Building for Production

```bash
npm run build
# or
yarn build
```

### Running Production Build

```bash
npm run start
# or
yarn start
```

## Project Structure

```
frontend/
├── public/          # Static assets
├── src/
│   ├── app/         # App router pages
│   ├── components/  # React components
│   │   ├── auth/    # Authentication related components
│   │   ├── booking/ # Booking related components
│   │   ├── dashboard/ # Dashboard components
│   │   ├── layout/  # Layout components
│   │   ├── movie/   # Movie related components
│   │   ├── providers/ # Context providers
│   │   └── ui/      # Reusable UI components
│   ├── hooks/       # Custom React hooks
│   ├── lib/         # Utility functions and services
│   └── types/       # TypeScript type definitions
├── tailwind.config.js # Tailwind configuration
└── next.config.js   # Next.js configuration
```

## API Integration

The frontend connects to the Django backend API. Connection settings can be configured in the `.env.local` file:

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
