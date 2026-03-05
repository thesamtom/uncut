import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing, Fonts } from '../theme';

interface HypeScoreBadgeProps {
  score: number;
  size?: 'small' | 'large';
}

const HypeScoreBadge: React.FC<HypeScoreBadgeProps> = ({ score, size = 'small' }) => {
  const getHypeColor = (s: number) => {
    if (s >= 80) return '#E53935'; // red-hot
    if (s >= 60) return '#FF6D00'; // orange
    if (s >= 40) return '#FFB300'; // amber
    return '#78909C';              // cool grey-blue
  };

  const getHypeLabel = (s: number) => {
    if (s >= 90) return 'MEGA HYPE';
    if (s >= 80) return 'VERY HOT';
    if (s >= 60) return 'HOT';
    if (s >= 40) return 'WARM';
    return 'LOW BUZZ';
  };

  const getHypeBg = (s: number) => {
    if (s >= 80) return '#FBE9E7';
    if (s >= 60) return '#FFF3E0';
    if (s >= 40) return '#FFF8E1';
    return '#ECEFF1';
  };

  const isLarge = size === 'large';
  const color = getHypeColor(score);
  const bgColor = getHypeBg(score);

  if (!isLarge) {
    // Compact badge for cards
    return (
      <View style={[styles.smallBadge, { backgroundColor: bgColor }]}>
        <Ionicons name="flame" size={12} color={color} />
        <Text style={[styles.smallScore, { color }]}>{score}</Text>
      </View>
    );
  }

  // Large badge for detail screen
  return (
    <View style={[styles.containerLarge, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View style={styles.largeLeft}>
        <View style={[styles.scoreCircleLarge, { backgroundColor: bgColor, borderColor: color }]}>
          <Ionicons name="flame" size={16} color={color} style={styles.flameIcon} />
          <Text style={[styles.scoreTextLarge, { color }]}>{score}</Text>
        </View>
      </View>
      <View style={styles.largeRight}>
        <Text style={styles.hypeTitle}>Hype Score</Text>
        <Text style={[styles.hypeLabel, { color }]}>{getHypeLabel(score)}</Text>
        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${score}%`, backgroundColor: color }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Small badge (on cards)
  smallBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
    gap: 3,
  },
  smallScore: {
    fontSize: 12,
    fontFamily: Fonts.bold,
  },

  // Large badge (detail screen)
  containerLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  largeLeft: {
    marginRight: Spacing.md,
  },
  scoreCircleLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flameIcon: {
    position: 'absolute',
    top: 2,
  },
  scoreTextLarge: {
    fontSize: 22,
    fontFamily: Fonts.extraBold,
    marginTop: 10,
  },
  largeRight: {
    flex: 1,
  },
  hypeTitle: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  hypeLabel: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    marginTop: 2,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.background,
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});

export default HypeScoreBadge;
