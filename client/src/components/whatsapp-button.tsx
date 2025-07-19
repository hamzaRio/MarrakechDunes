import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

interface WhatsAppButtonProps {
  name: string;
  role: string;
  phone: string;
}

export default function WhatsAppButton({ name, role, phone }: WhatsAppButtonProps) {
  const handleWhatsAppClick = () => {
    const message = `Hello ${name}, I'm interested in booking an activity with MarrakechDunes. Can you help me?`;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8 text-center hover:bg-opacity-20 transition-all duration-300">
      <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
        <MessageCircle className="text-3xl text-white" />
      </div>
      <h3 className="text-2xl font-bold mb-2">{name}</h3>
      <p className="text-blue-100 mb-4">{role}</p>
      <Button
        onClick={handleWhatsAppClick}
        className="bg-green-500 hover:bg-green-600 text-white w-full"
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        Chat with {name}
      </Button>
    </div>
  );
}
