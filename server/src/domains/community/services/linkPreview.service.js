import ogs from 'open-graph-scraper';

class LinkPreviewService {
  async extractFromText(text) {
    if (!text) return null;
    
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex);
    if (!urls?.length) return null;

    const url = urls[0]; // Process only the first URL found
    
    try {
      const options = { url, timeout: 3000 };
      const { result } = await ogs(options);
      
      return {
        url,
        title: result.ogTitle,
        description: result.ogDescription,
        image: result.ogImage?.[0]?.url,
        siteName: result.ogSiteName,
        type: this.detectLinkType(url),
      };
    } catch (err) {
      // Fallback: store URL only if fetch fails
      return { url };
    }
  }

  detectLinkType(url) {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('play.google.com') || url.includes('apps.apple.com')) return 'app';
    return 'website';
  }
}

export default new LinkPreviewService();
