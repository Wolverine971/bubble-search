import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import anime from 'animejs';
import { Card, TextInput, Button, Alert } from 'rewind-ui';

interface ApiKey {
  id?: number;
  service_name: string;
  api_key: string;
}

const ApiKeys: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    { service_name: 'OpenAI', api_key: '' },
    { service_name: 'LangGraph', api_key: '' }
  ]);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animation for the API keys form
    if (formRef.current) {
      anime({
        targets: formRef.current,
        opacity: [0, 1],
        translateY: [20, 0],
        easing: 'easeOutExpo',
        duration: 800
      });
    }

    // Fetch existing API keys
    const fetchApiKeys = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('api_keys')
          .select('*')
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          // Update the state with existing keys
          const newApiKeys = [...apiKeys];
          
          data.forEach((key) => {
            const index = newApiKeys.findIndex(k => k.service_name === key.service_name);
            if (index !== -1) {
              newApiKeys[index] = key;
            } else {
              newApiKeys.push(key);
            }
          });
          
          setApiKeys(newApiKeys);
        }
      } catch (error) {
        console.error('Error fetching API keys:', error);
        setError('Failed to load API keys');
      }
    };

    fetchApiKeys();
  }, [user]);

  const handleChange = (index: number, value: string) => {
    const newApiKeys = [...apiKeys];
    newApiKeys[index].api_key = value;
    setApiKeys(newApiKeys);
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Save each API key
      for (const key of apiKeys) {
        if (!key.api_key) continue;
        
        const { error } = await supabase
          .from('api_keys')
          .upsert(
            {
              user_id: user.id,
              service_name: key.service_name,
              api_key: key.api_key
            },
            { onConflict: 'user_id, service_name' }
          );
        
        if (error) throw error;
      }
      
      setSuccess('API keys saved successfully');
      
      // Navigate to dashboard after short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Error saving API keys:', error);
      setError('Failed to save API keys');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div ref={formRef} className="w-full max-w-md">
        <Card className="p-8">
          <h2 className="text-2xl font-bold text-center mb-6">Add Your API Keys</h2>
          
          {error && (
            <Alert color="red" className="mb-4">
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert color="green" className="mb-4">
              {success}
            </Alert>
          )}
          
          <div className="space-y-4">
            {apiKeys.map((key, index) => (
              <div key={key.service_name}>
                <TextInput
                  label={`${key.service_name} API Key`}
                  id={`apiKey-${index}`}
                  type="password"
                  value={key.api_key}
                  onChange={(e) => handleChange(index, e.target.value)}
                  fullWidth
                  placeholder={`Enter your ${key.service_name} API key`}
                />
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <Button
              onClick={handleSave}
              color="blue"
              loading={saving}
              disabled={saving}
              fullWidth
            >
              {saving ? 'Saving...' : 'Save and Continue'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ApiKeys;