const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { createReferenceImage } = require('../models/schemas');

class UploadService {
  constructor() {
    this.uploadsDir = './assets/temp';
    this.referencesDir = './assets/references';
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif'
    ];
    this.allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  }

  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch (error) {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  // Configure multer for file uploads
  getMulterConfig() {
    const storage = multer.diskStorage({
      destination: async (req, file, cb) => {
        await this.ensureDirectoryExists(this.uploadsDir);
        cb(null, this.uploadsDir);
      },
      filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      }
    });

    const fileFilter = (req, file, cb) => {
      const isValidMimeType = this.allowedMimeTypes.includes(file.mimetype);
      const isValidExtension = this.allowedExtensions.includes(
        path.extname(file.originalname).toLowerCase()
      );

      if (isValidMimeType && isValidExtension) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'), false);
      }
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: this.maxFileSize
      }
    });
  }

  // Process uploaded reference image
  async processReferenceImage(tempFilePath, projectName, campaignName = null, metadata = {}) {
    try {
      const { name, description = '', tags = [], notes = '' } = metadata;
      
      if (!name) {
        throw new Error('Reference image name is required');
      }

      // Generate unique ID and get file info
      const imageId = uuidv4();
      const originalFileName = path.basename(tempFilePath);
      const fileExtension = path.extname(originalFileName);
      const newFileName = `${imageId}${fileExtension}`;

      // Determine target directory
      let targetDir;
      if (campaignName) {
        targetDir = path.join(this.referencesDir, projectName, 'campaigns', campaignName);
      } else {
        targetDir = path.join(this.referencesDir, projectName, 'project');
      }

      await this.ensureDirectoryExists(targetDir);

      // Move file to final location
      const finalPath = path.join(targetDir, newFileName);
      await fs.rename(tempFilePath, finalPath);

      // Get file stats
      const stats = await fs.stat(finalPath);
      const mimeType = this.getMimeTypeFromExtension(fileExtension);

      // Create reference image metadata
      const referenceImage = createReferenceImage(
        name,
        description,
        finalPath,
        newFileName,
        stats.size,
        mimeType
      );

      // Add additional metadata
      referenceImage.tags = Array.isArray(tags) ? tags : [];
      referenceImage.notes = notes;

      return referenceImage;
    } catch (error) {
      // Clean up temp file if it exists
      try {
        await fs.unlink(tempFilePath);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      throw error;
    }
  }

  // Delete reference image file
  async deleteReferenceImage(referenceImage) {
    try {
      await fs.unlink(referenceImage.filePath);
      return true;
    } catch (error) {
      console.error('Error deleting reference image file:', error);
      return false;
    }
  }

  // Get relative path for serving files
  getRelativePath(absolutePath) {
    return path.relative('.', absolutePath).replace(/\\/g, '/');
  }

  // Get MIME type from file extension
  getMimeTypeFromExtension(extension) {
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif'
    };
    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  // Validate uploaded file
  async validateUploadedFile(filePath) {
    try {
      const stats = await fs.stat(filePath);
      
      // Check file size
      if (stats.size > this.maxFileSize) {
        throw new Error(`File size exceeds maximum limit of ${this.maxFileSize / 1024 / 1024}MB`);
      }

      // Check if file exists and is readable
      await fs.access(filePath, fs.constants.R_OK);
      
      return true;
    } catch (error) {
      throw new Error(`File validation failed: ${error.message}`);
    }
  }

  // Get project reference images directory
  getProjectReferencesDir(projectName) {
    return path.join(this.referencesDir, projectName, 'project');
  }

  // Get campaign reference images directory
  getCampaignReferencesDir(projectName, campaignName) {
    return path.join(this.referencesDir, projectName, 'campaigns', campaignName);
  }

  // Clean up old temporary files
  async cleanupTempFiles(olderThanHours = 24) {
    try {
      const tempDir = this.uploadsDir;
      const files = await fs.readdir(tempDir);
      const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime.getTime() < cutoffTime) {
          await fs.unlink(filePath);
          console.log(`Cleaned up old temp file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  }
}

module.exports = UploadService;