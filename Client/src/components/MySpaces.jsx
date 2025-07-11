import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, MapPin, Phone, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../hooks/use-toast';

const MySpaces = ({ onAddSpace }) => {
  const { user, token } = useAuth();
  const [myPlaygrounds, setMyPlaygrounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user && token) {
      fetchMyPlaygrounds();
    }
  }, [user, token]);

  const fetchMyPlaygrounds = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:5000/api/playgrounds/user/my-spaces', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setMyPlaygrounds(data.data);
      } else {
        setError(data.error || 'Failed to fetch your spaces');
      }
    } catch (error) {
      console.error('Error fetching my playgrounds:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (playgroundId, playgroundName) => {
    if (!window.confirm(`Are you sure you want to delete "${playgroundName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/playgrounds/${playgroundId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setMyPlaygrounds(prev => prev.filter(playground => playground._id !== playgroundId));
        toast({
          title: "Success!",
          description: "Playground deleted successfully"
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete playground",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting playground:', error);
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getSportIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'football': return '⚽';
      case 'basketball': return '🏀';
      case 'tennis': return '🎾';
      case 'volleyball': return '🏐';
      default: return '🏟️';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your spaces...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Spaces</h1>
          <p className="text-gray-600">Manage your sports facilities</p>
        </div>

        {error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
              <p className="text-red-600 font-medium">{error}</p>
              <Button onClick={fetchMyPlaygrounds} className="mt-4 bg-green-600 hover:bg-green-700 text-white">
                Try Again
              </Button>
            </div>
          </div>
        ) : myPlaygrounds.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-8 max-w-md mx-auto">
              <div className="text-6xl mb-4">🏟️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No spaces yet</h3>
              <p className="text-gray-600 mb-6">
                You haven't added any sports spaces yet. Start by adding your first space!
              </p>
              <Button onClick={onAddSpace} className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Space
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-lg text-gray-600">
                You have <span className="font-semibold text-green-600">{myPlaygrounds.length}</span> space{myPlaygrounds.length !== 1 ? 's' : ''}
              </p>
              <Button onClick={onAddSpace} className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Add New Space
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {myPlaygrounds.map((playground) => (
                <Card key={playground._id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg bg-white">
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
                        {getSportIcon(playground.type)} {playground.type}
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
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white/90 hover:bg-white text-gray-900"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(playground._id, playground.name)}
                          className="bg-red-500/90 hover:bg-red-600 text-white border-red-500"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
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
                        <Badge variant="outline" className="text-xs">
                          {new Date(playground.createdAt).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MySpaces;
