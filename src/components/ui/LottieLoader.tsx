'use client';

import Lottie from 'lottie-react';
import { useEffect, useState } from 'react';

interface LottieLoaderProps {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function LottieLoader({ fullScreen = false, size = 'md' }: LottieLoaderProps) {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    // Fetch the Lottie animation
    fetch('https://lottie.host/32d751ab-9c7f-4236-938c-21731a459bf9/O1QTtgqRYF.json')
      .then(response => response.json())
      .then(data => setAnimationData(data))
      .catch(error => console.error('Failed to load animation:', error));
  }, []);

  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-48 h-48',
    lg: 'w-64 h-64'
  };

  if (!animationData) {
    return (
      <div className={fullScreen ? 'min-h-screen flex items-center justify-center bg-gray-900' : 'flex items-center justify-center p-8'}>
        <div className="w-8 h-8 border-2 border-[#b1e787] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className={sizeClasses[size]}>
          <Lottie animationData={animationData} loop={true} />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${sizeClasses[size]}`}>
      <Lottie animationData={animationData} loop={true} />
    </div>
  );
}
