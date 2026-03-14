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
    embedTemplate: (id) => `https://player.bilibili.com/player.html?bvid=${id}&high_quality=1&danmaku=0&as_wide=1`,
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
 * Fetch Bilibili video metadata via public API
 * Note: The Bilibili API blocks CORS requests from browsers.
 * We try fetching but gracefully fall back to constructing info from the video ID.
 * @param {string} videoId - BV or av ID
 * @returns {Promise<object>} - { title, duration, thumbnail }
 */
async function fetchBilibiliInfo(videoId) {
  try {
    const isBV = videoId.toUpperCase().startsWith('BV');
    const param = isBV ? `bvid=${videoId}` : `aid=${videoId.replace(/^av/i, '')}`;
    const resp = await fetch(`https://api.bilibili.com/x/web-interface/view?${param}`);
    const json = await resp.json();

    if (json.code === 0 && json.data) {
      return {
        title: json.data.title,
        duration: json.data.duration,
        thumbnail: json.data.pic?.replace(/^http:/, 'https:') || null,
      };
    }
  } catch (err) {
    console.warn('Bilibili API blocked by CORS (expected in browser):', err.message);
  }
  // Fallback: return video ID as title, no thumbnail
  return {
    title: `Bilibili - ${videoId}`,
    duration: 0,
    thumbnail: null,
  };
}

/**
 * Fetch YouTube video metadata via oEmbed API (no API key needed)
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<object>} - { title, thumbnail }
 */
async function fetchYouTubeInfo(videoId) {
  try {
    const resp = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (resp.ok) {
      const json = await resp.json();
      return {
        title: json.title,
        duration: 0, // oEmbed doesn't provide duration
        thumbnail: json.thumbnail_url,
      };
    }
  } catch (err) {
    console.warn('Failed to fetch YouTube video info:', err);
  }
  return null;
}

/**
 * Platform-specific metadata fetchers
 */
const PLATFORM_FETCHERS = {
  [PLATFORMS.BILIBILI]: fetchBilibiliInfo,
  [PLATFORMS.YOUTUBE]: fetchYouTubeInfo,
};

/**
 * Parse video URL and extract metadata using platform APIs
 * @param {string} url - Video URL
 * @returns {Promise<object>} - Video metadata
 */
export async function parseVideoUrl(url) {
  const platformInfo = detectPlatform(url);

  if (platformInfo.platform === PLATFORMS.UNKNOWN) {
    throw new Error('Unsupported platform or invalid URL');
  }

  // Try to fetch real metadata from the platform API
  const fetcher = PLATFORM_FETCHERS[platformInfo.platform];
  let metadata = null;
  if (fetcher) {
    metadata = await fetcher(platformInfo.videoId);
  }

  return {
    ...platformInfo,
    title: metadata?.title || `${platformInfo.platformName} Video`,
    duration: metadata?.duration || 0,
    thumbnail: metadata?.thumbnail || null,
    supportsEmbed: supportsEmbed(platformInfo.platform),
  };
}
