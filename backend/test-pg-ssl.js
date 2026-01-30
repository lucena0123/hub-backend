const { Pool } = require('pg');

const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  database: 'bpmn_system',
  user: 'bpmn',
  password: 'dev123',
  ssl: false,
  connectionTimeoutMillis: 5000,
});

async function test() {
  try {
    console.log('Config:', {
      host: '127.0.0.1',
      port: 5432,
      database: 'bpmn_system',
      user: 'bpmn',
    });
    console.log('Tentando conectar...');
    const client = await pool.connect();
    console.log('✅ Cliente conectado!');
    
    const result = await client.query('SELECT current_database(), current_user');
    console.log('✅ Query executada:', result.rows[0]);
    
    client.release();
  } catch (error) {
    console.error('❌ Erro completo:', error);
  } finally {
    await pool.end();
  }
}

test();
