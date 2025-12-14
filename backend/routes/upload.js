const express = require('express');
const router = express.Router();
const cloudinary = require('../config/cloudinary');
const { protect } = require('../middleware/auth');

// Upload multiple images
router.post('/images', protect, async (req, res) => {
  try {
    const { images } = req.body;
    
    if (!images || !Array.isArray(images)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide images array'
      });
    }

    if (images.length > 4) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 4 images allowed'
      });
    }
    
    const uploadPromises = images.map(image =>
      cloudinary.uploader.upload(image, {
        folder: 'sportyspaces/turfs',
        transformation: [
          { width: 1200, height: 800, crop: 'limit' },
          { quality: 'auto' }
        ]
      })
    );

    const results = await Promise.all(uploadPromises);
    
    const uploadedImages = results.map(result => ({
      url: result.secure_url,
      publicId: result.public_id
    }));

    res.json({
      success: true,
      images: uploadedImages
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Images upload failed'
    });
  }
});

// Delete image
router.delete('/image/:publicId', protect, async (req, res) => {
  try {
    const publicId = req.params.publicId.replace(/--/g, '/');
    await cloudinary.uploader.destroy(publicId);

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Image deletion failed'
    });
  }
});

module.exports = router;
