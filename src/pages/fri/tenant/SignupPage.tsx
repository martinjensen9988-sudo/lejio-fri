import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface SignupFormData {
  company_name: string;
  email: string;
  subdomain: string;
}

export function TenantSignupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SignupFormData>({
    company_name: '',
    email: '',
    subdomain: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Auto-generate subdomain from company name
    if (name === 'company_name') {
      const slug = value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: value,
        subdomain: slug
      }));
    } else if (name === 'subdomain') {
      // Allow only lowercase, numbers, hyphens
      processedValue = value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, [name]: processedValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: processedValue }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!formData.company_name.trim()) {
      setError('Company name is required');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }
    if (!formData.subdomain || formData.subdomain.length < 3) {
      setError('Subdomain must be at least 3 characters');
      return;
    }
    if (!/^[a-z0-9-]{3,50}$/.test(formData.subdomain)) {
      setError('Subdomain can only contain lowercase letters, numbers, and hyphens');
      return;
    }

    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${apiUrl}/TenantSignup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create tenant (${response.status})`);
      }

      const data = await response.json();
      
      setSuccess(true);
      setFormData({ company_name: '', email: '', subdomain: '' });
      
      // Redirect to tenant subdomain after 2 seconds
      setTimeout(() => {
        const tenantUrl = `https://${data.subdomain}.ditdomæne.dk`;
        window.location.href = tenantUrl;
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Start din gratis prøveperiode</CardTitle>
          <CardDescription>
            Få din egen white‑label platform på 30 sekunder
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ✅ Tenant created! Redirecting to your instance...
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                placeholder="fx Din Biludlejning"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="subdomain">
                Subdomain
                {formData.subdomain && (
                  <span className="text-xs text-gray-500 ml-2">
                    → {formData.subdomain}.ditdomæne.dk
                  </span>
                )}
              </Label>
              <Input
                id="subdomain"
                name="subdomain"
                value={formData.subdomain}
                onChange={handleChange}
                placeholder="yourcompany"
                required
                disabled={isLoading}
                minLength={3}
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-1">
                Auto-generated from company name. Can contain letters, numbers, hyphens.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || success}
              size="lg"
            >
              {isLoading ? 'Creating Tenant...' : success ? 'Redirecting...' : 'Create Tenant'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-gray-600 text-center">
              📧 Check your email for login credentials<br/>
              ⏰ 30-day free trial included<br/>
              💳 No credit card required
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TenantSignupPage;
