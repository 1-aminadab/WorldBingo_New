import { authentication } from '../config/firebaseConfig';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { User } from '../types';

// Simple logging utility
const safeLog = (message: string, data?: any) => {
  if (__DEV__) {
    console.log(`[FirebaseAuth] ${message}`, data || '');
  }
};

export interface FirebaseAuthResult {
  success: boolean;
  user?: User;
  error?: string;
}


class FirebaseAuthService {
  private authStateListener: (() => void) | null = null;

  // Convert Firebase User to App User
  private convertFirebaseUserToAppUser(
    firebaseUser: FirebaseAuthTypes.User
  ): User {
    const appUser: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || 'User',
      avatar: firebaseUser.photoURL || undefined,
      createdAt: firebaseUser.metadata.creationTime ? new Date(firebaseUser.metadata.creationTime) : new Date(),
      isGuest: false,
      gamesPlayed: 0,
      gamesWon: 0,
      totalPlayTime: 0
    };

    safeLog('Converted Firebase user to app user', appUser);
    return appUser;
  }


  // Email/Password Sign Up
  async signUpWithEmailAndPassword(
    email: string,
    password: string,
    displayName: string
  ): Promise<FirebaseAuthResult> {
    try {
      safeLog('Attempting signup with email', { email, displayName });
      
      const result = await authentication.createUserWithEmailAndPassword(email, password);
      
      if (result.user) {
        // Update display name
        await result.user.updateProfile({
          displayName: displayName
        });

        // Convert to app user
        const appUser = this.convertFirebaseUserToAppUser(result.user);
        
        safeLog('Signup successful', { uid: result.user.uid });
        return {
          success: true,
          user: appUser
        };
      }

      return {
        success: false,
        error: 'Failed to create user account'
      };
    } catch (error: any) {
      console.error('Signup error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  // Email/Password Sign In
  async signInWithEmailAndPassword(
    email: string,
    password: string
  ): Promise<FirebaseAuthResult> {
    try {
      safeLog('Attempting signin with email', { email });
      
      const result = await authentication.signInWithEmailAndPassword(email, password);
      
      if (result.user) {
        // Convert to app user
        const appUser = this.convertFirebaseUserToAppUser(result.user);
        
        safeLog('Signin successful', { uid: result.user.uid });
        return {
          success: true,
          user: appUser
        };
      }

      return {
        success: false,
        error: 'Failed to sign in'
      };
    } catch (error: any) {
      console.error('Signin error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  // Sign Out
  async signOut(): Promise<FirebaseAuthResult> {
    try {
      await authentication.signOut();
      safeLog('Signout successful');
      return {
        success: true
      };
    } catch (error: any) {
      console.error('Signout error:', error);
      return {
        success: false,
        error: 'Failed to sign out'
      };
    }
  }

  // Send Password Reset Email
  async sendPasswordResetEmail(email: string): Promise<FirebaseAuthResult> {
    try {
      await authentication.sendPasswordResetEmail(email);
      safeLog('Password reset email sent', { email });
      return {
        success: true
      };
    } catch (error: any) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  // Get Current User
  getCurrentUser(): FirebaseAuthTypes.User | null {
    try {
      return authentication?.currentUser || null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Get Current App User
  getCurrentAppUser(): User | null {
    const firebaseUser = this.getCurrentUser();
    if (firebaseUser) {
      return this.convertFirebaseUserToAppUser(firebaseUser);
    }
    return null;
  }

  // Listen to Authentication State Changes
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    try {
      if (!authentication) {
        safeLog('Authentication not available, calling callback with null');
        setTimeout(() => callback(null), 0);
        return () => {};
      }

      this.authStateListener = authentication.onAuthStateChanged((firebaseUser) => {
        if (firebaseUser) {
          const appUser = this.convertFirebaseUserToAppUser(firebaseUser);
          callback(appUser);
        } else {
          callback(null);
        }
      });

      return () => {
        if (this.authStateListener) {
          this.authStateListener();
          this.authStateListener = null;
        }
      };
    } catch (error) {
      console.error('Auth state listener error:', error);
      setTimeout(() => callback(null), 0);
      return () => {};
    }
  }


  // Check if user is authenticated
  isAuthenticated(): boolean {
    try {
      return this.getCurrentUser() !== null;
    } catch (error) {
      console.error('Is authenticated check error:', error);
      return false;
    }
  }

  // Cleanup
  dispose(): void {
    if (this.authStateListener) {
      this.authStateListener();
      this.authStateListener = null;
    }
  }

  // Convert Firebase Auth error codes to user-friendly messages
  private getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'This email address is already registered. Please use a different email or sign in.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled. Please contact support.';
      case 'auth/weak-password':
        return 'Password is too weak. Please choose a stronger password.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection and try again.';
      default:
        return 'An error occurred. Please try again.';
    }
  }
}

// Export singleton instance
export const firebaseAuthService = new FirebaseAuthService();
export default firebaseAuthService;