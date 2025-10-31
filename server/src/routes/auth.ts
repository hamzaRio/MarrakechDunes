import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcrypt';
import { storage } from '../storage.js';

const router = Router();

/**
 * POST /api/auth/login
 * Authenticate admin or superadmin user
 * Supports both 'admin' and 'superadmin' roles
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    console.log('[AUTH] Login attempt for username:', username);

    if (!username || !password) {
      console.log('[AUTH] Missing username or password');
      return res.status(400).json({
        status: 'error',
        message: 'Nom d\'utilisateur et mot de passe requis'
      });
    }

    // Get user from storage
    const user = await storage.getUserByUsername(username);

    if (!user) {
      console.log('[AUTH] User not found:', username);
      return res.status(401).json({
        status: 'error',
        message: 'Nom d\'utilisateur ou mot de passe incorrect'
      });
    }

    console.log('[AUTH] User found:', { id: user.id || user._id, username: user.username, role: user.role, hasPassword: !!user.password });

    // Verify user has admin or superadmin role
    if (!user.role || (user.role !== 'admin' && user.role !== 'superadmin')) {
      console.log('[AUTH] User does not have admin/superadmin role:', user.role);
      return res.status(403).json({
        status: 'error',
        message: 'Accès refusé - permissions insuffisantes'
      });
    }

    // Verify password
    if (!user.password) {
      console.log('[AUTH] User has no password stored');
      return res.status(401).json({
        status: 'error',
        message: 'Nom d\'utilisateur ou mot de passe incorrect'
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      console.log('[AUTH] Password mismatch for user:', username);
      return res.status(401).json({
        status: 'error',
        message: 'Nom d\'utilisateur ou mot de passe incorrect'
      });
    }

    console.log('[AUTH] Password verified successfully for user:', username);

    // Set session
    if (!req.session) {
      console.log('[AUTH] Session not available');
      return res.status(500).json({
        status: 'error',
        message: 'Session non disponible'
      });
    }

    const userId = user.id || user._id;
    (req.session as any).userId = userId;
    (req.session as any).username = user.username;
    (req.session as any).role = user.role;
    (req.session as any).authenticated = true;

    console.log('[AUTH] Session set for user:', { userId, username: user.username, role: user.role });

    return res.status(200).json({
      status: 'success',
      success: true, // Also include success field for client compatibility
      user: {
        id: userId,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('[AUTH] Login error:', error);
    console.error('[AUTH] Error stack:', (error as Error).stack);
    return res.status(500).json({
      status: 'error',
      message: 'Erreur de connexion inattendue'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout admin or superadmin user
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    console.log('[AUTH] Logout attempt');
    
    if (req.session) {
      const username = (req.session as any).username || 'unknown';
      req.session.destroy((err) => {
        if (err) {
          console.error('[AUTH] Error destroying session:', err);
          return res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la déconnexion'
          });
        }
        
        res.clearCookie('connect.sid');
        console.log('[AUTH] Logged out user:', username);
        
        return res.status(200).json({
          status: 'success',
          success: true,
          message: 'Déconnexion réussie'
        });
      });
    } else {
      // No active session
      return res.status(200).json({
        status: 'success',
        success: true,
        message: 'Déconnexion réussie (aucune session active)'
      });
    }
  } catch (error) {
    console.error('[AUTH] Logout error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la déconnexion'
    });
  }
});

export default router;

