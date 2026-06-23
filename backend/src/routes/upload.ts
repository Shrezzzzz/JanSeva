import { Router, type Request, type Response } from 'express';
import { upload } from '../middleware/upload';
import { uploadLimiter } from '../middleware/rateLimit';
import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../utils/logger';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
  process.env.CLOUDINARY_API_KEY    &&
  process.env.CLOUDINARY_API_KEY    !== 'your_key';

const router = Router();

router.post('/', uploadLimiter, upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'No file provided' });

  try {
    if (cloudinaryConfigured) {
      // ── Production: upload to Cloudinary ──────────────────────────────
      const b64     = req.file.buffer.toString('base64');
      const dataUri = `data:${req.file.mimetype};base64,${b64}`;
      const result  = await cloudinary.uploader.upload(dataUri, {
        folder:        'janseva',
        resource_type: 'auto',
      });
      return res.json({
        success: true,
        data: {
          url:      result.secure_url,
          publicId: result.public_id,
          format:   result.format,
          width:    result.width,
          height:   result.height,
        },
      });
    } else {
      // ── Development fallback: return base64 data URL directly ──────────
      // This lets the full report flow work locally without Cloudinary.
      logger.info('Cloudinary not configured — returning base64 data URL (dev only)');
      const b64     = req.file.buffer.toString('base64');
      const dataUrl = `data:${req.file.mimetype};base64,${b64}`;
      return res.json({
        success: true,
        data: {
          url:      dataUrl,
          publicId: `local_${Date.now()}`,
          format:   req.file.mimetype.split('/')[1] ?? 'jpg',
          width:    0,
          height:   0,
        },
      });
    }
  } catch (e) {
    logger.error('Upload failed', e);
    return res.status(500).json({ success: false, error: 'Upload failed' });
  }
});

export default router;
