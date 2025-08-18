// Mobile optimization utilities for better streaming experience

export const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const isIOS = () => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

export const isAndroid = () => {
  if (typeof window === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
};

export const isSafari = () => {
  if (typeof window === 'undefined') return false;
  return /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
};

// Get mobile-optimized video constraints
export const getMobileVideoConstraints = () => {
  const mobile = isMobileDevice();
  const ios = isIOS();
  const android = isAndroid();
  
  if (mobile) {
    // iOS Safari has specific requirements
    if (ios && isSafari()) {
      return {
        width: { ideal: 640, max: 1280 },
        height: { ideal: 480, max: 720 },
        frameRate: { ideal: 24, max: 30 },
        facingMode: 'user'
      };
    }
    
    // Android devices
    if (android) {
      return {
        width: { ideal: 640, max: 1280 },
        height: { ideal: 480, max: 720 },
        frameRate: { ideal: 24, max: 30 },
        facingMode: 'user'
      };
    }
    
    // Generic mobile fallback
    return {
      width: { ideal: 640, max: 1280 },
      height: { ideal: 480, max: 720 },
      frameRate: { ideal: 24, max: 30 },
      facingMode: 'user'
    };
  }
  
  // Desktop constraints
  return {
    width: 1280,
    height: 720,
    facingMode: 'user'
  };
};

// Get mobile-optimized audio constraints
export const getMobileAudioConstraints = () => {
  const mobile = isMobileDevice();
  
  if (mobile) {
    return {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 48000,
      channelCount: 1
    };
  }
  
  return {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  };
};

// Network quality detection
export const getNetworkQuality = () => {
  if (typeof navigator === 'undefined' || !navigator.connection) {
    return 'unknown';
  }
  
  const connection = navigator.connection as any;
  
  if (connection.effectiveType) {
    switch (connection.effectiveType) {
      case 'slow-2g':
      case '2g':
        return 'poor';
      case '3g':
        return 'fair';
      case '4g':
        return 'good';
      default:
        return 'excellent';
    }
  }
  
  return 'unknown';
};

// Check if device supports WebRTC
export const supportsWebRTC = () => {
  if (typeof window === 'undefined') return false;
  
  return !!(
    window.RTCPeerConnection ||
    (window as any).webkitRTCPeerConnection ||
    (window as any).mozRTCPeerConnection
  );
};

// Check if device supports getUserMedia
export const supportsGetUserMedia = () => {
  if (typeof navigator === 'undefined') return false;
  
  return !!(
    navigator.mediaDevices?.getUserMedia ||
    (navigator as any).getUserMedia ||
    (navigator as any).webkitGetUserMedia ||
    (navigator as any).mozGetUserMedia
  );
};

// Get device capabilities
export const getDeviceCapabilities = () => {
  return {
    isMobile: isMobileDevice(),
    isIOS: isIOS(),
    isAndroid: isAndroid(),
    isSafari: isSafari(),
    supportsWebRTC: supportsWebRTC(),
    supportsGetUserMedia: supportsGetUserMedia(),
    networkQuality: getNetworkQuality(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
  };
};

// Optimize video element for mobile
export const optimizeVideoElement = (videoElement: HTMLVideoElement) => {
  if (!videoElement) return;
  
  const mobile = isMobileDevice();
  
  if (mobile) {
    // Mobile-specific optimizations
    videoElement.setAttribute('playsinline', 'true');
    videoElement.setAttribute('webkit-playsinline', 'true');
    videoElement.setAttribute('x5-playsinline', 'true');
    
    // Prevent fullscreen on iOS
    videoElement.setAttribute('webkit-playsinline', 'true');
    videoElement.setAttribute('x5-video-player-type', 'h5');
    videoElement.setAttribute('x5-video-player-fullscreen', 'false');
    
    // Optimize for mobile performance
    videoElement.style.objectFit = 'cover';
    videoElement.style.width = '100%';
    videoElement.style.height = '100%';
  }
};

// Retry logic for mobile connections
export const createRetryHandler = (maxRetries = 5, baseDelay = 1000) => {
  let retryCount = 0;
  
  return {
    shouldRetry: () => retryCount < maxRetries,
    getNextDelay: () => {
      retryCount++;
      return baseDelay * Math.pow(2, retryCount - 1); // Exponential backoff
    },
    reset: () => {
      retryCount = 0;
    },
    getRetryCount: () => retryCount
  };
};
