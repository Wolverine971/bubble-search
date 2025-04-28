import React, { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from 'rewind-ui';
import anime from 'animejs';

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const dashboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animation for dashboard elements
    if (dashboardRef.current) {
      anime({
        targets: dashboardRef.current.querySelectorAll('.animate-item'),
        opacity: [0, 1],
        translateY: [20, 0],
        delay: anime.stagger(100),
        easing: 'easeOutExpo',
        duration: 800
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div ref={dashboardRef} className="bg-white shadow rounded-lg p-6">
          <div className="animate-item flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Welcome, {user?.user_metadata?.name || 'User'}!</h1>
            <Button color="red" onClick={signOut}>
              Sign Out
            </Button>
          </div>
          
          <div className="animate-item mb-8">
            <p className="text-gray-600">
              This is your Perplexity-enhanced dashboard. Soon, you'll be able to search with enhanced results!
            </p>
          </div>
          
          <div className="animate-item bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Getting Started</h2>
            <p>
              We're setting up your enhanced search experience. Check back soon for the main search functionality!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;