# Overview

This is a georeferencing system for social assistance and health services in Samambaia, Recanto das Emas, and Águas Claras. The application maps healthcare facilities (UBS), NGOs, and patients, providing intelligent pairing between patients and nearest healthcare units based on geographic proximity and service availability. It features an interactive map interface, comprehensive management dashboards, and data import capabilities.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The application uses a modern React-based stack with TypeScript for type safety and maintainability. The UI is built with shadcn/ui components providing a consistent design system, while Tailwind CSS handles styling with a healthcare-focused color theme. The application follows a modular component architecture with clear separation between layout, forms, data visualization, and business logic components.

## State Management
State is managed through React hooks and context patterns, with @tanstack/react-query handling server state caching and synchronization. A custom mock data hook (useMockData) provides a complete data layer abstraction for development and prototyping, simulating real backend operations including CRUD operations for UBS, ONGs, patients, and social equipment.

## Routing and Navigation
React Router DOM provides client-side routing with protected routes ensuring authentication requirements. The layout system includes a responsive sidebar navigation and mobile-friendly header with search capabilities.

## Authentication System
The application includes a complete authentication system based on session-based auth with email verification support. Currently implemented with mock data for frontend development, but structured to easily integrate with a real backend. Uses passport.js for strategy-based authentication and includes user registration, login, logout, and profile management.

## Map Integration
Google Maps JavaScript API integration provides interactive mapping capabilities with custom markers for different entity types (UBS, ONGs, patients, social equipment). The map component supports layer toggling, edit mode for marker positioning, and real-time updates. Includes geolocation services through Capacitor for mobile device support.

## Form Management
React Hook Form with Zod validation provides robust form handling throughout the application. Forms include patient registration, UBS/ONG management, and data import interfaces with comprehensive validation and error handling.

## Mobile Support
Capacitor integration enables mobile app deployment with native device features like geolocation. The responsive design ensures optimal experience across desktop and mobile devices.

# External Dependencies

## Core Technologies
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server
- Tailwind CSS for utility-first styling approach

## UI Framework
- shadcn/ui component library built on Radix UI primitives
- Provides accessible, customizable components following design system principles

## Mapping Services
- Google Maps JavaScript API for interactive mapping functionality
- @googlemaps/js-api-loader for efficient API loading and management

## Authentication
- Passport.js with local strategy for user authentication
- Express session management with memory store
- Crypto module for secure password hashing

## Form and Validation
- React Hook Form for performant form management
- Zod for runtime type validation and schema definition
- @hookform/resolvers for seamless integration

## Data Management
- @tanstack/react-query for server state management and caching
- Custom mock data layer simulating backend operations

## Mobile Development
- Capacitor for cross-platform mobile app deployment
- @capacitor/geolocation for device location services
- Support for Android and iOS platforms

## Development Tools
- ESLint with TypeScript support for code quality
- Lovable integration for AI-assisted development
- PostCSS with Autoprefixer for CSS processing

## Backend Architecture (Prepared)
Express.js server setup with authentication routes, CORS configuration, and error handling middleware. Storage interface abstraction allows easy migration from memory-based mock data to database persistence. Session management configured for both development and production environments.