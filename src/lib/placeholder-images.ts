import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

export const placeholderImages: ImagePlaceholder[] = data.placeholderImages;

export const placeholderImageById: Record<string, ImagePlaceholder> = 
    placeholderImages.reduce((acc, image) => {
        acc[image.id] = image;
        return acc;
    }, {} as Record<string, ImagePlaceholder>);

export const defaultPlaceholderImage = {
    id: "default",
    description: "A beautiful travel destination",
    imageUrl: "https://picsum.photos/seed/default/600/400",
    imageHint: "travel destination"
};
