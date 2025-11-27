import Link from 'next/link';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

type DashboardCourse = {
  id: number;
  title: string;
  description: string | null;
  progress: number;
};

async function getDashboardData(): Promise<DashboardCourse[]> {
  const cookieStore = cookies();
  const supabase = createServerClient(
    'https://tdxpostwbmpnsikjftvy.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkeHBvc3R3Ym1wbnNpa2pmdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDk5MzAsImV4cCI6MjA1ODc4NTkzMH0.-_azSsbF2xre1qQr7vppVoKzHAJRuzIgHzlutAMtmW0',
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return [];

  const { data: purchases } = await supabase
    .from('purchases')
    .select('tutorial_id, all_access')
    .eq('user_id', session.user.id);

  if (!purchases || purchases.length === 0) return [];

  const hasAll = purchases.some((p) => p.all_access);
  const courseIds = hasAll
    ? undefined
    : (purchases
        .map((p) => p.tutorial_id)
        .filter(Boolean) as number[]);

  const { data: courses } = await supabase
    .from('courses')
    .select('id,title,description')
    .in('id', courseIds || [1, 2, 3, 4, 5]);

  const { data: progressRows } = await supabase
    .from('course_progress')
    .select('course_id, progress')
    .eq('user_id', session.user.id);

  const progressByCourse = new Map<number, number>(
    (progressRows || []).map((row: any) => [row.course_id, row.progress])
  );

  return (courses || []).map((c: any) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    progress: progressByCourse.get(c.id) ?? 0,
  }));
}

export default async function DashboardPage() {
  const courses = await getDashboardData();

  if (!courses.length) {
    return (
      <main>
        <h1>My Dashboard</h1>
        <p>You don&apos;t have any courses yet.</p>
        <Link href="/courses">Browse Courses</Link>
      </main>
    );
  }

  return (
    <main>
      <h1>My Dashboard</h1>
      <div>
        {courses.map((course) => (
          <article key={course.id}>
            <h2>{course.title}</h2>
            <p>{course.description}</p>
            <p>{course.progress}% complete</p>
            <Link href={`/course/${course.id}`}>Continue</Link>
          </article>
        ))}
      </div>
    </main>
  );
}


