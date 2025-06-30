import { useState, useEffect } from 'react';

interface UserVisitData {
  firstVisit: string;
  lastVisit: string;
  visitCount: number;
  preferredLanguage?: string;
  favoriteActivities?: string[];
}

export function useWelcomeAnimation() {
  const [showWelcome, setShowWelcome] = useState(false);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [userVisitData, setUserVisitData] = useState<UserVisitData | null>(null);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    const checkUserVisit = () => {
      const storedData = localStorage.getItem('marrakechDunesUserData');
      const currentTime = new Date().toISOString();

      if (storedData) {
        // Returning user
        const userData: UserVisitData = JSON.parse(storedData);
        const updatedData = {
          ...userData,
          lastVisit: currentTime,
          visitCount: userData.visitCount + 1
        };

        localStorage.setItem('marrakechDunesUserData', JSON.stringify(updatedData));
        setUserVisitData(updatedData);
        setIsReturningUser(true);
        
        // Show welcome animation for returning users
        setTimeout(() => setShowWelcome(true), 500);
      } else {
        // First-time user
        const newUserData: UserVisitData = {
          firstVisit: currentTime,
          lastVisit: currentTime,
          visitCount: 1
        };

        localStorage.setItem('marrakechDunesUserData', JSON.stringify(newUserData));
        setUserVisitData(newUserData);
        setIsReturningUser(false);
        
        // Show welcome animation for new users
        setTimeout(() => setShowWelcome(true), 1000);
      }
    };

    checkUserVisit();
  }, []);

  const dismissWelcome = () => {
    setShowWelcome(false);
    setTimeout(() => setAnimationComplete(true), 500);
  };

  const updateUserPreferences = (preferences: Partial<UserVisitData>) => {
    if (userVisitData) {
      const updatedData = { ...userVisitData, ...preferences };
      localStorage.setItem('marrakechDunesUserData', JSON.stringify(updatedData));
      setUserVisitData(updatedData);
    }
  };

  return {
    showWelcome,
    isReturningUser,
    userVisitData,
    animationComplete,
    dismissWelcome,
    updateUserPreferences
  };
}