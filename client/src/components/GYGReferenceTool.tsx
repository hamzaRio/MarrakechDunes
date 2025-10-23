import { useState } from 'react';
import { ExternalLink, Globe, Search } from 'lucide-react';
import ActivityAutocomplete from './ActivityAutocomplete';

interface GYGReferenceToolProps {
  onActivitySelect?: (activity: any) => void;
}

export default function GYGReferenceTool({ onActivitySelect }: GYGReferenceToolProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Open GetYourGuide website with search
  const handleGYGSearch = () => {
    const searchTerm = searchQuery.trim() || 'morocco activities';
    const gygUrl = `https://www.getyourguide.com/s/?q=${encodeURIComponent(searchTerm)}`;
    console.log('[GYG-REF] Opening GetYourGuide with search:', searchTerm);
    window.open(gygUrl, '_blank', 'noopener,noreferrer');
  };

  // Open GetYourGuide Morocco page
  const handleGYGMorocco = () => {
    const gygUrl = 'https://www.getyourguide.com/morocco/';
    console.log('[GYG-REF] Opening GetYourGuide Morocco page');
    window.open(gygUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Globe className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-blue-800">🔍 Référence GetYourGuide v3.0</h3>
      </div>
      
      <p className="text-sm text-blue-700 mb-4">
        Ouvrez GetYourGuide dans un nouvel onglet pour rechercher des activités et obtenir des idées de prix (référence uniquement)
      </p>

      <div className="space-y-3">
        <div className="relative">
          <ActivityAutocomplete
            value={searchQuery}
            onChange={setSearchQuery}
            onSelectActivity={(activity) => {
              console.log('[GYG-REF] Activity selected:', activity);
              if (onActivitySelect) {
                onActivitySelect(activity);
              }
            }}
            placeholder="Tapez votre recherche (ex: fes, desert, marrakech)..."
            city="marrakech"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleGYGSearch}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            🔍 Rechercher sur GetYourGuide
          </button>
          
          <button
            onClick={handleGYGMorocco}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Globe className="w-4 h-4" />
            🇲🇦 Voir Maroc
          </button>
        </div>

        <div className="text-xs text-gray-600 bg-blue-100 p-2 rounded">
          💡 <strong>Astuce:</strong> Utilisez cette recherche pour voir les prix et activités disponibles sur GetYourGuide, puis créez votre propre activité avec des prix compétitifs.
        </div>
      </div>
    </div>
  );
}
