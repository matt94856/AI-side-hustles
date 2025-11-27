import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import { LessonList } from '../LessonList';

async function getCourseContext(courseId: number) {
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

  if (!session) {
    redirect(`/sign-up?redirectTo=/course/${courseId}`);
  }

  const userId = session!.user.id;

  // Enrollment check
  const { data: purchase } = await supabase
    .from('purchases')
    .select('tutorial_id, all_access')
    .eq('user_id', userId)
    .or(`tutorial_id.eq.${courseId},all_access.eq.true`)
    .maybeSingle();

  if (!purchase) {
    redirect(`/checkout?courseId=${courseId}`);
  }

  const [{ data: course }, { data: lessons }, { data: progress }] =
    await Promise.all([
      supabase
        .from('courses')
        .select('id,title,description')
        .eq('id', courseId)
        .single(),
      supabase
        .from('lessons')
        .select('id,title,index')
        .eq('course_id', courseId)
        .order('index', { ascending: true }),
      supabase
        .from('course_progress')
        .select('completed_lessons')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .maybeSingle(),
    ]);

  const completed = new Set<number>(progress?.completed_lessons || []);
  const lessonList = (lessons || []).map((l: any) => ({
    id: l.id,
    title: l.title,
    index: l.index,
  }));

  const completionPct = lessonList.length
    ? Math.round((completed.size / lessonList.length) * 100)
    : 0;

  const canDownloadCertificate = completionPct === 100;

  return {
    course,
    lessonList,
    completed,
    completionPct,
    canDownloadCertificate,
  };
}

export default async function CoursePage({ params }: { params: { id: string } }) {
  const courseId = Number(params.id);
  const {
    course,
    lessonList,
    completed,
    completionPct,
    canDownloadCertificate,
  } = await getCourseContext(courseId);

  return (
    <main>
      <h1>{course.title}</h1>
      <p>{course.description}</p>
      <p>Progress: {completionPct}%</p>
      <LessonList
        courseId={courseId}
        lessons={lessonList as any}
        completedInitial={Array.from(completed)}
      />

      {canDownloadCertificate && (
        <a href={`/certificates/${courseId}`} className="btn">
          Download Certificate
        </a>
      )}
    </main>
  );
}


