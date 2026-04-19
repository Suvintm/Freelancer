import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TARGET_ASPECT_RATIO = 9 / 16;

let VAULT_WIDTH = SCREEN_WIDTH;
let VAULT_HEIGHT = SCREEN_WIDTH / TARGET_ASPECT_RATIO;
if (VAULT_HEIGHT > SCREEN_HEIGHT) {
  VAULT_HEIGHT = SCREEN_HEIGHT;
  VAULT_WIDTH = VAULT_HEIGHT * TARGET_ASPECT_RATIO;
}

interface PremiumMediaEngineProps {
  media: {
    type: 'IMAGE' | 'VIDEO';
    urls: {
      thumb?: string;
      feed?: string;
      full?: string;
      hls?: string | null;
      video?: string;
    };
    blurhash?: string;
    status?: string;
  };
  isActive?: boolean;
  priority?: 'low' | 'normal' | 'high';
  isPaused?: boolean;
  isMuted?: boolean;
  onStatusUpdate?: (status: { position: number; duration: number }) => void;
}

type PlayerStatus = 'idle' | 'loading' | 'readyToPlay' | 'error';

export const PremiumMediaEngine: React.FC<PremiumMediaEngineProps> = ({
  media,
  isActive = false,
  priority = 'normal',
  isPaused = false,
  isMuted = false,
  onStatusUpdate,
}) => {
  const isVideo = media.type === 'VIDEO';

  const [retryKey, setRetryKey]       = React.useState(0);
  const [playerStatus, setPlayerStatus] = React.useState<PlayerStatus>('idle');

  const imageUrl   = media.urls?.feed || media.urls?.full || media.urls?.thumb;
  const mp4Url     = media.urls?.video;
  const hlsUrl     = media.urls?.hls;
  const thumbUrl   = media.urls?.thumb;

  // Prefer HLS if available, else MP4
  const videoSource = hlsUrl || mp4Url;

  // ── Initialize WITH the URI so Android doesn't hit the null-replace race ──
  const player = useVideoPlayer(
    isVideo && videoSource ? { uri: videoSource } : null,
    (p) => {
      p.loop  = true;
      p.muted = isMuted;
    },
  );

  const loadedUriRef  = React.useRef<string | null>(
    isVideo && videoSource ? videoSource : null,
  );
  const shouldPlayRef = React.useRef(false);
  const isActiveRef   = React.useRef(isActive);
  const isPausedRef   = React.useRef(isPaused);

  React.useEffect(() => { isActiveRef.current = isActive; }, [isActive]);
  React.useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  // ── Status listener ──
  React.useEffect(() => {
    if (!isVideo || !player) return;

    const sub = player.addListener('statusChange', (event) => {
      const s = (event as any).status as string;
      console.log(`🎬 [VIDEO] status → ${s}`);
      setPlayerStatus(s as PlayerStatus);

      if (s === 'readyToPlay') {
        if (shouldPlayRef.current && isActiveRef.current && !isPausedRef.current) {
          player.play();
        }
      }
    });

    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, isVideo, retryKey]);

  // ── Playback control ──
  React.useEffect(() => {
    if (!isVideo || !player) return;

    if (isActive && videoSource) {
      shouldPlayRef.current = !isPaused;
      player.muted = isMuted;

      if (loadedUriRef.current !== videoSource) {
        console.log(`📹 [VIDEO] Loading → ${videoSource.slice(-50)}`);
        setPlayerStatus('loading');
        player.replace({ uri: videoSource });
        loadedUriRef.current = videoSource;
      } else {
        if (playerStatus === 'readyToPlay') {
          isPaused ? player.pause() : (!player.playing && player.play());
        }
      }
    } else {
      shouldPlayRef.current = false;
      if (player.playing) player.pause();
    }
  }, [isActive, isVideo, videoSource, isPaused, isMuted, player, playerStatus, retryKey]);

  // Mute sync
  React.useEffect(() => {
    if (isVideo && player) player.muted = isMuted;
  }, [isMuted, isVideo, player]);

  // Progress
  React.useEffect(() => {
    if (!isVideo || !isActive || isPaused || !onStatusUpdate) return;
    const id = setInterval(() => {
      if (player && (player.duration ?? 0) > 0) {
        onStatusUpdate({ position: player.currentTime ?? 0, duration: player.duration });
      }
    }, 100);
    return () => clearInterval(id);
  }, [isVideo, isActive, isPaused, player, onStatusUpdate]);

  const handleRetry = React.useCallback(() => {
    if (!player || !videoSource) return;
    console.log('🔄 [VIDEO] User retry');
    setPlayerStatus('loading');
    loadedUriRef.current = null; // Force re-load on next effect run
    shouldPlayRef.current = true;
    // Replace with the same source to restart the load
    player.replace({ uri: videoSource });
    loadedUriRef.current = videoSource;
    setRetryKey(k => k + 1); // Re-attaches the status listener fresh
  }, [player, videoSource]);

  const isReady    = playerStatus === 'readyToPlay';
  const isLoading  = playerStatus === 'loading' || playerStatus === 'idle';
  const isError    = playerStatus === 'error';
  const showThumb  = isVideo && !isReady;
  const showSpinner = isVideo && isLoading && isActive && !isError;

  return (
    <View style={styles.container}>
      <View style={styles.vault}>

        {/* Thumbnail — stays visible until video is playing */}
        {showThumb && thumbUrl && (
          <Image
            source={{ uri: thumbUrl }}
            placeholder={media.blurhash}
            contentFit="cover"
            transition={0}
            priority="high"
            style={StyleSheet.absoluteFill}
            cachePolicy="memory-disk"
          />
        )}

        {/* Static image */}
        {!isVideo && imageUrl && (
          <Image
            source={{ uri: imageUrl }}
            placeholder={media.blurhash}
            contentFit="contain"
            transition={350}
            priority={priority}
            style={styles.media}
            cachePolicy="memory-disk"
          />
        )}

        {/* Video — opacity 0 until ready so thumbnail shows cleanly */}
        {isVideo && videoSource && (
          <VideoView
            key={retryKey}
            player={player}
            style={[styles.media, !isReady && styles.invisible]}
            contentFit="contain"
            nativeControls={false}
          />
        )}

        {/* Buffering spinner */}
        {showSpinner && (
          <View style={styles.spinnerOverlay} pointerEvents="none">
            <ActivityIndicator color="rgba(255,255,255,0.85)" size="small" />
          </View>
        )}

        {/* ── Error state with Retry button ── */}
        {isError && isActive && (
          <View style={styles.errorOverlay}>
            <MaterialCommunityIcons
              name="wifi-alert"
              size={36}
              color="rgba(255,255,255,0.5)"
            />
            <Text style={styles.errorTitle}>Could not load video</Text>
            <Text style={styles.errorSub}>Slow or no connection</Text>
            <TouchableOpacity
              onPress={handleRetry}
              style={styles.retryBtn}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="refresh" size={16} color="#fff" />
              <Text style={styles.retryText}>Tap to retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* No source */}
        {isVideo && !videoSource && (
          <View style={styles.errorOverlay} pointerEvents="none">
            <MaterialCommunityIcons name="video-off-outline" size={32} color="rgba(255,255,255,0.3)" />
            <Text style={styles.errorTitle}>No video source</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vault: {
    width: VAULT_WIDTH,
    height: VAULT_HEIGHT,
    backgroundColor: '#18181B',
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  media: {
    width: '100%',
    height: '100%',
  },
  invisible: {
    opacity: 0,
  },
  spinnerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.60)',
    gap: 8,
  },
  errorTitle: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  errorSub: {
    color: 'rgba(255,255,255,0.40)',
    fontSize: 12,
    fontWeight: '500',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  retryText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});