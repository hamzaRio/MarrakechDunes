import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/hooks/use-language";
import { asset } from "@/lib/env";

// Import images


const galleryImages = [
  {
    id: 1,
    src: asset("agafaypack1_1751128022717.jpeg"),
    alt: "Agafay Desert Adventure",
    title: "Agafay Desert Experience",
    description: "Magical moments in the golden dunes of Agafay Desert",
    fallback: asset("agafaypack2_1751128022717.jpeg")
  },
  {
    id: 2,
    src: asset("montgolfiere-marrakech_1751127701687.jpg"),
    alt: "Marrakech Hot Air Balloon",
    title: "Hot Air Balloon Experience",
    description: "Soar above the Atlas Mountains at sunrise",
    fallback: asset("montgofliere_a_marrakech_1751127701687.jpg")
  },
  {
    id: 3,
    src: asset("Hot Air Balloon Ride2_1751127701686.jpg"),
    alt: "Hot Air Balloon Experience",
    title: "Hot Air Balloon Adventure",
    description: "Soar above the Atlas Mountains at sunrise",
    fallback: asset("Hot Air Balloon Ride3_1751127701686.jpg")
  },
  {
    id: 4,
    src: asset("Essaouira Day Trip1_1751124502666.jpg"),
    alt: "Essaouira Coastal Beauty",
    title: "Essaouira Day Trip",
    description: "Discover the coastal charm of this UNESCO World Heritage city",
    fallback: asset("Essaouira Day Trip2_1751122022833.jpg")
  },
  {
    id: 5,
    src: asset("Ouzoud-Waterfalls_1751126328233.jpg"),
    alt: "Ouzoud Waterfalls",
    title: "Ouzoud Waterfalls",
    description: "Spectacular cascades in the Atlas Mountains",
    fallback: asset("Ouzoud-Waterfalls3_1751126328233.jpg")
  },
  {
    id: 6,
    src: asset("Ourika Valley Day Trip1_1751114166831.jpg"),
    alt: "Ourika Valley Adventure",
    title: "Ourika Valley",
    description: "Mountain villages and traditional Berber culture",
    fallback: asset("ourika-valley-marrakech_1751114166832.jpg")
  }
];

export default function PhotoSlideshow() {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Auto-advance slideshow
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % galleryImages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const currentImage = galleryImages[currentIndex];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-playfair text-3xl md:text-4xl font-bold text-moroccan-blue mb-4">
            {t('galleryTitle')}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('gallerySubtitle')}
          </p>
          <div className="w-24 h-1 bg-moroccan-gold mx-auto mt-6" />
        </div>

        {/* Main Slideshow */}
        <Card className="relative overflow-hidden mb-8 bg-black">
          <CardContent className="p-0">
            <div className="relative h-[500px] md:h-[600px]">
              <img
                src={currentImage.src}
                alt={currentImage.alt}
                className="w-full h-full object-cover transition-opacity duration-500"
                onError={(e) => {
                  if (currentImage.fallback) {
                    e.currentTarget.src = currentImage.fallback;
                  }
                }}
              />
              
              {/* Overlay with image info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-8">
                <h3 className="font-playfair text-2xl md:text-3xl font-bold text-white mb-2">
                  {currentImage.title}
                </h3>
                <p className="text-gray-200 text-lg max-w-2xl">
                  {currentImage.description}
                </p>
              </div>

              {/* Navigation Arrows */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                onClick={prevSlide}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                onClick={nextSlide}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>

              {/* Play/Pause Button */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Thumbnail Navigation */}
        <div className="flex justify-center space-x-4 mb-8">
          {galleryImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => goToSlide(index)}
              className={`relative overflow-hidden rounded-lg transition-all duration-300 ${
                index === currentIndex 
                  ? 'ring-4 ring-moroccan-gold scale-110' 
                  : 'hover:scale-105 opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-20 h-16 object-cover"
                onError={(e) => {
                  if (image.fallback) {
                    e.currentTarget.src = image.fallback;
                  }
                }}
              />
            </button>
          ))}
        </div>

        {/* Progress Indicators */}
        <div className="flex justify-center space-x-2">
          {galleryImages.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'w-8 bg-moroccan-gold' 
                  : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Gallery Stats */}
        <div className="text-center mt-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-moroccan-blue mb-2">6</div>
              <div className="text-gray-600">Unique Destinations</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-moroccan-blue mb-2">1000+</div>
              <div className="text-gray-600">Happy Travelers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-moroccan-blue mb-2">5★</div>
              <div className="text-gray-600">Average Rating</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}