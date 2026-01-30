const { Pool } = require('pg');

const pool = new Pool({
  host: '127.0.0.1',
  port: 5433,
  database: 'bpmn_system',
  user: 'bpmn',
  password: 'dev123',
});

async function test() {
  try {
    console.log('Conectando na porta 5433...');
    const result = await pool.query('SELECT current_database(), current_user');
    console.log('✅ CONECTADO!', result.rows[0]);
    
    const clients = await pool.query('SELECT COUNT(*) as count FROM clients');
    console.log('✅ Clientes no banco:', clients.rows[0].count);
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

test();
