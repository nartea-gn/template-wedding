const url = process.env.SMOKE_TEST_URL;
if (!url) {
  console.error('SMOKE_TEST_URL is required');
  process.exit(1);
}

// Real paths, so each one is a distinct request the host has to answer. Under the previous hash
// routing all three were the same URL and this loop could not fail. Nothing in the repository
// configures the fallback -- Cloudflare Pages serves `index.html` for an unmatched path as long
// as the project publishes no `404.html` -- so this is the only check that a bookmarked `/rsvp`
// still reaches the application instead of a 404.
const paths = ['/', '/rsvp', '/admin'];
for (const path of paths) {
  try {
    const response = await fetch(`${url}${path}`, {redirect: 'manual'});
    const status = response.status;
    if (status !== 200) {
      console.error(`Smoke test failed for ${path} (HTTP ${status})`);
      process.exit(1);
    }
    console.log(`Smoke test passed for ${path} (HTTP ${status})`);
  } catch (error) {
    console.error(`Smoke test failed for ${path}: ${error}`);
    process.exit(1);
  }
}

// The Content-Security-Policy travels as a response header, emitted from the `_headers` file the
// build generates. Only the host applies that file, so this is the first point in the pipeline
// that sees the real thing: a policy lost to a config change, or one still naming the previous
// project's Supabase origin, would otherwise reach production silently.
try {
  const response = await fetch(`${url}/`);
  const policy = response.headers.get('content-security-policy');

  if (!policy) {
    console.error('Smoke test failed: the response carries no Content-Security-Policy header');
    process.exit(1);
  }

  const connectSrc = policy.match(/connect-src ([^;]+)/)?.[1];
  if (!connectSrc || !/https:\/\/[a-z0-9-]+\.supabase\.co/.test(connectSrc)) {
    console.error(`Smoke test failed: connect-src does not allow a Supabase origin (${connectSrc ?? 'absent'})`);
    process.exit(1);
  }

  // The directive that justified moving off a meta tag. If it is missing, the migration silently
  // gave back the one thing it was for.
  if (!/frame-ancestors\s+'none'/.test(policy)) {
    console.error('Smoke test failed: the policy does not deny framing');
    process.exit(1);
  }

  console.log(`Smoke test passed for the CSP (connect-src ${connectSrc.trim()}, framing denied)`);
} catch (error) {
  console.error(`Smoke test failed reading the CSP: ${error}`);
  process.exit(1);
}
