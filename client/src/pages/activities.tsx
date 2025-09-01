import { useQuery } from "@tanstack/react-query";
import { ActivityType } from "@shared/schema";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ActivityCard from "@/components/activity-card";

import { useLanguage } from "@/hooks/useLanguage";

export default function Activities() {
  const { t } = useLanguage();
  const { data: activities = [], isLoading } = useQuery<ActivityType[]>({
    queryKey: ["/api/activities"],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  return (
    <div className="min-h-screen bg-moroccan-sand">
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
          {isLoading ? (
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
                {activities.map((activity: ActivityType) => (
                  <div key={activity._id} className="transform hover:scale-105 transition-transform duration-300">
                    <ActivityCard activity={activity} showDescription />
                  </div>
                ))}
              </div>
              
              {activities.length === 0 && (
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
