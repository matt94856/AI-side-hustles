'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '../../lib/supabaseClient';

export default function SignUpPage() {
  const router = useRouter();
  const [redirectTo, setRedirectTo] = useState('/dashboard');
  const supabase = createSupabaseBrowserClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const search = new URLSearchParams(window.location.search);
    const value = search.get('redirectTo');
    if (value) setRedirectTo(value);
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement)
      .value;

    setLoading(true);
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: undefined },
    });
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    router.replace(redirectTo || '/dashboard');
  };

  return (
    <main>
      <h1>Create your account</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Email
            <input name="email" type="email" required />
          </label>
        </div>
        <div>
          <label>
            Password
            <input name="password" type="password" required />
          </label>
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Sign Up'}
        </button>
      </form>
    </main>
  );
}


