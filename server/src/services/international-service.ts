import { cacheService } from './cache-service.js';
import { loggingService } from './logging-service.js';

export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl: boolean;
  currency: string;
  dateFormat: string;
  numberFormat: {
    decimal: string;
    thousands: string;
  };
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  rate: number; // Exchange rate to MAD
  precision: number;
}

export interface LocalizedContent {
  language: string;
  content: Record<string, any>;
  lastUpdated: Date;
  version: string;
}

export interface TranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  context?: string;
}

export interface TranslationResult {
  translatedText: string;
  confidence: number;
  sourceLanguage: string;
  targetLanguage: string;
  alternatives?: string[];
}

export class InternationalService {
  private supportedLanguages: LanguageConfig[] = [
    {
      code: 'fr',
      name: 'French',
      nativeName: 'Français',
      flag: '🇫🇷',
      rtl: false,
      currency: 'MAD',
      dateFormat: 'DD/MM/YYYY',
      numberFormat: { decimal: ',', thousands: ' ' }
    },
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇺🇸',
      rtl: false,
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      numberFormat: { decimal: '.', thousands: ',' }
    },
    {
      code: 'ar',
      name: 'Arabic',
      nativeName: 'العربية',
      flag: '🇲🇦',
      rtl: true,
      currency: 'MAD',
      dateFormat: 'DD/MM/YYYY',
      numberFormat: { decimal: ',', thousands: ' ' }
    },
    {
      code: 'es',
      name: 'Spanish',
      nativeName: 'Español',
      flag: '🇪🇸',
      rtl: false,
      currency: 'EUR',
      dateFormat: 'DD/MM/YYYY',
      numberFormat: { decimal: ',', thousands: ' ' }
    },
    {
      code: 'de',
      name: 'German',
      nativeName: 'Deutsch',
      flag: '🇩🇪',
      rtl: false,
      currency: 'EUR',
      dateFormat: 'DD.MM.YYYY',
      numberFormat: { decimal: ',', thousands: '.' }
    }
  ];

  private supportedCurrencies: CurrencyConfig[] = [
    { code: 'MAD', symbol: 'د.م.', name: 'Moroccan Dirham', rate: 1.0, precision: 2 },
    { code: 'USD', symbol: '$', name: 'US Dollar', rate: 0.1, precision: 2 },
    { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.09, precision: 2 },
    { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.08, precision: 2 },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 0.13, precision: 2 }
  ];

  private exchangeRates: Map<string, number> = new Map();

  constructor() {
    this.initializeExchangeRates();
  }

  private async initializeExchangeRates(): Promise<void> {
    try {
      // In a real implementation, this would fetch from an exchange rate API
      this.exchangeRates.set('USD', 0.1);
      this.exchangeRates.set('EUR', 0.09);
      this.exchangeRates.set('GBP', 0.08);
      this.exchangeRates.set('CAD', 0.13);
      
      loggingService.info('Exchange rates initialized');
    } catch (error) {
      loggingService.error('Failed to initialize exchange rates', error as Error, { 
        endpoint: 'international',
        method: 'GET',
        type: 'exchange_rate_error'
      });
    }
  }

  // Language management
  getSupportedLanguages(): LanguageConfig[] {
    return this.supportedLanguages;
  }

  getLanguageConfig(languageCode: string): LanguageConfig | null {
    return this.supportedLanguages.find(lang => lang.code === languageCode) || null;
  }

  async getLocalizedContent(languageCode: string): Promise<LocalizedContent | null> {
    try {
      const cacheKey = `localization:${languageCode}`;
      const cached = await cacheService.get<LocalizedContent>('localization', cacheKey);
      if (cached) {
        return cached;
      }

      // Load localization content
      const content = await this.loadLocalizationContent(languageCode);
      if (!content) {
        return null;
      }

      const localizedContent: LocalizedContent = {
        language: languageCode,
        content,
        lastUpdated: new Date(),
        version: '1.0.0'
      };

      // Cache the content
      await cacheService.set('localization', cacheKey, localizedContent, 3600);
      
      return localizedContent;
    } catch (error) {
      loggingService.error('Failed to get localized content', error as Error, { 
        endpoint: 'international',
        method: 'GET',
        type: 'localization_error'
      });
      return null;
    }
  }

  private async loadLocalizationContent(languageCode: string): Promise<Record<string, any> | null> {
    // This would typically load from files or database
    // For now, return mock content
    const mockContent = {
      nav: {
        home: languageCode === 'fr' ? 'Accueil' : 'Home',
        activities: languageCode === 'fr' ? 'Activités' : 'Activities',
        contact: languageCode === 'fr' ? 'Contact' : 'Contact'
      },
      common: {
        loading: languageCode === 'fr' ? 'Chargement...' : 'Loading...',
        error: languageCode === 'fr' ? 'Erreur' : 'Error',
        success: languageCode === 'fr' ? 'Succès' : 'Success'
      }
    };

    return mockContent;
  }

  // Currency management
  getSupportedCurrencies(): CurrencyConfig[] {
    return this.supportedCurrencies;
  }

  getCurrencyConfig(currencyCode: string): CurrencyConfig | null {
    return this.supportedCurrencies.find(currency => currency.code === currencyCode) || null;
  }

  async convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    try {
      if (fromCurrency === toCurrency) {
        return amount;
      }

      const cacheKey = `currency:${fromCurrency}:${toCurrency}`;
      const cached = await cacheService.get<number>('currency', cacheKey);
      if (cached) {
        return amount * cached;
      }

      // Get exchange rate
      const rate = await this.getExchangeRate(fromCurrency, toCurrency);
      const convertedAmount = amount * rate;

      // Cache the rate for 1 hour
      await cacheService.set('currency', cacheKey, rate, 3600);

      loggingService.info('Currency converted', {
        endpoint: 'currency',
        method: 'GET',
        type: 'currency_conversion',
        metric: 'conversion_success'
      });

      return convertedAmount;
    } catch (error) {
      loggingService.error('Currency conversion failed', error as Error, { 
        endpoint: 'currency',
        method: 'GET',
        type: 'currency_error'
      });
      return amount; // Return original amount on error
    }
  }

  private async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    // In a real implementation, this would fetch from an exchange rate API
    const rates: Record<string, Record<string, number>> = {
      'MAD': { 'USD': 0.1, 'EUR': 0.09, 'GBP': 0.08, 'CAD': 0.13 },
      'USD': { 'MAD': 10, 'EUR': 0.9, 'GBP': 0.8, 'CAD': 1.3 },
      'EUR': { 'MAD': 11.1, 'USD': 1.1, 'GBP': 0.89, 'CAD': 1.44 },
      'GBP': { 'MAD': 12.5, 'USD': 1.25, 'EUR': 1.12, 'CAD': 1.63 },
      'CAD': { 'MAD': 7.7, 'USD': 0.77, 'EUR': 0.69, 'GBP': 0.61 }
    };

    return rates[fromCurrency]?.[toCurrency] || 1;
  }

  formatCurrency(amount: number, currencyCode: string, languageCode: string = 'fr'): string {
    const currency = this.getCurrencyConfig(currencyCode);
    if (!currency) {
      return `${amount} ${currencyCode}`;
    }

    const language = this.getLanguageConfig(languageCode);
    if (!language) {
      return `${currency.symbol}${amount.toFixed(currency.precision)}`;
    }

    // Format based on language and currency
    const formattedAmount = new Intl.NumberFormat(languageCode, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: currency.precision,
      maximumFractionDigits: currency.precision
    }).format(amount);

    return formattedAmount;
  }

  // Translation service
  async translateText(request: TranslationRequest): Promise<TranslationResult> {
    try {
      const cacheKey = `translation:${request.sourceLanguage}:${request.targetLanguage}:${Buffer.from(request.text).toString('base64')}`;
      const cached = await cacheService.get<TranslationResult>('translation', cacheKey);
      if (cached) {
        return cached;
      }

      // In a real implementation, this would use a translation service like Google Translate
      const translatedText = await this.performTranslation(request);
      
      const result: TranslationResult = {
        translatedText,
        confidence: 0.85,
        sourceLanguage: request.sourceLanguage,
        targetLanguage: request.targetLanguage,
        alternatives: this.generateAlternatives(translatedText)
      };

      // Cache the translation
      await cacheService.set('translation', cacheKey, result, 86400); // 24 hours

      loggingService.info('Text translated', {
        endpoint: 'translation',
        method: 'POST',
        type: 'translation_success',
        metric: 'translation_count'
      });

      return result;
    } catch (error) {
      loggingService.error('Translation failed', error as Error, { 
        endpoint: 'translation',
        method: 'POST',
        type: 'translation_error'
      });
      return {
        translatedText: request.text,
        confidence: 0,
        sourceLanguage: request.sourceLanguage,
        targetLanguage: request.targetLanguage
      };
    }
  }

  private async performTranslation(request: TranslationRequest): Promise<string> {
    // Mock translation - in real implementation, use translation API
    const translations: Record<string, Record<string, string>> = {
      'fr': {
        'en': request.text, // Mock: return same text
        'ar': request.text,
        'es': request.text,
        'de': request.text
      },
      'en': {
        'fr': request.text,
        'ar': request.text,
        'es': request.text,
        'de': request.text
      }
    };

    return translations[request.sourceLanguage]?.[request.targetLanguage] || request.text;
  }

  private generateAlternatives(translatedText: string): string[] {
    // Mock alternatives - in real implementation, generate actual alternatives
    return [
      translatedText + ' (alternative 1)',
      translatedText + ' (alternative 2)'
    ];
  }

  // Date and time formatting
  formatDate(date: Date, languageCode: string = 'fr'): string {
    const language = this.getLanguageConfig(languageCode);
    if (!language) {
      return date.toLocaleDateString();
    }

    return new Intl.DateTimeFormat(languageCode, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }

  formatDateTime(date: Date, languageCode: string = 'fr'): string {
    const language = this.getLanguageConfig(languageCode);
    if (!language) {
      return date.toLocaleString();
    }

    return new Intl.DateTimeFormat(languageCode, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  // Number formatting
  formatNumber(number: number, languageCode: string = 'fr'): string {
    const language = this.getLanguageConfig(languageCode);
    if (!language) {
      return number.toString();
    }

    return new Intl.NumberFormat(languageCode, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(number);
  }

  // RTL support
  isRTLLanguage(languageCode: string): boolean {
    const language = this.getLanguageConfig(languageCode);
    return language?.rtl || false;
  }

  // Get user's preferred language from headers
  detectUserLanguage(acceptLanguageHeader: string): string {
    const languages = acceptLanguageHeader
      .split(',')
      .map(lang => lang.split(';')[0].trim())
      .map(lang => lang.split('-')[0]);

    for (const lang of languages) {
      if (this.supportedLanguages.some(supported => supported.code === lang)) {
        return lang;
      }
    }

    return 'fr'; // Default to French
  }

  // Analytics for international usage
  async getInternationalAnalytics(): Promise<{
    languageUsage: Array<{ language: string; users: number; percentage: number }>;
    currencyUsage: Array<{ currency: string; transactions: number; percentage: number }>;
    topCountries: Array<{ country: string; users: number; percentage: number }>;
  }> {
    // Mock analytics data
    return {
      languageUsage: [
        { language: 'fr', users: 1200, percentage: 60 },
        { language: 'en', users: 600, percentage: 30 },
        { language: 'ar', users: 200, percentage: 10 }
      ],
      currencyUsage: [
        { currency: 'MAD', transactions: 1500, percentage: 75 },
        { currency: 'USD', transactions: 300, percentage: 15 },
        { currency: 'EUR', transactions: 200, percentage: 10 }
      ],
      topCountries: [
        { country: 'Morocco', users: 800, percentage: 40 },
        { country: 'France', users: 400, percentage: 20 },
        { country: 'USA', users: 300, percentage: 15 },
        { country: 'Germany', users: 200, percentage: 10 },
        { country: 'Spain', users: 100, percentage: 5 }
      ]
    };
  }
}

export const internationalService = new InternationalService();
