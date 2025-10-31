import { useEffect } from 'react';
import { useToast } from '../components/ui/Toast/ToastProvider';
import { setToastContext } from '../store/authStore';

export const useAuthToast = () => {
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    setToastContext({ showSuccess, showError });
    
    return () => {
      setToastContext(null);
    };
  }, [showSuccess, showError]);
};