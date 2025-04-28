import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import anime from 'animejs';
import { Card, TextInput, Button, Alert } from 'rewind-ui';
import { useEffect, useRef } from 'react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, error, loading } = useAuth();
  const navigate = useNavigate();
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animation for the login form
    if (formRef.current) {
      anime({
        targets: formRef.current,
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div ref={formRef} className="w-full max-w-md">
        <Card className="p-8">
          <h2 className="text-2xl font-bold text-center mb-6">Login to Your Account</h2>
          
          {error && (
            <Alert color="red" className="mb-4">
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <TextInput
                label="Email"
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
                placeholder="Your email"
              />
            </div>
            
            <div className="mb-6">
              <TextInput
                label="Password"
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                placeholder="Your password"
              />
            </div>
            
            <Button
              type="submit"
              color="blue"
              loading={loading}
              disabled={loading}
              fullWidth
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-500 hover:text-blue-700">
                Register here
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;