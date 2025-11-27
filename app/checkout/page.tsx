'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../providers/AuthProvider';

declare global {
  interface Window {
    paypal?: any;
  }
}

const COURSE_PRICE_MAP: Record<number, number> = {
  1: 97,
  2: 97,
  3: 97,
  4: 97,
  5: 97,
};

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [courseId, setCourseId] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const paypalContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const search = new URLSearchParams(window.location.search);
      const value = Number(search.get('courseId') || '1');
      setCourseId(Number.isNaN(value) ? 1 : value);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      router.replace(`/sign-up?redirectTo=/checkout?courseId=${courseId}`);
    }
  }, [user, router, courseId]);

  useEffect(() => {
    if (!user || !courseId) return;

    const clientId =
      process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
      'AX6xkdJVByAeHykBdruW3JfGNu4mL9K7UKIvU5LMZ6sqbWr2PpbHNY_myDxyjKnn0xcXlyFlgx6IAgkr';

    function renderButtons() {
      if (!window.paypal || !paypalContainerRef.current) return;
      const price = COURSE_PRICE_MAP[courseId] || 97;

      window.paypal
        .Buttons({
          createOrder: (_data: any, actions: any) => {
            return actions.order.create({
              purchase_units: [
                {
                  amount: { value: price.toString(), currency_code: 'USD' },
                  description: `Course ${courseId}`,
                },
              ],
            });
          },
          onApprove: async (_data: any, actions: any) => {
            const details = await actions.order.capture();
            await fetch('/.netlify/functions/paypalCapture', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: details.id,
                courseId,
                userId: user?.id,
                email: user?.email,
                amount: price,
                currency: 'USD',
              }),
            });
            router.replace('/dashboard');
          },
          onError: (err: any) => {
            console.error('PayPal error', err);
          },
        })
        .render(paypalContainerRef.current);

      setLoading(false);
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src*=\"www.paypal.com/sdk/js\"]'
    );

    if (existing) {
      existing.addEventListener('load', renderButtons);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
    script.async = true;
    script.onload = renderButtons;
    document.body.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, [user, courseId, router]);

  return (
    <main>
      <h1>Checkout</h1>
      <p>Course ID: {courseId}</p>
      <div ref={paypalContainerRef} />
      {loading && <p>Loading payment options…</p>}
    </main>
  );
}



