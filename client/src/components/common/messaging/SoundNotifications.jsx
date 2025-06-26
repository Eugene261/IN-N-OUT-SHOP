import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';

const SoundNotifications = () => {
  const sendSoundRef = useRef(null);
  const receiveSoundRef = useRef(null);
  const audioContextRef = useRef(null);
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  useEffect(() => {
    // Initialize audio differently for mobile vs desktop
    if (isMobile) {
      // For mobile, use Web Audio API when possible
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      } catch (error) {
        console.log('Web Audio API not available:', error);
      }
    } else {
      // For desktop, use Audio elements with base64 data
      sendSoundRef.current = new Audio();
      receiveSoundRef.current = new Audio();

      // Set audio sources (using web-safe notification sounds)
      sendSoundRef.current.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeDja33/LIeSsFJnjN8N2MNgcYa7zs5Z5MEQ1Mp+PwsmAcCEyw3vLXgiMFjXnF8+KSMQYVZ7f26aBSFhM6qtfzznoqDSlMp9z02YYiDhVYrdfx3YMbCkq85fXjjjMHGGiz7OGbSw0OZrPv7KtWIg9Dnd/z025HCBJ0qOby2IAhEFut2fTWhTQDZrPU8+WLNAVMrtDyzHU3DjDDuf7gfDkCZmqxynw5BXuwx1a4nREQa3QF';
      receiveSoundRef.current.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeDja33/LIeSsFJnjN8N2MNgcYa7zs5Z5MEQ1Mp+PwsmAcCEyw3vLXgiMFjXnF8+KSMQYVZ7f26aBSFhM6qtfzznoqDSlMp9z02YYiDhVYrdfx3YMbCkq85fXjjjMHGGiz7OGbSw0OZrPv7KtWIg9Dnd/z025HCBJ0qOby2IAhEFut2fTWhTQDZrPU8+WLNAVMrtDyzHU3DjDDuf7gfDkCZmqxynw5BXuwx1a4nREQa3QF';

      // Set volume (adjust as needed)
      sendSoundRef.current.volume = 0.3;
      receiveSoundRef.current.volume = 0.4;
    }

    return () => {
      // Cleanup
      if (sendSoundRef.current) {
        sendSoundRef.current.pause();
        sendSoundRef.current = null;
      }
      if (receiveSoundRef.current) {
        receiveSoundRef.current.pause();
        receiveSoundRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [isMobile]);

  // Create beep sound using Web Audio API (better for mobile)
  const createBeepSound = (frequency = 800, duration = 0.2, volume = 0.1) => {
    return new Promise((resolve, reject) => {
      try {
        if (!audioContextRef.current) {
          resolve(); // Silent fail if no audio context
          return;
        }

        // Resume audio context if suspended (common on mobile)
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().then(() => {
            playBeep();
          }).catch(reject);
        } else {
          playBeep();
        }

        function playBeep() {
          try {
            const oscillator = audioContextRef.current.createOscillator();
            const gainNode = audioContextRef.current.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContextRef.current.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            gainNode.gain.value = volume;
            
            // Fade out to avoid clicking
            gainNode.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration);
            
            oscillator.start();
            oscillator.stop(audioContextRef.current.currentTime + duration);
            
            oscillator.onended = () => resolve();
          } catch (error) {
            reject(error);
          }
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  // Expose sound playing methods globally
  useEffect(() => {
    window.playMessageSentSound = () => {
      if (isMobile) {
        // Use Web Audio API for mobile
        createBeepSound(900, 0.15, 0.1).catch(e => console.log('Send sound failed:', e));
      } else {
        // Use Audio element for desktop
        if (sendSoundRef.current) {
          sendSoundRef.current.currentTime = 0;
          sendSoundRef.current.play().catch(e => console.log('Send sound failed:', e));
        }
      }
    };

    window.playMessageReceivedSound = () => {
      if (isMobile) {
        // Use Web Audio API for mobile (lower pitch)
        createBeepSound(700, 0.25, 0.1).catch(e => console.log('Receive sound failed:', e));
      } else {
        // Use Audio element for desktop
        if (receiveSoundRef.current) {
          receiveSoundRef.current.currentTime = 0;
          receiveSoundRef.current.play().catch(e => console.log('Receive sound failed:', e));
        }
      }
    };

    // Initialize audio context on user interaction (required for mobile)
    const initializeAudioOnInteraction = () => {
      if (isMobile && audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(e => console.log('Audio context resume failed:', e));
      }
    };

    // Add listeners for user interaction to unlock audio on mobile
    const interactionEvents = ['touchstart', 'touchend', 'mousedown', 'keydown'];
    interactionEvents.forEach(event => {
      document.addEventListener(event, initializeAudioOnInteraction, { 
        once: true,
        passive: true 
      });
    });

    return () => {
      delete window.playMessageSentSound;
      delete window.playMessageReceivedSound;
      
      // Remove interaction listeners
      interactionEvents.forEach(event => {
        document.removeEventListener(event, initializeAudioOnInteraction);
      });
    };
  }, [isMobile]);

  return null; // This component doesn't render anything
};

export default SoundNotifications;  

