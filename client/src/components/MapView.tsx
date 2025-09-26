import { useEffect, useMemo, useState } from 'react';
import { MAP_PROVIDER } from '@/lib/env';

const GOOGLE_EMBED_URL = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3396.5636074242!2d-7.988845!3d31.628746!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xdafee8d84b23469%3A0x7d5e3e12a5b8c2d4!2s54%20Riad%20Zitoun%20Lakdim%2C%20Marrakech%2040000%2C%20Morocco!5e0!3m2!1sen!2sma!4v1647875432123';
const MAP_CENTER: [number, number] = [31.628746, -7.988845];

type LeafletModuleSet = {
  MapContainer: typeof import('react-leaflet').MapContainer;
  Marker: typeof import('react-leaflet').Marker;
  Popup: typeof import('react-leaflet').Popup;
  TileLayer: typeof import('react-leaflet').TileLayer;
};

let cachedLeaflet: LeafletModuleSet | null = null;
let leafletInitialized = false;

async function loadLeaflet(): Promise<LeafletModuleSet> {
  if (cachedLeaflet) {
    return cachedLeaflet;
  }

  const [leafletModules, leafletCore] = await Promise.all([
    import('react-leaflet'),
    import('leaflet'),
  ]);

  await import('leaflet/dist/leaflet.css');

  const [markerIcon2x, markerIcon, markerShadow] = await Promise.all([
    import('leaflet/dist/images/marker-icon-2x.png'),
    import('leaflet/dist/images/marker-icon.png'),
    import('leaflet/dist/images/marker-shadow.png'),
  ]);

  const L = leafletCore.default;
  if (!leafletInitialized) {
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: markerIcon2x.default,
      iconUrl: markerIcon.default,
      shadowUrl: markerShadow.default,
    });
    leafletInitialized = true;
  }

  cachedLeaflet = {
    MapContainer: leafletModules.MapContainer,
    Marker: leafletModules.Marker,
    Popup: leafletModules.Popup,
    TileLayer: leafletModules.TileLayer,
  };

  return cachedLeaflet;
}

interface MapViewProps {
  height?: string;
  className?: string;
  iframeTitle?: string;
}

const baseContainerClass = 'w-full rounded-lg border border-moroccan-sand/40 shadow-sm overflow-hidden bg-white';

export default function MapView({
  height = '320px',
  className = '',
  iframeTitle = 'Marrakech Dunes location map',
}: MapViewProps) {
  const provider = MAP_PROVIDER;
  const [leafletModules, setLeafletModules] = useState<LeafletModuleSet | null>(cachedLeaflet);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (provider === 'leaflet' && !cachedLeaflet) {
      loadLeaflet()
        .then(setLeafletModules)
        .catch((error) => {
          console.error('Failed to load Leaflet assets', error);
        });
    }
  }, [provider]);

  const containerClasses = useMemo(() => `${baseContainerClass} ${className}`.trim(), [className]);

  if (provider !== 'leaflet') {
    return (
      <div className={containerClasses} style={{ height }}>
        <iframe
          title={iframeTitle}
          src={GOOGLE_EMBED_URL}
          style={{ border: 0, width: '100%', height: '100%' }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="bg-moroccan-sand/40 px-3 py-2 text-sm text-moroccan-blue font-medium">
          <a
            href="https://maps.google.com/?q=54+Riad+Zitoun+Lakdim,+Marrakech+40000,+Morocco"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-moroccan-red transition-colors"
          >
            View larger map
          </a>
        </div>
      </div>
    );
  }

  if (!isClient || !leafletModules) {
    return (
      <div className={containerClasses} style={{ height }}>
        <div className="flex h-full items-center justify-center text-sm text-moroccan-blue opacity-70">
          Loading interactive map...
        </div>
      </div>
    );
  }

  const { MapContainer, Marker, Popup, TileLayer } = leafletModules;

  return (
    <div className={containerClasses} style={{ height }}>
      <MapContainer
        center={MAP_CENTER}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
        attributionControl
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
        />
        <Marker position={MAP_CENTER}>
          <Popup>
            <span className="font-semibold">Marrakech Dunes Tours</span>
            <br />
            54 Riad Zitoun Lakdim, Marrakech 40000
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
