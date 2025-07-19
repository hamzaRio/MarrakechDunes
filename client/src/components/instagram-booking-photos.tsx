import { useState } from "react";
import { Instagram, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/hooks/useLanguage";

const instagramPhotos = [
  {
    id: "1",
    src: "/assets/agafaypack1.jpeg",
    alt: "Agafay Desert Adventure Booking",
    caption: "Magical moments in the Agafay Desert 🏜️ #MarrakechViews #AgafayDesert"
  },
  {
    id: "2", 
    src: "/assets/Hot Air Balloon Ride1_1750779813337.jpg",
    alt: "Hot Air Balloon Booking",
    caption: "Rise with the sun over the Atlas Mountains ☀️ #HotAirBalloon #AtlasMountains"
  },
  {
    id: "3",
    src: "/assets/Essaouira Day Trip1_1750780056220.jpg", 
    alt: "Essaouira Day Trip Booking",
    caption: "Coastal beauty of Essaouira awaits 🌊 #EssaouiraTrip #CoastalMorocco"
  },
  {
    id: "4",
    src: "/assets/Ouzoud-Waterfalls_1750780266345.jpg",
    alt: "Ouzoud Waterfalls Booking", 
    caption: "Spectacular waterfalls and rainbow views 🌈 #OuzoudWaterfalls #NaturalBeauty"
  },
  {
    id: "5",
    src: "/assets/Ourika Valley Day Trip1_1750780142908.jpg",
    alt: "Ourika Valley Booking",
    caption: "Mountain adventures in the Ourika Valley 🏔️ #OurikaValley #MountainViews"
  },
  {
    id: "6",
    src: "/assets/agafaypack3.jpeg",
    alt: "Desert Camp Experience",
    caption: "Authentic Berber hospitality under the stars ⭐ #DesertCamp #BerberCulture"
  }
];

export default function InstagramBookingPhotos() {
  const { t } = useLanguage();
  const [selectedPhoto, setSelectedPhoto] = useState<typeof instagramPhotos[0] | null>(null);

  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-playfair text-3xl md:text-4xl font-bold text-moroccan-blue mb-4">
            {t('bookYourAdventure')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            {t('seeWhatAwaits')}
          </p>
          <Button
            onClick={() => window.open('https://www.instagram.com/medina_expeditions', '_blank')}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          >
            <Instagram className="w-4 h-4 mr-2" />
            Follow @medina_expeditions
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Instagram Photo Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          {instagramPhotos.map((photo) => (
            <Card
              key={photo.id}
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
              onClick={() => setSelectedPhoto(photo)}
            >
              <CardContent className="p-0">
                <div className="relative aspect-square">
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/assets/placeholder-activity.jpg";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-2 left-2 right-2">
                      <Instagram className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-moroccan-blue to-blue-600 text-white border-none">
            <CardContent className="p-8">
              <h3 className="font-playfair text-2xl font-bold mb-4">
                {t('readyToCreate')}
              </h3>
              <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                {t('joinThousands')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={() => window.location.href = '/booking'}
                  className="bg-moroccan-red hover:bg-red-700 text-white"
                >
                  {t('bookAdventure')}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => window.location.href = '/activities'}
                  className="bg-white text-moroccan-blue hover:bg-gray-100"
                >
                  {t('viewAllActivities')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Photo Modal */}
        {selectedPhoto && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="relative">
                <img
                  src={selectedPhoto.src}
                  alt={selectedPhoto.alt}
                  className="w-full h-auto max-h-[60vh] object-cover"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => setSelectedPhoto(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <Instagram className="w-5 h-5 text-purple-500 mr-2" />
                  <span className="font-semibold text-moroccan-blue">@medina_expeditions</span>
                </div>
                <p className="text-gray-700">{selectedPhoto.caption}</p>
                <div className="mt-4 pt-4 border-t">
                  <Button
                    onClick={() => window.open('https://www.instagram.com/medina_expeditions', '_blank')}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  >
                    <Instagram className="w-4 h-4 mr-2" />
                    {t('followForMore')}
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}