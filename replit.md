# Overview

This is a georeferencing system for social assistance and health services in Samambaia, Recanto das Emas, and Águas Claras. The application maps healthcare facilities (UBS), NGOs, and patients, providing intelligent pairing between patients and nearest healthcare units based on geographic proximity and service availability. It features an interactive map interface, comprehensive management dashboards, and data import capabilities.

# Recent Changes

## September 30, 2025 - Phase 9: Advanced Geocoding & Bulk Import System COMPLETED
- ✅ **Google Places API integration**: Migrated from Geocoding API to Places API (Text Search) for superior precision
- ✅ **Intelligent fallback chain**: Places API → Geocoding API → ViaCEP with automatic retry and backoff
- ✅ **Multi-source geocoding**: ViaCEP enrichment + Google Places + Geocoding ensures maximum address coverage
- ✅ **Bulk import endpoint**: POST /api/pacientes/importar with configurable batch processing (1-50 per batch)
- ✅ **Retry mechanism**: 3 attempts with exponential backoff for geocoding (1s, 2s, 4s) and persistence (0.5s, 1s, 2s)
- ✅ **Comprehensive validation**: Zod schema validation per record, graceful error handling, DoS prevention
- ✅ **Progress metrics**: Real-time tracking with elapsed time, batches processed, success/error/warning counts
- ✅ **Coordinate update API**: PUT /api/pacientes/:id/coordenadas for map-based coordinate adjustments
- ✅ **Security hardening**: Batch size validation (1-50), latitude/longitude bounds checking, authentication enforcement
- ✅ **Production-ready**: Architect-approved implementation with full test coverage

## September 29, 2025 - Phase 8: Calendar Month View Implementation COMPLETED
- ✅ **Calendar visualization**: Added third tab "Calendário" to Agenda page with full month grid view (7×6 layout)
- ✅ **Event indicators**: Visual dots (blue for próximo, green for último) on days with patient appointments
- ✅ **Month navigation**: Previous/next month buttons with proper date-fns locale support (pt-BR)
- ✅ **Day selection system**: Click any day to view detailed patient list in responsive sidebar panel
- ✅ **42-day fixed grid**: Proper calendar layout with Sunday-first alignment and trailing/leading dates
- ✅ **Performance optimization**: Memoized events mapping (useMemo) for efficient data processing
- ✅ **Quality assurance**: Complete data-testid coverage, architect-approved implementation

## September 22, 2025 - Phase 7: System Corrections and Statistics Implementation COMPLETED
- ✅ **Statistics API endpoint**: Implemented GET /api/estatisticas with comprehensive data insights
- ✅ **Patient registration fixes**: Corrected React Query configuration for proper API integration
- ✅ **Security improvements**: Added session cookie files to .gitignore to prevent exposure
- ✅ **Data persistence verification**: Confirmed end-to-end patient creation and data storage
- ✅ **Geolocation functionality**: Validated coordinate capture and storage in database
- ✅ **Real API integration**: Complete migration from mock data to PostgreSQL backend
- ✅ **Comprehensive testing**: All CRUD operations and statistics endpoints verified functional

## September 22, 2025 - Phase 6: Production-Ready Authentication COMPLETED
- ✅ **Security hardening completed**: SessionID removed from logs, session fixation prevention, auto-login blocked in production
- ✅ **PostgreSQL session store**: Implemented with connect-pg-simple for persistent sessions
- ✅ **Structured logging system**: JSON-formatted logs with audit trails and performance tracking  
- ✅ **Production environment configuration**: SESSION_SECRET enforcement, secure cookies (httpOnly, sameSite, secure)
- ✅ **Email verification flow**: Auto-verification disabled in production, verification required before login
- ✅ **Architect approved**: System confirmed as production-ready with no critical security vulnerabilities

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
The application features a production-ready authentication system with PostgreSQL session persistence, structured audit logging, and comprehensive security hardening. Built with passport.js local strategy, the system enforces email verification in production, implements session regeneration to prevent fixation attacks, and uses secure cookie configuration. All authentication events are logged with JSON structure for monitoring and compliance.

## Map Integration
Google Maps JavaScript API integration provides interactive mapping capabilities with custom markers for different entity types (UBS, ONGs, patients, social equipment). The map component supports layer toggling, edit mode for marker positioning with drag-and-drop coordinate updates, and real-time updates. Includes geolocation services through Capacitor for mobile device support. Advanced geocoding system uses Google Places API as primary source with intelligent fallback to Geocoding API and ViaCEP, featuring automatic retry with exponential backoff, address enrichment, and 4-layer filtering for maximum precision in Brazilian addresses.

## Form Management
React Hook Form with Zod validation provides robust form handling throughout the application. Forms include patient registration, UBS/ONG management, and data import interfaces with comprehensive validation and error handling.

## Calendar System
The Agenda page features a sophisticated calendar month view that displays patient appointments in a visual grid format. The calendar uses date-fns with Portuguese Brazilian locale, showing a fixed 42-day layout (6 weeks × 7 days) with proper weekday alignment. Events are indicated with colored dots (blue for próximo atendimento, green for último atendimento), and clicking on any day reveals a detailed list of patients scheduled for that date. Month navigation is smooth with previous/next controls, and the system includes performance optimizations through memoized data processing.

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
- PostgreSQL session store with connect-pg-simple for persistence
- Structured JSON logging with audit trails
- Production security hardening (secure cookies, session regeneration)
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

## Backend Architecture
Express.js server with production-ready authentication system featuring PostgreSQL storage with Drizzle ORM, structured JSON logging with performance tracking, and comprehensive security measures. Session management uses PostgreSQL persistence via connect-pg-simple. Security hardening includes XSS prevention, CSRF protection, secure cookie configuration, and session regeneration. Error handling middleware positioned correctly with audit logging for all authentication events.