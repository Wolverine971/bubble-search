// src/pages/Login.tsx
import { Alert, Button, Card, Input } from '@rewind-ui/core';
import { animate } from 'animejs';
import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import MainLayout from '../components/MainLayout';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, error, loading } = useAuth();
  const navigate = useNavigate();
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animation for the login form
    if (formRef.current) {
      animate(formRef.current, {
        opacity: [0, 1],
        translateY: [20, 0],
        easing: 'easeOutExpo',
        duration: 800
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn(email, password);
    
    if (!error) {
      navigate('/dashboard');
    }
  };

  return (
    <MainLayout>
      <div ref={formRef}>
        <Card shadow="lg" className="overflow-hidden">
          <Card.Header className="bg-white border-b border-gray-100">
            <h2 className="text-2xl font-semibold text-center text-gray-800">Welcome Back</h2>
            <p className="text-center text-gray-500 mt-1">Login to your account</p>
          </Card.Header>
          
          <Card.Body className="px-6 py-8">
            {error && (
              <Alert color="red" className="mb-6">
                {error}
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Input
                  label="Email Address"
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  fullWidth
                  placeholder="you@example.com"
                  shadow="sm"
                />
              </div>
              
              <div>
                <Input
                  label="Password"
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  fullWidth
                  placeholder="Your password"
                  shadow="sm"
                />
              </div>
              
              <Button
                type="submit"
                color="blue"
                loading={loading}
                disabled={loading}
                fullWidth
                className="mt-6"
              >
                {loading ? 'Logging in...' : 'Sign In'}
              </Button>
            </form>
          </Card.Body>
          
          <Card.Footer className="bg-gray-50 border-t border-gray-100 px-6 py-4">
            <p className="text-center text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-800 font-medium">
                Register here
              </Link>
            </p>
          </Card.Footer>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Login;