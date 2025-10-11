import { useState, useEffect, useRef } from 'react';
import axios from '@/lib/api';
import { toast } from 'sonner';

type ExternalActivity = {
  title: string;
  city: string;
  priceMAD: number;
  durationText: string;
  rating?: number;
  provider: string;
  providerUrl?: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSelectActivity: (activity: ExternalActivity) => void;
  placeholder?: string;
};

export default function ActivityAutocomplete({ value, onChange, onSelectActivity, placeholder }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<ExternalActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (value.length >= 3) {
        searchActivities(value);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [value]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);
  
  const searchActivities = async (query: string) => {
    setLoading(true);
    try {
      let mapped: ExternalActivity[] = [];
      
      // Try GetYourGuide first
      try {
        const r = await axios.get('/gyg/search', { 
          params: { q: `${query} maroc` } 
        });
        mapped = (r.data?.items ?? []).map((x: any) => ({
          title: x.title,
          city: x.city ?? '',
          priceMAD: x.priceMAD ?? x.price ?? 0,
          durationText: x.durationText ?? x.duration ?? '',
          rating: x.rating,
          provider: 'GetYourGuide',
          providerUrl: x.url,
        }));
      } catch {
        // Fallback to mock service
        const r2 = await axios.get('/api/external-activities', { 
          params: { query } 
        });
        mapped = r2.data;
      }
      
      setResults(mapped);
      setIsOpen(mapped.length > 0);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Erreur de recherche');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelect = (activity: ExternalActivity) => {
    onChange(activity.title);
    onSelectActivity(activity);
    setIsOpen(false);
    toast.success('Activité sélectionnée');
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Rechercher une activité au Maroc..."}
        className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500"
      />
      
      {loading && (
        <div className="absolute right-3 top-3">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      )}
      
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {results.map((activity, idx) => (
            <div
              key={`${activity.provider}-${idx}`}
              onClick={() => handleSelect(activity)}
              className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition-colors"
            >
              <div className="font-medium text-gray-900">{activity.title}</div>
              <div className="text-sm text-gray-600 mt-1">
                📍 {activity.city} • ⏱️ {activity.durationText}
                {activity.rating && ` • ⭐ ${activity.rating}/5`}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-lg font-bold text-green-600">
                  {activity.priceMAD} MAD
                </span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {activity.provider}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
