import { useEffect } from "react";
import { Instagram, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/hooks/useLanguage";

export default function InstagramFeed() {
  const { t } = useLanguage();

  useEffect(() => {
    // Load Instagram embed script
    const script = document.createElement('script');
    script.async = true;
    script.src = "//www.instagram.com/embed.js";
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-playfair text-3xl md:text-4xl font-bold text-moroccan-blue mb-4">
            {t('followOurAdventures')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            {t('followDescription')}
          </p>
          <Button
            onClick={() => window.open('https://www.instagram.com/medina_expeditions', '_blank')}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          >
            <Instagram className="w-4 h-4 mr-2" />
            {t('followInstagram')}
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Instagram Post Embeds */}
          <Card className="border-moroccan-gold/20 overflow-hidden">
            <CardContent className="p-0">
              <blockquote
                className="instagram-media"
                data-instgrm-permalink="https://www.instagram.com/p/C0example1/?utm_source=ig_embed&amp;utm_campaign=loading"
                data-instgrm-version="14"
                style={{
                  background: '#FFF',
                  border: '0',
                  borderRadius: '3px',
                  boxShadow: '0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)',
                  margin: '1px',
                  maxWidth: '540px',
                  minWidth: '326px',
                  padding: '0',
                  width: '99.375%'
                }}
              >
                <div style={{ padding: '16px' }}>
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Instagram className="w-5 h-5 text-white" />
                    </div>
                    <div className="ml-3">
                      <p className="font-semibold text-moroccan-blue">@medina_expeditions</p>
                      <p className="text-sm text-gray-500">Latest Adventure</p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-moroccan-sand to-moroccan-gold/20 h-64 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Instagram className="w-12 h-12 text-moroccan-blue mx-auto mb-2" />
                      <p className="text-moroccan-blue font-medium">Follow us on Instagram</p>
                      <p className="text-sm text-gray-600">to see our latest adventures</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-700">
                      Experience the magic of Morocco with authentic desert expeditions, cultural discoveries, and unforgettable moments.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">#MoroccoTravel #DesertAdventure #MarrakechDunes</p>
                  </div>
                </div>
              </blockquote>
            </CardContent>
          </Card>

          <Card className="border-moroccan-gold/20 overflow-hidden">
            <CardContent className="p-0">
              <blockquote
                className="instagram-media"
                data-instgrm-permalink="https://www.instagram.com/p/C0example2/?utm_source=ig_embed&amp;utm_campaign=loading"
                data-instgrm-version="14"
                style={{
                  background: '#FFF',
                  border: '0',
                  borderRadius: '3px',
                  boxShadow: '0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)',
                  margin: '1px',
                  maxWidth: '540px',
                  minWidth: '326px',
                  padding: '0',
                  width: '99.375%'
                }}
              >
                <div style={{ padding: '16px' }}>
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Instagram className="w-5 h-5 text-white" />
                    </div>
                    <div className="ml-3">
                      <p className="font-semibold text-moroccan-blue">@medina_expeditions</p>
                      <p className="text-sm text-gray-500">Desert Experience</p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-200 to-yellow-300 h-64 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Instagram className="w-12 h-12 text-orange-800 mx-auto mb-2" />
                      <p className="text-orange-800 font-medium">Sahara Desert Tours</p>
                      <p className="text-sm text-orange-700">Authentic Berber experiences</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-700">
                      Journey into the heart of the Sahara with our expert guides. Camel trekking, stargazing, and traditional Berber hospitality.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">#SaharaDesert #CamelTrekking #BerberCulture</p>
                  </div>
                </div>
              </blockquote>
            </CardContent>
          </Card>

          <Card className="border-moroccan-gold/20 overflow-hidden">
            <CardContent className="p-0">
              <blockquote
                className="instagram-media"
                data-instgrm-permalink="https://www.instagram.com/p/C0example3/?utm_source=ig_embed&amp;utm_campaign=loading"
                data-instgrm-version="14"
                style={{
                  background: '#FFF',
                  border: '0',
                  borderRadius: '3px',
                  boxShadow: '0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)',
                  margin: '1px',
                  maxWidth: '540px',
                  minWidth: '326px',
                  padding: '0',
                  width: '99.375%'
                }}
              >
                <div style={{ padding: '16px' }}>
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Instagram className="w-5 h-5 text-white" />
                    </div>
                    <div className="ml-3">
                      <p className="font-semibold text-moroccan-blue">@medina_expeditions</p>
                      <p className="text-sm text-gray-500">Hot Air Balloon</p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-200 to-cyan-300 h-64 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Instagram className="w-12 h-12 text-blue-800 mx-auto mb-2" />
                      <p className="text-blue-800 font-medium">Balloon Adventures</p>
                      <p className="text-sm text-blue-700">Soar above Morocco</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-700">
                      Rise with the sun over the Atlas Mountains. Our hot air balloon experiences offer breathtaking views of Morocco's diverse landscapes.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">#HotAirBalloon #AtlasMountains #MarrakechViews</p>
                  </div>
                </div>
              </blockquote>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <Card className="bg-gradient-to-r from-moroccan-blue to-blue-600 text-white border-none">
            <CardContent className="p-8">
              <h3 className="font-playfair text-2xl font-bold mb-4">
                {t('stayConnected')}
              </h3>
              <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                {t('stayConnectedDescription')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="secondary"
                  onClick={() => window.open('https://www.instagram.com/medina_expeditions', '_blank')}
                  className="bg-white text-moroccan-blue hover:bg-gray-100"
                >
                  <Instagram className="w-4 h-4 mr-2" />
                  {t('followOnInstagram')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/booking'}
                  className="border-white text-white hover:bg-white hover:text-moroccan-blue"
                >
                  Book Your Adventure
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}