import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { RefreshCw } from 'lucide-react-native';
import { useCoinSyncStore } from '../../store/coinSyncStore';

const { width } = Dimensions.get('window');

export const SyncIndicator: React.FC = () => {
  const { isLoading, message } = useCoinSyncStore();
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0);

  // Rotation animation for the icon
  React.useEffect(() => {
    if (isLoading) {
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000 }),
        -1, // infinite
        false // don't reverse
      );
    } else {
      scale.value = withSpring(0, { damping: 15, stiffness: 200 });
      rotation.value = withTiming(0, { duration: 200 });
    }
  }, [isLoading]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotation.value}deg` },
        { scale: scale.value },
      ],
    };
  });

  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: scale.value,
    };
  });

  if (!isLoading) return null;

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <View style={styles.indicator}>
        <Animated.View style={animatedStyle}>
          <RefreshCw size={16} color="#4285F4" />
        </Animated.View>
        <Text style={styles.text}>Syncing...</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90, // Just above the bottom tabs
    left: 16,
    right: 16,
    zIndex: 1000,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(66, 133, 244, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    gap: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});