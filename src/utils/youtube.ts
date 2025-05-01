export const getYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('youtube.com')) {
      const videoId = urlObj.searchParams.get('v');
      if (videoId) return videoId;
      
      // Handle youtube.com/v/VIDEO_ID format
      const pathMatch = urlObj.pathname.match(/\/v\/([^/]+)/);
      if (pathMatch) return pathMatch[1];
    } else if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1);
    }
  } catch (e) {
    // Try regex matching for non-URL formats
    const patterns = [
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) return match[1];
    }
  }
  return null;
};

export const getYouTubeThumbnail = (url: string): string | null => {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  
  // Try multiple thumbnail qualities
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
};