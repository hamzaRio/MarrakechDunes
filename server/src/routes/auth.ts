import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcrypt';
import { storage } from '../storage.js';

const router = Router();

/**
 * POST /api/auth/login
 * Authenticate admin user
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Nom d\'utilisateur et mot de passe requis'
      });
    }

    // Get user from storage
    const user = await storage.getUserByUsername(username);

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Nom d\'utilisateur ou mot de passe incorrect'
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Nom d\'utilisateur ou mot de passe incorrect'
      });
    }

    // Set session
    if (!req.session) {
      return res.status(500).json({
        status: 'error',
        message: 'Session non disponible'
      });
    }

    (req.session as any).userId = user.id;
    (req.session as any).username = user.username;
    (req.session as any).role = user.role;
    (req.session as any).authenticated = true;

    return res.status(200).json({
      status: 'success',
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('[AUTH] Login error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erreur de connexion inattendue'
    });
  }
});

export default router;

