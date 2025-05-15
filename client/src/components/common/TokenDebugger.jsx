import React, { useState, useEffect } from 'react';

const TokenDebugger = () => {
  const [tokenInfo, setTokenInfo] = useState({
    cookieToken: null,
    localStorageToken: null,
    tokenExpiry: null,
    tokenContents: null
  });
  
  const [manualToken, setManualToken] = useState('');
  const [showManualTokenInput, setShowManualTokenInput] = useState(false);
  
  const refreshTokenInfo = () => {
    // Check token in cookies
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
    const cookieToken = tokenCookie ? tokenCookie.split('=')[1] : null;
    
    // Check token in localStorage
    const localStorageToken = localStorage.getItem('token');
    
    // Get token information
    const token = cookieToken || localStorageToken;
    let tokenContents = null;
    let tokenExpiry = null;
    
    if (token) {
      try {
        // Decode token payload (without verification)
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        tokenContents = decoded;
        
        // Get expiration date
        if (decoded.exp) {
          tokenExpiry = new Date(decoded.exp * 1000).toLocaleString();
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
    
    setTokenInfo({
      cookieToken: cookieToken ? 'Present' : 'Missing',
      localStorageToken: localStorageToken ? 'Present' : 'Missing',
      tokenExpiry,
      tokenContents
    });
  };
  
  useEffect(() => {
    refreshTokenInfo();
    // Set up interval to refresh token info every 10 seconds
    const interval = setInterval(refreshTokenInfo, 10000);
    return () => clearInterval(interval);
  }, []);
  
  const setTokenToLocalStorage = () => {
    if (manualToken) {
      localStorage.setItem('token', manualToken);
      setManualToken('');
      refreshTokenInfo();
      alert('Token set to localStorage');
    }
  };
  
  const clearAllTokens = () => {
    localStorage.removeItem('token');
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    refreshTokenInfo();
  };
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      zIndex: 9999,
      maxWidth: '400px',
      fontSize: '12px'
    }}>
      <h4 style={{ margin: '0 0 10px 0' }}>Auth Token Debug</h4>
      <div style={{ marginBottom: '5px' }}>
        <strong>Cookie Token:</strong> {tokenInfo.cookieToken}
      </div>
      <div style={{ marginBottom: '5px' }}>
        <strong>LocalStorage Token:</strong> {tokenInfo.localStorageToken}
      </div>
      {tokenInfo.tokenExpiry && (
        <div style={{ marginBottom: '5px' }}>
          <strong>Expires:</strong> {tokenInfo.tokenExpiry}
        </div>
      )}
      {tokenInfo.tokenContents && (
        <div>
          <strong>Contents:</strong>
          <pre style={{ 
            maxHeight: '150px', 
            overflow: 'auto', 
            background: 'rgba(0, 0, 0, 0.5)',
            padding: '5px',
            fontSize: '10px'
          }}>
            {JSON.stringify(tokenInfo.tokenContents, null, 2)}
          </pre>
        </div>
      )}
      
      <div style={{ marginTop: '10px', display: 'flex', gap: '5px' }}>
        <button 
          onClick={() => setShowManualTokenInput(!showManualTokenInput)}
          style={{
            background: '#444',
            border: 'none',
            color: 'white',
            padding: '3px 8px',
            borderRadius: '3px',
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          {showManualTokenInput ? 'Hide' : 'Set Token'}
        </button>
        
        <button 
          onClick={clearAllTokens}
          style={{
            background: '#700',
            border: 'none',
            color: 'white',
            padding: '3px 8px',
            borderRadius: '3px',
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          Clear All
        </button>
        
        <button 
          onClick={refreshTokenInfo}
          style={{
            background: '#060',
            border: 'none',
            color: 'white',
            padding: '3px 8px',
            borderRadius: '3px',
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          Refresh
        </button>
      </div>
      
      {showManualTokenInput && (
        <div style={{ marginTop: '10px' }}>
          <input
            type="text"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            placeholder="Paste JWT token here"
            style={{
              width: '100%',
              padding: '5px',
              fontSize: '10px',
              marginBottom: '5px'
            }}
          />
          <button 
            onClick={setTokenToLocalStorage}
            style={{
              background: '#060',
              border: 'none',
              color: 'white',
              padding: '3px 8px',
              borderRadius: '3px',
              fontSize: '10px',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            Save to LocalStorage
          </button>
        </div>
      )}
    </div>
  );
};

export default TokenDebugger; 