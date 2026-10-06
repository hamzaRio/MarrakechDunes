import { Router, type Request, type Response } from 'express';
import { ObjectStorageService } from '../objectStorage.js';
import { requireSuperAdmin } from '../middleware/admin-auth.js';
import { uploadRateLimit } from '../security-hardening.js';
import { parseUploadRequest } from '../object-storage/upload-policy.js';

const router = Router();
const objectStorage = new ObjectStorageService();

/**
 * POST /api/objects/upload
 * Get a signed URL for file upload
 */
router.post('/objects/upload', uploadRateLimit, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const grant = await objectStorage.getObjectEntityUploadGrant(parseUploadRequest(req.body));
    return res.status(200).json({
      status: 'success',
      uploadURL: grant.uploadUrl,
      uploadUrl: grant.uploadUrl,
      objectPath: grant.objectPath,
      ...(grant.method ? { method: grant.method } : {}),
      ...(grant.headers ? { headers: grant.headers } : {}),
      ...(grant.expiresAt ? { expiresAt: grant.expiresAt } : {}),
      ...(grant.publicUrl ? { publicUrl: grant.publicUrl } : {}),
    });
  } catch (error) {
    if (error instanceof Error && /Unsupported image|Image content type|Image size/.test(error.message)) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
    console.error('[UPLOAD] Error generating upload URL:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to generate upload URL'
    });
  }
});

export default router;

