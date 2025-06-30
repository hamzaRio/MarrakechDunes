import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Star, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/hooks/useLanguage';

interface WelcomeAnimationProps {
  show: boolean;
  isReturningUser: boolean;
  visitCount?: number;
  lastVisit?: string;
  onDismiss: () => void;
}

export default function WelcomeAnimation({
  show,
  isReturningUser,
  visitCount = 1,
  lastVisit,
  onDismiss
}: WelcomeAnimationProps) {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (show) {
      // Auto-advance through animation steps
      const timer = setTimeout(() => {
        if (currentStep < 2) {
          setCurrentStep(currentStep + 1);
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [show, currentStep]);

  const getWelcomeMessage = () => {
    if (isReturningUser) {
      if (visitCount >= 5) {
        return {
          title: t('welcomeBackFrequent') || 'Welcome back, adventurer!',
          subtitle: t('frequentVisitorMessage') || `Your ${visitCount} visits show your love for Moroccan adventures!`,
          icon: <Heart className="w-8 h-8 text-moroccan-red" />
        };
      } else {
        return {
          title: t('welcomeBackReturning') || 'Welcome back!',
          subtitle: t('returningVisitorMessage') || `Great to see you again! Visit #${visitCount}`,
          icon: <Star className="w-8 h-8 text-moroccan-gold" />
        };
      }
    } else {
      return {
        title: t('welcomeFirstTime') || 'Welcome to MarrakechDunes!',
        subtitle: t('firstTimeMessage') || 'Discover authentic Moroccan adventures',
        icon: <MapPin className="w-8 h-8 text-moroccan-blue" />
      };
    }
  };

  const welcomeData = getWelcomeMessage();

  const formatLastVisit = (lastVisit: string) => {
    const lastVisitDate = new Date(lastVisit);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastVisitDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onDismiss}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 25,
              delay: 0.1 
            }}
            className="relative max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="overflow-hidden shadow-2xl border-2 border-moroccan-gold/20">
              <CardContent className="p-0">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div 
                    className="w-full h-full"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4af37' fill-opacity='0.4'%3E%3Cpath d='M30 30c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                      backgroundSize: '60px 60px'
                    }}
                  />
                </div>

                {/* Content */}
                <div className="relative bg-gradient-to-br from-moroccan-sand to-white p-8 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                    onClick={onDismiss}
                  >
                    <X className="w-4 h-4" />
                  </Button>

                  {/* Animation Steps */}
                  <AnimatePresence mode="wait">
                    {currentStep === 0 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                      >
                        <motion.div
                          animate={{ 
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0]
                          }}
                          transition={{ 
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className="mb-4"
                        >
                          {welcomeData.icon}
                        </motion.div>
                        
                        <motion.h2 
                          className="font-playfair text-2xl font-black text-gray-900 mb-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          {welcomeData.title}
                        </motion.h2>
                        
                        <motion.p 
                          className="text-gray-700 font-medium"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.6 }}
                        >
                          {welcomeData.subtitle}
                        </motion.p>
                      </motion.div>
                    )}

                    {currentStep === 1 && isReturningUser && lastVisit && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                      >
                        <div className="mb-4">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, ease: "linear" }}
                          >
                            <Star className="w-8 h-8 text-moroccan-gold mx-auto" />
                          </motion.div>
                        </div>
                        
                        <h3 className="font-playfair text-xl font-bold text-gray-900 mb-2">
                          {t('lastVisitMessage') || 'Your Last Adventure'}
                        </h3>
                        
                        <p className="text-gray-700 font-medium">
                          {t('visitedAgo') || 'You explored with us'} {formatLastVisit(lastVisit)}
                        </p>
                      </motion.div>
                    )}

                    {currentStep === 2 && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                      >
                        <div className="mb-6">
                          <motion.div
                            animate={{ 
                              scale: [1, 1.2, 1],
                            }}
                            transition={{ 
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          >
                            <MapPin className="w-8 h-8 text-moroccan-blue mx-auto" />
                          </motion.div>
                        </div>
                        
                        <h3 className="font-playfair text-xl font-bold text-gray-900 mb-4">
                          {isReturningUser 
                            ? (t('readyForNextAdventure') || 'Ready for your next adventure?')
                            : (t('startYourJourney') || 'Start your Moroccan journey!')
                          }
                        </h3>
                        
                        <div className="space-y-3">
                          <Button
                            className="w-full bg-moroccan-red hover:bg-red-600 text-white font-semibold"
                            onClick={() => {
                              window.location.href = '/activities';
                              onDismiss();
                            }}
                          >
                            {t('exploreActivities') || 'Explore Activities'}
                          </Button>
                          
                          <Button
                            variant="outline"
                            className="w-full border-moroccan-blue text-moroccan-blue hover:bg-moroccan-blue hover:text-white"
                            onClick={onDismiss}
                          >
                            {t('continueExploring') || 'Continue Exploring'}
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Progress Dots */}
                  <div className="flex justify-center space-x-2 mt-6">
                    {[0, 1, 2].map((step) => (
                      <motion.div
                        key={step}
                        className={`w-2 h-2 rounded-full ${
                          step <= currentStep ? 'bg-moroccan-gold' : 'bg-gray-300'
                        }`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: step * 0.1 }}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}