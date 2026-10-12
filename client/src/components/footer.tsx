import { Instagram, Phone, MapPin, MessageCircle } from "lucide-react";
import { supportAddress, supportInstagramHandle, supportInstagramUrl, supportPhone, supportContacts } from "@/lib/support-config";

export default function Footer() {
  return (
    <footer className="bg-blue-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          {/* Contact Information */}
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8">
            {supportInstagramUrl && <div className="flex items-center group">
              <Instagram className="w-5 h-5 mr-3 text-moroccan-gold group-hover:scale-110 transition-transform" />
              <a 
                href={supportInstagramUrl}
                className="text-gray-200 hover:text-white transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                {supportInstagramHandle || "Instagram"}
              </a>
            </div>}
            
            {supportPhone && <div className="flex items-center group">
              <Phone className="w-5 h-5 mr-3 text-moroccan-gold group-hover:scale-110 transition-transform" />
              <a href={`tel:${supportPhone}`} className="text-gray-200 hover:text-white transition-colors">
                {supportPhone}
              </a>
            </div>}
            
            {supportAddress && <div className="flex items-center group">
              <MapPin className="w-5 h-5 mr-3 text-moroccan-gold group-hover:scale-110 transition-transform" />
              <span className="text-gray-200">{supportAddress}</span>
            </div>}
            
            {supportContacts[0] && <div className="flex items-center group">
              <MessageCircle className="w-5 h-5 mr-3 text-moroccan-gold group-hover:scale-110 transition-transform" />
              <a 
                href={`https://wa.me/${supportContacts[0].phone.replace(/\D/g, '')}`}
                className="text-gray-200 hover:text-white transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp Admin
              </a>
            </div>}
          </div>

          {/* Copyright */}
          <div className="text-center md:text-right">
            <p className="text-gray-300 font-light">
              &copy; 2024 MarrakechDunes. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
