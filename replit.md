# Overview

This project is a georeferencing system designed for social assistance and health services in specific regions of Brazil (Samambaia, Recanto das Emas, and Água Quente). Its primary purpose is to map healthcare facilities (UBS), NGOs, and patients, facilitating intelligent pairing between patients and the nearest healthcare units based on geographic proximity and service availability. Key capabilities include an interactive map interface, comprehensive management dashboards for various entities, and robust data import functionalities with advanced geocoding and validation. The system aims to optimize resource allocation, improve access to services, and enhance overall operational efficiency for social and health initiatives.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The application is built with React, TypeScript, and a modern component-based architecture using `shadcn/ui` and Tailwind CSS for a consistent and responsive design. It utilizes React Router DOM for client-side navigation with protected routes. State management primarily relies on React hooks and context, with `@tanstack/react-query` handling server state caching. A custom mock data layer is used for development.

## Backend Architecture
The backend is an Express.js server featuring a production-ready authentication system. It uses PostgreSQL for data storage, managed with Drizzle ORM, and `connect-pg-simple` for persistent session management. The system includes structured JSON logging for audit trails and performance tracking, comprehensive security measures (XSS prevention, CSRF protection, secure cookies, session regeneration), and robust error handling.

## Authentication System
A secure authentication system built with `passport.js` local strategy is implemented. It includes PostgreSQL session persistence, enforces email verification in production, prevents session fixation attacks through session regeneration, and uses secure cookie configurations (`httpOnly`, `sameSite`, `secure`). All authentication events are logged in a structured JSON format.

## Map Integration
The system integrates the Google Maps JavaScript API for interactive mapping. It supports custom markers for different entity types (UBS, ONGs, patients, social equipment), layer toggling, and an edit mode for marker positioning with drag-and-drop functionality. Geolocation services are provided via Capacitor for mobile support. An advanced geocoding system uses Google Places API as the primary source, with intelligent fallbacks to Google Geocoding API and ViaCEP, featuring automatic retries, address enrichment, and multi-layer filtering for high precision, especially for Brazilian addresses.

## Data Management and Import
Data import capabilities include intelligent Google Places integration for Excel spreadsheets, automatically matching and enriching establishment data with phone numbers, business hours, and precise coordinates. It features a multi-criteria scoring algorithm for smart matching, confidence indicators, and a comprehensive validation system that detects duplicates and verifies data against Google Places before import. Bulk operations, including create, update, and delete for all entity types (UBS, ONGs, pacientes, equipamentos sociais), are supported with robust validation and error handling.

## Form Management
`React Hook Form` with `Zod` validation is used for all forms, ensuring robust handling, comprehensive validation, and clear error messaging.

## Calendar System
An advanced calendar month view is implemented for the "Agenda" page. It displays patient appointments in a 7x6 grid, with visual indicators for events, month navigation, and a responsive sidebar for detailed patient lists on day selection. The calendar uses `date-fns` with `pt-BR` locale for proper localization.

## Mobile Support
Capacitor integration enables cross-platform mobile app deployment, leveraging native device features like geolocation. The application is designed to be responsive across desktop and mobile devices.

# External Dependencies

## Core Technologies
- **React 18**: Frontend framework
- **TypeScript**: Type safety
- **Vite**: Build tool and development server
- **Tailwind CSS**: Utility-first styling

## UI Framework
- **shadcn/ui**: Component library built on Radix UI

## Mapping Services
- **Google Maps JavaScript API**: Interactive mapping
- **@googlemaps/js-api-loader**: API loading

## Authentication
- **Passport.js**: User authentication strategies
- **connect-pg-simple**: PostgreSQL session store
- **Crypto module**: Secure password hashing

## Form and Validation
- **React Hook Form**: Form management
- **Zod**: Runtime type validation
- **@hookform/resolvers**: Integration with Zod

## Data Management
- **@tanstack/react-query**: Server state management and caching
- **Drizzle ORM**: PostgreSQL ORM

## Mobile Development
- **Capacitor**: Cross-platform mobile app deployment
- **@capacitor/geolocation**: Device location services

## Backend Technologies
- **Express.js**: Backend web framework
- **PostgreSQL**: Primary database