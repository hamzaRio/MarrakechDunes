import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import MongoStore from "connect-mongo";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { insertBookingSchema, insertReviewSchema } from "@shared/schema";
import { whatsappService } from "./whatsapp-service";
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
  sessionSecurity
} from "./security-middleware";

// Types for session data
declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      username: string;
      role: string;
    };
  }
}

interface AuthenticatedRequest extends Request {
  session: session.Session & Partial<session.SessionData>;
}

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.session.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
};

const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.session.user || authReq.session.user.role !== 'superadmin') {
    return res.status(403).json({ message: "Superadmin access required" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for deployment monitoring
  app.get('/api/health', async (req: Request, res: Response) => {
    try {
      // Test database connectivity
      const activitiesCount = await storage.getActivities();
      
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        database: 'connected',
        activities: activitiesCount.length,
        environment: process.env.NODE_ENV || 'development'
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Database connection failed'
      });
    }
  });

  // Apply security headers
  app.use(securityHeaders);
  
  // Apply HTTPS enforcement for production
  app.use(enforceHTTPS);
  
  // Apply input validation
  app.use(validateInput);
  
  // Configure secure sessions
  app.use(session(sessionSecurity));

  // Initialize database when using MongoDB
  if (!storage.isUsingMemory()) {
    await storage.seedInitialData();
  }

  // Public API routes with general rate limiting
  app.use('/api/activities', generalApiRateLimit);
  app.use('/api/bookings', generalApiRateLimit);
  app.use('/api/reviews', generalApiRateLimit);

  // Admin API routes with stricter rate limiting and audit logging
  app.use('/api/admin', adminApiRateLimit, adminAuditLog);

  // Auth routes
  app.get('/api/auth/user', (req: Request, res) => {
    const authReq = req as AuthenticatedRequest;
    if (authReq.session.user) {
      res.json(authReq.session.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  app.post("/api/auth/login", authRateLimit, async (req: Request, res) => {
    const { username, password } = req.body;
    
    try {
      const user = await storage.getUserByUsername(username);
      console.log('Found user:', user ? { username: user.username, role: user.role } : null);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Use bcrypt to verify password with MongoDB
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const authReq = req as AuthenticatedRequest;
      authReq.session.user = {
        id: user._id,
        username: user.username,
        role: user.role,
      };

      // Create audit log
      try {
        await storage.createAuditLog({
          userId: user._id,
          action: `User ${username} logged in`,
          details: `Login from IP: ${req.ip}`
        });
      } catch (error) {
        console.log('Audit logging failed:', error);
      }

      res.json({ message: "Login successful", user: authReq.session.user });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res) => {
    const authReq = req as AuthenticatedRequest;
    authReq.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // Public routes
  app.get("/api/activities", async (req: Request, res) => {
    try {
      const activities = await storage.getActivities();
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.post("/api/bookings", async (req: Request, res) => {
    try {
      const data = req.body;
      
      const booking = await storage.createBooking({
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        activityId: data.activityId,
        numberOfPeople: data.numberOfPeople,
        preferredDate: data.preferredDate,
        notes: data.notes,
        status: 'pending',
        totalAmount: data.totalAmount,
        paymentStatus: 'unpaid',
        paidAmount: 0,
      });

      // Send WhatsApp notifications to all admins
      const activity = await storage.getActivity(data.activityId);
      if (activity) {
        const notificationData = {
          customerName: booking.customerName,
          customerPhone: booking.customerPhone,
          activityName: activity.name,
          numberOfPeople: booking.numberOfPeople,
          preferredDate: booking.preferredDate,
          preferredTime: booking.preferredDate.toLocaleTimeString(),
          totalAmount: parseInt(booking.totalAmount),
          paymentMethod: booking.paymentMethod || 'cash',
          paymentStatus: booking.paymentStatus || 'unpaid',
          status: booking.status,
          notes: booking.notes,
          bookingId: booking._id?.toString() || 'N/A'
        };
        
        await whatsappService.sendBookingNotification(notificationData);
      }

      res.status(201).json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  // Admin routes
  app.get("/api/admin/bookings", adminSecurityMiddleware, async (req: Request, res) => {
    try {
      const bookings = await storage.getBookings();
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/admin/audit-logs", superadminSecurityMiddleware, async (req: Request, res) => {
    try {
      const logs = await storage.getAuditLogs();
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  app.patch("/api/admin/bookings/:id/status", adminSecurityMiddleware, async (req: Request, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
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
    } catch (error) {
      console.error("Error updating booking status:", error);
      res.status(500).json({ message: "Failed to update booking status" });
    }
  });

  app.patch("/api/admin/bookings/:id/payment", adminSecurityMiddleware, async (req: Request, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const { id } = req.params;
      const { paymentStatus, paidAmount, paymentMethod, depositAmount } = req.body;
      
      const booking = await storage.updateBookingPayment(id, {
        paymentStatus,
        paidAmount,
        paymentMethod,
        depositAmount
      });
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
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
    } catch (error) {
      console.error("Error updating booking payment:", error);
      res.status(500).json({ message: "Failed to update booking payment" });
    }
  });

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
      res.status(500).json({ message: "Failed to create activity" });
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
      res.status(500).json({ message: "Failed to update activity" });
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
      res.status(500).json({ message: "Failed to delete activity" });
    }
  });

  // Review routes
  app.get("/api/reviews", async (req: Request, res) => {
    try {
      const activityId = req.query.activityId as string;
      const reviews = await storage.getReviews(activityId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.get("/api/activities/:id/rating", async (req: Request, res) => {
    try {
      const rating = await storage.getActivityRating(req.params.id);
      res.json(rating);
    } catch (error) {
      console.error("Error fetching activity rating:", error);
      res.status(500).json({ message: "Failed to fetch rating" });
    }
  });

  app.post("/api/reviews", async (req: Request, res) => {
    try {
      const validatedData = insertReviewSchema.parse(req.body);
      const review = await storage.createReview(validatedData);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Admin review management
  app.get("/api/admin/reviews", adminSecurityMiddleware, async (req: Request, res) => {
    try {
      const reviews = await storage.getReviews();
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching admin reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.patch("/api/admin/reviews/:id/approval", adminSecurityMiddleware, async (req: Request, res) => {
    try {
      const { approved } = req.body;
      const review = await storage.updateReviewApproval(req.params.id, approved);
      
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }

      res.json(review);
    } catch (error) {
      console.error("Error updating review approval:", error);
      res.status(500).json({ message: "Failed to update review approval" });
    }
  });

  // CEO Dashboard Analytics endpoints
  app.get("/api/admin/analytics/earnings", superadminSecurityMiddleware, async (req: Request, res) => {
    try {
      const analytics = await storage.getEarningsAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching earnings analytics:", error);
      res.status(500).json({ message: "Failed to fetch earnings analytics" });
    }
  });

  app.get("/api/admin/analytics/activities", requireAuth, async (req: Request, res) => {
    try {
      const analytics = await storage.getActivityAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching activity analytics:", error);
      res.status(500).json({ message: "Failed to fetch activity analytics" });
    }
  });

  app.get("/api/admin/analytics/bookings", requireAuth, async (req: Request, res) => {
    try {
      const analytics = await storage.getBookingAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching booking analytics:", error);
      res.status(500).json({ message: "Failed to fetch booking analytics" });
    }
  });

  // GetYourGuide price comparison
  app.get("/api/admin/getyourguide/comparison", requireAuth, async (req: Request, res) => {
    try {
      const comparison = await storage.getGetYourGuidePriceComparison();
      res.json(comparison);
    } catch (error) {
      console.error("Error fetching GetYourGuide comparison:", error);
      res.status(500).json({ message: "Failed to fetch price comparison" });
    }
  });

  app.patch("/api/admin/activities/:id/getyourguide-price", requireAuth, async (req: Request, res) => {
    try {
      const activityId = req.params.id;
      const { getyourguidePrice } = req.body;
      
      const updatedActivity = await storage.updateActivityGetYourGuidePrice(activityId, getyourguidePrice);
      
      if (!updatedActivity) {
        return res.status(404).json({ message: "Activity not found" });
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
      res.status(500).json({ message: "Failed to update GetYourGuide price" });
    }
  });

  // Admin WhatsApp contacts endpoint
  app.get("/api/admin/whatsapp-contacts", requireAuth, async (req: Request, res) => {
    try {
      const contacts = whatsappService.getAdminContacts();
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching WhatsApp contacts:", error);
      res.status(500).json({ message: "Failed to fetch WhatsApp contacts" });
    }
  });

  // Circuit breaker system health monitoring
  app.get("/api/admin/system-health", requireAuth, async (req: Request, res) => {
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
      res.status(500).json({ message: "Failed to fetch system health" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}