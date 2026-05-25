type AuthCallback = (token: string | null) => void;

class AuthManager {
  private listeners: AuthCallback[] = [];

  subscribe(callback: AuthCallback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  appLogin(token: string) {
    this.listeners.forEach(l => l(token));
  }

  appLogout() {
    this.listeners.forEach(l => l(null));
  }
}

export const authManager = new AuthManager();

// Keep the old exports for compatibility but use the new manager internally
export const appLogin = (token: string) => authManager.appLogin(token);
export const appLogout = () => authManager.appLogout();
