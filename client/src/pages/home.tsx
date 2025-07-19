import { useQuery } from "@tanstack/react-query";
import type { ActivityType } from "@shared/schema";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ActivityCard from "@/components/activity-card";
import WhatsAppButton from "@/components/whatsapp-button";

import PhotoSlideshow from "@/components/photo-slideshow";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mountain, Star, Award, MapPin, Play, Calendar } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import riadKheirredineImg from "@assets/montgofliere_a_marrakech_1751127701687.jpg";
import marrakechPlazaImg from "@assets/montgolfiere-marrakech_1751127701687.jpg";

export default function Home() {
  const { data: activities = [], isLoading } = useQuery<ActivityType[]>({
    queryKey: ["/api/activities"],
  });
  const { t } = useLanguage();

  const featuredActivities = activities.slice(0, 3);

  return (
    <div className="min-h-screen bg-moroccan-sand">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${riadKheirredineImg})`,
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
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-moroccan-red hover:bg-moroccan-red text-white shadow-xl"
                onClick={() => window.location.href = '/booking'}
              >
                <Calendar className="w-5 h-5 mr-2" />
                {t('bookAdventure')}
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-2 border-white hover:bg-white hover:text-gray-900 text-white"
                onClick={() => {
                  // Create modal for video player
                  const modal = document.createElement('div');
                  modal.style.cssText = `
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.9); display: flex; align-items: center;
                    justify-content: center; z-index: 9999; padding: 20px;
                  `;
                  
                  const videoContainer = document.createElement('div');
                  videoContainer.style.cssText = `
                    position: relative; max-width: 90%; max-height: 90%;
                    background: black; border-radius: 8px; overflow: hidden;
                  `;
                  
                  const video = document.createElement('video');
                  video.src = '/assets/promo-video.mp4';
                  video.controls = true;
                  video.autoplay = true;
                  video.style.cssText = 'width: 100%; height: auto; max-height: 80vh;';
                  
                  const closeBtn = document.createElement('button');
                  closeBtn.innerHTML = '×';
                  closeBtn.style.cssText = `
                    position: absolute; top: 10px; right: 15px; color: white;
                    background: rgba(0,0,0,0.7); border: none; font-size: 24px;
                    width: 30px; height: 30px; border-radius: 50%; cursor: pointer;
                  `;
                  
                  // Handle video loading error
                  video.onerror = () => {
                    videoContainer.innerHTML = `
                      <div style="padding: 40px; color: white; text-align: center;">
                        <p>Video not found. Please upload promo-video.mp4 to the assets folder.</p>
                      </div>
                    `;
                  };
                  
                  closeBtn.onclick = () => document.body.removeChild(modal);
                  modal.onclick = (e) => {
                    if (e.target === modal) document.body.removeChild(modal);
                  };
                  
                  videoContainer.appendChild(video);
                  videoContainer.appendChild(closeBtn);
                  modal.appendChild(videoContainer);
                  document.body.appendChild(modal);
                }}
              >
                <Play className="w-5 h-5 mr-2" />
                {t('watchVideo')}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
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
                      <p className="text-gray-800 font-medium mb-4">54 Riad Zitoun Lakdim, Marrakech 40000</p>
                    </div>
                  </div>
                  
                  {/* Google Maps Embed */}
                  <div className="mt-4">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3396.5891234567!2d-7.989!3d31.6295!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzHCsDM3JzQ2LjIiTiA3wrA1OScyMC40Ilc!5e0!3m2!1sen!2sma!4v1234567890123"
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
            <div>
              <img
                src="https://images.unsplash.com/photo-1539650116574-75c0c6d73d16?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80"
                alt="Traditional Moroccan riad courtyard with ornate tilework"
                className="rounded-2xl shadow-xl w-full h-auto object-cover"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1564155219151-52b4159c8b55?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600";
                }}
              />
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
                    Our Expertise & Commitment
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-moroccan-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl text-moroccan-blue">🗺️</span>
                      </div>
                      <h4 className="text-xl font-semibold text-moroccan-blue mb-3">Local Expertise</h4>
                      <p className="text-gray-700">
                        Born and raised in Marrakech, our team possesses intimate knowledge of Morocco's hidden treasures, 
                        secret locations, and authentic cultural experiences that only locals can provide.
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="w-20 h-20 bg-moroccan-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl text-moroccan-gold">👥</span>
                      </div>
                      <h4 className="text-xl font-semibold text-moroccan-blue mb-3">Personalized Service</h4>
                      <p className="text-gray-700">
                        Every adventure is tailored to your preferences. We work closely with each traveler to create 
                        customized itineraries that match your interests, pace, and desired level of adventure.
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="w-20 h-20 bg-moroccan-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl text-moroccan-red">🛡️</span>
                      </div>
                      <h4 className="text-xl font-semibold text-moroccan-blue mb-3">Safety & Quality</h4>
                      <p className="text-gray-700">
                        Licensed guides, insured activities, and carefully maintained equipment ensure your safety. 
                        We maintain the highest standards while preserving the authentic Moroccan experience.
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="w-20 h-20 bg-moroccan-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl text-moroccan-blue">🌍</span>
                      </div>
                      <h4 className="text-xl font-semibold text-moroccan-blue mb-3">Sustainable Tourism</h4>
                      <p className="text-gray-700">
                        We partner with local communities and promote responsible travel practices that benefit 
                        Morocco's environment and support traditional Berber and Arab cultures.
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="w-20 h-20 bg-moroccan-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl text-moroccan-gold">⚡</span>
                      </div>
                      <h4 className="text-xl font-semibold text-moroccan-blue mb-3">Instant Booking</h4>
                      <p className="text-gray-700">
                        Our streamlined booking platform allows instant confirmations with direct WhatsApp communication 
                        to our guides for real-time updates and personalized assistance.
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="w-20 h-20 bg-moroccan-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl text-moroccan-red">💎</span>
                      </div>
                      <h4 className="text-xl font-semibold text-moroccan-blue mb-3">Premium Experience</h4>
                      <p className="text-gray-700">
                        From sunrise balloon flights to luxury desert camps, we curate premium experiences 
                        that showcase Morocco's diverse landscapes and rich cultural heritage.
                      </p>
                    </div>
                  </div>

                  <div className="mt-12 text-center">
                    <div className="bg-white/80 rounded-2xl p-6 shadow-lg">
                      <p className="text-lg text-gray-700 italic">
                        "At MarrakechDunes, we don't just show you Morocco – we invite you to live it. 
                        Every adventure is a bridge between cultures, every moment a memory that lasts a lifetime."
                      </p>
                      <p className="text-moroccan-blue font-semibold mt-4">— Our Team Promise</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Agency Mission & Values */}
          <div className="text-center mb-16">
            <h3 className="font-playfair text-3xl md:text-4xl font-bold text-moroccan-blue mb-6">
              Our Mission & Values
            </h3>
            <div className="max-w-4xl mx-auto">
              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                At MarrakechDunes, we believe in creating authentic connections between travelers and Morocco's rich cultural heritage. 
                Our mission is to provide seamless, personalized booking experiences that open doors to unforgettable adventures while 
                supporting local communities and preserving traditional Moroccan hospitality.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-moroccan-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-moroccan-blue">⭐</span>
                  </div>
                  <h4 className="font-semibold text-moroccan-blue mb-2">Authenticity</h4>
                  <p className="text-gray-600 text-sm">Genuine experiences with local guides who share their culture and traditions</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-moroccan-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-moroccan-gold">🤝</span>
                  </div>
                  <h4 className="font-semibold text-moroccan-blue mb-2">Trust</h4>
                  <p className="text-gray-600 text-sm">Transparent pricing, reliable service, and commitment to every booking</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-moroccan-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-moroccan-red">🏔️</span>
                  </div>
                  <h4 className="font-semibold text-moroccan-blue mb-2">Adventure</h4>
                  <p className="text-gray-600 text-sm">Curated experiences that showcase Morocco's diverse landscapes and culture</p>
                </div>
              </div>
            </div>
          </div>

          {/* Client Testimonials */}
          <div className="bg-moroccan-sand/20 rounded-3xl p-8 md:p-12 mb-16">
            <div className="text-center mb-12">
              <h3 className="font-playfair text-3xl md:text-4xl font-bold text-moroccan-blue mb-4">
                What Our Clients Say
              </h3>
              <p className="text-lg text-gray-600">
                Real experiences from travelers who trusted us with their Moroccan adventures
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-2xl shadow-lg">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-moroccan-blue to-blue-600 flex items-center justify-center mr-4">
                    <span className="text-white font-semibold text-lg">SM</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-moroccan-blue">Sarah M.</h4>
                    <p className="text-sm text-gray-500">United Kingdom</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">
                  "The hot air balloon experience was absolutely magical! The booking process was seamless and our guide was incredibly knowledgeable. Highly recommend MarrakechDunes!"
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
                    <h4 className="font-semibold text-moroccan-blue">Ahmed K.</h4>
                    <p className="text-sm text-gray-500">France</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">
                  "Perfect organization for our Essaouira day trip. The coastal views were stunning and we learned so much about Moroccan history. Professional service from start to finish."
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
                    <h4 className="font-semibold text-moroccan-blue">Maria L.</h4>
                    <p className="text-sm text-gray-500">Spain</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">
                  "The Agafay Desert experience exceeded all expectations. Authentic Berber hospitality, stunning landscapes, and memories for a lifetime. Thank you MarrakechDunes!"
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
              Our Most Popular Adventures
            </h3>
            <p className="text-lg text-gray-600 mb-12">
              Discover the experiences that captivate travelers from around the world
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="group cursor-pointer" onClick={() => window.location.href = '/activities'}>
                <div className="relative overflow-hidden rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <img
                    src="/assets/hot-air-balloon1.jpg"
                    alt="Hot Air Balloon Adventure"
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/assets/montgolfiere-1.jpg";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h4 className="text-xl font-playfair font-bold">Hot Air Balloon</h4>
                    <p className="text-sm opacity-90">Sunrise Over Atlas Mountains</p>
                  </div>
                </div>
              </div>

              <div className="group cursor-pointer" onClick={() => window.location.href = '/activities'}>
                <div className="relative overflow-hidden rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <img
                    src="/assets/agafay-1.jpg"
                    alt="Agafay Desert Experience"
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/assets/agafay-2.jpg";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h4 className="text-xl font-playfair font-bold">Agafay Desert</h4>
                    <p className="text-sm opacity-90">Ultimate Desert Adventure</p>
                  </div>
                </div>
              </div>

              <div className="group cursor-pointer" onClick={() => window.location.href = '/activities'}>
                <div className="relative overflow-hidden rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <img
                    src="/assets/essaouira-trip1.jpg"
                    alt="Essaouira Coastal Adventure"
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/assets/essaouira-1.jpg";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h4 className="text-xl font-playfair font-bold">Essaouira</h4>
                    <p className="text-sm opacity-90">Atlantic Coast Discovery</p>
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
                View All Activities
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
                style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>Ready to Book Your Adventure?</h2>
            <p className="text-xl text-white font-semibold" 
               style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>Contact our expert guides directly via WhatsApp</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <WhatsAppButton
              name="Ahmed"
              role="Desert Specialist"
              phone="+212600623630"
            />
            <WhatsAppButton
              name="Yahia"
              role="Mountain Guide"
              phone="+212693323368"
            />
            <WhatsAppButton
              name="Nadia"
              role="Cultural Expert"
              phone="+212654497354"
            />
          </div>
        </div>
      </section>



      <Footer />
    </div>
  );
}
