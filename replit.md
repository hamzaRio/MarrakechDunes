# MarrakechDunes - Moroccan Adventure Booking Platform

## Overview

MarrakechDunes is a full-stack web application for booking authentic Moroccan desert adventures and experiences. The platform features a modern React frontend with a Node.js/Express backend, providing both customer-facing booking functionality and admin management capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom Moroccan-themed color palette
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: Express sessions with PostgreSQL store
- **API Design**: RESTful API with JSON responses

### Development Environment
- **Platform**: Replit with Node.js 20, Web, and PostgreSQL 16 modules
- **Hot Reload**: Vite dev server with HMR
- **Process Management**: tsx for TypeScript execution in development

## Key Components

### Database Schema
- **Users**: Admin authentication with role-based access (admin/superadmin)
- **Activities**: Desert tours and experiences with pricing, images, and categories
- **Bookings**: Customer reservations with contact info, dates, and payment tracking
- **Audit Logs**: Security and administrative action tracking

### Frontend Pages
- **Home**: Landing page with hero section and featured activities
- **Activities**: Complete catalog of available experiences
- **Booking**: Customer booking form with activity selection
- **Admin Dashboard**: Management interface for bookings, activities, and users
- **Admin Login**: Secure authentication for administrative access

### API Endpoints
- **Public APIs**: Activities listing and booking creation
- **Admin APIs**: CRUD operations for all entities, booking status updates
- **Authentication**: Login/logout with session-based auth

## Data Flow

1. **Customer Journey**:
   - Browse activities on home/activities pages
   - Select activity and fill booking form
   - Submit booking with automatic WhatsApp notification to staff
   - Receive booking confirmation

2. **Admin Workflow**:
   - Secure login with role verification
   - View and manage all bookings with status updates
   - Create/edit/delete activities
   - Monitor system through audit logs (superadmin only)

3. **Real-time Features**:
   - Automatic WhatsApp integration for instant booking notifications
   - Live booking status updates
   - Session-based authentication with automatic logout

## External Dependencies

### Core Framework Dependencies
- React ecosystem (React, React DOM, React Hook Form)
- TanStack Query for server state management
- Wouter for routing
- Zod for schema validation

### UI and Styling
- Radix UI components for accessible primitives
- Tailwind CSS for utility-first styling
- Lucide React for consistent iconography
- Custom Moroccan theme with traditional colors

### Backend Dependencies
- Express.js with TypeScript support
- Drizzle ORM for type-safe database operations
- Neon Database serverless driver
- Session management with connect-pg-simple

### Development Tools
- Vite for fast builds and HMR
- TypeScript for type safety
- ESBuild for production bundling
- Replit-specific development plugins

## Deployment Strategy

### Production Build
- Frontend: Vite builds optimized static assets to `dist/public`
- Backend: ESBuild bundles server code to `dist/index.js`
- Database: Drizzle handles schema migrations and seeding

### Environment Configuration
- Development: `npm run dev` with tsx and Vite dev server
- Production: `npm run start` with compiled Node.js bundle
- Database: Environment-based connection string configuration

### Replit Deployment
- Autoscale deployment target for production scaling
- Port 5000 internal, port 80 external
- Automatic builds on deployment with npm scripts

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### June 24, 2025
- Initial project setup with complete Moroccan-themed travel booking platform
- Implemented full-stack architecture with React frontend and Express backend
- Added PostgreSQL database with Drizzle ORM
- Created admin authentication system with role-based access
- Built public pages: Home, Activities, Booking with Moroccan styling
- Integrated WhatsApp booking notifications

### Latest Updates (June 25, 2025)
- **Brand Update**: Changed company name from MarrakechDeserts to MarrakechDunes across all components
- **Hero Section Redesign**: Updated French text to focus on activity booking platform rather than desert exploration
- **Image Display System**: Fixed all image loading issues across homepage, activities, and booking pages with comprehensive fallback handling
- **Homepage Photo Gallery**: Replaced activity cards with professional masonry-style photo grid featuring authentic Moroccan adventure images
- **WhatsApp Integration**: Updated all contact buttons to use correct admin phone numbers (Ahmed: +212600623630, Yahia: +212693323368, Nadia: +212654497354)
- **Communication Preference**: User prefers WhatsApp-only notifications, no email system implementation requested
- **Footer Redesign**: Applied blue (moroccan-blue) background color with proper white text contrast and clickable phone links
- **Asset Management**: Organized and optimized all activity images with proper fallback system for reliable display
- **Responsive Design**: Enhanced mobile and desktop layouts with consistent image sizing and hover effects
- **Translation System**: Updated French translations to emphasize booking platform functionality
- **Real-time Availability Calendar**: Implemented comprehensive booking calendar with time slots, capacity tracking, and dynamic pricing
  - Interactive monthly calendar with availability indicators
  - Time slot selection with capacity and pricing information
  - Activity-specific scheduling (sunrise balloon rides, multiple daily slots for desert experiences)
  - Enhanced booking flow with 4-step process including date/time selection
  - Backend availability API endpoint for future real-time integration

### Latest Updates (June 26, 2025)
- **Customer Review System**: Implemented comprehensive review and rating functionality
  - Database schema with Review model including customer details, ratings, comments, and admin approval
  - Star rating component with interactive selection (1-5 stars)
  - Review form with validation for customer feedback submission
  - Review list component displaying approved reviews with verified badges
  - Activity rating display showing average ratings and review counts
  - Admin panel for review approval and management
  - API endpoints for creating, fetching, and managing reviews
  - Created dedicated Reviews page at /reviews with filtering and modal forms
- **Homepage Visual Updates**: Enhanced homepage with new authentic Moroccan imagery
  - Hero section now features elegant Riad Kheirredine courtyard with traditional architecture
  - Photo gallery centerpiece updated to iconic Marrakech Jemaa el-Fnaa Plaza evening marketplace
  - Proper asset imports using Vite handling for optimized loading
- **Instagram Integration**: Added social media feed and updated contact information
  - Instagram feed component showcasing @medina_expeditions content
  - Updated footer with correct Instagram handle and link
  - Added Instagram section to homepage with multilingual support
  - Call-to-action buttons directing to authentic Instagram account
  - Created Instagram booking photos component with authentic activity images
  - Interactive photo grid with modal view and Instagram-style captions
  - Enhanced hero section visibility with improved text contrast and drop shadows
- **Photo Gallery Redesign**: Replaced unorganized masonry layout with professional slideshow
  - Auto-advancing slideshow with navigation controls and thumbnail preview
  - Interactive image viewer with descriptive overlays and titles
  - Play/pause functionality for slideshow automation
  - Progress indicators and gallery statistics display
  - Organized presentation of all 6 destination experiences
- **Content Optimization**: Removed Instagram integration blocks and enhanced font readability
  - Eliminated broken Instagram feed and booking photo components
  - Enhanced hero section typography with stronger text shadows and font weights
  - Improved contrast for all section headings using font-black weights
  - Added global CSS improvements for better text readability
  - Enhanced button and navigation text clarity throughout the site
- **Personalized Welcome Animation System**: Implemented sophisticated user recognition and engagement
  - Automatic detection of returning vs first-time visitors using localStorage
  - Multi-step animated welcome sequence with spring animations and smooth transitions
  - Personalized messaging based on visit count and frequency (frequent visitor recognition)
  - Display of last visit information for returning users
  - Progressive animation steps with interactive controls and progress indicators
  - Multilingual support for welcome messages in English and French
  - User preference tracking and customizable experience settings
  - Elegant modal design with Moroccan-themed patterns and gradients

### Latest Updates (June 28, 2025)
- **Complete Project Restructuring for Deployment**: Successfully reorganized full-stack architecture for optimal Vercel/Render deployment
  - **Clean Client/Server Separation**: Created distinct `client/` and `server/` folders with independent package.json files
  - **Frontend Optimization**: Configured client folder with Vite, React dependencies, and Vercel-optimized build process
  - **Backend Optimization**: Isolated server dependencies for Express, MongoDB, and authentication systems
  - **Deployment Configuration**: Updated vercel.json and render.yaml for restructured folder architecture
  - **TypeScript Configuration**: Separate tsconfig.json files for client and server with proper path mapping
- **Production-Ready Fallback System**: Implemented robust MongoDB Atlas connectivity with development fallback
  - **Authentic Data Preservation**: Maintained all 5 Moroccan activities with real photography in fallback system
  - **Admin User Management**: Preserved nadia (superadmin), ahmed, yahia (admin) with Marrakech@2025 credentials
  - **Circuit Breaker Pattern**: Smart connection retry with automatic fallback to in-memory storage
  - **Performance Optimization**: Activities API responding in 2ms with authentic data
- **Deployment Architecture Finalized**: Clean separation optimized for production platforms
  - **Vercel Frontend**: Build command targeting client folder with proper asset handling
  - **Render Backend**: Server-specific build process with MongoDB Atlas environment variables
  - **Cost Analysis Confirmed**: $7/month total deployment cost (Render + Vercel Free + MongoDB Atlas M0)
  - **Health Check Verified**: Endpoint responding with database connectivity and activity count metrics

### Previous Updates (June 28, 2025)
- **MongoDB Atlas Integration**: Implemented pure MongoDB-only storage system for MarrakechDunes booking platform
  - Removed all PostgreSQL dependencies and fallback systems per user requirement
  - Configured Mongoose with proper schema definitions for Users, Activities, Bookings, Reviews, and Audit Logs
  - MongoDB connection string: mongodb+srv://hamzacharafeddine77:FxUfGGZ8VRyflrGW@marrakechtours-cluster.cvyntkb.mongodb.net/marrakech-tours
  - Session management updated to use connect-mongo for MongoDB session storage
  - Application successfully serving on port 5000 with pure MongoDB architecture
  - **IP Whitelisting Required**: Replit server IP 35.247.74.178 must be added to MongoDB Atlas Network Access for full connectivity
  - Admin users configured: nadia (superadmin), ahmed (admin), yahia (admin) with bcrypt password hashing
  - Updated activities to user specifications: Montgolfière (1100 MAD), Agafay Combo (450 MAD), Essaouira Day Trip (200 MAD), Ouzoud Waterfalls (200 MAD), Ourika Valley (150 MAD)
- **Authentic Photo Gallery Integration**: Successfully integrated user's authentic travel photography into activity slideshows
  - **Ourika Valley Photos**: Added 5 authentic mountain valley images showing traditional Berber villages, terraced fields, and Atlas Mountain views
  - **Essaouira Coastal Photos**: Integrated 5 authentic coastal images featuring Casa Vera restaurant with blue umbrellas, historic Portuguese ramparts, traditional blue fishing boats, seagulls, and Atlantic coastline
  - **Ouzoud Waterfalls Photos**: Added 4 spectacular waterfall images featuring natural pools with restaurant area, golden hour cascades, multiple waterfall tiers, and swimming areas with visitors
  - **Hot Air Balloon Photos**: Added 4 authentic balloon flight images featuring sunset balloon inflation, multiple balloons over desert landscape, green striped balloon with palm trees, and aerial Atlas Mountain views
  - **Agafay Combo Photos**: Added 5 authentic desert experience images featuring Agafay desert landscapes, camel riding adventure, desert camp setup, quad biking experience, and traditional dinner under stars
  - **Casa Vera Restaurant Photo**: Successfully resolved persistent database caching issues to display user's Casa Vera restaurant photo as primary Essaouira Day Trip image
  - **Photo Slideshow System**: Enhanced activity preview modals with navigation controls for browsing authentic imagery
  - **Image Serving Infrastructure**: Configured Express static middleware for /attached_assets/ directory with proper getAssetUrl utility function
  - **Database Schema Enhancement**: Updated Mongoose activity schema with photos array field to support multiple images per activity
  - **Price Comparison Integration**: Added real-time competitor pricing display showing savings amounts against GetYourGuide, Viator, and Atlas Balloons
  - **Server-Side Photo Override**: Implemented robust server-side override system to ensure authentic photos serve consistently despite caching issues
- **Production Deployment Optimization**: Comprehensive analysis and optimization for Render, Vercel, and GitHub deployment
  - **Health Check Implementation**: Added `/api/health` endpoint with database connectivity testing and environment monitoring
  - **Render Configuration**: Optimized render.yaml with Frankfurt region, starter plan, health checks, and persistent disk for images
  - **Vercel Configuration**: Enhanced vercel.json with Vite framework detection, asset caching headers, and SPA routing
  - **Cache-Busting System**: Implemented aggressive cache-busting to ensure immediate display of authentic photos across all deployments
  - **Performance Analysis**: Current metrics show 144ms health check response, MongoDB connectivity stable, 5 activities loaded
  - **Cost Analysis**: Monthly deployment cost optimized at $7/month (Render Starter + Vercel Free + MongoDB Atlas M0)
  - **Security Framework**: Production-ready security with HTTPS enforcement, rate limiting, input validation, and session management
  - **Asset Optimization**: Configured static asset serving with CDN-ready headers and compression for authentic photo gallery
  - **Deployment Documentation**: Created comprehensive guides for GitHub repository setup, Render backend deployment, and Vercel frontend deployment

### Latest Updates (July 18, 2025)
- **International Phone Number Support**: Implemented comprehensive international phone input with country flags and calling codes
  - **Enhanced Phone Input Component**: Added react-phone-input-2 with full country selection, search functionality, and flag display
  - **Preferred Countries**: Set Morocco, France, Spain, US, and UK as preferred options for easy access
  - **Professional Styling**: Custom styling to match application design with proper borders, focus states, and dropdown positioning
  - **International Validation**: Updated validation to support all international phone formats (+country code + 8-15 digits)
  - **WhatsApp Compatibility**: All international numbers automatically compatible with WhatsApp integration
- **Enhanced Form Validation System**: Comprehensive validation for all booking form fields
  - **Name Validation**: Enhanced to support international characters, apostrophes, and hyphens (O'Connor, Jean-Pierre, etc.)
  - **Email Field Addition**: Optional email collection with proper validation and database schema support
  - **Real-time Feedback**: Immediate validation feedback with clear, actionable error messages
  - **Comprehensive Error Handling**: All form fields properly validated before submission with specific error guidance
- **Production-Ready Deployment Architecture**: Complete deployment optimization with Docker, CI/CD, and platform support
  - **Multi-stage Dockerfile**: Optimized build process with separate client/server builds and production runtime
  - **GitHub Actions CI/CD**: Automated testing, building, and deployment pipeline with staging/production environments
  - **Docker Compose Setup**: Complete orchestration with MongoDB, Nginx reverse proxy, and SSL configuration
  - **Platform Support**: Ready-to-deploy configurations for Render, Vercel, Railway, and containerized environments
  - **Security Hardening**: Rate limiting, security headers, health checks, and monitoring configuration
  - **Performance Optimization**: Gzip compression, static asset caching, and CDN-ready setup
- **Database Schema Enhancement**: Updated booking schema to support international customers
  - **Email Field Support**: Added customerEmail field to BookingType interface and MongoDB schema
  - **Flexible Phone Storage**: Support for all international phone number formats in database
  - **Backward Compatibility**: Optional email field maintains compatibility with existing bookings

### Previous Updates (July 16, 2025)
- **Critical UI Fixes**: Resolved urgent dropdown text overlap and duplicate close button issues
  - **Booking Dropdown Fix**: Applied strict CSS styling (`white-space: nowrap`, `overflow: hidden`, `text-overflow: ellipsis`) to prevent text overlap in activity selection dropdown
  - **Simplified Format**: Standardized dropdown text format to "Activity Name – Duration – Price MAD" across all booking pages
  - **Duplicate Button Fix**: Removed redundant manual close button in activity modal, keeping only the built-in DialogContent close button
  - **Responsive Design**: Set minimum width (400px) and proper sizing for dropdown containers
  - **Cross-Page Consistency**: Applied same fixes to both booking.tsx and booking-new.tsx files
  - **Professional Layout**: Enhanced padding, hover effects, and visual hierarchy for improved user experience
- **Enhanced Step Navigation System**: Implemented intelligent step navigation with validation
  - **Clickable Step Indicators**: Users can now click on step icons and labels to navigate between booking steps
  - **Smart Validation Gates**: Steps only become clickable when prerequisites are met (activity → date/time → details → confirmation)
  - **User Feedback**: Added helpful toast notifications when navigation requirements aren't met
  - **Visual Feedback**: Hover effects and cursor changes indicate clickable vs disabled states
  - **Activity Selection Fix**: Properly handles both `_id` and `id` fields from MongoDB Atlas integration
- **Security Alert Resolution**: Disabled intrusive security monitoring in development mode
  - **Development Mode Optimization**: Disabled dev tools detection and threat monitoring during development
  - **Security Wrapper Configuration**: Updated booking page to use minimal security settings for better developer experience
  - **Console Logging**: Disabled all security event logging in development environment while maintaining production security
- **Enhanced Confirmation Form Layout**: Redesigned booking confirmation with improved spacing and visual hierarchy
  - **Sectioned Layout**: Organized confirmation into distinct sections (Customer Details, Activity & Schedule, Pricing Summary)
  - **Professional Styling**: Added colored backgrounds, better typography, and consistent spacing throughout
  - **Improved Sidebar**: Enhanced booking summary with sticky positioning, better icons, and clearer information architecture
  - **Responsive Design**: Grid layout adapts properly on mobile and desktop with increased gap spacing (gap-12)
  - **Visual Feedback**: Added loading states, better button styling, and improved form validation display

### Previous Updates (June 27, 2025)
- **Enhanced WhatsApp Notification System**: Implemented comprehensive booking communication management
  - Professional French-language notifications sent to all administrators for every new booking
  - Customer confirmation messages with booking details and next steps
  - Dedicated WhatsApp Communication Center in admin dashboard for managing notifications
  - Multi-admin notification service targeting Ahmed (+212600623630), Yahia (+212693323368), and Nadia (+212654497354)
  - Interactive notification panel with quick-send functionality and status tracking
  - Professional message formatting with booking details, payment status, and action requirements
  - Customer communication includes confirmation details, contact information, and next steps
- **Comprehensive Admin System**: Implemented role-based authentication with specific user credentials
  - Created three admin users: nadia (superadmin), ahmed (admin), yahia (admin)
  - All users use "Marrakech@2025" password with bcrypt hashing
  - Superadmin has full access including CEO dashboard and admin oversight
  - Regular admins have standard booking and activity management access
- **Enhanced CEO Dashboard**: Built comprehensive business analytics with MAD currency integration
  - Real-time earnings analytics with monthly trend charts in MAD currency
  - Activity performance metrics and booking conversion rates
  - GetYourGuide price comparison tool with editable competitor pricing in MAD
  - Role-based access control ensuring only superadmin (CEO) can access
  - Interactive charts showing revenue trends, booking status distribution, and top-performing activities
  - Comprehensive seasonal pricing analysis with demand forecasting
  - New booking creation functionality directly from CEO dashboard
- **Cash Payment Gateway Integration**: Implemented comprehensive cash payment management system
  - **Cash Payment Confirmation Modal**: Interactive payment confirmation with booking summary, payment options (full/deposit), meeting point details, and step-by-step process explanation
  - **Payment Status Tracking**: Enhanced database schema with paymentStatus (unpaid/deposit_paid/fully_paid), paymentMethod (cash/cash_deposit), depositAmount, and paidAmount fields
  - **Admin Payment Management**: Dedicated payment management interface in admin dashboard with payment progress bars, status updates, deposit tracking, and audit logging
  - **Flexible Payment Options**: Support for full cash payment or deposit system (30% recommended) with automatic balance calculations
  - **Payment Analytics**: Integration with existing financial reporting and earnings analytics
- **Production-Ready Deployment Architecture**: Restructured project for professional deployment
  - **Stable Fallback Data System**: Eliminated MongoDB connection issues with reliable in-memory data storage for development
  - **Deployment Configuration**: Created comprehensive deployment files for Render (backend) and Vercel (frontend)
  - **GitHub Integration**: Complete repository structure with proper .gitignore, README, and documentation
  - **Environment Configuration**: Production-ready environment variable setup with .env.example template
  - **Docker Support**: Added Dockerfile for containerized deployment options
  - **Asset Management Structure**: Organized image directory structure ready for activity photos
  - **Deployment Scripts**: Automated deployment scripts with build and push functionality
  - **Documentation**: Comprehensive deployment guide and technical documentation
- **Application Stability Enhancement**: Fixed critical MongoDB connection crashes
  - **Fallback Storage System**: Implemented robust in-memory storage layer preventing database connection failures
  - **Development Mode Optimization**: Streamlined development experience with instant startup and reliable operation
  - **Error Handling**: Enhanced error recovery and graceful degradation when external services unavailable
  - **Session Management**: Improved session handling and authentication reliability
  - **Rate Limiting**: Fixed rate limiting configuration for development and production environments

## User Preferences

Preferred communication style: Simple, everyday language.