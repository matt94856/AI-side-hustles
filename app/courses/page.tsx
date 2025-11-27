import Link from 'next/link';

// Simple static catalog view – CTAs are moved into the Next flow
const COURSES = [
  { id: 1, title: 'AI in Marketing', description: 'Use AI to plan, write, and analyze campaigns.' },
  { id: 2, title: 'AI for Social Media', description: 'Repurpose and schedule content across channels.' },
  { id: 3, title: 'AI Automation', description: 'Automate onboarding, follow-up, and internal tasks.' },
  { id: 4, title: 'AI Content Creation', description: 'Turn ideas into articles, emails, and pages.' },
  { id: 5, title: 'AI Analytics & Insights', description: 'Track what matters and forecast with AI.' },
];

export default function CoursesPage() {
  return (
    <main>
      <h1>Courses</h1>
      <p>Browse the available AI tracks for your business.</p>
      <div>
        {COURSES.map((course) => (
          <article key={course.id}>
            <h2>{course.title}</h2>
            <p>{course.description}</p>
            <Link href={`/course/${course.id}`}>View course</Link>
          </article>
        ))}
      </div>
    </main>
  );
}


