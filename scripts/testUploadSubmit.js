(async () => {
  try {
    const imgUrl = 'https://cdn.builder.io/api/v1/image/assets%2F6ba43b4c1bf9477e9a28cc511e7171f9%2Ffab7e145a5a449ac9f14ed6c233eacc0?format=webp&width=800';
    const res = await fetch(imgUrl);
    if (!res.ok) {
      console.error('fetch img failed', res.status);
      process.exit(1);
    }
    const arr = await res.arrayBuffer();
    const buf = Buffer.from(arr);
    const b64 = buf.toString('base64');
    const dataUrl = 'data:image/webp;base64,' + b64;
    console.log('fetched image, size', buf.length);

    const up = await fetch('http://localhost:3000/api/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl }),
    });
    const upj = await up.json().catch(() => null);
    console.log('/api/upload-image', up.status, upj);
    if (!up.ok) process.exit(1);

    const publicUrl = upj && upj.url;
    const payload = {
      email: 'dderuvo@makingsense.com',
      name: 'dan',
      timestamp: new Date().toISOString(),
      sticker: publicUrl,
      photo: '',
      archetype: 'Test',
      survey: { q1: 'test' }
    };

    const sub = await fetch('http://localhost:3000/api/submit-user-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const subj = await sub.json().catch(() => null);
    console.log('/api/submit-user-data', sub.status, subj);
  } catch (e) {
    console.error('Test failed', e);
    process.exit(1);
  }
})();
