const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function run() {
  console.log('Enabling PostGIS via Neon HTTP...');
  await sql`CREATE EXTENSION IF NOT EXISTS postgis`;
  const rows = await sql`SELECT PostGIS_Version() as v`;
  console.log('PostGIS version:', rows[0].v);
  console.log('Done.');
}

run().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
