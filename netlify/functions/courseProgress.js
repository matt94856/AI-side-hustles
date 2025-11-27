const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { userId, courseId, lessonId, totalLessons } = JSON.parse(
      event.body || '{}'
    );

    if (!userId || !courseId || !lessonId || !totalLessons) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing fields' }),
      };
    }

    const { data: row, error } = await supabase
      .from('course_progress')
      .select('completed_lessons')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    const set = new Set(row?.completed_lessons || []);
    set.add(lessonId);

    const completed_lessons = Array.from(set);
    const progress = Math.round(
      (completed_lessons.length / Number(totalLessons)) * 100
    );

    const { error: upsertError } = await supabase.from('course_progress').upsert(
      {
        user_id: userId,
        course_id: courseId,
        completed_lessons,
        progress,
      },
      { onConflict: 'user_id,course_id' }
    );

    if (upsertError) {
      throw upsertError;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, progress }),
    };
  } catch (error) {
    console.error('courseProgress error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};


