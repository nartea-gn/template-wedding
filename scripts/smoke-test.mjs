const url = process.env.SMOKE_TEST_URL;
if (!url) {
  console.error('SMOKE_TEST_URL is required');
  process.exit(1);
}

const paths = ['/', '/#/rsvp', '/#/admin'];
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
