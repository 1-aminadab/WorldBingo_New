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
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react-native';
import { useCoinSyncStore } from '../../store/coinSyncStore';

const { width } = Dimensions.get('window');

export const SyncIndicator: React.FC = () => {
  const { isLoading, message, syncStatus } = useCoinSyncStore();
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0);

  // Animation for showing/hiding and rotation
  React.useEffect(() => {
    if (isLoading || syncStatus) {
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      if (isLoading) {
        rotation.value = withRepeat(
          withTiming(360, { duration: 1000 }),
          -1, // infinite
          false // don't reverse
        );
      } else {
        rotation.value = withTiming(0, { duration: 200 });
      }
    } else {
      scale.value = withSpring(0, { damping: 15, stiffness: 200 });
      rotation.value = withTiming(0, { duration: 200 });
    }
  }, [isLoading, syncStatus]);

  // Auto-hide status messages after 3 seconds
  React.useEffect(() => {
    if (syncStatus && !isLoading) {
      const timer = setTimeout(() => {
        useCoinSyncStore.getState().clearStatus();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [syncStatus, isLoading]);

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

  if (!isLoading && !syncStatus) return null;

  // Determine icon and colors based on state
  const getIndicatorContent = () => {
    if (isLoading) {
      return {
        icon: <RefreshCw size={16} color="#FFFFFF" />,
        text: message || 'Syncing...',
        backgroundColor: 'rgba(66, 133, 244, 0.95)', // Blue for loading
        animated: true
      };
    } else if (syncStatus === 'success') {
      return {
        icon: <CheckCircle size={16} color="#FFFFFF" />,
        text: message || 'Sync successful!',
        backgroundColor: 'rgba(76, 175, 80, 0.95)', // Green for success
        animated: false
      };
    } else if (syncStatus === 'error') {
      return {
        icon: <AlertCircle size={16} color="#FFFFFF" />,
        text: message || 'Sync failed',
        backgroundColor: 'rgba(244, 67, 54, 0.95)', // Red for error
        animated: false
      };
    }
    return null;
  };

  const content = getIndicatorContent();
  if (!content) return null;

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <View style={[styles.indicator, { backgroundColor: content.backgroundColor }]}>
        <Animated.View style={content.animated ? animatedStyle : undefined}>
          {content.icon}
        </Animated.View>
        <Text style={styles.text}>{content.text}</Text>
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