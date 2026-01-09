# Sporty Spaces - Full Stack Setup with Authentication

## API/Server Setup (Next.js)

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the project root with at least:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
JWT_EXPIRE=7d
```

3. Start the development server (Next.js serves both the UI and `/api/*`):
```bash
npm run dev
```

The app will run on http://localhost:3000

## 🔐 Authentication Features

### User Registration & Login
- **Secure signup** with password hashing (bcrypt)
- **JWT-based authentication** with 30-day token expiry
- **Email validation** and duplicate user prevention
- **Password strength requirements** (minimum 6 characters)

### User Management
- **Protected routes** for authenticated users only
- **User profile** with name, email, and phone
- **Secure logout** with token cleanup
- **Persistent login** with localStorage

### Authorization & Ownership
- **Create spaces** only when logged in
- **My Spaces** section to manage owned playgrounds
- **Edit/Delete permissions** only for space owners
- **Soft delete** (spaces marked as inactive, not permanently deleted)

## 🏟️ Playground Management

### Public Features
- Browse all active playgrounds
- Search by name, location, or sport type
- View playground details and ratings

### Authenticated Features
- **Add new playgrounds** with image upload
- **My Spaces dashboard** for managing owned spaces
- **Edit playground details** (for owners only)
- **Delete playgrounds** (for owners only, soft delete)
- **Owner information** displayed on playgrounds

## 🔒 Security Features

### Server Security
- **Password hashing** with bcrypt (12 salt rounds)
- **JWT token validation** on protected routes
- **User ownership verification** for CRUD operations
- **Input validation** and sanitization
- **CORS enabled** for frontend communication

### Frontend Security
- **Secure token storage** in localStorage
- **Automatic logout** on token expiry
- **Protected UI components** based on auth state
- **Request headers** with bearer tokens

## 📡 API Endpoints

### Authentication Routes
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (protected)
- `PUT /api/auth/profile` - Update profile (protected)
- `PUT /api/auth/change-password` - Change password (protected)

### Playground Routes
- `GET /api/playgrounds` - Get all playgrounds (public)
- `POST /api/playgrounds` - Create playground (protected)
- `GET /api/playgrounds/user/my-spaces` - Get user's playgrounds (protected)
- `GET /api/playgrounds/:id` - Get specific playground (public)
- `PUT /api/playgrounds/:id` - Update playground (protected, owner only)
- `DELETE /api/playgrounds/:id` - Delete playground (protected, owner only)

## 🗄️ Database Schema

### Users Collection
```javascript
{
  name: String (required),
  email: String (required, unique, lowercase),
  password: String (required, hashed),
  phone: String (optional),
  role: String (enum: ['user', 'admin'], default: 'user'),
  isActive: Boolean (default: true),
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Playgrounds Collection
```javascript
{
  name: String (required),
  location: String (required),
  phone_number: String (required),
  type: String (enum: ['Football', 'Basketball', 'Tennis', 'Volleyball']),
  price: Number (min: 0),
  image: String (base64 or URL),
  rating: Number (0-5, default: 4.0),
  owner: ObjectId (ref: 'User', required),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

## 🎯 Key Features Implemented

✅ **Complete Authentication System**  
✅ **User Registration & Login**  
✅ **JWT-based Security**  
✅ **Protected Routes & Components**  
✅ **My Spaces Management**  
✅ **Owner-only Edit/Delete**  
✅ **Secure Image Upload**  
✅ **Professional UI/UX**  
✅ **Error Handling & Validation**  
✅ **Responsive Design**  

## 🚀 Usage Instructions

1. **Start the app** (`npm run dev`)
2. **Register a new account** or login with existing credentials
3. **Browse playgrounds** on the home page
4. **Add your spaces** when logged in
5. **Manage your spaces** in the "My Spaces" section
6. **Edit or delete** only your own playgrounds

## 🔧 Production Considerations

- Change JWT_SECRET to a strong, random key
- Use HTTPS in production
- Implement rate limiting
- Add input validation middleware
- Use environment-specific configurations
- Implement refresh tokens for better security
- Add email verification for new accounts
