# MarrakechDunes - Moroccan Adventure Booking Platform

## Overview

MarrakechDunes is a production-ready full-stack web application designed for booking authentic Moroccan desert adventures and experiences. The platform offers a seamless customer booking journey, from browsing activities to receiving confirmations, alongside robust administrative tools for managing bookings, activities, and user roles. The application features dynamic background images with authentic Moroccan photography, bilingual support, comprehensive deployment configurations for multiple hosting platforms, and a complete business management system.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query
- **UI Framework**: Shadcn/ui (built on Radix UI)
- **Styling**: Tailwind CSS with a custom Moroccan-themed color palette
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite
- **UI/UX Decisions**: Custom Moroccan theme with traditional colors, professional slideshows for activity images, enhanced confirmation form layouts, clickable step navigation, and a personalized welcome animation system. All UI elements prioritize responsiveness and consistency across devices.

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: MongoDB Atlas (production-ready) with Mongoose ORM
- **Session Management**: Express sessions with `connect-mongo`
- **API Design**: RESTful API with JSON responses
- **Build System**: ESBuild for production bundling (78KB optimized bundle)
- **Key Features**: Admin authentication with role-based access (admin/superadmin), comprehensive booking management, activity CRUD operations, customer review system, international phone number support, WhatsApp integration, and authenticated image serving.
- **Production Ready**: Environment secrets management, rate limiting, security headers, input validation, and multi-platform deployment configurations (Docker, Vercel, Render).

### Production Environment
- **Development**: Replit with tsx for TypeScript execution
- **Production Builds**: Client (Vite) → `client/dist/`, Server (ESBuild) → `server/dist/`
- **Deployment Options**: Vercel (frontend), Render (backend), Docker containers, Replit Reserved VM
- **Environment Management**: Secure secrets handling with fallback data system

## External Dependencies

- **Database**: MongoDB Atlas
- **UI/Styling**: Radix UI, Tailwind CSS, Lucide React
- **Form Management**: React Hook Form, Zod
- **API Communication**: TanStack Query
- **Routing**: Wouter
- **Session Management**: `connect-mongo`
- **Phone Input**: `react-phone-input-2`
- **Build Tools**: Vite, ESBuild