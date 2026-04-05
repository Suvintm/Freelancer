import { Dimensions } from 'react-native';

/**
 * PRODUCTION-GRADE SCREEN DIMENSIONS
 * We use 'screen' instead of 'window' to get the full hardware size,
 * including the notch and system bars. This is critical for
 * full-bleed Reels that shouldn't have white gaps.
 */
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('screen');

export { SCREEN_W, SCREEN_H };
