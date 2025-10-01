import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, X, Share2, Download } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface PhotoSharingProps {
  activityId: string;
  bookingId?: string;
}

interface PhotoData {
  id: string;
  file: File;
  preview: string;
  caption: string;
  location?: string;
}

export default function PhotoSharing({ 
  activityId, 
  bookingId 
}: PhotoSharingProps) {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadPhotosMutation = useMutation({
    mutationFn: async (photoData: PhotoData[]) => {
      const formData = new FormData();
      photoData.forEach((photo, index) => {
        formData.append(`photos[${index}]`, photo.file);
        formData.append(`captions[${index}]`, photo.caption);
        if (photo.location) {
          formData.append(`locations[${index}]`, photo.location);
        }
      });
      
      if (bookingId) {
        formData.append('bookingId', bookingId);
      }
      formData.append('activityId', activityId);

      const response = await api.post('/photos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Photos Uploaded",
        description: "Your photos have been shared successfully!",
      });
      setPhotos([]);
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.response?.data?.message || "Failed to upload photos",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newPhotos: PhotoData[] = [];
    
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const preview = e.target?.result as string;
          const photoData: PhotoData = {
            id: Math.random().toString(36).substr(2, 9),
            file,
            preview,
            caption: '',
            location: undefined,
          };
          
          setPhotos(prev => [...prev, photoData]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== id));
  };

  const updatePhotoCaption = (id: string, caption: string) => {
    setPhotos(prev => prev.map(photo => 
      photo.id === id ? { ...photo, caption } : photo
    ));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          return `${latitude},${longitude}`;
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const handleUpload = () => {
    if (photos.length === 0) {
      toast({
        title: "No Photos",
        description: "Please select photos to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    uploadPhotosMutation.mutate(photos);
  };

  const sharePhotos = async () => {
    if (photos.length === 0) return;

    const shareData = {
      title: 'MarrakechDunes Photos',
      text: `Check out these photos from my MarrakechDunes adventure!`,
      files: photos.map(photo => photo.file),
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: download photos
        photos.forEach(photo => {
          const link = document.createElement('a');
          link.href = photo.preview;
          link.download = `marrakechdunes-${Date.now()}.jpg`;
          link.click();
        });
        toast({
          title: "Photos Downloaded",
          description: "Photos have been downloaded to your device",
        });
      }
    } catch (error) {
      console.error('Error sharing photos:', error);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-purple-600" />
          Share Your Adventure
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="photo-upload">Select Photos</Label>
          <div className="flex gap-2">
            <Button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              Choose Photos
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            {photos.length > 0 && (
              <Button 
                variant="outline" 
                onClick={sharePhotos}
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            )}
          </div>
        </div>

        {photos.length > 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {photos.map((photo) => (
                <Card key={photo.id} className="overflow-hidden">
                  <div className="relative">
                    <img 
                      src={photo.preview} 
                      alt="Preview" 
                      className="w-full h-48 object-cover"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={() => removePhoto(photo.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <Label htmlFor={`caption-${photo.id}`}>Caption</Label>
                      <Textarea
                        id={`caption-${photo.id}`}
                        placeholder="Add a caption..."
                        value={photo.caption}
                        onChange={(e) => updatePhotoCaption(photo.id, e.target.value)}
                        className="min-h-[60px]"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleUpload}
                disabled={isUploading || uploadPhotosMutation.isPending}
                className="flex items-center gap-2"
              >
                {isUploading || uploadPhotosMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload to MarrakechDunes
                  </>
                )}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setPhotos([])}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Clear All
              </Button>
            </div>
          </div>
        )}

        <div className="bg-purple-50 p-3 rounded-md">
          <p className="text-sm text-purple-800">
            💡 <strong>Tip:</strong> Share your adventure photos with the MarrakechDunes community! 
            Your photos help other travelers discover amazing experiences.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
