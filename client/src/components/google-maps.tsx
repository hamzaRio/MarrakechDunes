import { useEffect, useRef } from 'react';

interface GoogleMapsProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  height?: string;
}

export default function GoogleMaps({ 
  center = { lat: 31.6295, lng: -7.9811 }, // Marrakech coordinates
  zoom = 13,
  className = "",
  height = "400px"
}: GoogleMapsProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
    
    if (!googleMapsKey) {
      // Use iframe embed without API key - works without API key
      if (mapRef.current) {
        mapRef.current.innerHTML = `
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3398.5!2d-7.9811!3d31.6295!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xda76c8d5b9c8c8d%3A0xda76c8d5b9c8c8d!2sMarrakech%2C%20Morocco!5e0!3m2!1sen!2s!4v1234567890"
            width="100%" 
            height="100%" 
            style="border:0; border-radius: 8px;" 
            allowfullscreen="" 
            loading="lazy" 
            referrerpolicy="no-referrer-when-downgrade">
          </iframe>
        `;
      }
      return;
    }

    // Check if Google Maps is already loaded
    if (typeof google !== 'undefined' && google.maps) {
      initializeMap();
      return;
    }

    // Load Google Maps API
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      if (typeof google !== 'undefined' && google.maps) {
        initializeMap();
      }
    };
    
    script.onerror = () => {
      console.error('Failed to load Google Maps API');
      if (mapRef.current) {
        mapRef.current.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #3b82f6; color: white; border: 2px solid white; border-radius: 8px;">
            <div style="text-align: center;">
              <p style="font-size: 18px; font-weight: bold; margin: 0 0 8px 0;">🗺️ Google Maps</p>
              <p style="font-size: 14px; margin: 0;">Google Maps disabled</p>
            </div>
          </div>
        `;
      }
    };

    document.head.appendChild(script);

    function initializeMap() {
      if (!mapRef.current || mapInstanceRef.current) return;

      try {
        mapInstanceRef.current = new google.maps.Map(mapRef.current, {
          center,
          zoom,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });

        // Add a marker for Marrakech
        new google.maps.Marker({
          position: center,
          map: mapInstanceRef.current,
          title: 'Marrakech, Morocco',
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new google.maps.Size(32, 32)
          }
        });

      } catch (error) {
        console.error('Error initializing Google Maps:', error);
        if (mapRef.current) {
          mapRef.current.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #3b82f6; color: white; border: 2px solid white; border-radius: 8px;">
              <div style="text-align: center;">
                <p style="font-size: 18px; font-weight: bold; margin: 0 0 8px 0;">🗺️ Google Maps</p>
                <p style="font-size: 14px; margin: 0;">Google Maps disabled</p>
              </div>
            </div>
          `;
        }
      }
    }

    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [center, zoom]);

  return (
    <div 
      ref={mapRef}
      className={`w-full rounded-lg border ${className}`}
      style={{ height }}
    />
  );
}

// Hook for checking if Google Maps is available
export function useGoogleMaps() {
  const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
  const isAvailable = !!googleMapsKey && typeof google !== 'undefined' && google.maps;
  
  return {
    isAvailable,
    apiKey: googleMapsKey,
    isLoaded: typeof google !== 'undefined' && google.maps
  };
}
