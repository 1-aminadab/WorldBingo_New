import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  X 
} from 'lucide-react-native';
import { useTheme } from '../ThemeProvider';
import type { Toast } from './ToastProvider';

interface ToastItemProps {
  toast: Toast;
  onHide: (id: string) => void;
}

export const ToastItem: React.FC<ToastItemProps> = ({ toast, onHide }) => {
  const { theme } = useTheme();
  const translateY = useRef(new Animated.Value(-100)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide(toast.id);
    });
  };

  const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    const { translationX } = event.nativeEvent;
    if (Math.abs(translationX) > 50) {
      hideToast();
    }
  };

  const getIcon = () => {
    const iconProps = { size: 20, color: getIconColor() };
    
    switch (toast.type) {
      case 'success':
        return <CheckCircle {...iconProps} />;
      case 'error':
        return <XCircle {...iconProps} />;
      case 'warning':
        return <AlertTriangle {...iconProps} />;
      case 'info':
        return <Info {...iconProps} />;
      default:
        return <Info {...iconProps} />;
    }
  };

  const getIconColor = () => {
    switch (toast.type) {
      case 'success':
        return '#10B981';
      case 'error':
        return '#EF4444';
      case 'warning':
        return '#F59E0B';
      case 'info':
        return '#3B82F6';
      default:
        return theme.colors.text;
    }
  };

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return '#10B98120';
      case 'error':
        return '#EF444420';
      case 'warning':
        return '#F59E0B20';
      case 'info':
        return '#3B82F620';
      default:
        return theme.colors.surface;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return '#10B98140';
      case 'error':
        return '#EF444440';
      case 'warning':
        return '#F59E0B40';
      case 'info':
        return '#3B82F640';
      default:
        return theme.colors.border;
    }
  };

  return (
    <PanGestureHandler onGestureEvent={onGestureEvent}>
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: getBackgroundColor(),
            borderColor: getBorderColor(),
            transform: [{ translateY }, { translateX }],
            opacity,
          },
        ]}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            {getIcon()}
          </View>
          
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {toast.title}
            </Text>
            {toast.message && (
              <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
                {toast.message}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={hideToast}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {toast.action && (
          <TouchableOpacity
            style={[styles.actionButton, { borderTopColor: getBorderColor() }]}
            onPress={() => {
              toast.action?.onPress();
              hideToast();
            }}
          >
            <Text style={[styles.actionText, { color: getIconColor() }]}>
              {toast.action.label}
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  closeButton: {
    marginLeft: 8,
    marginTop: 2,
  },
  actionButton: {
    borderTopWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});