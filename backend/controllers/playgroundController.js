const Playground = require('../models/Playground');

// Get all playgrounds
exports.getAllPlaygrounds = async (req, res) => {
  try {
    const playgrounds = await Playground.find({ isActive: true }).populate('owner', 'name email');
    res.status(200).json({
      success: true,
      count: playgrounds.length,
      data: playgrounds
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get user's playgrounds
exports.getUserPlaygrounds = async (req, res) => {
  try {
    const playgrounds = await Playground.find({ 
      owner: req.user._id,
      isActive: true 
    }).populate('owner', 'name email');
    
    res.status(200).json({
      success: true,
      count: playgrounds.length,
      data: playgrounds
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Create a new playground
exports.createPlayground = async (req, res) => {
  try {
    const playgroundData = {
      name: req.body.name,
      location: req.body.location,
      phone_number: req.body.phone_number,
      type: req.body.type || 'Football',
      price: req.body.price || 40,
      image: req.body.image || null,
      rating: 4.0, // Default rating for new playgrounds
      owner: req.user._id
    };

    const playground = await Playground.create(playgroundData);
    
    // Populate owner details
    await playground.populate('owner', 'name email');
    
    res.status(201).json({
      success: true,
      data: playground
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      res.status(400).json({
        success: false,
        error: messages
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  }
};

// Get single playground by ID
exports.getPlaygroundById = async (req, res) => {
  try {
    const playground = await Playground.findOne({ 
      _id: req.params.id, 
      isActive: true 
    }).populate('owner', 'name email');
    
    if (!playground) {
      return res.status(404).json({
        success: false,
        error: 'Playground not found'
      });
    }
    res.status(200).json({
      success: true,
      data: playground
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Update playground (only owner can update)
exports.updatePlayground = async (req, res) => {
  try {
    const playground = await Playground.findOne({ 
      _id: req.params.id,
      isActive: true 
    });

    if (!playground) {
      return res.status(404).json({ 
        success: false,
        error: 'Playground not found' 
      });
    }

    // Check if user is the owner
    if (playground.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this playground'
      });
    }

    const updatedPlayground = await Playground.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { 
        new: true,
        runValidators: true 
      }
    ).populate('owner', 'name email');
    
    res.status(200).json({
      success: true,
      data: updatedPlayground
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Delete playground (only owner can delete)
exports.deletePlayground = async (req, res) => {
  try {
    const playground = await Playground.findOne({ 
      _id: req.params.id,
      isActive: true 
    });

    if (!playground) {
      return res.status(404).json({
        success: false,
        error: 'Playground not found'
      });
    }

    // Check if user is the owner
    if (playground.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this playground'
      });
    }

    // Soft delete (set isActive to false)
    playground.isActive = false;
    await playground.save();

    res.status(200).json({
      success: true,
      message: 'Playground deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};
