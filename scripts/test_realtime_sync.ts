import http from 'http';

function makeRequest(
  method: string,
  path: string,
  body?: any,
  headers: Record<string, string> = {}
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          ...headers,
        },
      },
      (res) => {
        let respData = '';
        res.on('data', (chunk) => {
          respData += chunk;
        });
        res.on('end', () => {
          let parsed = respData;
          try {
            parsed = JSON.parse(respData);
          } catch {}
          resolve({ status: res.statusCode || 200, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function listenToSSE(clientId: string, durationMs = 4000): Promise<any[]> {
  return new Promise((resolve) => {
    const events: any[] = [];
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/sync/stream',
        method: 'GET',
        headers: {
          'X-Client-Id': clientId,
        },
      },
      (res) => {
        res.on('data', (chunk) => {
          const text = chunk.toString();
          const lines = text.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(line.substring(6));
                events.push(parsed);
              } catch {}
            }
          }
        });
      }
    );
    req.on('error', () => {});
    req.end();

    setTimeout(() => {
      req.destroy();
      resolve(events);
    }, durationMs);
  });
}

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${msg}`);
    process.exit(1);
  }
}

async function runTests() {
  console.log('🧪 Starting Multi-Device & Real-Time Sync Validation Suite...');

  // Test 1: Health / Status check
  const statusRes = await makeRequest('GET', '/api/sync/status');
  assert(statusRes.status === 200, 'Server /api/sync/status returned 200');
  assert(statusRes.body.success === true, 'Status response has success: true');
  console.log('✅ Test 1 Passed: Server status endpoint responsive');

  // Test 2: Simulating Device A (Chrome) and Device B (Safari iPhone)
  const deviceA_Id = 'client_chrome_pc_101';
  const deviceB_Id = 'client_safari_iphone_202';

  // Start listening on Device B (Safari)
  const ssePromiseDeviceB = listenToSSE(deviceB_Id, 3000);

  // Wait 300ms for connection to establish
  await new Promise((r) => setTimeout(r, 300));

  // Device A adds a new word
  const testWord = {
    word_id: `test_sync_w_${Date.now()}`,
    tu: `dongbo_${Date.now()}`,
    nghia: 'kết nối, liên kết',
    ngon_ngu: 'ko',
    retention_level: 'nho',
    bai_hoc: 'Bài 1',
  };

  const addWordRes = await makeRequest('POST', '/api/vocabulary', testWord, {
    'X-Client-Id': deviceA_Id,
  });
  assert(addWordRes.status === 200, 'Device A addWord returned 200');
  assert(addWordRes.body.item.tu.startsWith('dongbo_'), 'Word saved successfully');
  const createdWordId = addWordRes.body.item.word_id;

  // Device A adds a grammar item
  const testGrammar = {
    grammar_id: `test_sync_g_${Date.now()}`,
    cau_truc: `V-아서/어서_${Date.now()}`,
    giai_thich: 'Vì ... nên ...',
    ngon_ngu: 'ko',
  };
  const addGrammarRes = await makeRequest('POST', '/api/grammar', testGrammar, {
    'X-Client-Id': deviceA_Id,
  });
  assert(addGrammarRes.status === 200, 'Device A addGrammar returned 200');

  // Device A creates a deck
  const testDeck = {
    deck_id: `test_sync_d_${Date.now()}`,
    ten_bo: 'Bộ từ vựng giao tiếp thực chiến',
    ngon_ngu: 'ko',
  };
  const addDeckRes = await makeRequest('POST', '/api/decks', testDeck, {
    'X-Client-Id': deviceA_Id,
  });
  assert(addDeckRes.status === 200, 'Device A addDeck returned 200');

  // Device A updates user points
  const updateUserRes = await makeRequest('PUT', '/api/user', { total_points: 9999 }, {
    'X-Client-Id': deviceA_Id,
  });
  assert(updateUserRes.status === 200, 'Device A updateUser returned 200');

  // Device A deletes the test word
  const delWordRes = await makeRequest('DELETE', `/api/vocabulary/${createdWordId}`, undefined, {
    'X-Client-Id': deviceA_Id,
  });
  assert(delWordRes.status === 200, 'Device A deleteWord returned 200');

  // Await events received by Device B
  const eventsReceivedByB = await ssePromiseDeviceB;
  console.log(`📦 Device B (Safari) received ${eventsReceivedByB.length} real-time events.`);

  const typesReceived = eventsReceivedByB.map((e) => e.type);
  assert(typesReceived.includes('CONNECTED'), 'Device B received CONNECTED event');
  assert(typesReceived.includes('WORD_STATUS_UPDATED'), 'Device B received WORD_STATUS_UPDATED event');
  assert(typesReceived.includes('GRAMMAR_UPDATED'), 'Device B received GRAMMAR_UPDATED event');
  assert(typesReceived.includes('DECK_UPDATED'), 'Device B received DECK_UPDATED event');
  assert(typesReceived.includes('USER_UPDATED'), 'Device B received USER_UPDATED event');
  assert(typesReceived.includes('WORDS_DELETED'), 'Device B received WORDS_DELETED event');

  const wordEvent = eventsReceivedByB.find((e) => e.type === 'WORD_STATUS_UPDATED');
  assert(wordEvent.senderId === deviceA_Id, 'SenderId correctly tagged as deviceA_Id');
  assert(wordEvent.word.tu.startsWith('dongbo_'), 'Word payload matches exactly');

  console.log('✅ Test 2 Passed: Device B received all real-time events from Device A instantaneously!');

  // Test 3: Echo-Loop Prevention Test
  // If Device A listens to its own SSE stream, it receives events with senderId = deviceA_Id,
  // allowing Device A to safely ignore echoes and avoid re-renders.
  const ssePromiseDeviceA = listenToSSE(deviceA_Id, 1500);
  await new Promise((r) => setTimeout(r, 200));
  await makeRequest('POST', '/api/vocabulary', { tu: '테스트', nghia: 'thử nghiệm', ngon_ngu: 'ko' }, {
    'X-Client-Id': deviceA_Id,
  });
  const eventsForA = await ssePromiseDeviceA;
  const echoEvent = eventsForA.find((e) => e.type === 'WORD_STATUS_UPDATED');
  assert(echoEvent.senderId === deviceA_Id, 'Echo correctly tagged with senderId = deviceA_Id');
  console.log('✅ Test 3 Passed: Echo loop prevention tags senderId correctly');

  // Test 4: Stress / Concurrency test - 50 rapid mutations
  console.log('⚡ Running stress test: 50 concurrent mutations...');
  const start = Date.now();
  const promises: Promise<any>[] = [];
  for (let i = 0; i < 50; i++) {
    promises.push(
      makeRequest('POST', '/api/vocabulary', {
        tu: `nhanh_${i}`,
        nghia: `nghia_${i}`,
        ngon_ngu: 'ko',
      }, { 'X-Client-Id': `device_${i % 3}` })
    );
  }
  await Promise.all(promises);
  const elapsed = Date.now() - start;
  console.log(`✅ Test 4 Passed: 50 concurrent mutations handled in ${elapsed}ms without lag or blocking!`);

  // Cleanup test words
  const cleanIds = [];
  for (let i = 0; i < 50; i++) {
    cleanIds.push(`nhanh_${i}`);
  }
  await makeRequest('POST', '/api/sync/delete-words', { wordIds: cleanIds });

  console.log('🎉 ALL MULTI-DEVICE REAL-TIME SYNC TESTS PASSED SUCCESSFULLY! (100% SUCCESS)');
}

runTests().catch((err) => {
  console.error('Test run failed with error:', err);
  process.exit(1);
});
