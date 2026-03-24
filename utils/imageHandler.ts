// Image handling utilities

export const FALLBACK_IMAGES = {
  birthday: 'https://via.placeholder.com/400x300/FF6B9D/FFFFFF?text=Birthday+Party',
  wedding: 'https://via.placeholder.com/400x300/FFD93D/000000?text=Wedding+Party',
  reception: 'https://via.placeholder.com/400x300/6BCB77/FFFFFF?text=Reception+Party',
  engagement: 'https://via.placeholder.com/400x300/FF8FB1/FFFFFF?text=Engagement',
  babyshower: 'https://via.placeholder.com/400x300/FF69B4/FFFFFF?text=Baby+Shower',
  corporate: 'https://via.placeholder.com/400x300/4169E1/FFFFFF?text=Corporate+Event',
  graduation: 'https://via.placeholder.com/400x300/FFD700/000000?text=Graduation',
  festival: 'https://via.placeholder.com/400x300/FF6347/FFFFFF?text=Festival',
  cultural: 'https://via.placeholder.com/400x300/DC143C/FFFFFF?text=Cultural+Event',
  housewarming: 'https://via.placeholder.com/400x300/32CD32/FFFFFF?text=Housewarming',
};

export type EventCategory = keyof typeof FALLBACK_IMAGES;

export const getEventImage = (url: string | undefined, category: EventCategory): string => {
  if (!url) return FALLBACK_IMAGES[category];
  // Return the URL as-is, browser will fall back to placeholder if it fails
  return url;
};

export const getImageUriWithFallback = (
  primaryUrl: string | undefined,
  fallbackCategory: EventCategory
): { uri: string; fallback?: string } => {
  const fallback = FALLBACK_IMAGES[fallbackCategory];
  return {
    uri: primaryUrl || fallback,
    fallback,
  };
};
