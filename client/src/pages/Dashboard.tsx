// src/pages/Dashboard.tsx
import React, { useEffect, useRef } from 'react';
import { Button, Card } from '@rewind-ui/core';
import { animate } from 'animejs';
import { useAuth } from '../contexts/AuthContext';

import MainLayout from '../components/MainLayout';

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const dashboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animation for dashboard elements
    if (dashboardRef.current) {
      animate(dashboardRef.current.querySelectorAll('.animate-item'), {
        opacity: [0, 1],
        translateY: [20, 0],
        delay: (el, i) => i * 100,
        easing: 'easeOutExpo',
        duration: 800
      });
    }
  }, []);

  return (
    <MainLayout maxWidth="lg">
      <div ref={dashboardRef}>
        <Card shadow="lg" className="overflow-hidden">
          <Card.Header className="bg-white border-b border-gray-100 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800 animate-item">Welcome, {user?.user_metadata?.name || 'User'}!</h1>
              <p className="text-gray-500 mt-1 animate-item">Your Perplexity-enhanced dashboard</p>
            </div>
            <Button color="red" onClick={signOut} className="animate-item">
              Sign Out
            </Button>
          </Card.Header>
          
          <Card.Body className="px-6 py-8">
            <div className="animate-item mb-8">
              <p className="text-gray-600">
                This is your enhanced search experience. Soon, you'll be able to search with improved results!
              </p>
            </div>
            
            <div className="animate-item bg-blue-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-2 text-blue-800">Getting Started</h2>
              <p className="text-blue-700">
                We're setting up your enhanced search experience. Check back soon for the main search functionality!
              </p>
            </div>
          </Card.Body>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Dashboard;