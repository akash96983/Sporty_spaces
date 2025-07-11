const express = require('express');
const router = express.Router();
const { 
  getAllPlaygrounds, 
  createPlayground, 
  getPlaygroundById, 
  updatePlayground, 
  deletePlayground,
  getUserPlaygrounds
} = require('../controllers/playgroundController');
const { auth, optionalAuth } = require('../middleware/auth');

// Public routes
router.get('/', optionalAuth, getAllPlaygrounds);

// Protected routes
router.post('/', auth, createPlayground);
router.get('/user/my-spaces', auth, getUserPlaygrounds);
router.get('/:id', getPlaygroundById);
router.put('/:id', auth, updatePlayground);
router.delete('/:id', auth, deletePlayground);

module.exports = router;
