import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { CheckCircle2, XCircle, X, Phone } from 'lucide-react-native';
import { handlePhoneCall } from '../../utils/dateUtils';
import { useTheme } from './ThemeProvider';

type StatusVariant = 'success' | 'error';

interface StatusModalProps {
  visible: boolean;
  variant: StatusVariant;
  title?: string;
  message?: string;
  onDismiss?: () => void;
  autoHideMs?: number;
  showPhoneSupport?: boolean; // Only show for web/payment related issues
}

export const StatusModal: React.FC<StatusModalProps> = ({
  visible,
  variant,
  title,
  message,
  onDismiss,
  autoHideMs,
  showPhoneSupport = false,
}) => {
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const { theme } = useTheme();

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
          
          {/* Only show phone support for web/payment related issues */}
          {showPhoneSupport && (
            <>
              <View style={{width:'100%', height:1, backgroundColor:'rgba(255, 255, 255, 0.23)', marginVertical:10}}/>
              <View style={{marginBottom: 10, gap:10, alignItems:'center'}}>
                <Text style={{ color: 'white' }}>
                  እርዳታ ከፈለጉ በዚ ስልክ ይደውሉ
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => handlePhoneCall('0977791828')}
                    style={[styles.phoneButton, { borderColor: theme.colors.primary }]}
                  >
                    <Text style={[styles.phoneText, { color: theme.colors.primary, gap:10 }]}>
                      <Phone color={'white'} size={13}/> {" "}0977791828
                    </Text>
                  </TouchableOpacity>
                  <Text style={{ color: 'white' }}>|</Text>
                  <TouchableOpacity
                    onPress={() => handlePhoneCall('0940883535')}
                    style={[styles.phoneButton, { borderColor: theme.colors.primary }]}
                  >
                    <Text style={[styles.phoneText, { color: theme.colors.primary }]}>
                    <Phone color={'white'} size={13}/> {" "}0940883535
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
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
  phoneButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneText: {
    fontSize: 14,
    fontWeight: '600',
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default StatusModal;

