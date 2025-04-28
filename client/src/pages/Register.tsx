import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import anime from 'animejs';
import { Card, TextInput, Button, Alert } from 'rewind-ui';

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div ref={formRef} className="w-full max-w-md">
        <Card className="p-8">
          <h2 className="text-2xl font-bold text-center mb-6">Create an Account</h2>
          
          {(error || formError) && (
            <Alert color="red" className="mb-4">
              {formError || error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <TextInput
                label="Name"
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
                placeholder="Your name"
              />
            </div>
            
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
            
            <div className="mb-4">
              <TextInput
                label="Password"
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                placeholder="Choose a password"
              />
            </div>
            
            <div className="mb-6">
              <TextInput
                label="Confirm Password"
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                fullWidth
                placeholder="Confirm your password"
              />
            </div>
            
            <Button
              type="submit"
              color="blue"
              loading={loading}
              disabled={loading}
              fullWidth
            >
              {loading ? 'Creating account...' : 'Register'}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="text-blue-500 hover:text-blue-700">
                Login here
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Register;