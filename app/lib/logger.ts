// Remote logging utility for debugging Mini App
export const logger = {
  log: (message: string, data?: any) => {
    const logData = {
      timestamp: new Date().toISOString(),
      message,
      data,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    };
    
    console.log('🔍', logData);
    
    // Send to remote logging service (optional)
    if (typeof window !== 'undefined') {
      // You can send to a logging service like LogRocket, Sentry, or your own endpoint
      // fetch('/api/log', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(logData),
      // }).catch(() => {
      //   // Silently fail if logging endpoint doesn't exist
      // });
    }
  },
  
  error: (message: string, error?: any) => {
    logger.log(`❌ ERROR: ${message}`, error);
  },
  
  wallet: (message: string, data?: any) => {
    logger.log(`💰 WALLET: ${message}`, data);
  },
};
