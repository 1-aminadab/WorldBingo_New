import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertTriangle, XCircle, RefreshCw, X } from 'lucide-react-native';
import { useTheme } from './ThemeProvider';

export type ErrorType = 'network' | 'auth' | 'validation' | 'server' | 'unknown';

interface ErrorMessageProps {
  title?: string;
  message: string;
  type?: ErrorType;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryLabel?: string;
  showIcon?: boolean;
  style?: any;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  type = 'unknown',
  onRetry,
  onDismiss,
  retryLabel = 'Try Again',
  showIcon = true,
  style,
}) => {
  const { theme } = useTheme();

  const getIcon = () => {
    if (!showIcon) return null;

    const iconProps = { size: 20, color: '#EF4444' };
    
    switch (type) {
      case 'network':
        return <RefreshCw {...iconProps} />;
      case 'auth':
        return <XCircle {...iconProps} />;
      case 'validation':
        return <AlertTriangle {...iconProps} />;
      case 'server':
        return <XCircle {...iconProps} />;
      default:
        return <AlertTriangle {...iconProps} />;
    }
  };

  const getTitle = () => {
    if (title) return title;
    
    switch (type) {
      case 'network':
        return 'Network Error';
      case 'auth':
        return 'Authentication Error';
      case 'validation':
        return 'Validation Error';
      case 'server':
        return 'Server Error';
      default:
        return 'Error';
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        {showIcon && (
          <View style={styles.iconContainer}>
            {getIcon()}
          </View>
        )}
        
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {getTitle()}
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

      {onRetry && (
        <TouchableOpacity
          style={[styles.retryButton, { borderTopColor: theme.colors.border }]}
          onPress={onRetry}
        >
          <RefreshCw size={16} color="#EF4444" style={styles.retryIcon} />
          <Text style={styles.retryText}>
            {retryLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EF444415',
    borderColor: '#EF444430',
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
  retryButton: {
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  retryIcon: {
    marginRight: 6,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
});