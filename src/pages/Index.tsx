
import React from 'react';
import Login from './Login';

const Index = () => {
  // TODO: Add authentication state management
  // For now, show login page. After Supabase integration,
  // this will check auth state and show Dashboard or Login accordingly
  
  const isAuthenticated = false; // This will be managed by Supabase auth

  if (isAuthenticated) {
    // Import Dashboard dynamically when needed
    const Dashboard = React.lazy(() => import('./Dashboard'));
    return (
      <React.Suspense fallback={<div>Loading...</div>}>
        <Dashboard />
      </React.Suspense>
    );
  }

  return <Login />;
};

export default Index;
