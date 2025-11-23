import { useRef, useCallback } from 'react';

type NotificationSoundType = 'urgent' | 'high' | 'info';

export const useNotificationSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playBeep = useCallback((frequency: number, duration: number, volume: number = 0.3) => {
    const ctx = initAudioContext();
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }, [initAudioContext]);

  const playUrgentAlert = useCallback(() => {
    // Three rapid high-pitched beeps for urgent
    playBeep(1200, 0.15, 0.4);
    setTimeout(() => playBeep(1200, 0.15, 0.4), 200);
    setTimeout(() => playBeep(1200, 0.15, 0.4), 400);
  }, [playBeep]);

  const playHighPriorityAlert = useCallback(() => {
    // Two medium-pitched beeps for high priority
    playBeep(900, 0.2, 0.3);
    setTimeout(() => playBeep(900, 0.2, 0.3), 250);
  }, [playBeep]);

  const playInfoAlert = useCallback(() => {
    // Single gentle beep for info
    playBeep(600, 0.3, 0.2);
  }, [playBeep]);

  const playSound = useCallback((type: NotificationSoundType) => {
    try {
      switch (type) {
        case 'urgent':
          playUrgentAlert();
          break;
        case 'high':
          playHighPriorityAlert();
          break;
        case 'info':
          playInfoAlert();
          break;
      }
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }, [playUrgentAlert, playHighPriorityAlert, playInfoAlert]);

  return { playSound };
};