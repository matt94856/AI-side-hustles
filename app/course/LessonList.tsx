'use client';

import { useState } from 'react';
import { useAuth } from '../providers/AuthProvider';

type Lesson = {
  id: number;
  title: string;
  index: number;
};

type Props = {
  courseId: number;
  lessons: Lesson[];
  completedInitial: number[];
};

export function LessonList({ courseId, lessons, completedInitial }: Props) {
  const { user } = useAuth();
  const [completed, setCompleted] = useState<Set<number>>(
    new Set(completedInitial)
  );

  const handleComplete = async (lessonId: number) => {
    if (!user) return;

    const res = await fetch('/.netlify/functions/courseProgress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        courseId,
        lessonId,
        totalLessons: lessons.length,
      }),
    });

    if (res.ok) {
      const next = new Set(completed);
      next.add(lessonId);
      setCompleted(next);
    }
  };

  return (
    <ul>
      {lessons.map((lesson) => {
        const isDone = completed.has(lesson.id);
        return (
          <li key={lesson.id}>
            {lesson.title} {isDone ? '(Completed)' : '(Not completed)'}{' '}
            {!isDone && (
              <button type="button" onClick={() => handleComplete(lesson.id)}>
                Complete Lesson
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}


