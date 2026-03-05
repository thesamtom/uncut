import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Colors } from '../theme/colors';
import { Fonts } from '../theme';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.timing(subtitleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(onFinish, 1200);
      });
    });
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.logo}>UNCUT</Text>
        <View style={styles.accentBar} />
      </Animated.View>

      <Animated.Text style={[styles.subtitle, { opacity: subtitleAnim }]}>
        Track Upcoming Movies
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 52,
    fontFamily: Fonts.black,
    color: Colors.accent,
    letterSpacing: 8,
  },
  accentBar: {
    width: 60,
    height: 4,
    backgroundColor: Colors.accent,
    borderRadius: 2,
    marginTop: 12,
  },
  subtitle: {
    color: Colors.accent,
    fontSize: 14,
    fontFamily: Fonts.medium,
    letterSpacing: 2,
    marginTop: 24,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
});

export default SplashScreen;
