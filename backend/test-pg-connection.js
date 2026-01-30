const { Pool } = require('pg');

const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  database: 'bpmn_system',
  user: 'bpmn',
  password: 'dev123',
});

async function test() {
  try {
    console.log('Tentando conectar...');
    const result = await pool.query('SELECT current_database(), current_user');
    console.log('✅ Conectado!', result.rows[0]);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Code:', error.code);
  } finally {
    await pool.end();
  }
}

test();
