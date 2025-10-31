import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { CheckCircle2, XCircle, X } from 'lucide-react-native';

type StatusVariant = 'success' | 'error';

interface StatusModalProps {
  visible: boolean;
  variant: StatusVariant;
  title?: string;
  message?: string;
  onDismiss?: () => void;
  autoHideMs?: number;
}

export const StatusModal: React.FC<StatusModalProps> = ({
  visible,
  variant,
  title,
  message,
  onDismiss,
  autoHideMs,
}) => {
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(scale, { toValue: 1, duration: 160, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
      ]).start();

      if (autoHideMs && onDismiss) {
        const t = setTimeout(onDismiss, autoHideMs);
        return () => clearTimeout(t);
      }
    } else {
      scale.setValue(0.9);
      opacity.setValue(0);
    }
  }, [visible, autoHideMs, onDismiss, opacity, scale]);

  const isSuccess = variant === 'success';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { transform: [{ scale }], opacity }] }>
          <View style={[styles.iconWrap, isSuccess ? styles.iconWrapSuccess : styles.iconWrapError]}>
            {isSuccess ? (
              <CheckCircle2 size={28} color="#0F5132" />
            ) : (
              <XCircle size={28} color="#842029" />
            )}
          </View>

          {!!title && (
            <Text style={[styles.title, isSuccess ? styles.titleSuccess : styles.titleError]}>{title}</Text>
          )}
          {!!message && (
            <Text style={styles.message}>{message}</Text>
          )}

          {onDismiss && (
            <TouchableOpacity style={styles.closeBtn} onPress={onDismiss}>
              <X size={18} color="#6c757d" />
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#1f1f1f',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconWrapSuccess: {
    backgroundColor: '#cfe7ff',
  },
  iconWrapError: {
    backgroundColor: '#f8d7da',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    color: '#ffffff',
  },
  titleSuccess: {
    color: '#cfe7ff',
  },
  titleError: {
    color: '#f8d7da',
  },
  message: {
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
    marginBottom: 8,
  },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  closeText: {
    color: '#adb5bd',
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default StatusModal;

