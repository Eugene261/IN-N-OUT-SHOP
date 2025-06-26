import { useEffect, useRef } from 'react';

const SoundNotifications = () => {
  const sendSoundRef = useRef(null);
  const receiveSoundRef = useRef(null);

  useEffect(() => {
    // Create audio elements for different notification sounds
    sendSoundRef.current = new Audio();
    receiveSoundRef.current = new Audio();

    // Set audio sources (using web-safe notification sounds)
    // Message sent sound (higher pitch, short)
    sendSoundRef.current.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeDja33/LIeSsFJnjN8N2MNgcYa7zs5Z5MEQ1Mp+PwsmAcCEyw3vLXgiMFjXnF8+KSMQYVZ7f26aBSFhM6qtfzznoqDSlMp9z02YYiDhVYrdfx3YMbCkq85fXjjjMHGGiz7OGbSw0OZrPv7KtWIg9Dnd/z025HCBJ0qOby2IAhEFut2fTWhTQDZrPU8+WLNAVMrtDyzHU3DjDDuf7gfDkCZmqxynw5BXuwx1a4nREQa3QF'
    
    // Message received sound (lower pitch, gentle)
    receiveSoundRef.current.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeDja33/LIeSsFJnjN8N2MNgcYa7zs5Z5MEQ1Mp+PwsmAcCEyw3vLXgiMFjXnF8+KSMQYVZ7f26aBSFhM6qtfzznoqDSlMp9z02YYiDhVYrdfx3YMbCkq85fXjjjMHGGiz7OGbSw0OZrPv7KtWIg9Dnd/z025HCBJ0qOby2IAhEFut2fTWhTQDZrPU8+WLNAVMrtDyzHU3DjDDuf7gfDkCZmqxynw5BXuwx1a4nREQa3QF'

    // Set volume (adjust as needed)
    sendSoundRef.current.volume = 0.3;
    receiveSoundRef.current.volume = 0.4;

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
    };
  }, []);

  // Expose sound playing methods globally
  useEffect(() => {
    window.playMessageSentSound = () => {
      if (sendSoundRef.current) {
        sendSoundRef.current.currentTime = 0;
        sendSoundRef.current.play().catch(e => console.log('Send sound failed:', e));
      }
    };

    window.playMessageReceivedSound = () => {
      if (receiveSoundRef.current) {
        receiveSoundRef.current.currentTime = 0;
        receiveSoundRef.current.play().catch(e => console.log('Receive sound failed:', e));
      }
    };

    return () => {
      delete window.playMessageSentSound;
      delete window.playMessageReceivedSound;
    };
  }, []);

  return null; // This component doesn't render anything
};

export default SoundNotifications; 

