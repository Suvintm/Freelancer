export function compositeScore(reel) {
    const views = reel.view_count || 0;
    const likes = reel.like_count || 0;
    const comments = reel.comment_count || 0;
    const shares = reel.share_count || 0;
    
    // Simple engagement rate algorithm
    const engagement = (likes * 2) + (comments * 3) + (shares * 5);
    const score = views > 0 ? (engagement / views) * 100 : 0;
    
    return Math.min(score, 100);
}
