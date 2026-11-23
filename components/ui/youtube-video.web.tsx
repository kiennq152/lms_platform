import React, { useEffect, useRef } from 'react';

interface Props {
  videoId: string;
  onEnded?: () => void;
}

const ORIGIN = 'https://www.youtube.com';
const ENDED = 0;

/**
 * 16:9 YouTube embed for web. react-native-youtube-iframe loads a third-party page that
 * expects a native WebView, so on web it throws and never reports "ended".
 */
export function YoutubeVideo({ videoId, onEnded }: Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const callback = useRef(onEnded);
  useEffect(() => { callback.current = onEnded; }, [onEnded]);

  useEffect(() => {
    let ended = false;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== ORIGIN || e.source !== frame.current?.contentWindow || typeof e.data !== 'string') return;
      try {
        const msg = JSON.parse(e.data);
        const state = msg.event === 'onStateChange' ? msg.info : msg.info?.playerState;
        if (typeof state !== 'number') return;
        if (state === ENDED && !ended) callback.current?.();
        ended = state === ENDED;
      } catch {
        // not a player message
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [videoId]);

  return (
    <iframe
      ref={frame}
      src={`${ORIGIN}/embed/${videoId}?enablejsapi=1&rel=0&playsinline=1`}
      title="Video bài giảng"
      loading="lazy"
      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      onLoad={() => frame.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: videoId }), ORIGIN)}
      style={{ display: 'block', width: '100%', aspectRatio: '16 / 9', border: 0, backgroundColor: '#000' }}
    />
  );
}
