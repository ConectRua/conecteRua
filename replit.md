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
The system integrates the Google Maps JavaScript API for interactive mapping. It supports custom markers for different entity types (UBS, ONGs, patients, social equipment), layer toggling, and an edit mode for marker positioning with drag-and-drop functionality. 

### Geolocation Services
Geolocation is provided through a unified helper system (`geolocation-helper.ts`) that:
- Detects iOS/iPhone devices using user agent analysis
- Provides platform-specific error messages and instructions
- Uses Capacitor Geolocation API with browser fallback
- Offers clear, actionable guidance for users when location permissions are denied
- Includes step-by-step instructions for enabling location services on iOS devices
- Integrates with toast notifications for user feedback

### Geocoding System
An advanced geocoding system uses Google Places API as the primary source, with intelligent fallbacks to Google Geocoding API and ViaCEP, featuring automatic retries, address enrichment, and multi-layer filtering for high precision, especially for Brazilian addresses.

## Data Management and Import
Data import capabilities include intelligent Google Places integration for Excel spreadsheets, automatically matching and enriching establishment data with phone numbers, business hours, and precise coordinates. It features a multi-criteria scoring algorithm for smart matching, confidence indicators, and a comprehensive validation system that detects duplicates and verifies data against Google Places before import. Bulk operations, including create, update, and delete for all entity types (UBS, ONGs, pacientes, equipamentos sociais), are supported with robust validation and error handling.

### Custom Import Formats
The system supports specialized import formats for different use cases:

#### Lista Alfabética (Personalized Patient Import)
A custom format for patient spreadsheets with the following structure:
- **NOME** (Column A): Patient name
- **QR** (Column B): Region/neighborhood identifier (e.g., "QR 101", "QR 115")
- **LOCAL** (Column C): Specific address or location within the region
- **DN** (Column D): Date of birth (optional)
- **CPF** (Column E): Brazilian tax ID number
- **ATUALIZAÇÃO** (Column F): Update notes or observations

**Special Features:**
- Automatically combines QR + LOCAL columns to create the full address
- Maps CPF field to cnsOuCpf (unified identification field)
- Maps ATUALIZAÇÃO field to observacoes (notes)
- CEP field is optional - when not provided, the system uses geocoding to automatically populate coordinates
- Supports geocoding-first approach where address precision is prioritized over postal code

## Form Management
`React Hook Form` with `Zod` validation is used for all forms, ensuring robust handling, comprehensive validation, and clear error messaging.

## Calendar System
An advanced calendar month view is implemented for the "Agenda" page. It displays patient appointments in a 7x6 grid, with visual indicators for events, month navigation, and a responsive sidebar for detailed patient lists on day selection. The calendar uses `date-fns` with `pt-BR` locale for proper localization.

## Territorial Activities (Atividades Territoriais)
A complete feature for tracking territorial activities with GPS location capture:

**Core Features:**
- Real-time GPS location capture using Capacitor Geolocation API with browser fallback
- Activity registration form with title, people count, location description, address, CEP, and region
- Automatic GPS coordinate capture with reverse geocoding to auto-fill address and CEP
- Card-based activity listing with complete information display including address and CEP
- Full CRUD operations (Create, Read, Update, Delete)
- Edit functionality with pencil icon button on each activity card

**Technical Implementation:**
- Database table: `atividades_territoriais` with columns for GPS coordinates (latitude/longitude), address (endereco), CEP, metadata, and timestamps
- Backend REST API endpoints: GET, POST, PUT, DELETE at `/api/atividades-territoriais/*`
- Frontend page at `/atividades-territoriais` with form dialog and responsive card layout
- Integration with reverse geocoding endpoint `/api/geocode/reverse` for automatic address lookup
- Integration with existing authentication and audit logging system
- Validation using Zod schemas with type coercion (z.coerce.number()) for seamless number field handling

**User Workflow:**
1. User clicks "Nova Atividade" button to open registration dialog
2. Clicks "Usar GPS" button to capture current location
3. System automatically performs reverse geocoding and fills address and CEP fields
4. User fills in remaining activity details (title, people count, description, region)
5. Activity is saved with coordinates, address, CEP and displayed in card grid
6. Users can view all activities with timestamps, location data, edit or delete as needed
7. Editing: Click pencil icon on card → form opens pre-filled with activity data → make changes → save updates

## Georeferenced Reports (Relatórios Georreferenciados)
PDF report generation system for territorial activities with precise formatting:

**Core Features:**
- Period filter: Select date range (start date and end date) for activities
- Region filter: Select specific region (Samambaia, Recanto das Emas, Água Quente) or all regions
- PDF generation following exact institutional format
- Activity preview with count before generating report

**PDF Format:**
- Fixed title: "MAPA GEORREFERENCIADO - EQUIPE ECR SAMAMBAIA"
- Dynamic subtitle: "LOCAIS DE ABORDAGEM - [SELECTED REGION]"
- For each activity, displays with checkboxes:
  * ☐ Activity title in bold
  * ☐ Coordenadas: decimal format with 6 decimal places (e.g., -15.883707, -48.100167)
  * ☐ Quantidade de pessoas: XX PSR format
  * ☐ Descrição do local: full description text
- When "Todas as Regiões" selected, creates separate sections for each region
- Automatic pagination for long lists

**Technical Implementation:**
- Frontend page at `/relatorios` with date pickers and region selector
- Uses jspdf for PDF generation with complete metadata (title, author, creator, keywords)
- Filters activities by date range (inclusive of last day using 23:59:59.999 timestamp)
- Filters by region when specific region selected
- Groups activities by region when "Todas" selected, including activities without region as "Sem Região Definida"
- Real-time preview of filtered activities count
- Clean, professional filename format: `Relatorio-Georreferenciado-{region}-{start-date}-a-{end-date}.pdf`
- PDF metadata added to prevent antivirus false positives

## Route Optimization (Otimização de Rotas)
Intelligent route optimization system for daily scheduled patient visits using Google Directions API:

**Core Features:**
- Automatic route calculation for scheduled appointments on selected calendar day
- Waypoint optimization to minimize travel distance and time
- Visual display of optimized visit order with distances between stops
- Total distance and estimated travel time calculations
- Smart filtering to include only patients with valid GPS coordinates

**User Workflow:**
1. User selects a day in the Agenda calendar with multiple scheduled appointments
2. System displays "Rota Otimizada" section if 2+ patients have valid coordinates
3. User clicks "Calcular Melhor Rota" button
4. Backend calls Google Directions API with waypoint optimization enabled
5. System displays optimized visit order with numbered sequence
6. Each visit shows patient name, distance from previous stop, and estimated time
7. Summary shows total route distance and duration
8. Route resets automatically when user changes calendar date

**Technical Implementation:**
- Backend service: `GoogleDirectionsService` at `server/services/googleDirectionsService.ts`
- API endpoint: POST `/api/routes/optimize` with origin/destinations payload
- Uses Google Directions API with `optimizeWaypoints: true` parameter
- Frontend component integrated in `src/pages/Agenda.tsx` below daily events
- Mutation-based approach using `@tanstack/react-query` with loading states
- Validates minimum 2 patients with coordinates before optimization
- Extracts first patient as origin, remaining patients as destinations
- Parses API response to extract optimized order, distances, and durations
- Toast notifications for success/error feedback

**API Usage:**
- Free tier: 40,000 requests/month (Google Directions API)
- Cost-effective for typical usage patterns
- Results cached client-side until date changes

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
- **Google Directions API**: Route optimization and waypoint calculation
- **@googlemaps/js-api-loader**: API loading
- **@googlemaps/google-maps-services-js**: Server-side Google Maps APIs client

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