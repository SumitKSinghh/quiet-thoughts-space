import React from 'react';

const GoogleAuthCallback: React.FC = () => {
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (code) {
      // Send the auth code back to the parent window
      window.opener?.postMessage({
        type: 'GOOGLE_AUTH_SUCCESS',
        code
      }, window.location.origin);
    } else if (error) {
      // Send the error back to the parent window
      window.opener?.postMessage({
        type: 'GOOGLE_AUTH_ERROR',
        error
      }, window.location.origin);
    }

    // Close the popup
    window.close();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Completing authentication...</p>
      </div>
    </div>
  );
};

export default GoogleAuthCallback;