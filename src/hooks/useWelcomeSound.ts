import { useCallback } from 'react';

export const useWelcomeSound = () => {
  const playWelcomeSound = useCallback(() => {
    // Create an AudioContext for better control
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a simple pleasant notification sound using oscillators
    const playTone = (frequency: number, startTime: number, duration: number, volume: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    // Create a pleasant chord progression (C Major chord)
    const currentTime = audioContext.currentTime;
    playTone(523.25, currentTime, 0.3, 0.1); // C5
    playTone(659.25, currentTime + 0.05, 0.3, 0.08); // E5
    playTone(783.99, currentTime + 0.1, 0.4, 0.06); // G5
  }, []);

  return { playWelcomeSound };
};
