import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing } from '../theme';

interface TrailerPlayerProps {
  videoKey: string;
  title?: string;
}

const { width } = Dimensions.get('window');
const PLAYER_HEIGHT = (width - Spacing.md * 2) * (9 / 16);

const TrailerPlayer: React.FC<TrailerPlayerProps> = ({ videoKey, title }) => {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  const handlePlay = useCallback(() => {
    setPlaying(true);
  }, []);

  if (!playing) {
    return (
      <TouchableOpacity
        style={styles.thumbnail}
        onPress={handlePlay}
        activeOpacity={0.8}
      >
        <View style={styles.playOverlay}>
          <View style={styles.playButton}>
            <Ionicons name="play" size={32} color="#FFFFFF" />
          </View>
          {title && <Text style={styles.title} numberOfLines={1}>{title}</Text>}
        </View>
      </TouchableOpacity>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0&modestbranding=1`;

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      )}
      <WebView
        source={{ uri: embedUrl }}
        style={styles.webview}
        allowsFullscreenVideo
        mediaPlaybackRequiresUserAction={false}
        onLoadEnd={() => setLoading(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width - Spacing.md * 2,
    height: PLAYER_HEIGHT,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
  },
  thumbnail: {
    width: width - Spacing.md * 2,
    height: PLAYER_HEIGHT,
    borderRadius: BorderRadius.md,
    backgroundColor: '#1A1A1A',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
    paddingHorizontal: 24,
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    zIndex: 1,
  },
});

export default TrailerPlayer;
