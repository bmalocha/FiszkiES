# FiszkiES

A web application designed to help Polish users learn Spanish by automatically generating flashcards from any pasted text, allowing users to save and view them :).

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Table of Contents
- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Development Guidelines](#development-guidelines)
- [License](#license)

## Project Overview

FiszkiES is a modern web application that helps Polish users learn Spanish through an interactive flashcard system. The application allows users to:

- Generate flashcards automatically from pasted Spanish text
- Save flashcards for later practice

## Tech Stack

- [Astro](https://astro.build/) v5.5.5 - Modern web framework for building fast, content-focused websites
- [React](https://react.dev/) v19.0.0 - UI library for building interactive components
- [TypeScript](https://www.typescriptlang.org/) v5 - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) v4.0.17 - Utility-first CSS framework
- [Shadcn/ui](https://ui.shadcn.com/) - Beautiful and accessible components
- [Supabase](https://supabase.com/) - Backend services and database
- [Vitest](https://vitest.dev/) - Unit & integration testing framework
- [Playwright](https://playwright.dev/) - End-to-end testing framework

## Getting Started

### Prerequisites

- Node.js (as specified in `.nvmrc`)
- npm (comes with Node.js)
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/bmalocha/FiszkiES.git
cd FiszkiES
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
OPENROUTER_API_KEY=your_openrouter_api_key
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run astro` - Run Astro CLI commands
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run test` - Run unit and integration tests
- `npm run test:e2e` - Run end-to-end tests

## Project Structure

```
.
├── src/
│   ├── layouts/    # Astro layouts
│   ├── pages/      # Astro pages
│   │   └── api/    # API endpoints
│   ├── middleware/ # Astro middleware
│   ├── db/        # Supabase clients and types
│   ├── types.ts   # Shared types
│   ├── components/ # UI components
│   │   └── ui/    # Shadcn/ui components
│   ├── lib/       # Services and helpers
│   ├── assets/    # Static assets
│   └── styles/    # Global styles
├── public/        # Public assets
└── .env          # Environment variables
```

## Development Guidelines

### Code Style

- Use ESLint and Prettier for code formatting
- Follow TypeScript best practices
- Implement proper error handling
- Write clean, maintainable code
- Use early returns and guard clauses
- Implement proper error logging
- Follow testing guidelines from `.ai/test-plan.md`

### Frontend Development

- Use Astro components for static content
- Implement React components for interactive features
- Follow accessibility best practices
- Use Tailwind CSS for styling
- Leverage Shadcn/ui components

### Backend Integration

- Use Supabase for backend services
- Implement proper data validation
- Follow security best practices
- Use environment variables for sensitive data

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
