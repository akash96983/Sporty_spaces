const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Playground = require('./models/Playground');
const User = require('./models/User');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected for testing'))
  .catch(err => console.log(err));

async function addTestData() {
  try {
    // Check if test user already exists
    let testUser = await User.findOne({ email: 'test@example.com' });
    
    if (!testUser) {
      // Create a test user
      testUser = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
      
      await testUser.save();
      console.log('Test user created:', testUser._id);
    } else {
      console.log('Test user already exists:', testUser._id);
    }

    // Create test playgrounds
    const testPlaygrounds = [
      {
        name: 'Victory Football Ground',
        location: 'Downtown Sports Complex, Main Street',
        phone_number: '+1234567890',
        type: 'Football',
        price: 50,
        rating: 4.5,
        owner: testUser._id,
        isActive: true
      },
      {
        name: 'Elite Basketball Court',
        location: 'Central Park, Basketball Zone',
        phone_number: '+1234567891',
        type: 'Basketball',
        price: 30,
        rating: 4.2,
        owner: testUser._id,
        isActive: true
      },
      {
        name: 'Champion Tennis Court',
        location: 'Sports City, Tennis Complex',
        phone_number: '+1234567892',
        type: 'Tennis',
        price: 75,
        rating: 4.8,
        owner: testUser._id,
        isActive: true
      }
    ];

    for (const playgroundData of testPlaygrounds) {
      const playground = new Playground(playgroundData);
      await playground.save();
      console.log(`Created playground: ${playground.name}`);
    }

    console.log('Test data added successfully!');
  } catch (error) {
    console.error('Error adding test data:', error);
  } finally {
    mongoose.connection.close();
  }
}

addTestData();
