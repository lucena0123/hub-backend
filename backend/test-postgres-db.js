const { Pool } = require('pg');

const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  database: 'postgres',
  user: 'bpmn',
  password: 'dev123',
});

async function test() {
  try {
    console.log('Conectando ao database postgres...');
    const result = await pool.query('SELECT current_database(), current_user');
    console.log('✅ Conectado:', result.rows[0]);
    
    // Listar todos os databases
    const dbs = await pool.query('SELECT datname FROM pg_database');
    console.log('Databases:', dbs.rows);
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

test();
