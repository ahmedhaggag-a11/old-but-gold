/**
 * YouTube Helper Utility for parsing video IDs and generating Embeds & Thumbnails
 */

function extractYouTubeId(url) {
  if (!url) return null;
  
  // Standard Watch URL: https://www.youtube.com/watch?v=VIDEO_ID
  // Short URL: https://youtu.be/VIDEO_ID
  // Embed URL: https://www.youtube.com/embed/VIDEO_ID
  // Shorts URL: https://www.youtube.com/shorts/VIDEO_ID

  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);

  return (match && match[2].length === 11) ? match[2] : null;
}

function getEmbedUrl(youtubeIdOrUrl) {
  const videoId = extractYouTubeId(youtubeIdOrUrl) || youtubeIdOrUrl;
  if (!videoId) return youtubeIdOrUrl;
  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=0`;
}

function getThumbnailUrl(youtubeIdOrUrl, quality = 'hq') {
  const videoId = extractYouTubeId(youtubeIdOrUrl) || youtubeIdOrUrl;
  if (!videoId) return '/static/images/default_video.jpg';
  
  // maxresdefault, hqdefault, mqdefault, default
  return `https://img.youtube.com/vi/${videoId}/${quality}default.jpg`;
}

module.exports = {
  extractYouTubeId,
  getEmbedUrl,
  getThumbnailUrl
};
