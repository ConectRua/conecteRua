# Overview

This project is a georeferencing system for social assistance and health services in specific regions of Brazil (Samambaia, Recanto das Emas, and Água Quente). Its main purpose is to map healthcare facilities (UBS), NGOs, and patients to facilitate intelligent pairing based on geographic proximity and service availability. Key capabilities include an interactive map interface, comprehensive management dashboards, and robust data import functionalities with advanced geocoding and validation. The system aims to optimize resource allocation, improve access to services, and enhance operational efficiency for social and health initiatives.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
The application uses React, TypeScript, `shadcn/ui`, and Tailwind CSS for a consistent, responsive, and modern component-based design. It features client-side navigation with protected routes and a responsive layout for both desktop and mobile.

## Technical Implementations
- **Frontend**: Built with React, TypeScript, and `@tanstack/react-query` for server state management.
- **Backend**: An Express.js server with PostgreSQL and Drizzle ORM for data storage. It includes a robust authentication system, structured JSON logging, and comprehensive security measures.
- **Authentication**: Secure `passport.js` local strategy with PostgreSQL session persistence, email verification (production), session regeneration, and secure cookie configurations.
- **Map Integration**: Utilizes Google Maps JavaScript API for interactive maps, custom markers, layer toggling, and drag-and-drop marker positioning.
- **Geolocation**: A unified helper system using Capacitor Geolocation API (with browser fallback) provides platform-specific error messages and user guidance for location permissions.
- **Geocoding**: An advanced system uses Google Places API, Google Geocoding API, and ViaCEP for precise address resolution, especially for Brazilian addresses, with automatic retries and address enrichment.
- **Data Management & Import**: Supports intelligent data import from spreadsheets, Google Places integration for data enrichment, multi-criteria scoring for smart matching, confidence indicators, and comprehensive validation for bulk operations (create, update, delete) across all entity types. Custom import formats are supported for specific patient data.
- **Form Management**: `React Hook Form` with `Zod` validation ensures robust form handling and validation.
- **Calendar System**: An advanced month view for appointments using `date-fns` with `pt-BR` locale, displaying events, navigation, and detailed patient lists.
- **Territorial Activities**: Features real-time GPS location capture, activity registration with automatic reverse geocoding, and full CRUD operations. Activities are displayed in card-based listings.
- **Georeferenced Reports**: Generates PDF reports for territorial activities with period and region filters, adhering to a specific institutional format with dynamic titles, activity details, and automatic pagination.
- **Agenda Management**: Comprehensive appointment management including adding new appointments with patient search and date pickers, rescheduling, and removing appointments. Integrates with patient records and the calendar.
- **Route Optimization**: Integrates Google Directions API to calculate and optimize routes for scheduled patient visits, displaying optimized order, distances, and travel times.
- **Mobile Support**: Capacitor integration enables cross-platform mobile deployment, leveraging native features like geolocation.

# External Dependencies

## Core Technologies
- **React 18**: Frontend framework
- **TypeScript**: Type safety
- **Vite**: Build tool
- **Tailwind CSS**: Styling

## UI Framework
- **shadcn/ui**: Component library

## Mapping Services
- **Google Maps JavaScript API**: Interactive maps
- **Google Directions API**: Route optimization
- **@googlemaps/js-api-loader**: API loading
- **@googlemaps/google-maps-services-js**: Server-side Google Maps APIs client

## Authentication
- **Passport.js**: Authentication strategies
- **connect-pg-simple**: PostgreSQL session store

## Form and Validation
- **React Hook Form**: Form management
- **Zod**: Runtime type validation
- **@hookform/resolvers**: Zod integration

## Data Management
- **@tanstack/react-query**: Server state management
- **Drizzle ORM**: PostgreSQL ORM

## Mobile Development
- **Capacitor**: Cross-platform mobile deployment
- **@capacitor/geolocation**: Device location services

## Backend Technologies
- **Express.js**: Backend framework
- **PostgreSQL**: Primary database