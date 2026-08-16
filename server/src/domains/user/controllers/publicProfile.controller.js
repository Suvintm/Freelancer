import { asyncHandler } from "../../../shared/middleware/error-handler.middleware.js";
import { getPublicProfileByUsername, recordPublicProfileEvent } from "../services/publicProfile.service.js";
import crypto from "crypto";

export const getPublicProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  
  const profile = await getPublicProfileByUsername(username);

  // Generate visitor ID if not present
  let visitorId = req.cookies?.v_id;
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    res.cookie("v_id", visitorId, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: true });
  }

  const userAgent = req.headers['user-agent'] || '';
  const deviceType = /mobile/i.test(userAgent) ? 'mobile' : /tablet/i.test(userAgent) ? 'tablet' : 'desktop';

  // Record PAGE_VIEW analytics event
  await recordPublicProfileEvent(profile.id, 'PAGE_VIEW', {
    visitorId,
    referrer: req.headers.referer || null,
    deviceType
  });

  res.status(200).json({
    success: true,
    data: profile
  });
});

export const recordClick = asyncHandler(async (req, res) => {
  const { blockId, profileId } = req.body;
  const visitorId = req.cookies?.v_id || 'unknown';

  const userAgent = req.headers['user-agent'] || '';
  const deviceType = /mobile/i.test(userAgent) ? 'mobile' : /tablet/i.test(userAgent) ? 'tablet' : 'desktop';

  await recordPublicProfileEvent(profileId, 'BLOCK_CLICK', {
    blockId,
    visitorId,
    referrer: req.headers.referer || null,
    deviceType
  });

  res.status(200).json({ success: true });
});
