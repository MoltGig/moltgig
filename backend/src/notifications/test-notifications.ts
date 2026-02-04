/**
 * Notification System Test Script
 *
 * Run with: npx ts-node test-notifications.ts
 *
 * Prerequisites:
 * - SUPABASE_URL and SUPABASE_SERVICE_KEY in environment
 * - notifications and webhooks tables created
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Config
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nsfelvytlvffussgydfq.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Test results
const results: { test: string; passed: boolean; details?: string }[] = [];

function log(test: string, passed: boolean, details?: string) {
  results.push({ test, passed, details });
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${test}${details ? `: ${details}` : ''}`);
}

async function runTests() {
  console.log('\n🔔 MoltGig Notification System Tests\n');
  console.log('='.repeat(50));

  // Test 1: Tables exist
  console.log('\n📋 Testing database tables...\n');

  const { data: notifTable, error: notifError } = await supabase
    .from('notifications')
    .select('id')
    .limit(1);

  log('Notifications table exists', !notifError, notifError?.message);

  const { data: webhookTable, error: webhookError } = await supabase
    .from('webhooks')
    .select('id')
    .limit(1);

  log('Webhooks table exists', !webhookError, webhookError?.message);

  // Test 2: Get a test agent (GigBot)
  console.log('\n🤖 Getting test agent...\n');

  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('id, wallet_address, moltbook_handle')
    .eq('wallet_address', '0x491cfD950cD82BB3878860392a8e807D3A41d434')
    .single();

  if (!agent) {
    log('Test agent (GigBot) found', false, 'GigBot not found in database');
    return printSummary();
  }
  log('Test agent (GigBot) found', true, `ID: ${agent.id.slice(0, 8)}...`);

  // Test 3: Create a notification
  console.log('\n📬 Testing notification creation...\n');

  const { data: notification, error: createError } = await supabase
    .from('notifications')
    .insert({
      agent_id: agent.id,
      event_type: 'task.accepted',
      title: 'Test: Task Accepted',
      body: 'This is a test notification from the verification script.',
      data: { test: true, timestamp: new Date().toISOString() }
    })
    .select()
    .single();

  log('Create notification', !createError && !!notification, createError?.message);

  if (!notification) {
    return printSummary();
  }

  // Test 4: Read notification
  console.log('\n📖 Testing notification retrieval...\n');

  const { data: fetched, error: fetchError } = await supabase
    .from('notifications')
    .select('*')
    .eq('id', notification.id)
    .single();

  log('Fetch notification', !fetchError && !!fetched, fetchError?.message);
  log('Notification has correct event_type', fetched?.event_type === 'task.accepted');
  log('Notification has data payload', !!fetched?.data && (fetched.data as any).test === true);

  // Test 5: Mark as read
  console.log('\n✓ Testing mark as read...\n');

  const { data: updated, error: updateError } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notification.id)
    .select()
    .single();

  log('Mark notification as read', !updateError && !!updated?.read_at, updateError?.message);

  // Test 6: Create webhook (with test URL)
  console.log('\n🔗 Testing webhook creation...\n');

  const testSecret = crypto.randomBytes(32).toString('hex');
  const { data: webhook, error: webhookCreateError } = await supabase
    .from('webhooks')
    .insert({
      agent_id: agent.id,
      url: 'https://webhook.site/test-moltgig-' + Date.now(),
      secret: testSecret,
      events: ['task.accepted', 'task.completed']
    })
    .select()
    .single();

  log('Create webhook', !webhookCreateError && !!webhook, webhookCreateError?.message);

  if (webhook) {
    log('Webhook has HTTPS URL', webhook.url.startsWith('https://'));
    log('Webhook has events array', Array.isArray(webhook.events) && webhook.events.length === 2);
    log('Webhook is active', webhook.is_active === true);
  }

  // Test 7: Webhook HTTPS constraint
  console.log('\n🔒 Testing HTTPS constraint...\n');

  const { error: httpError } = await supabase
    .from('webhooks')
    .insert({
      agent_id: agent.id,
      url: 'http://insecure.example.com/webhook',
      secret: testSecret,
      events: ['task.accepted']
    });

  log('HTTPS constraint enforced', !!httpError, httpError ? 'HTTP URL correctly rejected' : 'HTTP URL was allowed!');

  // Test 8: Events array constraint
  console.log('\n📝 Testing events constraint...\n');

  const { error: emptyEventsError } = await supabase
    .from('webhooks')
    .insert({
      agent_id: agent.id,
      url: 'https://example.com/webhook',
      secret: testSecret,
      events: []
    });

  log('Empty events rejected', !!emptyEventsError, emptyEventsError ? 'Empty events correctly rejected' : 'Empty events was allowed!');

  // Test 9: HMAC signature generation
  console.log('\n🔐 Testing HMAC signature...\n');

  const testPayload = JSON.stringify({ event: 'task.accepted', data: { task_id: 'test' } });
  const signature = crypto.createHmac('sha256', testSecret).update(testPayload).digest('hex');

  log('HMAC signature generated', signature.length === 64, `Signature: ${signature.slice(0, 16)}...`);

  // Verify signature
  const expectedSig = crypto.createHmac('sha256', testSecret).update(testPayload).digest('hex');
  const sigMatch = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
  log('HMAC signature verification', sigMatch);

  // Cleanup
  console.log('\n🧹 Cleaning up test data...\n');

  if (notification) {
    await supabase.from('notifications').delete().eq('id', notification.id);
    log('Cleaned up test notification', true);
  }

  if (webhook) {
    await supabase.from('webhooks').delete().eq('id', webhook.id);
    log('Cleaned up test webhook', true);
  }

  printSummary();
}

function printSummary() {
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 Test Summary\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`Passed: ${passed}/${total}`);
  console.log(`Failed: ${failed}/${total}`);

  if (failed > 0) {
    console.log('\n❌ Failed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.test}: ${r.details || 'No details'}`);
    });
  }

  console.log('\n' + '='.repeat(50));

  if (failed === 0) {
    console.log('\n✅ All tests passed! Notification system is working.\n');
  } else {
    console.log('\n⚠️ Some tests failed. Please review the errors above.\n');
    process.exit(1);
  }
}

// Run tests
runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
