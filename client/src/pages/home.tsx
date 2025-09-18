
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import WhatsAppButton from "@/components/whatsapp-button";
import PhotoSlideshow from "@/components/photo-slideshow";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Award, MapPin, Calendar } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { asset } from "@/lib/env";
// Single hero background image - force refresh
const heroBackgroundImage = asset("riad-kheirredine_1756041288677.jpg");

export default function Home() {
  const { t } = useLanguage();



  return (
    <div className="min-h-screen bg-moroccan-sand">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${heroBackgroundImage})`,
          }}
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex items-center justify-center h-full text-center text-white px-4">
          <div className="max-w-4xl">
            <h1 className="font-playfair text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight text-white" 
                style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.8), 1px 1px 3px rgba(0,0,0,0.6)' }}>
              {t('heroTitle')}
              <span className="text-moroccan-gold font-black"> {t('heroTitleHighlight')}</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white max-w-2xl mx-auto font-semibold" 
               style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8), 1px 1px 2px rgba(0,0,0,0.6)' }}>
              {t('heroSubtitle')}
            </p>
            <div className="flex justify-center">
              <Button 
                size="lg" 
                className="bg-moroccan-red hover:bg-moroccan-red text-white shadow-xl"
                onClick={() => window.location.href = '/booking'}
              >
                <Calendar className="w-5 h-5 mr-2" />
                {t('bookAdventure')}
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 moroccan-pattern h-20 bg-repeat-x" />
      </section>

      {/* Photo Slideshow Section */}
      <PhotoSlideshow />

      {/* Agency Description */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-moroccan-sand/30 rounded-3xl p-8 md:p-12">
            <div className="max-w-4xl mx-auto text-center">
              <h3 className="font-playfair text-3xl md:text-4xl font-black text-gray-900 mb-6">
                {t('agencyIntroTitle')}
              </h3>
              <p className="text-lg text-gray-800 font-medium leading-relaxed mb-8">
                {t('agencyDescription')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg"
                  className="bg-moroccan-red hover:bg-red-600 text-white px-8 py-3"
                  onClick={() => window.location.href = '/activities'}
                >
                  {t('exploreActivities')}
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-moroccan-blue text-moroccan-blue hover:bg-moroccan-blue hover:text-white px-8 py-3"
                  onClick={() => window.location.href = '/booking'}
                >
                  {t('bookNow')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-moroccan-sand">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div>
              <h2 className="font-playfair text-4xl font-black text-gray-900 mb-6">
                {t('aboutTitle')}
              </h2>
              <p className="text-lg text-gray-800 font-medium mb-6">
                {t('aboutText')}
              </p>
              <Card className="mb-6 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start mb-4">
                    <MapPin className="text-moroccan-red text-xl mr-4 mt-1" />
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">{t('visitOffice')}</h4>
                      <p className="text-gray-800 font-medium mb-4">{t('home.office.address')}</p>
                    </div>
                  </div>
                  
                  {/* Google Maps Embed */}
                  <div className="mt-4">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3396.540!2d-7.9898!3d31.6295!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xdafee8d96179e51%3A0x5950b6534f87adb8!2sMarrakech%2C%20Morocco!5e0!3m2!1sen!2sma!4v1647875432123"
                      width="100%"
                      height="250"
                      style={{ border: 0, borderRadius: '8px' }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="MarrakechDeserts Location"
                      className="shadow-md"
                    ></iframe>
                  </div>
                </CardContent>
              </Card>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center text-moroccan-blue">
                  <Star className="text-moroccan-gold mr-2" />
                  <span className="font-semibold">500+ {t('happyTravelers')}</span>
                </div>
                <div className="flex items-center text-moroccan-blue">
                  <Award className="text-moroccan-gold mr-2" />
                  <span className="font-semibold">15 {t('yearsExperience')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Aventures Vedettes */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-playfair font-bold text-moroccan-blue mb-6">
              {t('featuredTitle')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              {t('featuredSubtitle')}
            </p>
            <div className="w-24 h-1 bg-moroccan-gold mx-auto mb-12" />
            
            {/* Agency Introduction */}
            <div className="bg-moroccan-sand/30 rounded-2xl p-8 mb-16">
              <div className="max-w-4xl mx-auto">
                <h3 className="text-2xl font-playfair font-bold text-moroccan-blue mb-4">
                  {t('agencyIntroTitle')}
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed">
                  {t('agencyIntroText')}
                </p>
              </div>
            </div>
            
            {/* Agency Expertise & Services */}
            <div className="mb-16">
              <div className="bg-gradient-to-br from-moroccan-blue/5 to-moroccan-sand/20 rounded-3xl p-8 md:p-12">
                <div className="max-w-5xl mx-auto">
                  <h3 className="text-3xl font-playfair font-bold text-moroccan-blue mb-8 text-center">
                    {t('home.expertise.title')}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-moroccan-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl text-moroccan-blue">🗺️</span>
                      </div>
                      <h4 className="text-xl font-semibold text-moroccan-blue mb-3">{t('home.expertise.items.localExpertise.title')}</h4>
                      <p className="text-gray-700">
                        {t('home.expertise.items.localExpertise.description')}
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="w-20 h-20 bg-moroccan-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl text-moroccan-gold">👥</span>
                      </div>
                      <h4 className="text-xl font-semibold text-moroccan-blue mb-3">{t('home.expertise.items.personalizedService.title')}</h4>
                      <p className="text-gray-700">
                        {t('home.expertise.items.personalizedService.description')}
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="w-20 h-20 bg-moroccan-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl text-moroccan-red">🛡️</span>
                      </div>
                      <h4 className="text-xl font-semibold text-moroccan-blue mb-3">{t('home.expertise.items.safetyQuality.title')}</h4>
                      <p className="text-gray-700">
                        {t('home.expertise.items.safetyQuality.description')}
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="w-20 h-20 bg-moroccan-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl text-moroccan-blue">🌍</span>
                      </div>
                      <h4 className="text-xl font-semibold text-moroccan-blue mb-3">{t('home.expertise.items.sustainableTourism.title')}</h4>
                      <p className="text-gray-700">
                        {t('home.expertise.items.sustainableTourism.description')}
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="w-20 h-20 bg-moroccan-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl text-moroccan-gold">⚡</span>
                      </div>
                      <h4 className="text-xl font-semibold text-moroccan-blue mb-3">{t('home.expertise.items.instantBooking.title')}</h4>
                      <p className="text-gray-700">
                        {t('home.expertise.items.instantBooking.description')}
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="w-20 h-20 bg-moroccan-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl text-moroccan-red">💎</span>
                      </div>
                      <h4 className="text-xl font-semibold text-moroccan-blue mb-3">{t('home.expertise.items.premiumExperience.title')}</h4>
                      <p className="text-gray-700">
                        {t('home.expertise.items.premiumExperience.description')}
                      </p>
                    </div>
                  </div>

                  <div className="mt-12 text-center">
                    <div className="bg-white/80 rounded-2xl p-6 shadow-lg">
                      <p className="text-lg text-gray-700 italic">
                        {t('home.quote.text')}
                      </p>
                      <p className="text-moroccan-blue font-semibold mt-4">{t('home.quote.signature')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Agency Mission & Values */}
          <div className="text-center mb-16">
            <h3 className="font-playfair text-3xl md:text-4xl font-bold text-moroccan-blue mb-6">
              {t('home.mission.title')}
            </h3>
            <div className="max-w-4xl mx-auto">
              <p className="text-lg text-gray-700 leading-relaxed mb-8">{t('home.mission.description')}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-moroccan-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-moroccan-blue">⭐</span>
                  </div>
                  <h4 className="font-semibold text-moroccan-blue mb-2">{t('home.mission.values.authenticity.title')}</h4>
                  <p className="text-gray-600 text-sm">{t('home.mission.values.authenticity.description')}</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-moroccan-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-moroccan-gold">🤝</span>
                  </div>
                  <h4 className="font-semibold text-moroccan-blue mb-2">{t('home.mission.values.trust.title')}</h4>
                  <p className="text-gray-600 text-sm">{t('home.mission.values.trust.description')}</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-moroccan-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-moroccan-red">🏔️</span>
                  </div>
                  <h4 className="font-semibold text-moroccan-blue mb-2">{t('home.mission.values.adventure.title')}</h4>
                  <p className="text-gray-600 text-sm">{t('home.mission.values.adventure.description')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Client Testimonials */}
          <div className="bg-moroccan-sand/20 rounded-3xl p-8 md:p-12 mb-16">
            <div className="text-center mb-12">
              <h3 className="font-playfair text-3xl md:text-4xl font-bold text-moroccan-blue mb-4">
                {t('home.testimonials.title')}
              </h3>
              <p className="text-lg text-gray-600">
                {t('home.testimonials.subtitle')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-2xl shadow-lg">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-moroccan-blue to-blue-600 flex items-center justify-center mr-4">
                    <span className="text-white font-semibold text-lg">SM</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-moroccan-blue">{t('home.testimonials.items.sarah.name')}</h4>
                    <p className="text-sm text-gray-500">{t('home.testimonials.items.sarah.country')}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">
                  {t('home.testimonials.items.sarah.quote')}
                </p>
                <div className="flex mt-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">⭐</span>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-moroccan-gold to-yellow-600 flex items-center justify-center mr-4">
                    <span className="text-white font-semibold text-lg">AK</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-moroccan-blue">{t('home.testimonials.items.ahmed.name')}</h4>
                    <p className="text-sm text-gray-500">{t('home.testimonials.items.ahmed.country')}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">
                  {t('home.testimonials.items.ahmed.quote')}
                </p>
                <div className="flex mt-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">⭐</span>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-moroccan-red to-red-600 flex items-center justify-center mr-4">
                    <span className="text-white font-semibold text-lg">ML</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-moroccan-blue">{t('home.testimonials.items.maria.name')}</h4>
                    <p className="text-sm text-gray-500">{t('home.testimonials.items.maria.country')}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">
                  {t('home.testimonials.items.maria.quote')}
                </p>
                <div className="flex mt-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">⭐</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Top Activities Highlight */}
          <div className="text-center mb-16">
            <h3 className="font-playfair text-3xl md:text-4xl font-bold text-moroccan-blue mb-6">
              {t('home.popular.title')}
            </h3>
            <p className="text-lg text-gray-600 mb-12">
              {t('home.popular.subtitle')}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="group cursor-pointer" onClick={() => window.location.href = '/activities'}>
                <div className="relative overflow-hidden rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <img
                    src={asset("Hot Air Balloon Ride2_1751127701686.jpg")}
                    alt={t('home.popular.cards.balloon.alt')}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = asset("montgofliere_a_marrakech_1751127701687.jpg");
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h4 className="text-xl font-playfair font-bold">{t('home.popular.cards.balloon.title')}</h4>
                    <p className="text-sm opacity-90">{t('home.popular.cards.balloon.subtitle')}</p>
                  </div>
                </div>
              </div>

              <div className="group cursor-pointer" onClick={() => window.location.href = '/activities'}>
                <div className="relative overflow-hidden rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <img
                    src={asset("agafaypack1_1751128022717.jpeg")}
                    alt={t('home.popular.cards.agafay.alt')}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = asset("agafaypack2_1751128022717.jpeg");
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h4 className="text-xl font-playfair font-bold">{t('home.popular.cards.agafay.title')}</h4>
                    <p className="text-sm opacity-90">{t('home.popular.cards.agafay.subtitle')}</p>
                  </div>
                </div>
              </div>

              <div className="group cursor-pointer" onClick={() => window.location.href = '/activities'}>
                <div className="relative overflow-hidden rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <img
                    src={asset("Essaouira Day Trip1_1751124502666.jpg")}
                    alt={t('home.popular.cards.essaouira.alt')}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = asset("Essaouira day trip 3_1751122022832.jpg");
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h4 className="text-xl font-playfair font-bold">{t('home.popular.cards.essaouira.title')}</h4>
                    <p className="text-sm opacity-90">{t('home.popular.cards.essaouira.subtitle')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Button
                size="lg"
                className="bg-moroccan-blue hover:bg-moroccan-blue/90 text-white px-8 py-3"
                onClick={() => window.location.href = '/activities'}
              >
                {t('home.viewAllActivities')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* WhatsApp Contact Section */}
      <section className="py-20 bg-moroccan-blue text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-playfair text-4xl font-black mb-4 text-white" 
                style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>{t('home.readyTitle')}</h2>
            <p className="text-xl text-white font-semibold" 
               style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>{t('home.readySubtitle')}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <WhatsAppButton
              name="Ahmed"
              role={t('home.whatsapp.roles.desertSpecialist')}
              phone="+212600623630"
            />
            <WhatsAppButton
              name="Yahia"
              role={t('home.whatsapp.roles.mountainGuide')}
              phone="+212693323368"
            />
            <WhatsAppButton
              name="Nadia"
              role={t('home.whatsapp.roles.culturalExpert')}
              phone="+212654497354"
            />
          </div>
        </div>
      </section>



      <Footer />
    </div>
  );
}
