export interface Translation {
  [key: string]: string | Translation;
}

export const translations = {
  en: {
    nav: {
      home: "Home",
      activities: "Activities", 
      reviews: "Reviews",
      contact: "Contact",
      admin: "Admin",
      booking: "Booking"
    },
    hero: {
      title: "Discover Authentic Moroccan Adventures",
      subtitle: "Book unforgettable experiences across Morocco's most spectacular destinations",
      cta: "Explore Activities",
      trustBadge: "Trusted by 10,000+ travelers"
    },
    heroTitle: "Authentic Moroccan",
    heroTitleHighlight: "Adventures",
    heroSubtitle: "Book unforgettable experiences across Morocco's most spectacular destinations",
    bookAdventure: "Book Your Adventure",
    bookingSubtitle: "Reserve your authentic Moroccan experience with our expert guides",
    bookingDetails: "Booking Details",
    featuredTitle: "Featured Experiences",
    featuredSubtitle: "Discover our most popular Moroccan adventures",
    agencyIntroTitle: "Your Trusted Morocco Travel Partner",
    agencyIntroText: "MarrakechDunes specializes in authentic Moroccan experiences, from desert adventures to cultural tours. We create unforgettable memories across Morocco's most stunning destinations.",
    agencyDescription: "Experience the magic of Morocco with our carefully curated adventures",
    aboutTitle: "About MarrakechDunes",
    aboutText: "We are passionate about sharing Morocco's incredible beauty and rich culture with travelers from around the world.",
    galleryTitle: "Photo Gallery",
    gallerySubtitle: "Stunning moments from our adventures",
    visitOffice: "Visit Our Office",
    exploreActivities: "Explore Activities",
    bookNow: "Book Now",
    happyTravelers: "Happy Travelers",
    yearsExperience: "Years Experience",
    activitiesTitle: "Our Moroccan Adventures",
    activitiesSubtitle: "Discover authentic experiences across Morocco's most spectacular destinations",
    activities: {
      title: "Our Experiences",
      bookNow: "Book Now",
      duration: "Duration",
      category: "Category", 
      price: "Price",
      perPerson: "per person",
      viewDetails: "View Details & Book",
      available: "Available",
      soldOut: "Sold Out",
      change: "Change"
    },
    booking: {
      title: "Book Your Adventure",
      customerName: "Full Name",
      customerPhone: "Phone Number",
      email: "Email Address",
      phone: "Phone Number",
      numberOfPeople: "Number of People",
      preferredDate: "Preferred Date",
      preferredTime: "Preferred Time",
      notes: "Special Requests",
      submit: "Confirm Booking",
      success: "Booking confirmed! We'll contact you soon.",
      totalAmount: "Total Amount",
      selectActivity: "Select Activity",
      chooseActivity: "Choose Activity",
      selectDate: "Select Date",
      customerDetails: "Customer Details",
      confirmation: "Confirmation",
      next: "Next",
      previous: "Previous",
      participantNames: "Participant Names",
      selectNumberOfPeople: "Select number of people",
      person: "person",
      people: "people",
      personalInformation: "Personal Information",
      selectExperience: "Select Your Experience",
      bookingDetailsSection: "Booking Details"
    },
    reviews: {
      title: "Customer Reviews",
      writeReview: "Write a Review",
      rating: "Rating",
      verified: "Verified Booking",
      helpful: "Helpful",
      stars: "stars",
      submitReview: "Submit Review",
      comment: "Your Review"
    },
    footer: {
      about: "About MarrakechDunes",
      description: "Your gateway to authentic Moroccan adventures and desert experiences.",
      contact: "Contact Information",
      phone: "Phone",
      email: "Email",
      address: "Address",
      followUs: "Follow Us",
      rights: "All rights reserved"
    },
    admin: {
      adminAccess: "Admin Access",
      loginSubtitle: "Sign in to manage bookings and activities",
      username: "Username",
      password: "Password",
      signIn: "Sign In",
      signingIn: "Signing In...",
      dashboard: "Dashboard",
      loginSuccess: "Login successful",
      loginFailed: "Login failed",
      logout: "Logout",
      bookings: "Bookings",
      analytics: "Analytics",
      settings: "Settings"
    }
  },
  fr: {
    nav: {
      home: "Accueil",
      activities: "Activités",
      reviews: "Avis",
      contact: "Contact", 
      admin: "Admin",
      booking: "Réservation"
    },
    hero: {
      title: "Découvrez les Aventures Marocaines Authentiques",
      subtitle: "Réservez des expériences inoubliables dans les destinations les plus spectaculaires du Maroc",
      cta: "Explorer les Activités",
      trustBadge: "Approuvé par plus de 10 000 voyageurs"
    },
    heroTitle: "Aventures Marocaines",
    heroTitleHighlight: "Authentiques", 
    heroSubtitle: "Réservez des expériences inoubliables à travers les destinations les plus spectaculaires du Maroc",
    bookAdventure: "Réservez Votre Aventure",
    bookingSubtitle: "Réservez votre expérience marocaine authentique avec nos guides experts",
    bookingDetails: "Détails de Réservation",
    featuredTitle: "Expériences Vedettes",
    featuredSubtitle: "Découvrez nos aventures marocaines les plus populaires",
    agencyIntroTitle: "Votre Partenaire de Voyage de Confiance au Maroc",
    agencyIntroText: "MarrakechDunes se spécialise dans les expériences marocaines authentiques, des aventures du désert aux tours culturels. Nous créons des souvenirs inoubliables à travers les destinations les plus magnifiques du Maroc.",
    agencyDescription: "Vivez la magie du Maroc avec nos aventures soigneusement sélectionnées",
    aboutTitle: "À Propos de MarrakechDunes",
    aboutText: "Nous sommes passionnés par le partage de l'incroyable beauté et de la riche culture du Maroc avec les voyageurs du monde entier.",
    galleryTitle: "Galerie Photos",
    gallerySubtitle: "Moments magnifiques de nos aventures",
    visitOffice: "Visitez Notre Bureau",
    exploreActivities: "Explorer les Activités",
    bookNow: "Réserver Maintenant",
    happyTravelers: "Voyageurs Satisfaits",
    yearsExperience: "Années d'Expérience",
    activitiesTitle: "Nos Aventures Marocaines",
    activitiesSubtitle: "Découvrez des expériences authentiques à travers les destinations les plus spectaculaires du Maroc",
    activities: {
      title: "Nos Expériences",
      bookNow: "Réserver Maintenant",
      duration: "Durée",
      category: "Catégorie",
      price: "Prix",
      perPerson: "par personne",
      viewDetails: "Voir les Détails et Réserver",
      available: "Disponible",
      soldOut: "Complet",
      change: "Changer"
    },
    booking: {
      title: "Réservez Votre Aventure",
      customerName: "Nom Complet",
      customerPhone: "Numéro de Téléphone",
      email: "Adresse Email",
      phone: "Numéro de Téléphone",
      numberOfPeople: "Nombre de Personnes",
      preferredDate: "Date Préférée",
      preferredTime: "Heure Préférée",
      notes: "Demandes Spéciales",
      submit: "Confirmer la Réservation",
      success: "Réservation confirmée ! Nous vous contacterons bientôt.",
      totalAmount: "Montant Total",
      selectActivity: "Sélectionner l'Activité",
      chooseActivity: "Choisir une Activité",
      selectDate: "Sélectionner la Date",
      customerDetails: "Détails du Client",
      confirmation: "Confirmation",
      next: "Suivant",
      previous: "Précédent",
      participantNames: "Noms des Participants",
      selectNumberOfPeople: "Sélectionner le nombre de personnes",
      person: "personne",
      people: "personnes",
      personalInformation: "Informations Personnelles",
      selectExperience: "Sélectionnez Votre Expérience",
      bookingDetailsSection: "Détails de la Réservation"
    },
    reviews: {
      title: "Avis Clients",
      writeReview: "Écrire un Avis",
      rating: "Note",
      verified: "Réservation Vérifiée",
      helpful: "Utile",
      stars: "étoiles",
      submitReview: "Soumettre l'Avis",
      comment: "Votre Avis"
    },
    footer: {
      about: "À Propos de MarrakechDunes",
      description: "Votre porte d'entrée vers des aventures marocaines authentiques et des expériences désertiques.",
      contact: "Informations de Contact",
      phone: "Téléphone",
      email: "Email",
      address: "Adresse",
      followUs: "Suivez-Nous",
      rights: "Tous droits réservés"
    },
    admin: {
      adminAccess: "Accès Administrateur",
      loginSubtitle: "Connectez-vous pour gérer les réservations et activités",
      username: "Nom d'utilisateur",
      password: "Mot de passe",
      signIn: "Se Connecter",
      signingIn: "Connexion...",
      dashboard: "Tableau de Bord",
      loginSuccess: "Connexion réussie",
      loginFailed: "Échec de la connexion",
      logout: "Déconnexion",
      bookings: "Réservations",
      analytics: "Analyses",
      settings: "Paramètres"
    }
  }
};

export type Language = 'en' | 'fr';

export function getTranslation(lang: Language, key: string): string {
  const keys = key.split('.');
  let current: any = translations[lang];
  
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      // Fallback to English if translation not found
      current = translations.en;
      for (const fallbackKey of keys) {
        if (current && typeof current === 'object' && fallbackKey in current) {
          current = current[fallbackKey];
        } else {
          return key; // Return key if no translation found
        }
      }
      return current;
    }
  }
  
  return typeof current === 'string' ? current : key;
}