// src/pages/Register.tsx
import { Alert, Button, Card, Input } from '@rewind-ui/core';
import { animate } from 'animejs';
import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import MainLayout from '../components/MainLayout';
import { useAuth } from '../contexts/AuthContext';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  
  const { signUp, error, loading } = useAuth();
  const navigate = useNavigate();
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animation for the register form
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
    setFormError(null);
    
    if (password !== confirmPassword) {
      setFormError("Passwords don't match");
      return;
    }
    
    await signUp(email, password, name);
    
    if (!error) {
      navigate('/api-keys');
    }
  };

  return (
    <MainLayout>
      <div ref={formRef}>
        <Card shadow="lg" className="overflow-hidden">
          <Card.Header className="bg-white border-b border-gray-100">
            <h2 className="text-2xl font-semibold text-center text-gray-800">Create an Account</h2>
            <p className="text-center text-gray-500 mt-1">Join our platform</p>
          </Card.Header>
          
          <Card.Body className="px-6 py-8">
            {(error || formError) && (
              <Alert color="red" className="mb-6">
                {formError || error}
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Input
                  label="Full Name"
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  fullWidth
                  placeholder="John Doe"
                  shadow="sm"
                />
              </div>
              
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
                  placeholder="Choose a secure password"
                  shadow="sm"
                />
              </div>
              
              <div>
                <Input
                  label="Confirm Password"
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  fullWidth
                  placeholder="Confirm your password"
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
                {loading ? 'Creating account...' : 'Register'}
              </Button>
            </form>
          </Card.Body>
          
          <Card.Footer className="bg-gray-50 border-t border-gray-100 px-6 py-4">
            <p className="text-center text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                Login here
              </Link>
            </p>
          </Card.Footer>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Register;