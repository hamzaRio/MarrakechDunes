import { Instagram, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-blue-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          {/* Contact Information */}
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8">
            <div className="flex items-center group">
              <Instagram className="w-5 h-5 mr-3 text-moroccan-gold group-hover:scale-110 transition-transform" />
              <a 
                href="https://www.instagram.com/medina_expeditions" 
                className="text-gray-200 hover:text-white transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                @medina_expeditions
              </a>
            </div>
            
            <div className="flex items-center group">
              <Phone className="w-5 h-5 mr-3 text-moroccan-gold group-hover:scale-110 transition-transform" />
              <a href="tel:+212600623630" className="text-gray-200 hover:text-white transition-colors">
                +212 600 623 630
              </a>
            </div>
            
            <div className="flex items-center group">
              <MapPin className="w-5 h-5 mr-3 text-moroccan-gold group-hover:scale-110 transition-transform" />
              <span className="text-gray-200">54 Riad Zitoun Lakdim, Marrakech 40000</span>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center md:text-right">
            <p className="text-gray-300 font-light">
              © 2024 MarrakechDunes. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
