export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS headers for all responses
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    // Router
    if (method === 'POST' && path === '/register') return handleRegister(request, env, cors);
    if (method === 'POST' && path === '/connect')  return handleConnect(request, env, cors);
    if (method === 'POST' && path === '/sync')     return handleSync(request, env, cors);
    if (method === 'GET'  && path.startsWith('/user/'))   return handleUser(request, env, cors);
    if (method === 'GET'  && path.startsWith('/search/')) return handleSearch(request, env, cors);

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
  }
};

async function handleRegister(request, env, cors) {
  try {
    const body = await request.json();
    const username = (body.username || '').toLowerCase().trim();
    const scores = body.scores || [];

    // Validate username
    if (!username || username.length < 3) {
      return json({ error: 'Username must be at least 3 characters' }, 400, cors);
    }
    if (!/^[a-z0-9_-]+$/.test(username)) {
      return json({ error: 'Username may only contain letters, numbers, hyphens and underscores' }, 400, cors);
    }

    // Check if username is taken
    const existing = await env.soljs.get('user:' + username);
    if (existing) {
      return json({ error: 'Username is taken' }, 409, cors);
    }

    // Generate token
    const token = crypto.randomUUID();

    // Save user record
    const record = {
      username,
      token,
      scores: scores.slice(0, 100)
    };
    await env.soljs.put('user:' + username, JSON.stringify(record));
    await env.soljs.put('token:' + token, username);

    return json({ success: true, username, token, scores: record.scores }, 200, cors);

  } catch(e) {
    return json({ error: 'Server error' }, 500, cors);
  }
}

async function handleConnect(request, env, cors) {
  try {
    const body = await request.json();
    const token = (body.token || '').trim();

    if (!token) {
      return json({ error: 'Token is required' }, 400, cors);
    }

    // Look up username by token
    const username = await env.soljs.get('token:' + token);
    if (!username) {
      return json({ error: 'Invalid token' }, 401, cors);
    }

    // Get user record
    const record = JSON.parse(await env.soljs.get('user:' + username));

    return json({ success: true, username, scores: record.scores }, 200, cors);

  } catch(e) {
    return json({ error: 'Server error' }, 500, cors);
  }
}

async function handleSync(request, env, cors) {
  try {
    const body = await request.json();
    const token = (body.token || '').trim();
    const newScores = body.scores || [];

    if (!token) {
      return json({ error: 'Token is required' }, 400, cors);
    }

    // Validate token
    const username = await env.soljs.get('token:' + token);
    if (!username) {
      return json({ error: 'Invalid token' }, 401, cors);
    }

    // Get existing record
    const record = JSON.parse(await env.soljs.get('user:' + username));

    // Merge scores, sort, cap at 100
    const merged = record.scores.concat(newScores);
    merged.sort(function(a, b) { return b - a; });
    record.scores = merged.slice(0, 100);

    // Save updated record
    await env.soljs.put('user:' + username, JSON.stringify(record));

    return json({ success: true, username, scores: record.scores }, 200, cors);

  } catch(e) {
    return json({ error: 'Server error' }, 500, cors);
  }
}

async function handleUser(request, env, cors) {
  try {
    const url = new URL(request.url);
    const username = url.pathname.replace('/user/', '').toLowerCase().trim();

    if (!username) {
      return json({ error: 'Username is required' }, 400, cors);
    }

    const stored = await env.soljs.get('user:' + username);
    if (!stored) {
      return json({ error: 'User not found' }, 404, cors);
    }

    const record = JSON.parse(stored);

    // Return scores only - never expose the token
    return json({ success: true, username: record.username, scores: record.scores }, 200, cors);

  } catch(e) {
    return json({ error: 'Server error' }, 500, cors);
  }
}

async function handleSearch(request, env, cors) {
  try {
    const url = new URL(request.url);
    const username = url.pathname.replace('/search/', '').toLowerCase().trim();

    if (!username) {
      return json({ error: 'Username is required' }, 400, cors);
    }

    if (username.length < 3) {
      return json({ error: 'Username must be at least 3 characters' }, 400, cors);
    }

    if (!/^[a-z0-9_-]+$/.test(username)) {
      return json({ error: 'Username may only contain letters, numbers, hyphens and underscores' }, 400, cors);
    }

    const existing = await env.soljs.get('user:' + username);

    if (existing) {
      return json({ available: false, username }, 200, cors);
    } else {
      return json({ available: true, username }, 200, cors);
    }

  } catch(e) {
    return json({ error: 'Server error' }, 500, cors);
  }
}

// Helper
function json(data, status, cors) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' }
  });
}