import { Router, type Request, type Response } from 'express';
import { ObjectStorageService } from '../objectStorage.js';

const router = Router();
const objectStorage = new ObjectStorageService();

/**
 * POST /api/objects/upload
 * Get a signed URL for file upload
 */
router.post('/objects/upload', async (req: Request, res: Response) => {
  try {
    const uploadURL = await objectStorage.getObjectEntityUploadURL();
    return res.status(200).json({
      status: 'success',
      uploadUrl: uploadURL
    });
  } catch (error) {
    console.error('[UPLOAD] Error generating upload URL:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to generate upload URL'
    });
  }
});

export default router;

