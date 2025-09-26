import { useQuery } from "@tanstack/react-query";
import { ActivityType } from "marrakechdunes-shared/schema";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ActivityCard from "@/components/activity-card";
import SEOHead, { seoConfigs } from "@/components/seo-head";
import { ensureArray } from "@/lib/ensureArray";

import { useLanguage } from "@/hooks/use-language";

export default function Activities() {
  const { t, language } = useLanguage();
  const seoConfig = seoConfigs.activities(language);
  const { data: activities = [], isLoading, error } = useQuery<ActivityType[]>({
    queryKey: ["/activities"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Retry up to 2 times for network errors
      return failureCount < 2;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
  const activityList = ensureArray(activities);

  return (
    <div className="min-h-screen bg-moroccan-sand">
      <SEOHead 
        title={seoConfig.title}
        description={seoConfig.description}
        keywords={seoConfig.keywords}
      />
      <Navbar />
      
      {/* Header Section */}
      <section className="bg-moroccan-blue text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-playfair text-4xl md:text-5xl font-bold mb-4">
            {t('activitiesTitle')}
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            {t('activitiesSubtitle')}
          </p>
          <div className="w-24 h-1 bg-moroccan-gold mx-auto mt-6" />
        </div>
      </section>

      {/* Activities Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {error ? (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg p-8">
                <div className="text-red-600 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-red-800 mb-4">Server Error</h3>
                <p className="text-red-700 mb-6">
                  We're having trouble loading our activities. Please try again later.
                </p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-4 animate-pulse">
                  <div className="bg-gray-300 h-64 w-full rounded-2xl" />
                  <div className="bg-gray-300 h-6 w-3/4 rounded" />
                  <div className="bg-gray-300 h-4 w-full rounded" />
                  <div className="bg-gray-300 h-4 w-2/3 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {activityList.map((activity: ActivityType) => (
                  <div key={activity._id} className="transform hover:scale-105 transition-transform duration-300">
                    <ActivityCard activity={activity} showDescription />
                  </div>
                ))}
              </div>
              
              {activityList.length === 0 && (
                <div className="text-center py-20">
                  <h3 className="text-2xl font-bold text-gray-600 mb-4">{t('noActivities')}</h3>
                  <p className="text-gray-500">{t('checkBackLater')}</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
