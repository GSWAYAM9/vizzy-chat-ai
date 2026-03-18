#!/usr/bin/env node

import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('[v0] DATABASE_URL not set');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function fixDatabaseSchema() {
  try {
    console.log('[v0] Starting database schema fix...');

    // Step 1: Drop and recreate users table to ensure correct schema
    console.log('[v0] Dropping old images table if exists...');
    await sql`DROP TABLE IF EXISTS images CASCADE`;

    console.log('[v0] Dropping old users table if exists...');
    await sql`DROP TABLE IF EXISTS users CASCADE`;

    // Step 2: Create fresh users table with all required columns
    console.log('[v0] Creating users table with correct schema...');
    await sql`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        password_hash VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('[v0] Users table created successfully');

    // Step 3: Create images table
    console.log('[v0] Creating images table with correct schema...');
    await sql`
      CREATE TABLE images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        prompt TEXT NOT NULL,
        aspect_ratio VARCHAR(20) DEFAULT '1:1',
        seed INTEGER,
        is_favorited BOOLEAN DEFAULT FALSE,
        likes_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('[v0] Images table created successfully');

    // Step 4: Create indexes for better performance
    console.log('[v0] Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at DESC)`;
    console.log('[v0] Indexes created successfully');

    console.log('[v0] ✓ Database schema fix completed successfully!');
    console.log('[v0] You can now sign up and use the app.');
    process.exit(0);
  } catch (error) {
    console.error('[v0] Error fixing database schema:', error);
    process.exit(1);
  }
}

fixDatabaseSchema();
