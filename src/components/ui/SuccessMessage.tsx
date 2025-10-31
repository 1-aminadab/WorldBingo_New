import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckCircle, ArrowRight, X } from 'lucide-react-native';
import { useTheme } from './ThemeProvider';

interface SuccessMessageProps {
  title?: string;
  message: string;
  onAction?: () => void;
  onDismiss?: () => void;
  actionLabel?: string;
  showIcon?: boolean;
  style?: any;
  autoHide?: boolean;
  duration?: number;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  title = 'Success',
  message,
  onAction,
  onDismiss,
  actionLabel = 'Continue',
  showIcon = true,
  style,
  autoHide = false,
  duration = 4000,
}) => {
  const { theme } = useTheme();

  React.useEffect(() => {
    if (autoHide && onDismiss) {
      const timer = setTimeout(() => {
        onDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoHide, onDismiss, duration]);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        {showIcon && (
          <View style={styles.iconContainer}>
            <CheckCircle size={20} color="#10B981" />
          </View>
        )}
        
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {title}
          </Text>
          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
            {message}
          </Text>
        </View>

        {onDismiss && (
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={onDismiss}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {onAction && (
        <TouchableOpacity
          style={[styles.actionButton, { borderTopColor: theme.colors.border }]}
          onPress={onAction}
        >
          <Text style={styles.actionText}>
            {actionLabel}
          </Text>
          <ArrowRight size={16} color="#10B981" style={styles.actionIcon} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#10B98115',
    borderColor: '#10B98130',
    borderWidth: 1,
    borderRadius: 8,
    marginVertical: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
  },
  iconContainer: {
    marginRight: 10,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
  },
  dismissButton: {
    marginLeft: 8,
    marginTop: 2,
  },
  actionButton: {
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },
  actionIcon: {
    marginLeft: 6,
  },
});