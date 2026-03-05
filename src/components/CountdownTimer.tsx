import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing, Fonts } from '../theme';

interface CountdownTimerProps {
  releaseDate: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ releaseDate }) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [isReleased, setIsReleased] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const release = new Date(releaseDate).getTime();
      const difference = release - now;

      if (difference <= 0) {
        setIsReleased(true);
        setTimeLeft(null);
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [releaseDate]);

  if (isReleased) {
    return (
      <View style={styles.container}>
        <View style={[styles.releasedBadge]}>
          <Text style={styles.releasedText}>NOW RELEASED</Text>
        </View>
      </View>
    );
  }

  if (!timeLeft) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>RELEASES IN</Text>
      <View style={styles.timerRow}>
        <TimeBlock value={timeLeft.days} unit="DAYS" />
        <Text style={styles.separator}>:</Text>
        <TimeBlock value={timeLeft.hours} unit="HRS" />
        <Text style={styles.separator}>:</Text>
        <TimeBlock value={timeLeft.minutes} unit="MIN" />
        <Text style={styles.separator}>:</Text>
        <TimeBlock value={timeLeft.seconds} unit="SEC" />
      </View>
    </View>
  );
};

const TimeBlock: React.FC<{ value: number; unit: string }> = ({ value, unit }) => (
  <View style={styles.timeBlock}>
    <Text style={styles.timeValue}>{String(value).padStart(2, '0')}</Text>
    <Text style={styles.timeUnit}>{unit}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  label: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    letterSpacing: 2,
    marginBottom: Spacing.sm,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeBlock: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    minWidth: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  timeValue: {
    color: Colors.accent,
    fontSize: 28,
    fontFamily: Fonts.extraBold,
  },
  timeUnit: {
    color: Colors.textMuted,
    fontSize: 10,
    fontFamily: Fonts.semiBold,
    marginTop: 2,
    letterSpacing: 1,
  },
  separator: {
    color: Colors.accent,
    fontSize: 24,
    fontFamily: Fonts.bold,
    marginHorizontal: 4,
  },
  releasedBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
  },
  releasedText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Fonts.bold,
    letterSpacing: 1,
  },
});

export default CountdownTimer;
