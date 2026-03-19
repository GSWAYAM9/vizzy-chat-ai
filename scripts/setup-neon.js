import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("[v0] DATABASE_URL not set");
  process.exit(1);
}

const sql = neon(databaseUrl);

async function setupDatabase() {
  try {
    console.log("[v0] Starting database setup...");

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        password_hash VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log("[v0] Created users table");

    // Create images table
    await sql`
      CREATE TABLE IF NOT EXISTS images (
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
    console.log("[v0] Created images table");

    // Create analysis table
    await sql`
      CREATE TABLE IF NOT EXISTS analysis (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
        analysis TEXT NOT NULL,
        rating INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log("[v0] Created analysis table");

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_analysis_image_id ON analysis(image_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;

    console.log("[v0] Created indexes");
    console.log("[v0] Database setup completed successfully!");
  } catch (error) {
    console.error("[v0] Database setup error:", error);
    process.exit(1);
  }
}

setupDatabase();
