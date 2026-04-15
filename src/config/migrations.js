/**
 * Database Migrations System
 * Simple migration runner for MongoDB schema changes.
 * 
 * Migrations are tracked in a 'migrations' collection.
 */
const mongoose = require('mongoose');

const MigrationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  appliedAt: { type: Date, default: Date.now },
  checksum: String
});

const Migration = mongoose.model('Migration', MigrationSchema);

const migrations = [
  {
    name: '001_initial_indexes',
    checksum: 'initial',
    up: async (db) => {
      // Ensure Match collection has proper indexes
      await db.collection('matches').createIndex({ matchId: 1 }, { unique: true });
      await db.collection('matches').createIndex({ gameId: 1 });
      await db.collection('matches').createIndex({ 'participants.championId': 1 });
      await db.collection('matches').createIndex({ 'participants.teamId': 1 });
      await db.collection('matches').createIndex({ gameCreation: -1 });
      await db.collection('matches').createIndex({ highlighted: 1, highlightScore: -1 });
      await db.collection('matches').createIndex({ 'highlights.type': 1 });
      await db.collection('matches').createIndex({ 'highlights.severity': 1 });
    }
  },
  {
    name: '002_add_summoner_collection',
    checksum: 'v2',
    up: async (db) => {
      await db.collection('summoners').createIndex({ summonerId: 1 }, { unique: true });
      await db.collection('summoners').createIndex({ puuid: 1 }, { unique: true });
      await db.collection('summoners').createIndex({ name: 1 });
      await db.collection('summoners').createIndex({ region: 1 });
    }
  }
];

/**
 * Run all pending migrations
 * @param {mongoose.Connection} db
 */
async function run(db) {
  const applied = new Set(
    (await Migration.find({}).lean()).map(m => m.name)
  );

  const pending = migrations.filter(m => !applied.has(m.name));

  if (pending.length === 0) {
    console.log('Database is up to date');
    return;
  }

  console.log(`Running ${pending.length} migration(s)...`);

  for (const migration of pending) {
    try {
      await migration.up(db);
      await Migration.create({ name: migration.name, checksum: migration.checksum });
      console.log(`  ✓ ${migration.name}`);
    } catch (error) {
      if (error.code === 11000) {
        // Duplicate key - index might already exist, that's ok
        console.log(`  ~ ${migration.name} (already applied)`);
      } else {
        console.error(`  ✗ ${migration.name}: ${error.message}`);
        throw error;
      }
    }
  }

  console.log('Migrations complete');
}

/**
 * Get migration status
 */
async function status() {
  const applied = await Migration.find({}).sort({ appliedAt: 1 }).lean();
  const total = migrations.length;
  const appliedCount = applied.length;

  return {
    total,
    applied: appliedCount,
    pending: total - appliedCount,
    migrations: migrations.map(m => ({
      name: m.name,
      status: applied.some(a => a.name === m.name) ? 'applied' : 'pending',
      appliedAt: applied.find(a => a.name === m.name)?.appliedAt || null
    }))
  };
}

module.exports = { run, status };
