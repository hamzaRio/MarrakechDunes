import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

import PhotoSlideshow from "@/components/photo-slideshow";
import { Button } from "@/components/ui/button";
import { Play, Calendar } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

// Runtime + fallback paths for hero images
const riadKheirredinePath = "/attached_assets/montgofliere_a_marrakech_1751127701687.jpg";
const riadKheirredineFallback = "/assets/montgofliere_a_marrakech_1751127701687.jpg";

export default function Home() {
    const { t } = useLanguage();

    return (
    <div className="min-h-screen bg-moroccan-sand">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${riadKheirredinePath}), url(${riadKheirredineFallback})`,
          }}
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex items-center justify-center h-full text-center text-white px-4">
          <div className="max-w-4xl">
            <h1
              className="font-playfair text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight text-white"
              style={{ textShadow: "3px 3px 6px rgba(0,0,0,0.8), 1px 1px 3px rgba(0,0,0,0.6)" }}
            >
              {t("heroTitle")}
              <span className="text-moroccan-gold font-black"> {t("heroTitleHighlight")}</span>
            </h1>
            <p
              className="text-xl md:text-2xl mb-8 text-white max-w-2xl mx-auto font-semibold"
              style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.8), 1px 1px 2px rgba(0,0,0,0.6)" }}
            >
              {t("heroSubtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-moroccan-red hover:bg-moroccan-red text-white shadow-xl"
                onClick={() => (window.location.href = "/booking")}
              >
                <Calendar className="w-5 h-5 mr-2" />
                {t("bookAdventure")}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-white hover:bg-white hover:text-gray-900 text-white"
                onClick={() => {
                  const modal = document.createElement("div");
                  modal.style.cssText = `
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.9); display: flex; align-items: center;
                    justify-content: center; z-index: 9999; padding: 20px;
                  `;

                  const videoContainer = document.createElement("div");
                  videoContainer.style.cssText = `
                    position: relative; max-width: 90%; max-height: 90%;
                    background: black; border-radius: 8px; overflow: hidden;
                  `;

                  const video = document.createElement("video");
                  video.src = "/assets/promo-video.mp4";
                  video.controls = true;
                  video.autoplay = true;
                  video.style.cssText = "width: 100%; height: auto; max-height: 80vh;";

                  const closeBtn = document.createElement("button");
                  closeBtn.innerHTML = "×";
                  closeBtn.style.cssText = `
                    position: absolute; top: 10px; right: 15px; color: white;
                    background: rgba(0,0,0,0.7); border: none; font-size: 24px;
                    width: 30px; height: 30px; border-radius: 50%; cursor: pointer;
                  `;

                  video.onerror = () => {
                    videoContainer.innerHTML = `
                      <div style="padding: 40px; color: white; text-align: center;">
                        <p>Video not found. Please upload promo-video.mp4 to the assets folder.</p>
                      </div>
                    `;
                  };

                  closeBtn.onclick = () => document.body.removeChild(modal);
                  modal.onclick = (e) => {
                    if (e.target === modal) document.body.removeChild(modal);
                  };

                  videoContainer.appendChild(video);
                  videoContainer.appendChild(closeBtn);
                  modal.appendChild(videoContainer);
                  document.body.appendChild(modal);
                }}
              >
                <Play className="w-5 h-5 mr-2" />
                {t("watchVideo")}
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 moroccan-pattern h-20 bg-repeat-x" />
      </section>

      {/* Photo Slideshow Section */}
      <PhotoSlideshow />

      {/* Keep the rest of your original sections unchanged */}
      {/* ... Existing content from your original file ... */}

      <Footer />
    </div>
  );
}
