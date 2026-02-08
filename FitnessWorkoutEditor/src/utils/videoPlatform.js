// Video platform detection and parsing utilities

/**
 * Supported video platforms
 */
export const PLATFORMS = {
  BILIBILI: 'bilibili',
  YOUTUBE: 'youtube',
  WEIBO: 'weibo',
  XIAOHONGSHU: 'xiaohongshu',
  TWITTER: 'twitter',
  UNKNOWN: 'unknown',
};

/**
 * Platform configurations
 */
const PLATFORM_CONFIGS = {
  [PLATFORMS.BILIBILI]: {
    name: 'Bilibili',
    patterns: [
      /bilibili\.com\/video\/(BV[\w]+)/i,
      /bilibili\.com\/video\/(av[\d]+)/i,
      /b23\.tv\/([\w]+)/i,
    ],
    embedTemplate: (id) => `https://player.bilibili.com/player.html?bvid=${id}`,
  },
  [PLATFORMS.YOUTUBE]: {
    name: 'YouTube',
    patterns: [
      /youtube\.com\/watch\?v=([\w-]+)/i,
      /youtu\.be\/([\w-]+)/i,
      /youtube\.com\/embed\/([\w-]+)/i,
      /youtube\.com\/v\/([\w-]+)/i,
    ],
    embedTemplate: (id) => `https://www.youtube.com/embed/${id}`,
  },
  [PLATFORMS.WEIBO]: {
    name: 'Weibo Video',
    patterns: [
      /weibo\.com\/tv\/show\/([\w:]+)/i,
      /weibo\.com.*\/(\d+:\w+)/i,
    ],
    embedTemplate: (id) => `https://weibo.com/tv/show/${id}`,
  },
  [PLATFORMS.XIAOHONGSHU]: {
    name: 'Xiaohongshu',
    patterns: [
      /xiaohongshu\.com\/.*\/([\w]+)/i,
      /xhslink\.com\/([\w]+)/i,
    ],
    embedTemplate: null, // Xiaohongshu doesn't support iframe embed
  },
  [PLATFORMS.TWITTER]: {
    name: 'Twitter/X',
    patterns: [
      /twitter\.com\/.*\/status\/([\d]+)/i,
      /x\.com\/.*\/status\/([\d]+)/i,
    ],
    embedTemplate: null, // Twitter requires special handling
  },
};

/**
 * Detect video platform from URL
 * @param {string} url - Video URL
 * @returns {object} - { platform, videoId, embedUrl }
 */
export function detectPlatform(url) {
  if (!url || typeof url !== 'string') {
    return {
      platform: PLATFORMS.UNKNOWN,
      videoId: null,
      embedUrl: null,
    };
  }

  // Trim URL but preserve case (video IDs like BV numbers are case-sensitive)
  const trimmedUrl = url.trim();

  // Try to match each platform (patterns use 'i' flag for domain matching)
  for (const [platform, config] of Object.entries(PLATFORM_CONFIGS)) {
    for (const pattern of config.patterns) {
      const match = trimmedUrl.match(pattern);
      if (match) {
        const videoId = match[1];
        const embedUrl = config.embedTemplate ? config.embedTemplate(videoId) : null;

        return {
          platform,
          platformName: config.name,
          videoId,
          embedUrl,
          originalUrl: url,
        };
      }
    }
  }

  return {
    platform: PLATFORMS.UNKNOWN,
    platformName: 'Unknown',
    videoId: null,
    embedUrl: null,
    originalUrl: url,
  };
}

/**
 * Check if platform supports iframe embedding
 * @param {string} platform - Platform identifier
 * @returns {boolean}
 */
export function supportsEmbed(platform) {
  const config = PLATFORM_CONFIGS[platform];
  return config && config.embedTemplate !== null;
}

/**
 * Parse video URL and extract metadata
 * This is a simplified version - in production, you'd call actual APIs
 * @param {string} url - Video URL
 * @returns {Promise<object>} - Video metadata
 */
export async function parseVideoUrl(url) {
  const platformInfo = detectPlatform(url);

  if (platformInfo.platform === PLATFORMS.UNKNOWN) {
    throw new Error('Unsupported platform or invalid URL');
  }

  // For now, return basic info
  // In production, you would:
  // 1. Call platform APIs to get video metadata
  // 2. Use a backend proxy to handle CORS
  // 3. Parse video duration, title, thumbnail, etc.

  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Mock response
  return {
    ...platformInfo,
    title: `${platformInfo.platformName} Video`,
    duration: 300, // 5 minutes (mock)
    thumbnail: null,
    supportsEmbed: supportsEmbed(platformInfo.platform),
  };
}

/**
 * Get video stream URL (requires backend API)
 * This is a placeholder - actual implementation requires a backend service
 * @param {string} platform - Platform identifier
 * @param {string} videoId - Video ID
 * @returns {Promise<string>} - Direct video URL
 */
export async function getVideoStreamUrl(platform, videoId) {
  // This would typically call a backend API that:
  // 1. Uses platform-specific parsers
  // 2. Handles authentication and API keys
  // 3. Returns direct video URLs or m3u8 streams

  throw new Error('Video streaming requires a backend service. This feature is not yet implemented.');
}
