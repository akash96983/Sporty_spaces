import React, { useState, useEffect } from 'react';
import { Search, Plus, MapPin, Phone, Calendar, Star, User, LogOut } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { toast } from '../hooks/use-toast';
import PlaygroundAPI from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from '../components/auth/LoginForm';
import SignupForm from '../components/auth/SignupForm';
import MySpaces from '../components/MySpaces';

const Index = () => {
  const { user, token, logout, isAuthenticated } = useAuth();
  const [playgrounds, setPlaygrounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddSpaceDialog, setShowAddSpaceDialog] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [currentView, setCurrentView] = useState('home'); // 'home' or 'myspaces'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPlayground, setNewPlayground] = useState({
    name: '',
    location: '',
    phone_number: '',
    type: 'Football',
    price: '',
    image: ''
  });

  // Fetch playgrounds from API
  useEffect(() => {
    fetchPlaygrounds();
  }, []);

  const fetchPlaygrounds = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await PlaygroundAPI.getAllPlaygrounds(token);
      setPlaygrounds(data);
    } catch (error) {
      console.error('Error fetching playgrounds:', error);
      setError('Failed to load playgrounds. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPlayground(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image size should be less than 5MB",
          variant: "destructive"
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select a valid image file",
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setNewPlayground(prev => ({
          ...prev,
          image: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const getDefaultImage = (type) => {
    // Return a placeholder or null - no hardcoded images
    return null;
  };

  const handleAddPlayground = async () => {
    if (!isAuthenticated) {
      setAuthMode('signup');
      setShowAuthDialog(true);
      toast({
        title: "Login Required",
        description: "Please login to add a playground",
        variant: "destructive"
      });
      return;
    }

    if (!newPlayground.name || !newPlayground.location || !newPlayground.phone_number) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const playgroundData = {
        name: newPlayground.name,
        location: newPlayground.location,
        phone_number: newPlayground.phone_number,
        type: newPlayground.type,
        price: parseInt(newPlayground.price) || 40,
        image: newPlayground.image || null
      };

      const createdPlayground = await PlaygroundAPI.createPlayground(playgroundData, token);
      
      // Add the new playground to the state
      setPlaygrounds(prev => [...prev, createdPlayground]);
      setShowAddSpaceDialog(false);
      setNewPlayground({
        name: '',
        location: '',
        phone_number: '',
        type: 'Football',
        price: '',
        image: ''
      });

      toast({
        title: "Success!",
        description: "Playground added successfully",
      });
    } catch (error) {
      console.error('Error adding playground:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add playground. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPlaygrounds = playgrounds.filter(playground => 
    playground.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    playground.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    playground.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSportIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'football': return '⚽';
      case 'basketball': return '🏀';
      case 'tennis': return '🎾';
      case 'volleyball': return '🏐';
      default: return '🏟️';
    }
  };

  const handleLogout = () => {
    logout();
    setCurrentView('home');
    toast({
      title: "Logged out",
      description: "You have been successfully logged out"
    });
  };

  const handleMySpacesClick = () => {
    if (!isAuthenticated) {
      setAuthMode('login');
      setShowAuthDialog(true);
      toast({
        title: "Login Required",
        description: "Please login to view your spaces",
        variant: "destructive"
      });
      return;
    }
    setCurrentView('myspaces');
  };

  const handleAddSpaceClick = () => {
    if (!isAuthenticated) {
      setAuthMode('signup');
      setShowAuthDialog(true);
      return;
    }
    setShowAddSpaceDialog(true);
  };

  // Show My Spaces view
  if (currentView === 'myspaces') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-green-100 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2">
                <div className="bg-green-600 w-8 h-8 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SS</span>
                </div>
                <button 
                  onClick={() => setCurrentView('home')}
                  className="text-2xl font-bold text-green-600 hover:text-green-700 transition-colors"
                >
                  Sporty Spaces
                </button>
              </div>
              
              <nav className="hidden md:flex items-center space-x-6">
                <button 
                  onClick={() => setCurrentView('home')}
                  className="text-gray-700 hover:text-green-600 transition-colors"
                >
                  Home
                </button>
                <button 
                  onClick={handleMySpacesClick}
                  className="text-green-600 font-medium"
                >
                  My Spaces
                </button>
                <a href="#" className="text-gray-700 hover:text-green-600 transition-colors">My Bookings</a>
                <a href="#" className="text-gray-700 hover:text-green-600 transition-colors">Contact</a>
                {isAuthenticated ? (
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-700">Hello, {user?.name}</span>
                    <Button variant="outline" onClick={handleLogout} className="border-red-500 text-red-500 hover:bg-red-50">
                      <LogOut className="h-4 w-4 mr-1" />
                      Logout
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => { setAuthMode('login'); setShowAuthDialog(true); }} className="border-green-600 text-green-600 hover:bg-green-50">
                      Login
                    </Button>
                    <Button onClick={() => { setAuthMode('signup'); setShowAuthDialog(true); }} className="bg-green-600 hover:bg-green-700 text-white">
                      Sign Up
                    </Button>
                  </>
                )}
              </nav>
            </div>
          </div>
        </header>

        <MySpaces onAddSpace={handleAddSpaceClick} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading amazing spaces...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-green-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="bg-green-600 w-8 h-8 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SS</span>
              </div>
              <h1 className="text-2xl font-bold text-green-600">
                Sporty Spaces
              </h1>
            </div>
            
            <nav className="hidden md:flex items-center space-x-6">
              <button 
                onClick={handleMySpacesClick}
                className="text-gray-700 hover:text-green-600 transition-colors"
              >
                My Spaces
              </button>
              <a href="#" className="text-gray-700 hover:text-green-600 transition-colors">My Bookings</a>
              <a href="#" className="text-gray-700 hover:text-green-600 transition-colors">Contact</a>
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <span className="text-gray-700">Hello, {user?.name}</span>
                  <Button variant="outline" onClick={handleLogout} className="border-red-500 text-red-500 hover:bg-red-50">
                    <LogOut className="h-4 w-4 mr-1" />
                    Logout
                  </Button>
                </div>
              ) : (
                <>
                  <Button variant="outline" onClick={() => { setAuthMode('login'); setShowAuthDialog(true); }} className="border-green-600 text-green-600 hover:bg-green-50">
                    Login
                  </Button>
                  <Button onClick={() => { setAuthMode('signup'); setShowAuthDialog(true); }} className="bg-green-600 hover:bg-green-700 text-white">
                    Sign Up
                  </Button>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Find Your Perfect
            <span className="text-green-600"> Sports Space</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Book premium sports facilities in your area with just a few clicks. From football fields to tennis courts.
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search by name, location, or sport type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-4 text-lg border-2 border-green-200 focus:border-green-500 rounded-xl"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Dialog open={showAddSpaceDialog} onOpenChange={setShowAddSpaceDialog}>
              <DialogTrigger asChild>
                <Button onClick={handleAddSpaceClick} size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg rounded-xl">
                  <Plus className="mr-2 h-5 w-5" />
                  Add Your Space
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-center">Add New Sports Space</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Space Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={newPlayground.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Elite Football Arena"
                      className="border-2 border-gray-200 focus:border-green-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      name="location"
                      value={newPlayground.location}
                      onChange={handleInputChange}
                      placeholder="e.g., Downtown Sports Complex"
                      className="border-2 border-gray-200 focus:border-green-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone_number">Phone Number *</Label>
                    <Input
                      id="phone_number"
                      name="phone_number"
                      value={newPlayground.phone_number}
                      onChange={handleInputChange}
                      placeholder="e.g., +1 (555) 123-4567"
                      className="border-2 border-gray-200 focus:border-green-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Sport Type</Label>
                    <select
                      id="type"
                      name="type"
                      value={newPlayground.type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-md focus:border-green-500 focus:outline-none"
                    >
                      <option value="Football">Football</option>
                      <option value="Basketball">Basketball</option>
                      <option value="Tennis">Tennis</option>
                      <option value="Volleyball">Volleyball</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price per hour</Label>
                    <Input
                      id="price"
                      name="price"
                      value={newPlayground.price}
                      onChange={handleInputChange}
                      placeholder="e.g., 45"
                      type="number"
                      className="border-2 border-gray-200 focus:border-green-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image">Playground Image</Label>
                    <div className="space-y-3">
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="border-2 border-gray-200 focus:border-green-500"
                      />
                      {newPlayground.image && (
                        <div className="relative">
                          <img
                            src={newPlayground.image}
                            alt="Preview"
                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setNewPlayground(prev => ({...prev, image: ''}))}
                            className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                      <p className="text-xs text-gray-500">
                        Upload an image of your playground (max 5MB). If no image is uploaded, a default image will be used.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={() => setShowAddSpaceDialog(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={handleAddPlayground} disabled={isSubmitting} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                      {isSubmitting ? 'Adding...' : 'Add Space'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* Spaces Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-3xl font-bold text-gray-900">
              Available Spaces
              <span className="text-green-600 ml-2">({filteredPlaygrounds.length})</span>
            </h3>
          </div>

          {error ? (
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
                <p className="text-red-600 font-medium">{error}</p>
                <Button onClick={fetchPlaygrounds} className="mt-4 bg-green-600 hover:bg-green-700 text-white">
                  Try Again
                </Button>
              </div>
            </div>
          ) : filteredPlaygrounds.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 max-w-md mx-auto">
                <p className="text-gray-600 mb-4">
                  {searchTerm ? 'No spaces found matching your search.' : 'No spaces available yet.'}
                </p>
                <Button onClick={() => setShowAddSpaceDialog(true)} className="bg-green-600 hover:bg-green-700 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Space
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPlaygrounds.map((playground) => (
                <Card key={playground._id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <div className="relative overflow-hidden rounded-t-lg h-48">
                    {playground.image ? (
                      <img
                        src={playground.image}
                        alt={playground.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center group-hover:from-gray-200 group-hover:to-gray-300 transition-all duration-300">
                        <div className="text-center text-gray-500">
                          <div className="text-4xl mb-2">{getSportIcon(playground.type)}</div>
                          <p className="text-sm font-medium">No Image Available</p>
                        </div>
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-white/90 text-gray-700 hover:bg-white">
                        {getSportIcon(playground.type || 'Football')} {playground.type || 'Football'}
                      </Badge>
                    </div>
                    {playground.rating && (
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-yellow-400/90 text-yellow-900 hover:bg-yellow-400">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          {playground.rating}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <h4 className="font-bold text-lg text-gray-900 line-clamp-2">
                        {playground.name}
                      </h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-green-600 flex-shrink-0" />
                          <span className="line-clamp-1">{playground.location}</span>
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-green-600 flex-shrink-0" />
                          <span>{playground.phone_number}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        {playground.price && (
                          <div className="text-2xl font-bold text-green-600">
                            ${playground.price}
                            <span className="text-sm font-normal text-gray-500">/hr</span>
                          </div>
                        )}
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white px-6">
                          <Calendar className="h-4 w-4 mr-1" />
                          Book
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="bg-green-600 w-8 h-8 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SS</span>
                </div>
                <h3 className="text-xl font-bold">Sporty Spaces</h3>
              </div>
              <p className="text-gray-400">
                Find and book premium sports facilities with ease. Your game, your space.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Facebook</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Sporty Spaces. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Authentication Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-md">
          {authMode === 'login' ? (
            <LoginForm 
              onSwitchToSignup={() => setAuthMode('signup')}
              onClose={() => setShowAuthDialog(false)}
            />
          ) : (
            <SignupForm 
              onSwitchToLogin={() => setAuthMode('login')}
              onClose={() => setShowAuthDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
