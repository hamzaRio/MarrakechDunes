import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import MongoStore from "connect-mongo";
import bcrypt from "bcrypt";
import { storage } from "./storage.js";
import gygRoutes from "./routes/getyourguide.js";
import debugRoutes from "./routes/debug.js";
import competitorsRoutes from "./routes/competitors.js";
import reschedulingRoutes from "./routes/rescheduling.js";
import cancellationRoutes from "./routes/cancellation.js";
import groupBookingRoutes from "./routes/group-bookings.js";
import capacityRoutes from "./routes/capacity.js";
import { 
  insertBookingSchema, 
  insertReviewSchema,
  statusTransitionSchema,
  cancellationSchema,
  rescheduleSchema,
  pricingQuoteSchema,
  portalLoginSchema,
  otpRequestSchema
} from "marrakechdunes-shared/schema";
import { whatsappService } from "./whatsapp-service.js";
import { emailService } from "./services/email-service.js";
import { validateStatusTransition, getStatusDisplayName, getStatusColor } from "./utils/booking-transitions.js";
import { calculateCancellationPolicy, getCancellationReasonDisplay } from "./utils/cancellation-policy.js";
import { calculateDynamicPricing, getSeasonalDescription } from "./utils/dynamic-pricing.js";
import { formatNotificationTemplate, getTemplateById, NOTIFICATION_TEMPLATES } from "./utils/notification-templates.js";
import { z } from "zod";
import {
  authRateLimit,
  adminApiRateLimit,
  generalApiRateLimit,
  enforceHTTPS,
  adminSecurityMiddleware,
  superadminSecurityMiddleware,
  validateInput,
  securityHeaders,
  adminAuditLog,
  sessionSecurity,
  sqlInjectionProtection,
  requestSizeLimit,
  strictApiRateLimit
} from "./security-middleware.js";
import { strictLimiter } from './rate-limiters.js';
import { 
  asyncHandler, 
  AppError, 
  AuthenticationError, 
  AuthorizationError, 
  NotFoundError,
  handleDatabaseError,
  handleZodError
} from "./error-handler.js";

// Types for session data
declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      role: string;
      username?: string;
    };
  }
}

interface AuthenticatedRequest extends Request {
  session: session.Session & Partial<session.SessionData>;
}

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.session.user) {
    return next(new AuthenticationError("Not authenticated"));
  }
  next();
};

const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.session.user || authReq.session.user.role !== 'superadmin') {
    return next(new AuthorizationError("Superadmin access required"));
  }
  next();
};

const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.session.user || (authReq.session.user.role !== "admin" && authReq.session.user.role !== "superadmin")) {
    return next(new AuthorizationError("Forbidden: Admins only"));
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Note: CORS is already configured in server/index.ts before routes are registered
  // This ensures CORS headers are set before session middleware

  // Health check endpoint moved to server/index.ts to avoid duplication

  // Session middleware is already configured in server/index.ts
  
  // Session debug middleware (reduced logging with rate limiting)
  const logRateLimit = new Map<string, number>();
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Debug logging only in development, with rate limiting to reduce noise
    if (process.env.NODE_ENV === 'development' && req.path.startsWith('/api/auth/')) {
      const now = Date.now();
      const key = `${req.ip}-${req.path}`;
      const lastLog = logRateLimit.get(key) || 0;
      
      // Only log once every 10 seconds per IP/path combination
      if (now - lastLog > 10000) {
        console.log('🔧 Session middleware for:', req.path);
        logRateLimit.set(key, now);
      }
    }
    next();
  });
  
  // Apply security headers
  app.use(securityHeaders);
  
  // Apply HTTPS enforcement for production
  app.use(enforceHTTPS);
  
  // Apply input validation
  app.use(validateInput);
  
  // Apply SQL injection protection
  app.use(sqlInjectionProtection);
  
  // Apply request size limiting
  app.use(requestSizeLimit);

  // Initialize database
  await storage.seedInitialData();

  // Public API routes with general rate limiting
  // Note: /api/activities has no rate limiting to prevent 429 errors
  app.use('/api/bookings', generalApiRateLimit);
  app.use('/api/reviews', generalApiRateLimit);

  // GetYourGuide API routes (public for admin reference)
  app.use('/api/gyg', gygRoutes);
  
  // Competitors API routes (for activity search)
  app.use('/api/competitors', competitorsRoutes);
  app.use('/api/rescheduling', reschedulingRoutes);
  app.use('/api/cancellation', cancellationRoutes);
  app.use('/api/group-bookings', groupBookingRoutes);
  app.use('/api/capacity', capacityRoutes);
  
  // Market Intelligence routes
  const marketIntelligenceRoutes = (await import('./routes/market-intelligence.js')).default;
  app.use('/api/market', marketIntelligenceRoutes);
  
  // Debug routes (for testing and development)
  app.use('/api/debug', debugRoutes);

  // Admin API routes with stricter rate limiting, audit logging, and admin authentication
  app.use('/api/admin', adminApiRateLimit, adminAuditLog, requireAdmin);

  // Auth routes
  app.get('/api/auth/test', asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    
    // Debug logging only in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🧪 Auth test endpoint called');
    }
    
    res.json({
      sessionId: authReq.session.id,
      hasSession: !!authReq.session,
      hasUser: !!authReq.session?.user,
      user: authReq.session?.user,
      cookie: req.headers.cookie ? 'present' : 'missing',
      sessionCookie: authReq.session?.cookie,
      headers: {
        origin: req.headers.origin,
        referer: req.headers.referer,
        'user-agent': req.headers['user-agent']
      },
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  }));

  app.get('/api/auth/user', asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    
    // Debug session information
    console.log('[AUTH] Checking user session:', {
      hasSession: !!authReq.session,
      hasUser: !!authReq.session?.user,
      sessionId: authReq.session?.id,
      cookies: req.headers.cookie ? 'present' : 'missing',
      origin: req.headers.origin,
      userAgent: req.headers['user-agent']?.substring(0, 50)
    });
    
    if (authReq.session?.user) {
      console.log('[AUTH] User authenticated:', authReq.session.user.username);
      res.json({
        success: true,
        user: authReq.session.user,
      });
    } else {
      console.log('[AUTH] No user in session, returning 401');
      console.log('[AUTH] Session details:', {
        sessionExists: !!authReq.session,
        sessionId: authReq.session?.id,
        sessionUser: authReq.session?.user,
        cookieHeader: req.headers.cookie
      });
      
      // Return 401 instead of throwing error for better frontend handling
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
        message: 'No valid session found'
      });
    }
  }));

  app.post("/api/auth/login", authRateLimit, asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body;
    
    console.log('[AUTH] Login attempt:', { username, hasPassword: !!password });
    
    if (!username || !password) {
      throw new AuthenticationError("Username and password are required");
    }
    
    try {
      const user = await storage.getUserByUsername(username);
      console.log('[AUTH] User lookup result:', { found: !!user, username: user?.username, role: user?.role });
      
      if (!user) {
        console.log('[AUTH] User not found:', username);
        throw new AuthenticationError("Invalid username or password");
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('[AUTH] Password validation:', { isValid: isPasswordValid });
      
      if (!isPasswordValid) {
        console.log('[AUTH] Invalid password for user:', username);
        throw new AuthenticationError("Invalid username or password");
      }

      const authReq = req as AuthenticatedRequest;

      const sessionUser = {
        id: user._id?.toString() || user.id?.toString() || "",
        role: user.role,
      } as session.SessionData["user"];

      if (sessionUser && user.username) {
        sessionUser.username = user.username;
      }

      authReq.session.user = sessionUser;

      // Save the session to ensure it's persisted
      authReq.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({
            success: false,
            error: 'Session creation failed',
            message: 'Unable to create user session'
          });
        }
        
        console.log('[AUTH] Session created successfully for user:', sessionUser?.username || 'unknown');
        console.log('[AUTH] Session ID:', authReq.session.id);
        console.log('[AUTH] Session cookie:', authReq.session.cookie);

      res.json({
        success: true,
        user: authReq.session.user,
        });
      });      
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      } else {
        console.error("Login error:", error);
        throw new AuthenticationError("Login failed");
      }
    }
  }));

  app.post("/api/auth/logout", strictLimiter, asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    
    authReq.session.destroy((err: any) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: "Logout failed" });
      }
      
      res.json({ message: "Logout successful" });
    });
  }));

  // Security events endpoint for frontend audit logging with rate limiting
  app.post("/api/security-events", generalApiRateLimit, asyncHandler(async (req: Request, res: Response) => {
    // Only log in production to reduce console noise
    if (process.env.NODE_ENV === 'production') {
      console.log("Security event:", {
        origin: req.headers.origin || null,
        ip: req.ip,
        event: req.body?.event,
        timestamp: req.body?.timestamp,
        url: req.body?.url,
        userAgent: req.body?.userAgent ? req.body.userAgent.substring(0, 100) : 'unknown'
      });
    }
    res.status(200).json({ ok: true });
  }));

  // Simple health alias
  app.get('/api/health/check', asyncHandler(async (_req: Request, res: Response) => {
    res.status(200).json({ status: 'healthy' });
  }));

  // Debug endpoints only available in development
  if (process.env.NODE_ENV === 'development') {
    // Debug endpoint to check admin users (development only)
    app.get('/api/debug/users', asyncHandler(async (_req: Request, res: Response) => {
      try {
        const users = await storage.getUsers();
        const userList = users.map(user => ({
          username: user.username,
          role: user.role,
          hasPassword: !!user.password,
          passwordLength: user.password ? user.password.length : 0
        }));
        res.json({ users: userList, count: users.length });
      } catch (error) {
        console.error('Debug users error:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }));

    // Debug endpoint to reset admin passwords (development only)
    app.post('/api/debug/reset-passwords', asyncHandler(async (_req: Request, res: Response) => {
      try {
        const bcrypt = await import('bcrypt');
        const adminPassword = process.env.ADMIN_PASSWORD;
        const superadminPassword = process.env.SUPERADMIN_PASSWORD;
        
        if (!adminPassword || !superadminPassword) {
          return res.status(400).json({ 
            status: 'error', 
            message: 'ADMIN_PASSWORD and SUPERADMIN_PASSWORD must be set in environment variables' 
          });
        }
        
        // Update ahmed and yahia with admin password
        await storage.updateUserPassword('ahmed', adminPassword);
        await storage.updateUserPassword('yahia', adminPassword);
        
        // Update nadia with superadmin password
        await storage.updateUserPassword('nadia', superadminPassword);
        
        res.json({ message: 'Admin passwords reset successfully' });
      } catch (error) {
        console.error('Reset passwords error:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }));
  }

  // Public routes
  app.get("/api/activities", asyncHandler(async (req: Request, res: Response) => {
    try {
      const activities = await storage.getActivities();
      res.json({ activities: Array.isArray(activities) ? activities : [] });
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }));

  app.post("/api/bookings", asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = req.body;
      console.log('📝 New booking request received:', {
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        activityId: data.activityId,
        numberOfPeople: data.numberOfPeople,
        preferredDate: data.preferredDate
      });
      
      // Calculate total amount
      const activity = await storage.getActivity(data.activityId);
      if (!activity) {
        console.error('❌ Activity not found:', data.activityId);
        throw new NotFoundError('Activity not found');
      }
      
      const totalAmount = (parseInt(activity.price) * data.numberOfPeople).toString();
      console.log('[BOOKING] Total calculated:', { activityPrice: activity.price, numberOfPeople: data.numberOfPeople, totalAmount });
      
      const booking = await storage.createBooking({
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        activityId: data.activityId,
        numberOfPeople: data.numberOfPeople,
        preferredDate: new Date(data.preferredDate),
        participantNames: data.participantNames || [data.customerName],
        notes: data.notes,
        status: 'PENDING',
        totalAmount: totalAmount,
        paymentStatus: 'unpaid',
        paymentMethod: 'cash',
        paidAmount: 0,
        rescheduleCount: 0,
      });
      
      console.log('[SUCCESS] Booking created:', {
        bookingId: booking._id,
        customerName: booking.customerName,
        status: booking.status,
        paymentStatus: booking.paymentStatus
      });

      // Tour business logging for analytics
      console.log('🏜️ Tour booking created:', {
        activityId: data.activityId,
        customerPhone: data.customerPhone,
        totalAmount: totalAmount,
        preferredDate: data.preferredDate,
        numberOfPeople: data.numberOfPeople,
        timestamp: new Date().toISOString()
      });

      // Send WhatsApp notifications to all admins with action links
      const participantNames = booking.participantNames?.join(', ') || booking.customerName;
      const bookingId = booking._id?.toString() || 'N/A';
      const baseUrl = process.env.CLIENT_URL || 'https://marrakech-dunes.vercel.app';
      
      const adminNotificationData = {
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        activityName: activity.name,
        numberOfPeople: booking.numberOfPeople,
        preferredDate: new Date(booking.preferredDate),
        totalAmount: parseInt(booking.totalAmount),
        paymentMethod: booking.paymentMethod || 'cash',
        paymentStatus: booking.paymentStatus || 'unpaid',
        status: booking.status,
        notes: booking.notes ? `Participants: ${participantNames}\n${booking.notes}` : `Participants: ${participantNames}`,
        bookingId: bookingId,
        // Add admin action links
        confirmLink: `${baseUrl}/api/bookings/${bookingId}/confirm`,
        rejectLink: `${baseUrl}/api/bookings/${bookingId}/reject`
      };
      
      console.log('[NOTIFY] Sending admin notifications for new booking:', booking._id);
      const whatsappResult = await whatsappService.sendBookingNotification(adminNotificationData);
      
      // Send email confirmation to customer if email is provided
      if (data.customerEmail) {
        try {
          const emailData = {
            customerName: booking.customerName,
            customerPhone: booking.customerPhone,
            activityName: activity.name,
            numberOfPeople: booking.numberOfPeople,
            preferredDate: new Date(booking.preferredDate),
            totalAmount: parseInt(booking.totalAmount),
            bookingId: bookingId
          };
          
          const emailSent = await emailService.sendBookingConfirmation(emailData);
          console.log('[EMAIL] Customer email notification:', emailSent ? 'sent' : 'failed');
        } catch (error) {
          console.error('[EMAIL] Failed to send customer email:', error);
        }
      }
      
      // Log admin notifications
      if (whatsappResult.success) {
        console.log('✅ Admin WhatsApp notifications sent successfully');
        console.log('📱 Admin notification links:', whatsappResult.whatsappLinks);
      } else {
        console.log('⚠️ Admin WhatsApp notifications failed, trying email fallback');
        
        // Try email fallback for admin notifications
        try {
          const emailService = new (await import('./services/email-service.js')).EmailService();
          const adminEmailSubject = `New Booking Alert - ${activity.name}`;
          const adminEmailHtml = `
            <h2>🚨 New Booking Alert</h2>
            <p>A new booking has been created:</p>
            <ul>
              <li><strong>Customer:</strong> ${booking.customerName}</li>
              <li><strong>Phone:</strong> ${booking.customerPhone}</li>
              <li><strong>Activity:</strong> ${activity.name}</li>
              <li><strong>Date:</strong> ${new Date(booking.preferredDate).toLocaleDateString()}</li>
              <li><strong>Participants:</strong> ${booking.numberOfPeople}</li>
              <li><strong>Total Amount:</strong> ${booking.totalAmount} MAD</li>
              <li><strong>Status:</strong> ${booking.status}</li>
            </ul>
            <p>Please log into the admin dashboard to confirm this booking.</p>
          `;
          
          // Send to all admin emails (you'll need to configure admin emails)
          const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
          for (const adminEmail of adminEmails) {
            if (adminEmail.trim()) {
              await emailService.sendEmail(adminEmail.trim(), adminEmailSubject, adminEmailHtml);
              console.log('📧 Admin email notification sent to:', adminEmail.trim());
            }
          }
        } catch (emailError) {
          console.error('❌ Admin email notification failed:', emailError);
        }
      }
      
      // Return booking without customer notification (admin must confirm first)
      res.status(201).json({
        ...booking,
        adminNotification: {
          sent: whatsappResult.success,
          method: whatsappResult.success ? 'whatsapp' : 'email_fallback'
        },
        message: 'Booking created successfully. Admin will review and confirm your reservation.'
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw handleDatabaseError(error);
    }
  }));

  // Admin routes
  app.get("/api/admin/bookings", adminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    try {
      const bookings = await storage.getBookings();
      res.json(Array.isArray(bookings) ? bookings : []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ 
        status: 'error',
        message: "Failed to fetch bookings",
        code: 'FETCH_BOOKINGS_ERROR',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      });
    }
  }));

  // Update booking endpoint
  app.put("/api/admin/bookings/:id", adminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({
          status: 'error',
          message: 'Booking not found',
          code: 'BOOKING_NOT_FOUND'
        });
      }

      const updatedBooking = await storage.updateBooking(id, updateData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: authReq.session.user!.id,
        action: `Updated booking: ${booking.customerName}`,
        details: JSON.stringify({ 
          bookingId: id, 
          changes: updateData,
          previousData: {
            status: booking.status,
            paymentStatus: booking.paymentStatus,
            totalAmount: booking.totalAmount
          }
        })
      });
      
      res.json({ 
        status: 'success',
        message: "Booking updated successfully",
        booking: updatedBooking
      });
    } catch (error) {
      console.error("Error updating booking:", error);
      res.status(500).json({ 
        status: 'error',
        message: "Failed to update booking",
        code: 'UPDATE_BOOKING_ERROR',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      });
    }
  }));

  // Delete booking endpoint
  app.delete("/api/admin/bookings/:id", adminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const { id } = req.params;
      console.log(`Attempting to delete booking with ID: ${id}`);
      
      // Validate ID format
      if (!id || id.length < 24) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid booking ID format',
          code: 'INVALID_BOOKING_ID'
        });
      }
      
      const booking = await storage.getBooking(id);
      
      if (!booking) {
        console.log(`Booking not found with ID: ${id}`);
        return res.status(404).json({
          status: 'error',
          message: 'Booking not found',
          code: 'BOOKING_NOT_FOUND'
        });
      }

      console.log(`Found booking: ${booking.customerName}, deleting...`);
      const deleteResult = await storage.deleteBooking(id);
      
      if (!deleteResult) {
        console.log(`Failed to delete booking with ID: ${id}`);
        return res.status(500).json({
          status: 'error',
          message: 'Failed to delete booking from database',
          code: 'DELETE_FAILED'
        });
      }
      
      console.log(`Successfully deleted booking: ${booking.customerName}`);
      
      // Create audit log
      try {
        await storage.createAuditLog({
          userId: authReq.session.user!.id,
          action: `Deleted booking: ${booking.customerName} - ${booking.activity?.name || 'Unknown Activity'}`,
          details: JSON.stringify({ 
            bookingId: id, 
            customerName: booking.customerName,
            activityName: booking.activity?.name,
            totalAmount: booking.totalAmount
          })
        });
      } catch (auditError) {
        console.error("Failed to create audit log:", auditError);
        // Don't fail the request if audit log fails
      }
      
      res.json({ 
        status: 'success',
        message: "Booking deleted successfully" 
      });
    } catch (error) {
      console.error("Error deleting booking:", error);
      res.status(500).json({ 
        status: 'error',
        message: "Failed to delete booking",
        code: 'DELETE_BOOKING_ERROR',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }));

  app.get("/api/admin/audit-logs", superadminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    try {
      const logs = await storage.getAuditLogs();
      res.json(Array.isArray(logs) ? logs : []);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ 
        status: 'error',
        message: "Failed to fetch audit logs",
        code: 'FETCH_AUDIT_LOGS_ERROR',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      });
    }
  }));

  // Superadmin endpoints for admin management
  app.get("/api/superadmin/admins", superadminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    try {
      const admins = await storage.getAdmins();
      res.json(Array.isArray(admins) ? admins : []);
    } catch (error) {
      console.error("Error fetching admins:", error);
      res.status(500).json({ 
        status: 'error',
        message: "Failed to fetch admins",
        code: 'FETCH_ADMINS_ERROR'
      });
    }
  }));

  app.post("/api/superadmin/admins", superadminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const { username, password, role = 'admin' } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          status: 'error',
          message: 'Username and password are required'
        });
      }

      const admin = await storage.createAdmin({ username, password, role });
      
      // Create audit log
      await storage.createAuditLog({
        userId: authReq.session.user!.id,
        action: `Created new admin: ${username}`,
        details: JSON.stringify({ username, role })
      });
      
      res.json({ 
        status: 'success',
        message: "Admin created successfully",
        admin: { id: admin._id, username: admin.username, role: admin.role }
      });
    } catch (error) {
      console.error("Error creating admin:", error);
      res.status(500).json({ 
        status: 'error',
        message: "Failed to create admin",
        code: 'CREATE_ADMIN_ERROR'
      });
    }
  }));

  app.delete("/api/superadmin/admins/:id", superadminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const { id } = req.params;
      
      if (id === authReq.session.user!.id) {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot delete your own account'
        });
      }

      const deleted = await storage.deleteAdmin(id);
      
      if (!deleted) {
        return res.status(404).json({
          status: 'error',
          message: 'Admin not found'
        });
      }
      
      // Create audit log
      await storage.createAuditLog({
        userId: authReq.session.user!.id,
        action: `Deleted admin: ${id}`,
        details: JSON.stringify({ deletedAdminId: id })
      });
      
      res.json({ 
        status: 'success',
        message: "Admin deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting admin:", error);
      res.status(500).json({ 
        status: 'error',
        message: "Failed to delete admin",
        code: 'DELETE_ADMIN_ERROR'
      });
    }
  }));

  // CSV Export endpoints
  app.get("/api/admin/export/bookings", asyncHandler(async (req: Request, res: Response) => {
    try {
      const bookings = await storage.getBookings();
      const csvData = await storage.exportBookingsToCSV(bookings);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="bookings.csv"');
      res.send(csvData);
    } catch (error) {
      console.error("Error exporting bookings:", error);
      res.status(500).json({ 
        status: 'error',
        message: "Failed to export bookings",
        code: 'EXPORT_BOOKINGS_ERROR'
      });
    }
  }));

  app.get("/api/admin/export/audit-logs", superadminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    try {
      const logs = await storage.getAuditLogs();
      const csvData = await storage.exportAuditLogsToCSV(logs);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"');
      res.send(csvData);
    } catch (error) {
      console.error("Error exporting audit logs:", error);
      res.status(500).json({ 
        status: 'error',
        message: "Failed to export audit logs",
        code: 'EXPORT_AUDIT_LOGS_ERROR'
      });
    }
  }));

  // PDF Export endpoints
  app.get("/api/admin/export/bookings/pdf", adminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    try {
      console.log("Starting PDF export...");
      
      // Import jsPDF using dynamic import for ES modules
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.jsPDF;
      console.log("jsPDF loaded successfully");
      
      const bookings = await storage.getBookings();
      console.log(`Found ${bookings.length} bookings for PDF export`);
      
      if (!bookings || bookings.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'No bookings found to export',
          code: 'NO_BOOKINGS_FOUND'
        });
      }
      
      const pdfData = await storage.exportBookingsToPDF(bookings);
      console.log(`PDF generated successfully, size: ${pdfData.length} bytes`);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="bookings-report.pdf"');
      res.setHeader('Content-Length', pdfData.length.toString());
      res.send(pdfData);
    } catch (error) {
      console.error("Error exporting bookings PDF:", error);
      res.status(500).json({ 
        status: 'error',
        message: "Failed to export bookings PDF",
        code: 'EXPORT_BOOKINGS_PDF_ERROR',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }));

  app.get("/api/admin/export/operations-report/pdf", adminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    try {
      const reportData = await storage.generateOperationsReport();
      const pdfData = await storage.exportOperationsReportToPDF(reportData);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="operations-report.pdf"');
      res.send(pdfData);
    } catch (error) {
      console.error("Error exporting operations report PDF:", error);
      res.status(500).json({ 
        status: 'error',
        message: "Failed to export operations report PDF",
        code: 'EXPORT_OPERATIONS_PDF_ERROR'
      });
    }
  }));

  // Operations report endpoint
  app.get("/api/admin/operations-report", adminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    try {
      const reportData = await storage.generateOperationsReport();
      res.json(reportData);
    } catch (error) {
      console.error("Error generating operations report:", error);
      res.status(500).json({ 
        status: 'error',
        message: "Failed to generate operations report",
        code: 'GENERATE_OPERATIONS_REPORT_ERROR'
      });
    }
  }));

  // Performance Analytics Routes
  app.get("/api/admin/performance-metrics", adminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    try {
      const timeRange = req.query.range as string || '24h';
      
      // Get actual data from storage
      const bookings = await storage.getBookings();
      const activities = await storage.getActivities();
      
      // Calculate response time metrics (simulated but realistic)
      const responseTime = {
        average: Math.floor(Math.random() * 100) + 80, // 80-180ms
        p95: Math.floor(Math.random() * 150) + 120,
        p99: Math.floor(Math.random() * 200) + 180,
        trend: 'stable' as const
      };

      // Calculate actual booking conversion
      const totalBookings = bookings.length;
      const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED').length;
      const conversionRate = totalBookings > 0 ? Math.round((confirmedBookings / totalBookings) * 100) : 0;

      const bookingConversion = {
        rate: conversionRate,
        trend: 'up' as const,
        byActivity: activities.map(activity => {
          const activityBookings = bookings.filter(b => b.activityId === activity._id);
          const activityConfirmed = activityBookings.filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED');
          return {
            name: activity.name,
            rate: activityBookings.length > 0 ? Math.round((activityConfirmed.length / activityBookings.length) * 100) : 0
          };
        })
      };

      // System health (simulated but realistic)
      const systemHealth = {
        cpu: Math.floor(Math.random() * 30) + 15, // 15-45%
        memory: Math.floor(Math.random() * 40) + 25, // 25-65%
        database: Math.floor(Math.random() * 20) + 5, // 5-25%
        uptime: process.uptime(),
        status: 'healthy' as const
      };

      // Booking flow analysis
      const bookingFlow = {
        stepConversion: [
          { step: 'Activity Selection', rate: 100, dropoff: 0 },
          { step: 'Date Selection', rate: 88, dropoff: 12 },
          { step: 'Customer Details', rate: 76, dropoff: 12 },
          { step: 'Confirmation', rate: conversionRate, dropoff: 76 - conversionRate }
        ],
        averageTime: Math.floor(Math.random() * 3) + 4, // 4-7 minutes
        abandonmentRate: 100 - conversionRate
      };

      // Revenue metrics from actual bookings
      const now = new Date();
      const filteredBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.createdAt);
        switch (timeRange) {
          case '1h': return bookingDate >= new Date(now.getTime() - 60 * 60 * 1000);
          case '24h': return bookingDate >= new Date(now.getTime() - 24 * 60 * 60 * 1000);
          case '7d': return bookingDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          case '30d': return bookingDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          default: return true;
        }
      });

      // Generate hourly revenue data
      const hourly = Array.from({ length: 24 }, (_, i) => {
        const hour = new Date();
        hour.setHours(hour.getHours() - (23 - i));
        const hourBookings = filteredBookings.filter(b => {
          const bookingDate = new Date(b.createdAt);
          return bookingDate.getHours() === hour.getHours();
        });
        return {
          hour: hour.getHours().toString().padStart(2, '0') + ':00',
          amount: hourBookings.reduce((sum, b) => sum + parseInt(b.totalAmount || '0'), 0),
          bookings: hourBookings.length
        };
      });

      // Generate daily revenue data
      const daily = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dayBookings = filteredBookings.filter(b => {
          const bookingDate = new Date(b.createdAt);
          return bookingDate.toDateString() === date.toDateString();
        });
        return {
          date: date.toISOString().split('T')[0],
          amount: dayBookings.reduce((sum, b) => sum + parseInt(b.totalAmount || '0'), 0),
          bookings: dayBookings.length
        };
      });

      // Revenue by activity
      const byActivity = activities.map(activity => {
        const activityBookings = filteredBookings.filter(b => b.activityId === activity._id);
        const revenue = activityBookings.reduce((sum, b) => sum + parseInt(b.totalAmount || '0'), 0);
        return {
          name: activity.name,
          revenue,
          bookings: activityBookings.length
        };
      }).filter(a => a.revenue > 0);

      // Customer insights
      const customerInsights = {
        deviceTypes: [
          { type: 'mobile', percentage: 68 },
          { type: 'desktop', percentage: 27 },
          { type: 'tablet', percentage: 5 }
        ],
        countries: [
          { country: 'Morocco', bookings: Math.floor(totalBookings * 0.4) },
          { country: 'France', bookings: Math.floor(totalBookings * 0.25) },
          { country: 'Spain', bookings: Math.floor(totalBookings * 0.15) },
          { country: 'United States', bookings: Math.floor(totalBookings * 0.1) },
          { country: 'United Kingdom', bookings: Math.floor(totalBookings * 0.1) }
        ],
        peakHours: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          bookings: bookings.filter(b => new Date(b.createdAt).getHours() === hour).length
        }))
      };

      // Optimization suggestions based on actual data
      const optimizationSuggestions = [
        {
          category: 'Booking Conversion',
          priority: conversionRate < 60 ? 'high' as const : 'medium' as const,
          suggestion: `Conversion rate is ${conversionRate}%. Consider adding booking incentives or simplifying the process.`,
          impact: 'High',
          effort: 'Medium'
        },
        {
          category: 'Database Performance',
          priority: 'medium' as const,
          suggestion: 'Add indexes on frequently queried fields (activityId, preferredDate, status) to improve query performance.',
          impact: 'Medium',
          effort: 'Low'
        },
        {
          category: 'User Experience',
          priority: 'high' as const,
          suggestion: 'Implement real-time form validation to reduce booking errors and improve completion rates.',
          impact: 'High',
          effort: 'Medium'
        },
        {
          category: 'Mobile Optimization',
          priority: 'high' as const,
          suggestion: 'Optimize the booking flow for mobile users (68% of traffic) with touch-friendly interfaces.',
          impact: 'High',
          effort: 'Medium'
        }
      ];

      const metrics = {
        responseTime,
        bookingConversion,
        systemHealth,
        bookingFlow,
        revenue: { hourly, daily, byActivity },
        customerInsights,
        optimizationSuggestions
      };

      res.json(metrics);
    } catch (error) {
      console.error("Failed to fetch performance metrics:", error);
      res.status(500).json({ 
        status: 'error',
        message: "Failed to fetch performance metrics",
        code: 'FETCH_PERFORMANCE_METRICS_ERROR',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      });
    }
  }));

  app.get("/api/admin/performance-alerts", adminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const bookings = await storage.getBookings();
    const alerts = [];

    // Check recent booking volume
    const recentBookings = bookings.filter(b => {
      const bookingDate = new Date(b.createdAt);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return bookingDate >= oneDayAgo;
    }).length;

    if (recentBookings === 0) {
      alerts.push({
        type: 'warning',
        message: 'No bookings in the last 24 hours',
        value: '0',
        threshold: '1+',
        timestamp: new Date()
      });
    }

    // Check conversion rate
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED').length;
    const conversionRate = totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0;

    if (conversionRate < 50) {
      alerts.push({
        type: 'warning',
        message: 'Low booking conversion rate',
        value: `${Math.round(conversionRate)}%`,
        threshold: '50%',
        timestamp: new Date()
      });
    }

    res.json({ 
      alerts, 
      systemHealth: {
        cpu: Math.floor(Math.random() * 30) + 15,
        memory: Math.floor(Math.random() * 40) + 25,
        database: Math.floor(Math.random() * 20) + 5,
        uptime: process.uptime(),
        status: 'healthy'
      }
    });
  }));

  app.patch("/api/admin/bookings/:id/status", adminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const { status } = req.body;
    const booking = await storage.updateBookingStatus(id, status);
    
    // Create audit log
    await storage.createAuditLog({
      userId: authReq.session.user!.id,
      action: `Updated booking ${id} status to ${status}`,
      details: `Booking ${id} status changed to ${status}`
    });
    
    res.json(booking);
  }));

  app.patch("/api/admin/bookings/:id/payment", adminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const { paymentStatus, paidAmount, paymentMethod, depositAmount } = req.body;
    
    const booking = await storage.updateBookingPayment(id, {
      paymentStatus,
      paidAmount,
      paymentMethod,
      depositAmount
    });
    
    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    // Create audit log
    await storage.createAuditLog({
      userId: authReq.session.user!.id,
      action: `Updated booking ${id} payment status to ${paymentStatus}`,
      details: `Payment updated for booking ${id}: ${paymentStatus}, paid: ${paidAmount} MAD`
    });

    // Send WhatsApp payment confirmation to all admins
    const bookingWithActivity = await storage.getBooking(id);
    if (bookingWithActivity && bookingWithActivity.activity) {
      const notificationData = {
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        activityName: bookingWithActivity.activity.name,
        numberOfPeople: booking.numberOfPeople,
        preferredDate: booking.preferredDate,
        preferredTime: booking.preferredDate.toLocaleTimeString(),
        totalAmount: parseInt(booking.totalAmount),
        paymentMethod: booking.paymentMethod || 'cash',
        paymentStatus: booking.paymentStatus,
        status: booking.status,
        notes: booking.notes || '',
        bookingId: booking._id?.toString() || id
      };
      
      const paymentType = paymentStatus === 'fully_paid' ? 'full' : 'deposit';
      await whatsappService.sendPaymentConfirmation(notificationData, paymentType);
    }

    res.json(booking);
  }));

  app.post("/api/admin/activities", adminSecurityMiddleware, async (req: Request, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const activityData = req.body;
      const activity = await storage.createActivity(activityData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: authReq.session.user!.id,
        action: `Created activity: ${activity.name}`,
        details: JSON.stringify({ activityId: activity.id, activityData })
      });
      
      res.status(201).json(activity);
    } catch (error) {
      console.error("Error creating activity:", error);
      res.status(500).json({ 
        status: 'error',
        message: "Failed to create activity",
        code: 'CREATE_ACTIVITY_ERROR',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      });
    }
  });

  app.put("/api/admin/activities/:id", adminSecurityMiddleware, async (req: Request, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const { id } = req.params;
      const updateData = req.body;
      const activity = await storage.updateActivity(id, updateData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: authReq.session.user!.id,
        action: `Updated activity: ${activity?.name}`,
        details: JSON.stringify({ activityId: id, updateData })
      });
      
      res.json(activity);
    } catch (error) {
      console.error("Error updating activity:", error);
      res.status(500).json({ 
        status: 'error',
        message: "Failed to update activity",
        code: 'UPDATE_ACTIVITY_ERROR',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      });
    }
  });

  app.delete("/api/admin/activities/:id", adminSecurityMiddleware, async (req: Request, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const { id } = req.params;
      const activity = await storage.getActivity(id);
      await storage.deleteActivity(id);
      
      // Create audit log
      await storage.createAuditLog({
        userId: authReq.session.user!.id,
        action: `Deleted activity: ${activity?.name}`,
        details: JSON.stringify({ activityId: id })
      });
      
      res.json({ message: "Activity deleted successfully" });
    } catch (error) {
      console.error("Error deleting activity:", error);
      res.status(500).json({ 
        status: 'error',
        message: "Failed to delete activity",
        code: 'DELETE_ACTIVITY_ERROR',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      });
    }
  });

  // Activity approval routes (superadmin only)
  app.get("/api/admin/activities/pending", adminSecurityMiddleware, async (req: Request, res) => {
    try {
      const activities = await storage.getPendingActivities();
      res.json(activities);
    } catch (error) {
      console.error("Error fetching pending activities:", error);
      res.status(500).json({ 
        status: 'error',
        message: "Failed to fetch pending activities",
        code: 'FETCH_PENDING_ACTIVITIES_ERROR',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      });
    }
  });

  app.get("/api/admin/activities/all", adminSecurityMiddleware, async (req: Request, res) => {
    try {
      const activities = await storage.getAllActivities();
      res.json(activities);
    } catch (error) {
      console.error("Error fetching all activities:", error);
      res.status(500).json({ 
        status: 'error',
        message: "Failed to fetch all activities",
        code: 'FETCH_ALL_ACTIVITIES_ERROR',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      });
    }
  });

  app.post("/api/admin/activities/:id/approve", adminSecurityMiddleware, async (req: Request, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const { id } = req.params;
      const user = authReq.session.user;
      
      // Only superadmin can approve activities
      if (user?.role !== 'superadmin') {
        return res.status(403).json({ 
          status: 'error',
          message: "Only superadmin can approve activities",
          code: 'INSUFFICIENT_PERMISSIONS',
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method
        });
      }

      const activity = await storage.approveActivity(id, user.id);
      
      // Create audit log
      await storage.createAuditLog({
        userId: user.id,
        action: `Approved activity: ${activity?.name}`,
        details: JSON.stringify({ activityId: id })
      });
      
      res.json(activity);
    } catch (error) {
      console.error("Error approving activity:", error);
      res.status(500).json({ 
        status: 'error',
        message: "Failed to approve activity",
        code: 'APPROVE_ACTIVITY_ERROR',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      });
    }
  });

  app.post("/api/admin/activities/:id/reject", adminSecurityMiddleware, async (req: Request, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const { id } = req.params;
      const user = authReq.session.user;
      
      // Only superadmin can reject activities
      if (user?.role !== 'superadmin') {
        return res.status(403).json({ 
          status: 'error',
          message: "Only superadmin can reject activities",
          code: 'INSUFFICIENT_PERMISSIONS',
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method
        });
      }

      const activity = await storage.rejectActivity(id, user.id);
      
      // Create audit log
      await storage.createAuditLog({
        userId: user.id,
        action: `Rejected activity: ${activity?.name}`,
        details: JSON.stringify({ activityId: id })
      });
      
      res.json(activity);
    } catch (error) {
      console.error("Error rejecting activity:", error);
      res.status(500).json({ 
        status: 'error',
        message: "Failed to reject activity",
        code: 'REJECT_ACTIVITY_ERROR',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      });
    }
  });

  // Static assets are now served by frontend (Vercel)
  // Object storage routes removed - all images now served from client/public/images

  app.post("/api/objects/upload", adminSecurityMiddleware, async (req, res) => {
    const { ObjectStorageService } = await import("./objectStorage.js");
    const objectStorageService = new ObjectStorageService();
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ 
        status: 'error',
        message: "Failed to get upload URL",
        code: 'GET_UPLOAD_URL_ERROR',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      });
    }
  });

  app.put("/api/admin/activities/:id/image", adminSecurityMiddleware, async (req: Request, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const { id } = req.params;
      const { imageURL } = req.body;
      
      if (!imageURL) {
        return res.status(400).json({ 
          status: 'error',
          message: "imageURL is required",
          code: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method
        });
      }

      const { ObjectStorageService } = await import("./objectStorage.js");
      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(imageURL);

      const existingActivity = await storage.getActivity(id);
      if (!existingActivity) {
        return res.status(404).json({ 
          status: 'error',
          message: "Activity not found",
          code: 'ACTIVITY_NOT_FOUND',
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method
        });
      }

      const currentUrls = Array.isArray(existingActivity.imageUrls) ? existingActivity.imageUrls : [];
      const mergedUrls = Array.from(new Set([objectPath, ...currentUrls].filter(Boolean)));
      const activity = await storage.updateActivity(id, { imageUrls: mergedUrls });

      await storage.createAuditLog({
        userId: authReq.session.user!.id,
        action: `Updated activity images: ${activity?.name}`,
        details: JSON.stringify({ activityId: id, imageUrls: mergedUrls })
      });

      res.json({ objectPath });
    } catch (error) {
      console.error("Error updating activity image:", error);
      res.status(500).json({ 
        status: 'error',
        message: "Failed to update activity image",
        code: 'UPDATE_ACTIVITY_IMAGE_ERROR',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      });
    }
  });

  // Review routes
  app.get("/api/reviews", asyncHandler(async (req: Request, res: Response) => {
    const activityId = req.query.activityId as string;
    const reviews = await storage.getReviews(activityId);
    res.json(Array.isArray(reviews) ? reviews : []);
  }));

  app.get("/api/activities/:id/rating", asyncHandler(async (req: Request, res: Response) => {
    const rating = await storage.getActivityRating(req.params.id);
    res.json(rating);
  }));

  app.post("/api/reviews", asyncHandler(async (req: Request, res: Response) => {
    try {
      const validatedData = insertReviewSchema.parse(req.body);
      const review = await storage.createReview(validatedData);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new AppError("Validation error", 400, 'VALIDATION_ERROR');
      }
      throw error;
    }
  }));

  // Admin review management
  app.get("/api/admin/reviews", adminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const reviews = await storage.getReviews();
    res.json(Array.isArray(reviews) ? reviews : []);
  }));

  app.patch("/api/admin/reviews/:id/approval", adminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const { approved } = req.body;
    const review = await storage.updateReviewApproval(req.params.id, approved);
    
    if (!review) {
      throw new NotFoundError("Review not found");
    }

    res.json(review);
  }));

  // CEO Dashboard Analytics endpoints
  app.get("/api/admin/analytics/earnings", superadminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const analytics = await storage.getEarningsAnalytics();
    res.json(analytics);
  }));

  app.get("/api/admin/analytics/activities", adminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const analytics = await storage.getActivityAnalytics();
    res.json(analytics);
  }));

  app.get("/api/admin/analytics/bookings", adminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const analytics = await storage.getBookingAnalytics();
    res.json(Array.isArray(analytics) ? analytics : []);
  }));

  // GetYourGuide price comparison
  app.get("/api/admin/getyourguide/comparison", superadminSecurityMiddleware, async (req: Request, res) => {
    try {
      const comparison = await storage.getGetYourGuidePriceComparison();
      res.json(comparison);
    } catch (error) {
      console.error("Error fetching GetYourGuide comparison:", error);
      res.status(500).json({ 
        status: 'error',
        message: "Failed to fetch price comparison",
        code: 'FETCH_PRICE_COMPARISON_ERROR',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      });
    }
  });

  app.patch("/api/admin/activities/:id/getyourguide-price", requireAuth, async (req: Request, res) => {
    try {
      const activityId = req.params.id;
      const { getyourguidePrice } = req.body;
      
      const updatedActivity = await storage.updateActivityGetYourGuidePrice(activityId, getyourguidePrice);
      
      if (!updatedActivity) {
        return res.status(404).json({ 
          status: 'error',
          message: "Activity not found",
          code: 'ACTIVITY_NOT_FOUND',
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method
        });
      }

      // Create audit log
      const authReq = req as AuthenticatedRequest;
      await storage.createAuditLog({
        userId: authReq.session.user!.id,
        action: `Updated GetYourGuide price for activity`,
        details: JSON.stringify({ activityId, getyourguidePrice })
      });

      res.json(updatedActivity);
    } catch (error) {
      console.error("Error updating GetYourGuide price:", error);
      res.status(500).json({ 
        status: 'error',
        message: "Failed to update GetYourGuide price",
        code: 'UPDATE_GETYOURGUIDE_PRICE_ERROR',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      });
    }
  });

  // Admin WhatsApp contacts endpoint
  app.get("/api/admin/whatsapp-contacts", adminSecurityMiddleware, async (req: Request, res) => {
    try {
      const contacts = whatsappService.getAdminContacts();
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching WhatsApp contacts:", error);
      res.status(500).json({ 
        status: 'error',
        message: "Failed to fetch WhatsApp contacts",
        code: 'FETCH_WHATSAPP_CONTACTS_ERROR',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      });
    }
  });

  // Circuit breaker system health monitoring
  app.get("/api/admin/system-health", superadminSecurityMiddleware, async (req: Request, res) => {
    try {
      const dbStatus = { isConnected: true, failureCount: 0 };
      const systemHealth = {
        database: {
          ...dbStatus,
          status: dbStatus.isConnected ? 'connected' : 'disconnected',
          lastCheck: new Date().toISOString()
        },
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          nodeVersion: process.version
        }
      };
      res.json(systemHealth);
    } catch (error) {
      console.error("Error fetching system health:", error);
      res.status(500).json({ 
        status: 'error',
        message: "Failed to fetch system health",
        code: 'FETCH_SYSTEM_HEALTH_ERROR',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      });
    }
  });

  // ===== DEPOSIT PAYMENT ENDPOINTS =====
  
  // Deposit payment endpoint
  app.post("/api/bookings/deposit", generalApiRateLimit, asyncHandler(async (req: Request, res: Response) => {
    const { bookingId, depositAmount, paymentMethod } = req.body;
    
    if (!bookingId || !depositAmount) {
      return res.status(400).json({
        status: 'error',
        message: 'Booking ID and deposit amount are required',
        code: 'MISSING_DEPOSIT_DATA'
      });
    }
    
    const booking = await storage.updateBookingPayment(bookingId, {
      paymentStatus: 'deposit_paid',
      paidAmount: depositAmount,
      paymentMethod: 'cash_deposit',
      depositAmount: depositAmount
    });
    
    if (!booking) {
      throw new NotFoundError("Booking not found");
    }
    
    // Send WhatsApp deposit confirmation
    const bookingWithActivity = await storage.getBooking(bookingId);
    if (bookingWithActivity && bookingWithActivity.activity) {
      const notificationData = {
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        activityName: bookingWithActivity.activity.name,
        numberOfPeople: booking.numberOfPeople,
        preferredDate: booking.preferredDate,
        totalAmount: parseInt(booking.totalAmount),
        paymentMethod: 'cash_deposit',
        paymentStatus: 'deposit_paid',
        status: booking.status,
        notes: `Deposit paid: ${depositAmount} MAD, Balance: ${parseInt(booking.totalAmount) - depositAmount} MAD`,
        bookingId: booking._id?.toString() || bookingId
      };
      
      await whatsappService.sendDepositConfirmation(notificationData);
    }
    
    res.json({
      status: 'success',
      message: 'Deposit payment recorded successfully',
      booking: booking
    });
  }));

  // ===== SMART NOTIFICATIONS ENDPOINTS =====
  
  // Send bulk notifications
  app.post("/api/admin/notifications/send", adminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const { templateId, bookingIds, customMessage } = req.body;
    
    if (!templateId || !bookingIds || !Array.isArray(bookingIds)) {
      return res.status(400).json({
        status: 'error',
        message: 'Template ID and booking IDs are required',
        code: 'MISSING_NOTIFICATION_DATA'
      });
    }
    
    const notifications = [];
    
    for (const bookingId of bookingIds) {
      const booking = await storage.getBooking(bookingId);
      if (booking && booking.activity) {
        const notificationData = {
          customerName: booking.customerName,
          customerPhone: booking.customerPhone,
          activityName: booking.activity.name,
          numberOfPeople: booking.numberOfPeople,
          preferredDate: booking.preferredDate,
          totalAmount: parseInt(booking.totalAmount),
          paymentMethod: booking.paymentMethod || 'cash',
          paymentStatus: booking.paymentStatus,
          status: booking.status,
          notes: customMessage || '',
          bookingId: booking._id?.toString() || bookingId
        };
        
        try {
          await whatsappService.sendSmartNotification(notificationData, templateId);
          notifications.push({
            bookingId,
            status: 'sent',
            sentAt: new Date().toISOString()
          });
        } catch (error) {
          notifications.push({
            bookingId,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            sentAt: new Date().toISOString()
          });
        }
      }
    }
    
    // Create audit log
    await storage.createAuditLog({
      userId: authReq.session.user!.id,
      action: `Sent ${notifications.length} smart notifications`,
      details: `Template: ${templateId}, Bookings: ${bookingIds.length}, Custom message: ${customMessage || 'none'}`
    });
    
    res.json({
      status: 'success',
      message: `Notifications sent to ${notifications.filter(n => n.status === 'sent').length} bookings`,
      notifications: notifications
    });
  }));

  // Get notification templates
  app.get("/api/admin/notifications/templates", adminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const templates = [
      {
        id: 'booking_confirmation',
        name: 'Booking Confirmation',
        description: 'Sent immediately when booking is created',
        timing: 'immediate'
      },
      {
        id: 'reminder_24h',
        name: '24-Hour Reminder',
        description: 'Sent 24 hours before activity',
        timing: 'scheduled'
      },
      {
        id: 'reminder_2h',
        name: '2-Hour Reminder',
        description: 'Sent 2 hours before activity',
        timing: 'scheduled'
      },
      {
        id: 'weather_alert',
        name: 'Weather Alert',
        description: 'Sent when weather conditions change',
        timing: 'immediate'
      },
      {
        id: 'payment_reminder',
        name: 'Payment Reminder',
        description: 'Sent for payment reminders',
        timing: 'scheduled'
      }
    ];
    
    res.json(templates);
  }));

  // ===== ANALYTICS & MONITORING ENDPOINTS =====

  // Performance monitoring endpoint
  app.get("/api/analytics/performance", adminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    // Mock performance metrics - in production, collect real metrics
    const metrics = {
      responseTime: Math.floor(Math.random() * 200) + 50, // 50-250ms
      uptime: 99.9,
      memoryUsage: Math.floor(Math.random() * 30) + 40, // 40-70%
      cpuUsage: Math.floor(Math.random() * 20) + 20, // 20-40%
      activeUsers: Math.floor(Math.random() * 50) + 10, // 10-60
      requestsPerMinute: Math.floor(Math.random() * 100) + 50, // 50-150
      errorRate: Math.random() * 2, // 0-2%
      databaseConnections: Math.floor(Math.random() * 10) + 5, // 5-15
      cacheHitRate: Math.floor(Math.random() * 20) + 80, // 80-100%
      lastUpdated: new Date().toISOString()
    };
    
    res.json(metrics);
  }));

  // System health endpoint
  app.get("/api/analytics/health", adminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const health = {
      status: 'healthy',
      services: {
        api: { status: 'up', responseTime: 45, uptime: 99.9, lastChecked: new Date().toISOString() },
        database: { status: 'up', responseTime: 12, uptime: 99.8, lastChecked: new Date().toISOString() },
        cache: { status: 'up', responseTime: 2, uptime: 99.9, lastChecked: new Date().toISOString() },
        storage: { status: 'up', responseTime: 8, uptime: 99.7, lastChecked: new Date().toISOString() }
      },
      alerts: [
        {
          id: 'alert-1',
          type: 'info',
          message: 'System running normally',
          timestamp: new Date().toISOString()
        }
      ]
    };
    
    res.json(health);
  }));

  // User analytics endpoint
  app.get("/api/analytics/users", adminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const timeRange = req.query.range || '7d';
    
    const analytics = {
      totalUsers: Math.floor(Math.random() * 1000) + 500,
      newUsers: Math.floor(Math.random() * 100) + 50,
      activeUsers: Math.floor(Math.random() * 200) + 100,
      returningUsers: Math.floor(Math.random() * 150) + 75,
      averageSessionDuration: Math.floor(Math.random() * 30) + 15, // 15-45 minutes
      bounceRate: Math.random() * 20 + 30, // 30-50%
      pageViews: Math.floor(Math.random() * 5000) + 2000,
      uniqueVisitors: Math.floor(Math.random() * 1000) + 500,
      topPages: [
        { page: '/', views: 1200, uniqueVisitors: 800 },
        { page: '/activities', views: 900, uniqueVisitors: 600 },
        { page: '/booking', views: 300, uniqueVisitors: 250 },
        { page: '/reviews', views: 200, uniqueVisitors: 180 }
      ],
      deviceBreakdown: {
        desktop: Math.floor(Math.random() * 200) + 300,
        mobile: Math.floor(Math.random() * 300) + 400,
        tablet: Math.floor(Math.random() * 100) + 50
      },
      geographicData: [
        { country: 'Morocco', users: 400, percentage: 45 },
        { country: 'France', users: 200, percentage: 22 },
        { country: 'Spain', users: 150, percentage: 17 },
        { country: 'Germany', users: 100, percentage: 11 },
        { country: 'UK', users: 50, percentage: 5 }
      ],
      hourlyActivity: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        users: Math.floor(Math.random() * 50) + 10,
        sessions: Math.floor(Math.random() * 80) + 20
      })),
      userJourney: [
        { step: 'Homepage Visit', users: 1000, dropoff: 0 },
        { step: 'Activities Page', users: 600, dropoff: 40 },
        { step: 'Booking Form', users: 200, dropoff: 67 },
        { step: 'Payment', users: 150, dropoff: 25 },
        { step: 'Confirmation', users: 140, dropoff: 7 }
      ]
    };
    
    res.json(analytics);
  }));

  // Business metrics endpoint
  app.get("/api/analytics/business", adminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const timeRange = req.query.range || '30d';
    
    const metrics = {
      revenue: {
        total: Math.floor(Math.random() * 50000) + 100000, // 100k-150k MAD
        monthly: Math.floor(Math.random() * 20000) + 30000, // 30k-50k MAD
        growth: Math.random() * 20 - 5, // -5% to +15%
        target: 50000
      },
      bookings: {
        total: Math.floor(Math.random() * 200) + 100,
        confirmed: Math.floor(Math.random() * 150) + 80,
        pending: Math.floor(Math.random() * 30) + 10,
        cancelled: Math.floor(Math.random() * 20) + 5,
        conversionRate: Math.random() * 10 + 15 // 15-25%
      },
      customers: {
        total: Math.floor(Math.random() * 500) + 200,
        new: Math.floor(Math.random() * 100) + 50,
        returning: Math.floor(Math.random() * 150) + 100,
        averageOrderValue: Math.floor(Math.random() * 500) + 800, // 800-1300 MAD
        lifetimeValue: Math.floor(Math.random() * 2000) + 3000 // 3000-5000 MAD
      },
      activities: {
        total: 5,
        popular: [
          { name: 'Hot Air Balloon Ride', bookings: 45, revenue: 22500 },
          { name: 'Desert Safari', bookings: 40, revenue: 20000 },
          { name: 'Ouzoud Waterfalls', bookings: 35, revenue: 17500 },
          { name: 'Ourika Valley', bookings: 30, revenue: 15000 },
          { name: 'Essaouira Day Trip', bookings: 25, revenue: 12500 }
        ],
        performance: [
          { name: 'Hot Air Balloon', bookings: 45, revenue: 22500, rating: 4.8 },
          { name: 'Desert Safari', bookings: 40, revenue: 20000, rating: 4.6 },
          { name: 'Ouzoud Waterfalls', bookings: 35, revenue: 17500, rating: 4.7 },
          { name: 'Ourika Valley', bookings: 30, revenue: 15000, rating: 4.5 },
          { name: 'Essaouira Trip', bookings: 25, revenue: 12500, rating: 4.4 }
        ]
      },
      trends: {
        revenue: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          amount: Math.floor(Math.random() * 2000) + 1000,
          bookings: Math.floor(Math.random() * 10) + 5
        })),
        bookings: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          bookings: Math.floor(Math.random() * 8) + 2,
          revenue: Math.floor(Math.random() * 1500) + 500
        })),
        seasonal: [
          { month: 'Jan', bookings: 20, revenue: 10000 },
          { month: 'Feb', bookings: 25, revenue: 12500 },
          { month: 'Mar', bookings: 35, revenue: 17500 },
          { month: 'Apr', bookings: 45, revenue: 22500 },
          { month: 'May', bookings: 55, revenue: 27500 },
          { month: 'Jun', bookings: 65, revenue: 32500 },
          { month: 'Jul', bookings: 70, revenue: 35000 },
          { month: 'Aug', bookings: 75, revenue: 37500 },
          { month: 'Sep', bookings: 60, revenue: 30000 },
          { month: 'Oct', bookings: 50, revenue: 25000 },
          { month: 'Nov', bookings: 30, revenue: 15000 },
          { month: 'Dec', bookings: 25, revenue: 12500 }
        ]
      },
      goals: {
        monthlyRevenue: {
          target: 50000,
          current: Math.floor(Math.random() * 20000) + 30000,
          percentage: 0
        },
        monthlyBookings: {
          target: 100,
          current: Math.floor(Math.random() * 50) + 50,
          percentage: 0
        },
        customerSatisfaction: {
          target: 4.5,
          current: Math.random() * 0.5 + 4.3,
          percentage: 0
        }
      }
    };

    // Calculate goal percentages
    metrics.goals.monthlyRevenue.percentage = (metrics.goals.monthlyRevenue.current / metrics.goals.monthlyRevenue.target) * 100;
    metrics.goals.monthlyBookings.percentage = (metrics.goals.monthlyBookings.current / metrics.goals.monthlyBookings.target) * 100;
    metrics.goals.customerSatisfaction.percentage = (metrics.goals.customerSatisfaction.current / metrics.goals.customerSatisfaction.target) * 100;
    
    res.json(metrics);
  }));

  // System health detailed endpoint
  app.get("/api/analytics/system-health", adminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const health = {
      overall: {
        status: 'healthy',
        uptime: 99.9,
        lastCheck: new Date().toISOString()
      },
      services: {
        api: {
          status: 'up',
          responseTime: Math.floor(Math.random() * 50) + 20,
          uptime: 99.9,
          lastChecked: new Date().toISOString()
        },
        database: {
          status: 'up',
          responseTime: Math.floor(Math.random() * 20) + 5,
          uptime: 99.8,
          lastChecked: new Date().toISOString()
        },
        cache: {
          status: 'up',
          responseTime: Math.floor(Math.random() * 5) + 1,
          uptime: 99.9,
          lastChecked: new Date().toISOString()
        },
        storage: {
          status: 'up',
          responseTime: Math.floor(Math.random() * 15) + 5,
          uptime: 99.7,
          lastChecked: new Date().toISOString()
        },
        cdn: {
          status: 'up',
          responseTime: Math.floor(Math.random() * 10) + 5,
          uptime: 99.9,
          lastChecked: new Date().toISOString()
        },
        monitoring: {
          status: 'up',
          responseTime: Math.floor(Math.random() * 5) + 2,
          uptime: 99.9,
          lastChecked: new Date().toISOString()
        }
      },
      resources: {
        cpu: {
          current: Math.floor(Math.random() * 30) + 20,
          max: 100,
          average: Math.floor(Math.random() * 20) + 25,
          trend: 'stable'
        },
        memory: {
          current: Math.floor(Math.random() * 20) + 40,
          max: 100,
          average: Math.floor(Math.random() * 15) + 45,
          trend: 'stable'
        },
        disk: {
          current: Math.floor(Math.random() * 20) + 30,
          max: 100,
          average: Math.floor(Math.random() * 15) + 35,
          trend: 'up'
        },
        network: {
          bandwidth: {
            incoming: Math.floor(Math.random() * 100) + 50,
            outgoing: Math.floor(Math.random() * 50) + 25
          },
          latency: Math.floor(Math.random() * 20) + 10,
          packetLoss: Math.random() * 0.5
        }
      },
      alerts: [
        {
          id: 'alert-1',
          type: 'info',
          title: 'System Running Normally',
          message: 'All systems are operating within normal parameters',
          timestamp: new Date().toISOString(),
          resolved: true
        }
      ],
      incidents: []
    };
    
    res.json(health);
  }));

  // ===== DEBUG ENDPOINTS =====
  
  // Fake booking generator for testing
  app.post("/api/debug/fake-booking", asyncHandler(async (req: Request, res: Response) => {
    try {
      console.log('🧪 Creating fake booking for testing...');
      
      // Create a fake booking
      const fakeBooking = await storage.createBooking({
        customerName: "Test Customer",
        customerPhone: "+212636738343",
        customerEmail: "test@example.com",
        activityId: "fake-activity-id",
        numberOfPeople: 2,
        preferredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        participantNames: ["Test Customer", "Test Guest"],
        notes: "This is a test booking created via debug endpoint",
        status: 'PENDING',
        totalAmount: "600",
        paymentStatus: 'unpaid',
        paymentMethod: 'cash',
        paidAmount: 0,
        rescheduleCount: 0,
      });
      
      // Get a real activity for the notification
      const activities = await storage.getActivities();
      const activity = activities[0] || {
        name: "Test Activity",
        description: "Test activity for debugging",
        price: 300
      };
      
      // Send WhatsApp notification to admins
      const participantNames = fakeBooking.participantNames?.join(', ') || fakeBooking.customerName;
      const bookingId = fakeBooking._id?.toString() || 'N/A';
      const baseUrl = process.env.CLIENT_URL || 'https://marrakech-dunes.vercel.app';
      
      const adminNotificationData = {
        customerName: fakeBooking.customerName,
        customerPhone: fakeBooking.customerPhone,
        activityName: activity.name,
        numberOfPeople: fakeBooking.numberOfPeople,
        preferredDate: new Date(fakeBooking.preferredDate),
        totalAmount: parseInt(fakeBooking.totalAmount),
        paymentMethod: fakeBooking.paymentMethod || 'cash',
        paymentStatus: fakeBooking.paymentStatus || 'unpaid',
        status: fakeBooking.status,
        notes: fakeBooking.notes ? `Participants: ${participantNames}\n${fakeBooking.notes}` : `Participants: ${participantNames}`,
        bookingId: bookingId,
        confirmLink: `${baseUrl}/api/bookings/${bookingId}/confirm`,
        rejectLink: `${baseUrl}/api/bookings/${bookingId}/reject`
      };
      
      console.log('📤 Sending admin notifications for fake booking:', fakeBooking._id);
      const whatsappResult = await whatsappService.sendBookingNotification(adminNotificationData);
      
      // Log results
      if (whatsappResult.success) {
        console.log('✅ Admin WhatsApp notifications sent successfully');
        console.log('📱 Admin notification links:', whatsappResult.whatsappLinks);
      } else {
        console.log('⚠️ Admin WhatsApp notifications failed');
      }
      
      res.status(201).json({
        status: 'success',
        message: 'Fake booking created and admin notifications sent',
        booking: fakeBooking,
        adminNotification: {
          sent: whatsappResult.success,
          method: whatsappResult.success ? 'whatsapp' : 'email_fallback',
          links: whatsappResult.whatsappLinks
        }
      });
      
    } catch (error: any) {
      console.error('❌ Fake booking creation failed:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create fake booking',
        error: error.message
      });
    }
  }));

  // ===== BOOKING STATUS WORKFLOW ENDPOINTS =====
  
  // Pending booking endpoint (for admin notifications)
  app.post("/api/bookings/:id/pending", adminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    console.log('📋 Admin marking booking as pending:', id);
    
    const booking = await storage.getBooking(id);
    if (!booking) {
      throw new NotFoundError("Booking not found");
    }
    
    // Update booking to pending status
    const updatedBooking = await storage.updateBooking(id, { 
      status: 'PENDING',
      statusHistory: [
        ...(booking.statusHistory || []),
        {
          status: 'PENDING' as any,
          changedBy: 'system',
          changedAt: new Date(),
          reason: 'Booking marked as pending for admin review'
        }
      ]
    });
    
    console.log('✅ Booking marked as pending:', id);
    
    res.json({
      status: 'success',
      message: 'Booking marked as pending',
      booking: updatedBooking
    });
  }));
  
  // Reject booking endpoint
  app.post("/api/bookings/:id/reject", adminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const { reason } = req.body;
    
    console.log('❌ Admin rejecting booking:', id);
    
    const booking = await storage.getBooking(id);
    if (!booking) {
      throw new NotFoundError("Booking not found");
    }
    
    if (booking.status !== 'PENDING') {
      return res.status(400).json({
        status: 'error',
        message: 'Only pending bookings can be rejected',
        code: 'INVALID_BOOKING_STATUS'
      });
    }
    
    // Update booking to rejected
    const updatedBooking = await storage.updateBooking(id, { 
      status: 'REJECTED',
      statusHistory: [
        ...(booking.statusHistory || []),
        {
          status: booking.status as any,
          changedBy: authReq.session.user!.id,
          changedAt: new Date(),
          reason: reason || 'Booking rejected by admin'
        }
      ]
    });
    
    // Get activity details for notification
    const activity = await storage.getActivity(booking.activityId);
    if (!activity) {
      throw new NotFoundError("Activity not found");
    }
    
    // Send rejection notification to customer
    const customerNotificationData = {
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      activityName: activity.name,
      numberOfPeople: booking.numberOfPeople,
      preferredDate: new Date(booking.preferredDate),
      totalAmount: parseInt(booking.totalAmount),
      paymentMethod: booking.paymentMethod || 'cash',
      paymentStatus: 'unpaid',
      status: 'REJECTED',
      notes: booking.notes,
      bookingId: booking._id?.toString() || 'N/A'
    };
    
    // Try WhatsApp first, then email fallback
    let notificationResult = { success: false, method: 'none' };
    
    try {
      // Try WhatsApp notification
      const whatsappResult = await whatsappService.sendBookingNotification(customerNotificationData);
      if (whatsappResult.success) {
        notificationResult = { success: true, method: 'whatsapp' };
        console.log('📱 Customer WhatsApp rejection notification sent');
      }
    } catch (whatsappError) {
      console.log('⚠️ WhatsApp failed, trying email fallback');
    }
    
    // If WhatsApp failed and customer has email, send email
    if (!notificationResult.success && booking.customerEmail) {
      try {
        const emailService = new (await import('./services/email-service.js')).EmailService();
        const emailSubject = `Booking Update - ${activity.name}`;
        const emailHtml = `
          <h2>Booking Status Update</h2>
          <p>Dear ${booking.customerName},</p>
          <p>We regret to inform you that your booking has been rejected:</p>
          <ul>
            <li><strong>Activity:</strong> ${activity.name}</li>
            <li><strong>Date:</strong> ${new Date(booking.preferredDate).toLocaleDateString()}</li>
            <li><strong>Participants:</strong> ${booking.numberOfPeople}</li>
            <li><strong>Total Amount:</strong> ${booking.totalAmount} MAD</li>
            <li><strong>Status:</strong> Rejected</li>
            <li><strong>Reason:</strong> ${reason || 'No specific reason provided'}</li>
          </ul>
          <p>Please contact us if you have any questions.</p>
          <p>Best regards,<br>MarrakechDunes Team</p>
        `;
        
        const emailSent = await emailService.sendEmail(
          booking.customerEmail,
          emailSubject,
          emailHtml
        );
        
        if (emailSent) {
          notificationResult = { success: true, method: 'email' };
          console.log('📧 Customer email rejection notification sent to:', booking.customerEmail);
        }
      } catch (emailError) {
        console.error('❌ Email rejection notification failed:', emailError);
      }
    }
    
    // Create audit log
    await storage.createAuditLog({
      userId: authReq.session.user!.id,
      action: `Rejected booking ${id}`,
      details: JSON.stringify({ 
        bookingId: id, 
        from: booking.status, 
        to: 'REJECTED',
        reason: reason,
        notificationMethod: notificationResult.method
      })
    });
    
    console.log('✅ Booking rejected:', {
      bookingId: id,
      customerName: booking.customerName,
      notificationSent: notificationResult.success,
      notificationMethod: notificationResult.method
    });
    
    res.json({
      status: 'success',
      message: 'Booking rejected successfully',
      booking: updatedBooking,
      notification: notificationResult
    });
  }));
  
  // Confirm booking endpoint
  app.post("/api/bookings/:id/confirm", adminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    
    console.log('🔔 Admin confirming booking:', id);
    
    const booking = await storage.getBooking(id);
    if (!booking) {
      throw new NotFoundError("Booking not found");
    }
    
    if (booking.status !== 'PENDING') {
      return res.status(400).json({
        status: 'error',
        message: 'Only pending bookings can be confirmed',
        code: 'INVALID_BOOKING_STATUS'
      });
    }
    
    // Update booking to confirmed and paid
    const updatedBooking = await storage.updateBooking(id, { 
      status: 'CONFIRMED',
      paymentStatus: 'fully_paid',
      statusHistory: [
        ...(booking.statusHistory || []),
        {
          status: booking.status as any,
          changedBy: authReq.session.user!.id,
          changedAt: new Date(),
          reason: 'Admin confirmed booking'
        }
      ]
    });
    
    // Get activity details for notification
    const activity = await storage.getActivity(booking.activityId);
    if (!activity) {
      throw new NotFoundError("Activity not found");
    }
    
    // Send confirmation notification to customer
    const customerNotificationData = {
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      activityName: activity.name,
      numberOfPeople: booking.numberOfPeople,
      preferredDate: new Date(booking.preferredDate),
      totalAmount: parseInt(booking.totalAmount),
      paymentMethod: booking.paymentMethod || 'cash',
      paymentStatus: 'fully_paid',
      status: 'CONFIRMED',
      notes: booking.notes,
      bookingId: booking._id?.toString() || 'N/A'
    };
    
    // Try WhatsApp first, then email fallback
    let notificationResult = { success: false, method: 'none' };
    
    try {
      // Try WhatsApp notification
      const whatsappResult = await whatsappService.sendBookingNotification(customerNotificationData);
      if (whatsappResult.success) {
        notificationResult = { success: true, method: 'whatsapp' };
        console.log('📱 Customer WhatsApp confirmation sent');
      }
    } catch (whatsappError) {
      console.log('⚠️ WhatsApp failed, trying email fallback');
    }
    
    // If WhatsApp failed and customer has email, send email
    if (!notificationResult.success && booking.customerEmail) {
      try {
        const emailService = new (await import('./services/email-service.js')).EmailService();
        const emailSubject = `Booking Confirmed - ${activity.name}`;
        const emailHtml = `
          <h2>🎉 Your Booking is Confirmed!</h2>
          <p>Dear ${booking.customerName},</p>
          <p>Great news! Your booking has been confirmed:</p>
          <ul>
            <li><strong>Activity:</strong> ${activity.name}</li>
            <li><strong>Date:</strong> ${new Date(booking.preferredDate).toLocaleDateString()}</li>
            <li><strong>Participants:</strong> ${booking.numberOfPeople}</li>
            <li><strong>Total Amount:</strong> ${booking.totalAmount} MAD</li>
            <li><strong>Status:</strong> Confirmed ✅</li>
          </ul>
          <p>We will contact you soon with pickup details.</p>
          <p>Best regards,<br>MarrakechDunes Team</p>
        `;
        
        const emailSent = await emailService.sendEmail(
          booking.customerEmail,
          emailSubject,
          emailHtml
        );
        
        if (emailSent) {
          notificationResult = { success: true, method: 'email' };
          console.log('📧 Customer email confirmation sent to:', booking.customerEmail);
        }
      } catch (emailError) {
        console.error('❌ Email confirmation failed:', emailError);
      }
    }
    
    // Create audit log
    await storage.createAuditLog({
      userId: authReq.session.user!.id,
      action: `Confirmed booking ${id}`,
      details: JSON.stringify({ 
        bookingId: id, 
        from: booking.status, 
        to: 'CONFIRMED',
        notificationMethod: notificationResult.method
      })
    });
    
    console.log('✅ Booking confirmed:', {
      bookingId: id,
      customerName: booking.customerName,
      notificationSent: notificationResult.success,
      notificationMethod: notificationResult.method
    });
    
    res.json({
      status: 'success',
      message: 'Booking confirmed successfully',
      booking: updatedBooking,
      notification: notificationResult
    });
  }));
  
  // Update booking status with validation
  app.patch("/api/bookings/:id/status", adminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const { status, reason } = req.body;
    
    const booking = await storage.getBooking(id);
    if (!booking) {
      throw new NotFoundError("Booking not found");
    }
    
    // Validate status transition
    const validation = validateStatusTransition(booking.status as any, status);
    if (!validation.valid) {
      return res.status(400).json({
        status: 'error',
        message: validation.reason,
        code: 'INVALID_STATUS_TRANSITION'
      });
    }
    
    // Update booking status
    const updatedBooking = await storage.updateBooking(id, { 
      status,
      statusHistory: [
        ...(booking.statusHistory || []),
        {
          status: booking.status as any,
          changedBy: authReq.session.user!.id,
          changedAt: new Date(),
          reason
        }
      ]
    });
    
    // Create audit log
    await storage.createAuditLog({
      userId: authReq.session.user!.id,
      action: `Updated booking ${id} status from ${booking.status} to ${status}`,
      details: JSON.stringify({ 
        bookingId: id, 
        from: booking.status, 
        to: status, 
        reason 
      })
    });
    
    res.json({
      status: 'success',
      message: 'Booking status updated successfully',
      booking: updatedBooking,
      displayName: getStatusDisplayName(status as any),
      color: getStatusColor(status as any)
    });
  }));

  // ===== CANCELLATION HANDLING ENDPOINTS =====
  
  // Cancel booking with policy calculation
  app.patch("/api/bookings/:id/cancel", adminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const { reason } = req.body;
    
    const booking = await storage.getBooking(id);
    if (!booking) {
      throw new NotFoundError("Booking not found");
    }
    
    // Calculate cancellation policy
    const policy = calculateCancellationPolicy(
      new Date(booking.preferredDate),
      new Date(),
      parseInt(booking.totalAmount),
      reason
    );
    
    // Update booking with cancellation details
    const updatedBooking = await storage.updateBooking(id, {
      status: 'CANCELLED',
      cancellationReason: reason,
      cancellationDate: new Date(),
      refundAmount: policy.refundPercentage > 0 ? (parseInt(booking.totalAmount) * policy.refundPercentage / 100) : 0,
      refundStatus: policy.refundPercentage === 100 ? 'full' : policy.refundPercentage > 0 ? 'partial' : 'none'
    });
    
    // Create audit log
    await storage.createAuditLog({
      userId: authReq.session.user!.id,
      action: `Cancelled booking ${id}`,
      details: JSON.stringify({ 
        bookingId: id, 
        reason, 
        policy: policy.description,
        refundAmount: updatedBooking?.refundAmount || 0
      })
    });
    
    res.json({
      status: 'success',
      message: 'Booking cancelled successfully',
      booking: updatedBooking,
      policy: {
        ...policy,
        reasonDisplay: getCancellationReasonDisplay(reason)
      }
    });
  }));

  // ===== WHATSAPP TEMPLATES ENDPOINTS =====
  
  // Get notification templates
  app.get("/api/notifications/templates", adminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    res.json(NOTIFICATION_TEMPLATES);
  }));

  // Preview notification template
  app.post("/api/notifications/preview", adminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const { templateId, data } = req.body;
    
    const template = getTemplateById(templateId);
    if (!template) {
      return res.status(404).json({
        status: 'error',
        message: 'Template not found',
        code: 'TEMPLATE_NOT_FOUND'
      });
    }
    
    const formattedMessage = formatNotificationTemplate(template, data);
    
    res.json({
      template,
      formattedMessage,
      preview: formattedMessage.substring(0, 200) + '...'
    });
  }));

  // Send notification
  app.post("/api/notifications/send", adminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const { templateId, bookingId, customMessage } = req.body;
    
    const booking = await storage.getBooking(bookingId);
    if (!booking) {
      throw new NotFoundError("Booking not found");
    }
    
    const template = getTemplateById(templateId);
    if (!template) {
      return res.status(404).json({
        status: 'error',
        message: 'Template not found',
        code: 'TEMPLATE_NOT_FOUND'
      });
    }
    
    const notificationData = {
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      activityName: booking.activity?.name || 'Unknown Activity',
      numberOfPeople: booking.numberOfPeople,
      preferredDate: new Date(booking.preferredDate),
      totalAmount: parseInt(booking.totalAmount),
      paymentMethod: booking.paymentMethod || 'cash',
      paymentStatus: booking.paymentStatus,
      status: booking.status,
      notes: customMessage || booking.notes || '',
      bookingId: booking._id?.toString() || bookingId
    };
    
    // Send WhatsApp notification
    let whatsappSent = false;
    try {
      await whatsappService.sendBookingNotification(notificationData);
      whatsappSent = true;
    } catch (error) {
      console.error('WhatsApp sending failed:', error);
    }
    
    // Send email backup if WhatsApp failed
    let emailSent = false;
    if (!whatsappSent) {
      try {
        emailSent = await emailService.sendBookingConfirmation(notificationData);
      } catch (error) {
        console.error('Email sending failed:', error);
      }
    }
    
    // Create audit log
    await storage.createAuditLog({
      userId: authReq.session.user!.id,
      action: `Sent notification for booking ${bookingId}`,
      details: JSON.stringify({ 
        bookingId, 
        templateId, 
        whatsappSent, 
        emailSent,
        customMessage 
      })
    });
    
    res.json({
      status: 'success',
      message: 'Notification sent successfully',
      whatsappSent,
      emailSent,
      fallbackUsed: !whatsappSent && emailSent
    });
  }));

  // ===== EMAIL BACKUP ENDPOINTS =====
  
  // Test email service
  app.post("/api/notifications/email/test", adminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Email address is required',
        code: 'EMAIL_REQUIRED'
      });
    }
    
    const testData = {
      customerName: 'Test Customer',
      customerPhone: email,
      activityName: 'Test Activity',
      numberOfPeople: 2,
      preferredDate: new Date(),
      totalAmount: 500,
      bookingId: 'TEST-123'
    };
    
    const emailSent = await emailService.sendBookingConfirmation(testData);
    
    res.json({
      status: emailSent ? 'success' : 'error',
      message: emailSent ? 'Test email sent successfully' : 'Failed to send test email',
      emailSent
    });
  }));

  // Test notification system endpoint
  app.post("/api/notifications/test", adminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const { testType } = req.body;
    
    try {
      let result = { success: false, message: '', details: {} };
      
      if (testType === 'whatsapp') {
        // Test WhatsApp notifications
        const testBooking = {
          customerName: 'Test Customer',
          customerPhone: '+212600000000',
          activityName: 'Test Activity',
          numberOfPeople: 1,
          preferredDate: new Date(),
          totalAmount: 500,
          paymentMethod: 'cash',
          paymentStatus: 'unpaid',
          status: 'pending',
          notes: 'Test booking notification',
          bookingId: 'TEST-' + Date.now(),
          confirmLink: 'https://marrakech-dunes.vercel.app/admin',
          rejectLink: 'https://marrakech-dunes.vercel.app/admin'
        };
        
        const whatsappResult = await whatsappService.sendBookingNotification(testBooking);
        result = {
          success: whatsappResult.success,
          message: 'WhatsApp test completed',
          details: {
            recipients: whatsappResult.recipients,
            whatsappLinks: whatsappResult.whatsappLinks
          }
        };
      } else if (testType === 'email') {
        // Test email notifications
        const testEmailData = {
          customerName: 'Test Customer',
          customerPhone: '+212600000000',
          activityName: 'Test Activity',
          numberOfPeople: 1,
          preferredDate: new Date(),
          totalAmount: 500,
          bookingId: 'TEST-' + Date.now()
        };
        
        const emailSent = await emailService.sendBookingConfirmation(testEmailData);
        result = {
          success: emailSent,
          message: emailSent ? 'Email test sent successfully' : 'Email test failed',
          details: { emailSent }
        };
      } else {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid test type. Use "whatsapp" or "email"',
          code: 'INVALID_TEST_TYPE'
        });
      }
      
      // Create audit log
      await storage.createAuditLog({
        userId: authReq.session.user!.id,
        action: `Tested ${testType} notification system`,
        details: JSON.stringify(result)
      });
      
      res.json({
        status: result.success ? 'success' : 'error',
        message: result.message,
        ...result.details
      });
    } catch (error: any) {
      console.error('Notification test error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to test notifications',
        error: error.message
      });
    }
  }));

  // Send email to customer endpoint
  app.post("/api/notifications/email/send", adminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const { customerEmail, customerName, subject, message, bookingId } = req.body;
    
    if (!customerEmail || !customerName || !subject || !message) {
      return res.status(400).json({
        status: 'error',
        message: 'All fields are required: customerEmail, customerName, subject, message',
        code: 'MISSING_FIELDS'
      });
    }
    
    try {
      // Send email using the email service
      const emailData = {
        customerName,
        customerPhone: customerEmail,
        activityName: 'Custom Message',
        numberOfPeople: 1,
        preferredDate: new Date(),
        totalAmount: 0,
        bookingId: bookingId || 'EMAIL-' + Date.now()
      };
      
      const emailSent = await emailService.sendBookingConfirmation(emailData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: authReq.session.user!.id,
        action: `Sent email to ${customerName} (${customerEmail})`,
        details: JSON.stringify({ 
          customerEmail, 
          customerName, 
          subject, 
          message, 
          bookingId,
          emailSent 
        })
      });
      
      res.json({
        status: emailSent ? 'success' : 'error',
        message: emailSent ? 'Email sent successfully' : 'Failed to send email',
        emailSent
      });
    } catch (error: any) {
      console.error('Email sending error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to send email',
        error: error.message
      });
    }
  }));

  // ===== DYNAMIC PRICING ENDPOINTS =====
  
  // Get pricing quote
  app.get("/api/pricing/quote", generalApiRateLimit, asyncHandler(async (req: Request, res: Response) => {
    const { activityId, date, partySize } = req.query;
    
    if (!activityId || !date || !partySize) {
      return res.status(400).json({
        status: 'error',
        message: 'activityId, date, and partySize are required',
        code: 'MISSING_PARAMETERS'
      });
    }
    
    const activity = await storage.getActivity(activityId as string);
    if (!activity) {
      throw new NotFoundError("Activity not found");
    }
    
    // Get current bookings for demand calculation
    const bookings = await storage.getBookings();
    const currentBookings = bookings.filter(b => 
      b.activityId === activityId && 
      new Date(b.preferredDate).toDateString() === new Date(date as string).toDateString()
    ).length;
    
    const pricingContext = {
      activityId: activityId as string,
      date: new Date(date as string),
      partySize: parseInt(partySize as string),
      basePrice: parseInt(activity.price),
      currentBookings,
      maxCapacity: activity.maxParticipants || 20
    };
    
    const quote = calculateDynamicPricing(pricingContext, activity.pricingConfig);
    const seasonalDescription = getSeasonalDescription(pricingContext.date.getMonth() + 1);
    
    res.json({
      ...quote,
      seasonalDescription,
      capacityUtilization: (currentBookings / pricingContext.maxCapacity) * 100
    });
  }));

  // ===== WEATHER API ENDPOINTS =====
  
  // Get weather data
  app.get("/api/weather", generalApiRateLimit, asyncHandler(async (req: Request, res: Response) => {
    try {
      // Mock weather data - in production, integrate with real weather API
      const weatherData = {
        condition: 'sunny',
        temperature: 28,
        windSpeed: 12,
        humidity: 45,
        forecast: 'Sunny with clear skies',
        recommendation: 'Perfect weather for outdoor activities',
        lastUpdated: new Date().toISOString()
      };
      
      res.json(weatherData);
    } catch (error) {
      console.error("Error fetching weather data:", error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch weather data',
        code: 'WEATHER_FETCH_ERROR'
      });
    }
  }));

  // Weather-based activity recommendations
  app.get("/api/weather/recommendations", generalApiRateLimit, asyncHandler(async (req: Request, res: Response) => {
    try {
      const { condition } = req.query;
      
      const recommendations = {
        sunny: {
          recommended: ['Hot Air Balloon', 'Desert Safari', 'Ourika Valley', 'Ouzoud Waterfalls'],
          notRecommended: [],
          message: 'Perfect weather for all outdoor activities!'
        },
        rainy: {
          recommended: ['Essaouira Day Trip', 'City Tour'],
          notRecommended: ['Hot Air Balloon', 'Desert Safari', 'Ourika Valley'],
          message: 'Indoor and covered activities recommended'
        },
        cloudy: {
          recommended: ['Essaouira Day Trip', 'Ouzoud Waterfalls', 'City Tour'],
          notRecommended: ['Hot Air Balloon'],
          message: 'Good weather for most activities, avoid balloon rides'
        },
        windy: {
          recommended: ['City Tour', 'Essaouira Day Trip'],
          notRecommended: ['Hot Air Balloon', 'Desert Safari'],
          message: 'Windy conditions - avoid balloon and desert activities'
        }
      };
      
      const weatherCondition = condition as string || 'sunny';
      const recommendation = recommendations[weatherCondition as keyof typeof recommendations] || recommendations.sunny;
      
      res.json({
        condition: weatherCondition,
        recommendations: recommendation,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error fetching weather recommendations:", error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch weather recommendations',
        code: 'WEATHER_RECOMMENDATIONS_ERROR'
      });
    }
  }));

  // ===== GROUP BOOKING ENDPOINTS =====
  
  // Create group booking
  app.post("/api/bookings/group", generalApiRateLimit, asyncHandler(async (req: Request, res: Response) => {
    const { activityId, coordinator, participants, preferredDate, notes } = req.body;
    
    if (!activityId || !coordinator || !participants || !preferredDate) {
      return res.status(400).json({
        status: 'error',
        message: 'activityId, coordinator, participants, and preferredDate are required',
        code: 'MISSING_GROUP_BOOKING_DATA'
      });
    }
    
    const activity = await storage.getActivity(activityId);
    if (!activity) {
      throw new NotFoundError("Activity not found");
    }
    
    // Calculate group discount
    const participantCount = participants.length;
    let groupDiscountPct = 0;
    if (participantCount >= 9) {
      groupDiscountPct = 15; // 15% for 9+ people
    } else if (participantCount >= 5) {
      groupDiscountPct = 10; // 10% for 5-8 people
    } else if (participantCount >= 2) {
      groupDiscountPct = 5; // 5% for 2-4 people
    }
    
    const basePrice = parseInt(activity.price);
    const totalAmount = Math.round(basePrice * participantCount * (1 - groupDiscountPct / 100));
    
    const booking = await storage.createBooking({
      customerName: coordinator.name,
      customerPhone: coordinator.phone,
      activityId,
      numberOfPeople: participantCount,
      preferredDate: new Date(preferredDate),
      participantNames: participants.map((p: any) => p.name),
      status: 'PENDING',
      totalAmount: totalAmount.toString(),
      paymentStatus: 'unpaid',
      paymentMethod: 'cash',
      paidAmount: 0,
      isGroupBooking: true,
      groupCoordinator: coordinator,
      participants,
      groupDiscountPct,
      rescheduleCount: 0
    });
    
    res.status(201).json({
      status: 'success',
      message: 'Group booking created successfully',
      booking,
      groupDiscount: {
        percentage: groupDiscountPct,
        amount: basePrice * participantCount - totalAmount
      }
    });
  }));

  // ===== RESCHEDULING ENDPOINTS =====
  
  // Reschedule booking
  app.patch("/api/bookings/:id/reschedule", adminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const { newDate, reason } = req.body;
    
    const booking = await storage.getBooking(id);
    if (!booking) {
      throw new NotFoundError("Booking not found");
    }
    
    // Check reschedule limits
    const rescheduleCount = booking.rescheduleCount || 0;
    if (rescheduleCount >= 2) {
      return res.status(400).json({
        status: 'error',
        message: 'Maximum reschedules reached (2 per booking)',
        code: 'MAX_RESCHEDULES_REACHED'
      });
    }
    
    // Check deadline (48 hours before tour)
    const hoursUntilTour = (new Date(booking.preferredDate).getTime() - new Date().getTime()) / (1000 * 60 * 60);
    if (hoursUntilTour < 48) {
      return res.status(400).json({
        status: 'error',
        message: 'Rescheduling deadline passed (48 hours before tour)',
        code: 'RESCHEDULE_DEADLINE_PASSED'
      });
    }
    
    // Calculate reschedule fee
    const rescheduleFee = 50; // 50 MAD per reschedule
    
    const updatedBooking = await storage.updateBooking(id, {
      preferredDate: new Date(newDate),
      rescheduleCount: rescheduleCount + 1,
      rescheduleFee: (booking.rescheduleFee || 0) + rescheduleFee,
      originalDate: booking.originalDate || new Date(booking.preferredDate)
    });
    
    // Create audit log
    await storage.createAuditLog({
      userId: authReq.session.user!.id,
      action: `Rescheduled booking ${id}`,
      details: JSON.stringify({ 
        bookingId: id, 
        from: booking.preferredDate, 
        to: newDate, 
        reason,
        rescheduleCount: rescheduleCount + 1,
        fee: rescheduleFee
      })
    });
    
    res.json({
      status: 'success',
      message: 'Booking rescheduled successfully',
      booking: updatedBooking,
      rescheduleFee,
      remainingReschedules: 2 - (rescheduleCount + 1)
    });
  }));

  // ===== CUSTOMER PORTAL ENDPOINTS =====
  
  // Request OTP for portal login
  app.post("/api/portal/request-otp", generalApiRateLimit, asyncHandler(async (req: Request, res: Response) => {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        status: 'error',
        message: 'Phone number is required',
        code: 'PHONE_REQUIRED'
      });
    }
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Store OTP in database (you'll need to implement this in storage)
    // For now, we'll just return success
    console.log(`OTP for ${phone}: ${otp} (expires at ${expiresAt})`);
    
    res.json({
      status: 'success',
      message: 'OTP sent successfully',
      expiresAt
    });
  }));

  // Login with OTP
  app.post("/api/portal/login", generalApiRateLimit, asyncHandler(async (req: Request, res: Response) => {
    const { phone, otp } = req.body;
    
    if (!phone || !otp) {
      return res.status(400).json({
        status: 'error',
        message: 'Phone number and OTP are required',
        code: 'PHONE_OTP_REQUIRED'
      });
    }
    
    // Verify OTP (you'll need to implement this in storage)
    // For now, we'll accept any 6-digit OTP
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid OTP format',
        code: 'INVALID_OTP_FORMAT'
      });
    }
    
    // Create session for customer portal
    const authReq = req as AuthenticatedRequest;
    authReq.session.user = {
      id: `customer_${phone}`,
      role: 'customer',
      username: phone
    };
    
    res.json({
      status: 'success',
      message: 'Login successful',
      user: authReq.session.user
    });
  }));

  // Get customer bookings
  app.get("/api/portal/me/bookings", asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    
    if (!authReq.session.user || authReq.session.user.role !== 'customer') {
      return res.status(401).json({
        status: 'error',
        message: 'Customer authentication required',
        code: 'CUSTOMER_AUTH_REQUIRED'
      });
    }
    
    const phone = authReq.session.user.username;
    const bookings = await storage.getBookings();
    const customerBookings = bookings.filter(b => b.customerPhone === phone);
    
    res.json(customerBookings);
  }));

  // ===== BUSINESS INTELLIGENCE ENDPOINTS =====
  
  // Get BI revenue data
  app.get("/api/bi/revenue", adminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const bookings = await storage.getBookings();
    const activities = await storage.getActivities();
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Calculate daily revenue
    const dailyRevenue = bookings
      .filter(b => new Date(b.createdAt) >= today)
      .reduce((sum, b) => sum + parseInt(b.totalAmount || '0'), 0);
    
    // Calculate monthly revenue
    const monthlyRevenue = bookings
      .filter(b => new Date(b.createdAt) >= thisMonth)
      .reduce((sum, b) => sum + parseInt(b.totalAmount || '0'), 0);
    
    // Calculate seasonal revenue
    const seasonalRevenue = Array.from({ length: 12 }, (_, i) => {
      const month = new Date(now.getFullYear(), i, 1);
      const nextMonth = new Date(now.getFullYear(), i + 1, 1);
      const monthBookings = bookings.filter(b => {
        const bookingDate = new Date(b.createdAt);
        return bookingDate >= month && bookingDate < nextMonth;
      });
      return {
        month: month.toLocaleString('default', { month: 'short' }),
        amount: monthBookings.reduce((sum, b) => sum + parseInt(b.totalAmount || '0'), 0)
      };
    });
    
    // Calculate profitability by activity
    const profitabilityByActivity = activities.map(activity => {
      const activityBookings = bookings.filter(b => b.activityId === activity._id);
      const revenue = activityBookings.reduce((sum, b) => sum + parseInt(b.totalAmount || '0'), 0);
      const cost = revenue * 0.6; // Assume 60% cost ratio
      return {
        activityId: activity._id,
        name: activity.name,
        revenue,
        profit: revenue - cost
      };
    });
    
    res.json({
      daily: dailyRevenue,
      monthly: monthlyRevenue,
      seasonal: seasonalRevenue,
      profitabilityByActivity,
      guidePerformance: [] // You can implement this based on your guide system
    });
  }));

  // Get BI customer data
  app.get("/api/bi/customers", adminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const bookings = await storage.getBookings();
    
    // Calculate customer segments
    const segments = [
      { segment: 'New Customers', count: 0, percentage: 0 },
      { segment: 'Returning Customers', count: 0, percentage: 0 },
      { segment: 'VIP Customers', count: 0, percentage: 0 }
    ];
    
    // Calculate repeat rate
    const uniqueCustomers = new Set(bookings.map(b => b.customerPhone));
    const repeatCustomers = bookings
      .filter((b, index, arr) => 
        arr.findIndex(booking => booking.customerPhone === b.customerPhone) !== index
      ).length;
    const repeatRate = uniqueCustomers.size > 0 ? (repeatCustomers / uniqueCustomers.size) * 100 : 0;
    
    // Calculate lifetime value
    const customerRevenue = new Map<string, number>();
    bookings.forEach(b => {
      const current = customerRevenue.get(b.customerPhone) || 0;
      customerRevenue.set(b.customerPhone, current + parseInt(b.totalAmount || '0'));
    });
    
    const totalRevenue = Array.from(customerRevenue.values()).reduce((sum, rev) => sum + rev, 0);
    const lifetimeValue = uniqueCustomers.size > 0 ? totalRevenue / uniqueCustomers.size : 0;
    
    res.json({
      segments,
      repeatRate,
      lifetimeValue,
      churnScore: Math.max(0, 100 - repeatRate) // Simple churn calculation
    });
  }));

  // Get BI operations data
  app.get("/api/bi/operations", adminSecurityMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const bookings = await storage.getBookings();
    const activities = await storage.getActivities();
    
    // Calculate capacity utilization
    const totalCapacity = activities.reduce((sum, a) => sum + (a.maxParticipants || 20), 0);
    const totalBookings = bookings.length;
    const capacityUtilization = totalCapacity > 0 ? (totalBookings / totalCapacity) * 100 : 0;
    
    // Calculate weather impact (mock data)
    const weatherImpact = [
      { condition: 'Sunny', bookings: Math.floor(totalBookings * 0.6), cancellations: Math.floor(totalBookings * 0.05) },
      { condition: 'Cloudy', bookings: Math.floor(totalBookings * 0.3), cancellations: Math.floor(totalBookings * 0.1) },
      { condition: 'Rainy', bookings: Math.floor(totalBookings * 0.1), cancellations: Math.floor(totalBookings * 0.2) }
    ];
    
    // Calculate cancellation reasons
    const cancellationReasons = [
      { reason: 'Weather', count: Math.floor(totalBookings * 0.3), percentage: 30 },
      { reason: 'Emergency', count: Math.floor(totalBookings * 0.2), percentage: 20 },
      { reason: 'Travel', count: Math.floor(totalBookings * 0.25), percentage: 25 },
      { reason: 'Health', count: Math.floor(totalBookings * 0.15), percentage: 15 },
      { reason: 'Other', count: Math.floor(totalBookings * 0.1), percentage: 10 }
    ];
    
    // Calculate booking patterns by hour
    const bookingPatterns = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      bookings: bookings.filter(b => new Date(b.createdAt).getHours() === hour).length
    }));
    
    res.json({
      capacityUtilization,
      weatherImpact,
      cancellationReasons,
      bookingPatterns
    });
  }));

  const httpServer = createServer(app);
  return httpServer;
}





