import React, { useState } from 'react';
import { Plus, Search, MapPin, Clock, Users, Star, DollarSign, Save, X } from 'lucide-react';
import GYGActivitySearch from '../components/gyg-activity-search';

interface Activity {
  id: string;
  title: string;
  description: string;
  location: string;
  duration: string;
  price: number;
  currency: string;
  maxParticipants: number;
  highlights: string[];
  imageUrl: string;
  category: string;
  difficulty: string;
  included: string[];
  requirements: string[];
}

interface GYGActivity {
  id: string;
  title: string;
  location: string;
  duration: string;
  price: {
    amount: number;
    currency: string;
    originalAmount?: number;
  };
  rating: number;
  reviewCount: number;
  imageUrl: string;
  url: string;
  description: string;
  highlights: string[];
}

export default function AddActivity() {
  const [showGYGSearch, setShowGYGSearch] = useState(false);
  const [selectedGYGActivity, setSelectedGYGActivity] = useState<GYGActivity | null>(null);
  const [activity, setActivity] = useState<Activity>({
    id: '',
    title: '',
    description: '',
    location: 'Marrakech, Morocco',
    duration: '',
    price: 0,
    currency: 'MAD',
    maxParticipants: 20,
    highlights: [],
    imageUrl: '',
    category: 'Adventure',
    difficulty: 'Easy',
    included: [],
    requirements: []
  });

  const [newHighlight, setNewHighlight] = useState('');
  const [newIncluded, setNewIncluded] = useState('');
  const [newRequirement, setNewRequirement] = useState('');

  const handleGYGActivitySelect = (gygActivity: GYGActivity) => {
    setSelectedGYGActivity(gygActivity);
    setActivity(prev => ({
      ...prev,
      title: gygActivity.title,
      description: gygActivity.description,
      location: gygActivity.location,
      duration: gygActivity.duration,
      price: gygActivity.price.amount,
      currency: gygActivity.currency,
      highlights: gygActivity.highlights,
      imageUrl: gygActivity.imageUrl
    }));
    setShowGYGSearch(false);
  };

  const addHighlight = () => {
    if (newHighlight.trim()) {
      setActivity(prev => ({
        ...prev,
        highlights: [...prev.highlights, newHighlight.trim()]
      }));
      setNewHighlight('');
    }
  };

  const removeHighlight = (index: number) => {
    setActivity(prev => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index)
    }));
  };

  const addIncluded = () => {
    if (newIncluded.trim()) {
      setActivity(prev => ({
        ...prev,
        included: [...prev.included, newIncluded.trim()]
      }));
      setNewIncluded('');
    }
  };

  const removeIncluded = (index: number) => {
    setActivity(prev => ({
      ...prev,
      included: prev.included.filter((_, i) => i !== index)
    }));
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setActivity(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()]
      }));
      setNewRequirement('');
    }
  };

  const removeRequirement = (index: number) => {
    setActivity(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    // Here you would save the activity to your database
    console.log('Saving activity:', activity);
    alert('Activity saved successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
              <Plus className="mr-3 text-blue-600" />
              Add New Activity
            </h1>
            <button
              onClick={() => setShowGYGSearch(!showGYGSearch)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
            >
              <Search className="mr-2 h-5 w-5" />
              {showGYGSearch ? 'Hide' : 'Search'} GetYourGuide
            </button>
          </div>

          {showGYGSearch && (
            <div className="mb-8">
              <GYGActivitySearch onActivitySelect={handleGYGActivitySelect} />
            </div>
          )}

          {selectedGYGActivity && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Selected from GetYourGuide:</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-700">{selectedGYGActivity.title}</p>
                  <p className="text-sm text-green-600">
                    ${selectedGYGActivity.price.amount} {selectedGYGActivity.price.currency} • {selectedGYGActivity.duration}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedGYGActivity(null)}
                  className="text-green-600 hover:text-green-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Title *
                </label>
                <input
                  type="text"
                  value={activity.title}
                  onChange={(e) => setActivity(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={activity.category}
                  onChange={(e) => setActivity(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Adventure">Adventure</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Food & Drink">Food & Drink</option>
                  <option value="Nature">Nature</option>
                  <option value="History">History</option>
                  <option value="Relaxation">Relaxation</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={activity.description}
                onChange={(e) => setActivity(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={activity.location}
                  onChange={(e) => setActivity(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration
                </label>
                <input
                  type="text"
                  value={activity.duration}
                  onChange={(e) => setActivity(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="e.g., 4 hours, 1 day"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Participants
                </label>
                <input
                  type="number"
                  value={activity.maxParticipants}
                  onChange={(e) => setActivity(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price
                </label>
                <div className="flex">
                  <input
                    type="number"
                    value={activity.price}
                    onChange={(e) => setActivity(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <select
                    value={activity.currency}
                    onChange={(e) => setActivity(prev => ({ ...prev, currency: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="MAD">MAD</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <select
                  value={activity.difficulty}
                  onChange={(e) => setActivity(prev => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Easy">Easy</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Challenging">Challenging</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image URL
              </label>
              <input
                type="url"
                value={activity.imageUrl}
                onChange={(e) => setActivity(prev => ({ ...prev, imageUrl: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Highlights
              </label>
              <div className="flex mb-2">
                <input
                  type="text"
                  value={newHighlight}
                  onChange={(e) => setNewHighlight(e.target.value)}
                  placeholder="Add a highlight"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHighlight())}
                />
                <button
                  type="button"
                  onClick={addHighlight}
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {activity.highlights.map((highlight, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center"
                  >
                    {highlight}
                    <button
                      type="button"
                      onClick={() => removeHighlight(index)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What's Included
              </label>
              <div className="flex mb-2">
                <input
                  type="text"
                  value={newIncluded}
                  onChange={(e) => setNewIncluded(e.target.value)}
                  placeholder="Add what's included"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIncluded())}
                />
                <button
                  type="button"
                  onClick={addIncluded}
                  className="px-4 py-2 bg-green-600 text-white rounded-r-lg hover:bg-green-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {activity.included.map((item, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => removeIncluded(index)}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requirements
              </label>
              <div className="flex mb-2">
                <input
                  type="text"
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  placeholder="Add a requirement"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                />
                <button
                  type="button"
                  onClick={addRequirement}
                  className="px-4 py-2 bg-orange-600 text-white rounded-r-lg hover:bg-orange-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {activity.requirements.map((requirement, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm flex items-center"
                  >
                    {requirement}
                    <button
                      type="button"
                      onClick={() => removeRequirement(index)}
                      className="ml-2 text-orange-600 hover:text-orange-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Save className="mr-2 h-5 w-5" />
                Save Activity
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
