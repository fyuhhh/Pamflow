const initializeDB = require('./db');
async function debugData() {
  const db = await initializeDB();
  try {
    const [tasks] = await db.query('SELECT id, agen_id, nama_tugas FROM tasks LIMIT 5');
    console.log('--- Sample Tasks ---');
    console.log(JSON.stringify(tasks, null, 2));

    const [users] = await db.query('SELECT id, firstName, lastName FROM users LIMIT 10');
    console.log('\n--- Sample Users ---');
    console.log(JSON.stringify(users, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
debugData();
