import jwt from 'jsonwebtoken';

// Create admin token
const JWT_SECRET = process.env.JWT_SECRET || 'santa-jump-secret';
const adminToken = jwt.sign({ role: 'admin', userId: 'test-admin' }, JWT_SECRET);

console.log('🔑 Admin Token:', adminToken.slice(0, 50) + '...\n');

// Test API
try {
  const response = await fetch('http://localhost:3000/api/admin/suspicious-sessions?filter=suspicious', {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });

  const data = await response.json();

  console.log('📊 API Response:');
  console.log('Status:', response.status);
  console.log('Sessions count:', data.sessions?.length || 0);
  console.log('\nStats:', data.stats);

  if (data.sessions && data.sessions.length > 0) {
    console.log('\n🚨 Suspicious Sessions:');
    data.sessions.forEach((s, i) => {
      console.log(`\n${i+1}. ID: ${s.id}`);
      console.log(`   User: ${s.user?.email || 'N/A'}`);
      console.log(`   Client Score: ${s.client_score}`);
      console.log(`   Validated Score: ${s.validated_score}`);
      console.log(`   Suspicion: ${s.suspicion_reason?.slice(0, 80)}...`);
    });
  } else {
    console.log('\n⚠️  No sessions found!');
    console.log('Full response:', JSON.stringify(data, null, 2));
  }
} catch (error) {
  console.error('❌ Error:', error.message);
}
