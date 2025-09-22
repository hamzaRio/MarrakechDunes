import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import MapView from "@/components/MapView";
import WhatsAppButton from "@/components/whatsapp-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MapPin, Phone } from "lucide-react";

export default function Contact() {
  return (
    <div className="flex min-h-screen flex-col bg-moroccan-sand">
      <Navbar />

      <main className="flex-1">
        <section className="bg-white py-16">
          <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 md:flex-row md:px-8">
            <div className="flex-1 space-y-6">
              <header>
                <h1 className="font-playfair text-4xl font-black text-moroccan-blue md:text-5xl">
                  Visit Marrakech Dunes
                </h1>
                <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
                  We would love to meet you in person or help you craft an unforgettable Moroccan adventure. Find us in the heart of Marrakech or reach out through the channels below.
                </p>
              </header>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-moroccan-blue">
                    <MapPin className="mr-2 h-5 w-5" />
                    Marrakech Office
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground">
                  <p>Riad Kheirredine, Derb Sidi Safi 14, Marrakech Medina</p>
                  <div>
                    <p className="font-semibold text-moroccan-blue">Office Hours</p>
                    <p>Monday – Sunday: 08:00 – 20:00</p>
                  </div>
                  <div className="space-y-2">
                    <p className="flex items-center">
                      <Phone className="mr-2 h-4 w-4" />
                      <a href="tel:+212600623630" className="hover:text-moroccan-red">+212 600 623 630</a>
                    </p>
                    <p className="flex items-center">
                      <Mail className="mr-2 h-4 w-4" />
                      <a href="mailto:contact@marrakechdunes.com" className="hover:text-moroccan-red">
                        contact@marrakechdunes.com
                      </a>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div>
                <p className="font-semibold text-moroccan-blue">Need immediate assistance?</p>
                <p className="text-muted-foreground">
                  Our adventure specialists are available on WhatsApp for quick answers.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <WhatsAppButton name="Ahmed" role="Desert Specialist" phone="+212600623630" />
                  <WhatsAppButton name="Yahia" role="Mountain Guide" phone="+212693323368" />
                </div>
              </div>
            </div>

            <div className="flex-1">
              <MapView className="h-full" height="420px" iframeTitle="Marrakech Dunes contact map" />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
