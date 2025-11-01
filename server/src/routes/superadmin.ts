/**
 * Superadmin Routes
 * Only accessible to superadmin users
 * Allows managing admin users and system-level operations
 */

import { Router, type Request, type Response } from 'express';
import { storage } from '../storage.js';
import { requireSuperAdmin } from '../middleware/admin-auth.js';
import bcrypt from 'bcrypt';

const router = Router();

// Apply superadmin authentication middleware to all routes
router.use(requireSuperAdmin);

/**
 * GET /api/superadmin/admins
 * Get all admin users (superadmin only)
 */
router.get('/admins', async (req: Request, res: Response) => {
  try {
    // Get all users with admin or superadmin role
    const users = await storage.getUsers();
    const admins = users.filter(u => u.role === 'admin' || u.role === 'superadmin');
    
    // Remove password from response
    const adminsWithoutPassword = admins.map(admin => ({
      _id: admin._id || admin.id,
      username: admin.username,
      role: admin.role,
      createdAt: admin.createdAt || new Date()
    }));
    
    return res.status(200).json(adminsWithoutPassword);
  } catch (error) {
    console.error('[SUPERADMIN] Error fetching admins:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch admins'
    });
  }
});

/**
 * POST /api/superadmin/admins
 * Create new admin user (superadmin only)
 */
router.post('/admins', async (req: Request, res: Response) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Username and password are required'
      });
    }

    // Validate role
    if (role && role !== 'admin' && role !== 'superadmin') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid role. Must be "admin" or "superadmin"'
      });
    }

    // Check if user already exists
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'Username already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await storage.createUser({
      username,
      password: hashedPassword,
      role: role || 'admin'
    });

    // Remove password from response
    const userResponse = {
      _id: newUser._id || newUser.id,
      username: newUser.username,
      role: newUser.role,
      createdAt: newUser.createdAt || new Date()
    };

    console.log(`[SUPERADMIN] Admin user created: ${username} (${role || 'admin'})`);
    
    return res.status(201).json(userResponse);
  } catch (error) {
    console.error('[SUPERADMIN] Error creating admin:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create admin'
    });
  }
});

/**
 * DELETE /api/superadmin/admins/:id
 * Delete admin user (superadmin only)
 */
router.delete('/admins/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get user to check role
    const user = await storage.getUser(id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Prevent deleting superadmin users (safety check)
    if (user.role === 'superadmin') {
      // Only allow if there are other superadmins
      const allUsers = await storage.getUsers();
      const superadmins = allUsers.filter(u => u.role === 'superadmin');
      
      if (superadmins.length <= 1) {
        return res.status(403).json({
          status: 'error',
          message: 'Cannot delete the last superadmin user'
        });
      }
    }

    // Delete user
    await storage.deleteUser(id);
    
    console.log(`[SUPERADMIN] Admin user deleted: ${user.username} (${user.role})`);
    
    return res.status(200).json({
      status: 'success',
      message: 'Admin deleted successfully'
    });
  } catch (error) {
    console.error('[SUPERADMIN] Error deleting admin:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete admin'
    });
  }
});

/**
 * PATCH /api/superadmin/admins/:id
 * Update admin user (superadmin only)
 */
router.patch('/admins/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { username, password, role } = req.body;

    const user = await storage.getUser(id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const updateData: any = {};

    if (username && username !== user.username) {
      // Check if new username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser && existingUser._id !== id && existingUser.id !== id) {
        return res.status(409).json({
          status: 'error',
          message: 'Username already exists'
        });
      }
      updateData.username = username;
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (role && (role === 'admin' || role === 'superadmin')) {
      // Prevent changing the last superadmin to admin
      if (user.role === 'superadmin' && role === 'admin') {
        const allUsers = await storage.getUsers();
        const superadmins = allUsers.filter(u => u.role === 'superadmin' && u._id !== id && u.id !== id);
        
        if (superadmins.length < 1) {
          return res.status(403).json({
            status: 'error',
            message: 'Cannot change the last superadmin to admin'
          });
        }
      }
      updateData.role = role;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No valid fields to update'
      });
    }

    const updatedUser = await storage.updateUser(id, updateData);
    
    if (!updatedUser) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to update user'
      });
    }

    // Remove password from response
    const userResponse = {
      _id: updatedUser._id || updatedUser.id,
      username: updatedUser.username,
      role: updatedUser.role,
      createdAt: updatedUser.createdAt || new Date()
    };

    console.log(`[SUPERADMIN] Admin user updated: ${user.username}`);
    
    return res.status(200).json(userResponse);
  } catch (error) {
    console.error('[SUPERADMIN] Error updating admin:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update admin'
    });
  }
});

export default router;

