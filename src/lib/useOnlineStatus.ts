import { useEffect, useRef } from 'react';

export function useOnlineStatus() {
  const sessionId = useRef<string>(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Start heartbeat to keep user online
    const startHeartbeat = () => {
      heartbeatInterval.current = setInterval(async () => {
        try {
          await fetch('/api/users/online', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ sessionId: sessionId.current })
          });
        } catch (error) {
          console.error('Failed to update online status:', error);
        }
      }, 60000); // Update every 60 seconds (reduced frequency)
    };

    // Initial heartbeat
    const initialHeartbeat = async () => {
      try {
        await fetch('/api/users/online', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ sessionId: sessionId.current })
        });
      } catch (error) {
        console.error('Failed to set initial online status:', error);
      }
    };

    initialHeartbeat();
    startHeartbeat();

    // Cleanup on unmount
    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      
      // Mark user as offline
      fetch('/api/users/online', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sessionId: sessionId.current })
      }).catch(error => {
        console.error('Failed to set offline status:', error);
      });
    };
  }, []);

  return sessionId.current;
}
