import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useTheme } from './ThemeProvider';

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width - 120; // Accounting for padding and labels

interface DraggableRTPSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue: number;
  maximumValue: number;
  step: number;
}

export const DraggableRTPSlider: React.FC<DraggableRTPSliderProps> = ({
  value,
  onValueChange,
  minimumValue,
  maximumValue,
  step,
}) => {
  const { theme } = useTheme();
  
  const translateX = useSharedValue(
    ((value - minimumValue) / (maximumValue - minimumValue)) * SLIDER_WIDTH
  );

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startX = translateX.value;
    },
    onActive: (event, context) => {
      const newX = Math.max(0, Math.min(SLIDER_WIDTH, context.startX + event.translationX));
      translateX.value = newX;
      
      // Calculate new value
      const percentage = newX / SLIDER_WIDTH;
      const newValue = minimumValue + (percentage * (maximumValue - minimumValue));
      const steppedValue = Math.round(newValue / step) * step;
      
      runOnJS(onValueChange)(Math.max(minimumValue, Math.min(maximumValue, steppedValue)));
    },
    onEnd: () => {
      // Snap to final position
      const percentage = (value - minimumValue) / (maximumValue - minimumValue);
      translateX.value = percentage * SLIDER_WIDTH;
    },
  });

  const thumbStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const trackFillStyle = useAnimatedStyle(() => {
    return {
      width: translateX.value,
    };
  });

  const percentagePosition = ((value - minimumValue) / (maximumValue - minimumValue)) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.sliderContainer}>
        {/* Track Background */}
        <View style={[styles.track, { backgroundColor: theme.colors.surface }]} />
        
        {/* Track Fill */}
        <Animated.View 
          style={[
            styles.trackFill, 
            { backgroundColor: theme.colors.primary },
            trackFillStyle
          ]} 
        />

        {/* Value Labels on Track */}
        {Array.from({ length: Math.floor((maximumValue - minimumValue) / step) + 1 }, (_, index) => {
          const tickValue = minimumValue + (index * step);
          const tickPosition = ((tickValue - minimumValue) / (maximumValue - minimumValue)) * SLIDER_WIDTH;
          
          return (
            <View
              key={tickValue}
              style={[
                styles.tickMark,
                {
                  left: tickPosition - 1,
                  backgroundColor: theme.colors.border,
                }
              ]}
            />
          );
        })}

        {/* Draggable Thumb */}
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View style={[styles.thumb, thumbStyle]}>
            <View style={[styles.thumbInner, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.thumbText}>{value}%</Text>
            </View>
          </Animated.View>
        </PanGestureHandler>
      </View>

      {/* Value Display */}
      <View style={[styles.valueDisplay, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.valueText, { color: theme.colors.text }]}>
          Current RTP: {value}%
        </Text>
        <Text style={[styles.valueDescription, { color: theme.colors.textSecondary }]}>
          {value >= 70 ? 'High Return' : value >= 50 ? 'Medium Return' : 'Conservative Return'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
  },
  sliderContainer: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    height: 8,
    borderRadius: 4,
    width: SLIDER_WIDTH,
  },
  trackFill: {
    position: 'absolute',
    height: 8,
    borderRadius: 4,
    left: 0,
  },
  tickMark: {
    position: 'absolute',
    width: 2,
    height: 12,
    top: 14,
  },
  thumb: {
    position: 'absolute',
    top: -6,
    marginLeft: -20,
  },
  thumbInner: {
    width: 40,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  thumbText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  valueDisplay: {
    marginTop: 15,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  valueText: {
    fontSize: 16,
    fontWeight: '600',
  },
  valueDescription: {
    fontSize: 12,
    marginTop: 2,
  },
});