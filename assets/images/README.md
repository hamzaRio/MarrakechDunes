# Image Assets Guide - MarrakechDunes

This directory contains all image assets for the MarrakechDunes booking platform.

## Directory Structure

```
assets/images/
├── activities/          # Activity-specific photos
│   ├── balloon-ride/    # Hot air balloon photos
│   ├── camel-trek/      # Desert camel trek photos
│   ├── atlas-hiking/    # Atlas Mountains hiking photos
│   ├── food-tour/       # Medina food tour photos
│   ├── ouzoud-waterfalls/ # Waterfalls day trip photos
│   └── essaouira/       # Coastal excursion photos
├── gallery/             # Homepage gallery images
├── hero/                # Hero section backgrounds
└── destinations/        # Destination overview images
```

## Current Activities Setup

The system is configured for these 6 activities with the following image paths:

1. **Hot Air Balloon Over Marrakech**
   - ID: `676e123456789abcdef01240`
   - Path: `/images/balloon-ride.jpg`
   - Directory: `assets/images/activities/balloon-ride/`

2. **Sahara Desert Camel Trek**
   - ID: `676e123456789abcdef01241`
   - Path: `/images/camel-trek.jpg`
   - Directory: `assets/images/activities/camel-trek/`

3. **Atlas Mountains Hiking**
   - ID: `676e123456789abcdef01242`
   - Path: `/images/atlas-hiking.jpg`
   - Directory: `assets/images/activities/atlas-hiking/`

4. **Marrakech Medina Food Tour**
   - ID: `676e123456789abcdef01243`
   - Path: `/images/food-tour.jpg`
   - Directory: `assets/images/activities/food-tour/`

5. **Ouzoud Waterfalls Day Trip**
   - ID: `676e123456789abcdef01244`
   - Path: `/images/ouzoud-waterfalls.jpg`
   - Directory: `assets/images/activities/ouzoud-waterfalls/`

6. **Essaouira Coastal Excursion**
   - ID: `676e123456789abcdef01245`
   - Path: `/images/essaouira.jpg`
   - Directory: `assets/images/activities/essaouira/`

## Adding New Images

### Step 1: Upload Activity Photos
Place your activity photos in the corresponding directories:
- Use high-quality images (minimum 1200x800px)
- Optimize for web (JPG format, ~200-500KB)
- Name the main image same as the path configured above

### Step 2: Update Image Paths
After uploading, the system will automatically serve images from:
- Development: `http://localhost:5000/images/[filename]`
- Production: `https://yourdomain.com/images/[filename]`

### Step 3: Additional Photos (Optional)
You can add multiple photos per activity:
- `main.jpg` - Primary activity image
- `gallery-1.jpg`, `gallery-2.jpg` - Additional gallery images
- `hero.jpg` - Large hero image for activity detail pages

## Image Specifications

### Activity Images
- **Dimensions**: 1200x800px (3:2 aspect ratio)
- **Format**: JPG (optimized for web)
- **Size**: 200-500KB
- **Quality**: High (85-95% JPEG quality)

### Gallery Images
- **Dimensions**: 800x600px (4:3 aspect ratio)
- **Format**: JPG
- **Size**: 150-300KB

### Hero Images
- **Dimensions**: 1920x1080px (16:9 aspect ratio)
- **Format**: JPG
- **Size**: 300-800KB

## Image Optimization Tips

1. **Use appropriate tools**:
   - Online: TinyPNG, ImageOptim
   - Desktop: Photoshop, GIMP

2. **Maintain quality**:
   - Keep original files as backup
   - Use progressive JPEG encoding
   - Maintain sharp details for activity recognition

3. **Consider mobile users**:
   - Images should look good on small screens
   - Text overlays should be readable
   - Important elements should be centered

## Integration with Application

The images are automatically integrated into:
- **Homepage**: Activity cards and gallery slideshow
- **Activities Page**: Activity listing grid
- **Activity Details**: Full-size hero images
- **Booking Page**: Activity confirmation images
- **Admin Dashboard**: Activity management interface

## Next Steps

1. Upload your activity photos to the respective directories
2. Rename files to match the configured paths
3. Test the images appear correctly in the application
4. Add additional gallery photos if desired
5. Update image paths in the storage configuration if needed