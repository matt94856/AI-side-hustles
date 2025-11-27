import Link from 'next/link';

export default function HomePage() {
  // Middleware will redirect logged-in users away from this page
  return (
    <main>
      <section>
        <h1>Premium Web Creators</h1>
        <p>
          Learn how to apply AI to your marketing, content, and automation with
          practical, Coursera-style course flows.
        </p>
        <div>
          <Link href="/courses">Browse Courses</Link>
          {' · '}
          <Link href="/sign-up">Start Learning</Link>
        </div>
      </section>
    </main>
  );
}


