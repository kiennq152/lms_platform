import React, { useState } from 'react';
import { View } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

interface Props {
  videoId: string;
  onEnded?: () => void;
}

/** 16:9 YouTube player (iOS / Android). See youtube-video.web.tsx for the web version. */
export function YoutubeVideo({ videoId, onEnded }: Props) {
  const [width, setWidth] = useState(0);
  return (
    <View
      style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' }}
      onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))}
    >
      {width > 0 ? (
        <YoutubePlayer
          width={width}
          height={Math.round((width * 9) / 16)}
          videoId={videoId}
          play={false}
          onChangeState={(state: string) => { if (state === 'ended') onEnded?.(); }}
        />
      ) : null}
    </View>
  );
}
