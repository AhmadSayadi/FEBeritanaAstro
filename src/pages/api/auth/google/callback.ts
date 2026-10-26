import type { APIRoute } from 'astro'

export const prerender = false

/**
 * Google OAuth callback — Laravel redirects here with token + user info in the
 * query string. Renders an HTML page that stores the token/user in localStorage
 * then redirects home. Identical behaviour to the old Next handler.
 */
export const GET: APIRoute = ({ url }) => {
  const sp = url.searchParams
  const token = sp.get('token')
  const name = sp.get('name')
  const email = sp.get('email')
  const avatar = sp.get('avatar')
  const role = sp.get('role') || 'reader'
  const slug = sp.get('slug')

  if (!token) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/masuk?error=google_failed' },
    })
  }

  const verified = sp.get('verified') === 'true' || sp.get('verified') === '1'
  const userData = JSON.stringify({
    name: name || '',
    email: email || '',
    avatar_url: avatar || '',
    role,
    slug: slug || '',
    verified,
  })

  const html = `
<!DOCTYPE html>
<html>
<head><title>Login...</title></head>
<body>
<script>
  try {
    localStorage.setItem('beritana_token', ${JSON.stringify(token)});
    localStorage.setItem('beritana_user', ${JSON.stringify(userData)});
    window.location.href = '/';
  } catch (e) {
    window.location.href = '/masuk?error=storage_failed';
  }
</script>
<noscript><p>Redirecting... <a href="/">Klik di sini</a></p></noscript>
</body>
</html>`

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
