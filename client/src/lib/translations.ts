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
      admin: "Admin"
    },
    hero: {
      title: "Discover Authentic Moroccan Adventures",
      subtitle: "Book unforgettable experiences across Morocco's most spectacular destinations",
      cta: "Explore Activities",
      trustBadge: "Trusted by 10,000+ travelers"
    },
    heroTitle: "Authentic Moroccan",
    heroTitleHighlight: "Adventures",
    heroSubtitle: "Réservez des expériences inoubliables à travers les destinations les plus spectaculaires du Maroc",
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
      viewDetails: "View Details",
      available: "Available",
      soldOut: "Sold Out"
    },
    booking: {
      title: "Book Your Adventure",
      customerName: "Full Name",
      phone: "Phone Number",
      numberOfPeople: "Number of People",
      preferredDate: "Preferred Date",
      preferredTime: "Preferred Time",
      notes: "Special Requests",
      submit: "Confirm Booking",
      success: "Booking confirmed! We'll contact you soon.",
      totalAmount: "Total Amount"
    },
    reviews: {
      title: "Customer Reviews",
      writeReview: "Write a Review",
      rating: "Rating",
      verified: "Verified Booking",
      helpful: "Helpful",
      stars: "stars"
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
      loginFailed: "Login failed"
    }
  },
  fr: {
    nav: {
      home: "Accueil",
      activities: "Activités",
      reviews: "Avis",
      contact: "Contact", 
      admin: "Admin"
    },
    hero: {
      title: "Découvrez les Aventures Marocaines Authentiques",
      subtitle: "Réservez des expériences inoubliables dans les destinations les plus spectaculaires du Maroc",
      cta: "Explorer les Activités",
      trustBadge: "Approuvé par plus de 10 000 voyageurs"
    },
    activities: {
      title: "Nos Expériences",
      bookNow: "Réserver Maintenant",
      duration: "Durée",
      category: "Catégorie",
      price: "Prix",
      perPerson: "par personne",
      viewDetails: "Voir les Détails",
      available: "Disponible",
      soldOut: "Complet"
    },
    booking: {
      title: "Réservez Votre Aventure",
      customerName: "Nom Complet",
      phone: "Numéro de Téléphone",
      numberOfPeople: "Nombre de Personnes",
      preferredDate: "Date Préférée",
      preferredTime: "Heure Préférée",
      notes: "Demandes Spéciales",
      submit: "Confirmer la Réservation",
      success: "Réservation confirmée ! Nous vous contacterons bientôt.",
      totalAmount: "Montant Total"
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
    reviews: {
      title: "Avis Clients",
      writeReview: "Écrire un Avis",
      rating: "Note",
      verified: "Réservation Vérifiée",
      helpful: "Utile",
      stars: "étoiles"
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
      loginFailed: "Échec de la connexion"
    }
  },
  ar: {
    nav: {
      home: "الرئيسية",
      activities: "الأنشطة",
      reviews: "التقييمات",
      contact: "اتصل بنا",
      admin: "الإدارة"
    },
    hero: {
      title: "اكتشف المغامرات المغربية الأصيلة",
      subtitle: "احجز تجارب لا تُنسى في أروع وجهات المغرب",
      cta: "استكشف الأنشطة",
      trustBadge: "موثوق من قبل أكثر من 10,000 مسافر"
    },
    activities: {
      title: "تجاربنا",
      bookNow: "احجز الآن",
      duration: "المدة",
      category: "الفئة",
      price: "السعر",
      perPerson: "للشخص الواحد",
      viewDetails: "عرض التفاصيل",
      available: "متاح",
      soldOut: "مكتمل"
    },
    booking: {
      title: "احجز مغامرتك",
      customerName: "الاسم الكامل",
      phone: "رقم الهاتف",
      numberOfPeople: "عدد الأشخاص",
      preferredDate: "التاريخ المفضل",
      preferredTime: "الوقت المفضل",
      notes: "طلبات خاصة",
      submit: "تأكيد الحجز",
      success: "تم تأكيد الحجز! سنتواصل معك قريباً.",
      totalAmount: "المبلغ الإجمالي"
    },
    reviews: {
      title: "تقييمات العملاء",
      writeReview: "اكتب تقييماً",
      rating: "التقييم",
      verified: "حجز موثق",
      helpful: "مفيد",
      stars: "نجوم"
    },
    footer: {
      about: "حول مراكش الكثبان",
      description: "بوابتك إلى المغامرات المغربية الأصيلة وتجارب الصحراء.",
      contact: "معلومات الاتصال",
      phone: "الهاتف",
      email: "البريد الإلكتروني",
      address: "العنوان",
      followUs: "تابعنا",
      rights: "جميع الحقوق محفوظة"
    }
  }
};

export type Language = 'en' | 'fr' | 'ar';

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