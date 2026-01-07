import { Database } from "bun:sqlite";

const DB_PATH = process.env.DB_PATH || "./taggai.db";

export const db = new Database(DB_PATH, { create: true, strict: true });

// Enable WAL mode for better concurrent access
db.exec("PRAGMA journal_mode = WAL;");

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT UNIQUE NOT NULL,
    group_name TEXT NOT NULL,
    derivation TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_id INTEGER NOT NULL,
    filename TEXT UNIQUE NOT NULL,
    video_number INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS video_tags (
    video_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (video_id, tag_id),
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_images_group_name ON images(group_name);
  CREATE INDEX IF NOT EXISTS idx_videos_image_id ON videos(image_id);
  CREATE INDEX IF NOT EXISTS idx_video_tags_video_id ON video_tags(video_id);
  CREATE INDEX IF NOT EXISTS idx_video_tags_tag_id ON video_tags(tag_id);
  CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
`);

// Types
export interface ImageRow {
  id: number;
  filename: string;
  group_name: string;
  derivation: string | null;
  created_at: string;
}

export interface ImageGroupRow {
  group_name: string;
  source_filename: string | null;
  first_filename: string;
  total_videos: number;
  derivation_count: number;
}

export interface VideoRow {
  id: number;
  image_id: number;
  filename: string;
  video_number: number;
  created_at: string;
}

// With strict: true, parameters should be passed WITHOUT the $ prefix in objects
export const queries = {
  // Images
  insertImage: db.prepare<{ id: number }, { filename: string; group_name: string; derivation: string | null }>(
    "INSERT OR IGNORE INTO images (filename, group_name, derivation) VALUES ($filename, $group_name, $derivation) RETURNING id"
  ),
  getImageByFilename: db.prepare<ImageRow, { filename: string }>(
    "SELECT * FROM images WHERE filename = $filename"
  ),
  
  // Get all unique groups with their primary image (source or first derivation)
  getAllGroups: db.prepare<ImageGroupRow, []>(
    `SELECT 
       i.group_name,
       MIN(CASE WHEN i.derivation IS NULL THEN i.filename ELSE NULL END) as source_filename,
       MIN(i.filename) as first_filename,
       COUNT(DISTINCT v.id) as total_videos,
       COUNT(DISTINCT i.derivation) as derivation_count
     FROM images i
     LEFT JOIN videos v ON v.image_id = i.id
     GROUP BY i.group_name
     ORDER BY MAX(i.created_at) DESC`
  ),
  
  // Get all images in a group
  getImagesByGroup: db.prepare<ImageRow, { group_name: string }>(
    `SELECT * FROM images 
     WHERE group_name = $group_name 
     ORDER BY derivation IS NOT NULL, derivation`
  ),
  
  getImageById: db.prepare<ImageRow, { id: number }>(
    "SELECT * FROM images WHERE id = $id"
  ),

  // Videos
  insertVideo: db.prepare<{ id: number }, { image_id: number; filename: string; video_number: number }>(
    "INSERT OR IGNORE INTO videos (image_id, filename, video_number) VALUES ($image_id, $filename, $video_number) RETURNING id"
  ),
  getVideosByImageId: db.prepare<VideoRow, { image_id: number }>(
    "SELECT * FROM videos WHERE image_id = $image_id ORDER BY video_number"
  ),
  
  // Get all videos for a group (all derivations)
  getVideosByGroup: db.prepare<
    VideoRow & { image_filename: string; derivation: string | null },
    { group_name: string }
  >(
    `SELECT v.*, i.filename as image_filename, i.derivation
     FROM videos v
     INNER JOIN images i ON i.id = v.image_id
     WHERE i.group_name = $group_name
     ORDER BY i.derivation IS NOT NULL, i.derivation, v.video_number`
  ),
  
  // Get videos for specific derivation (or source if derivation is null)
  getVideosByDerivation: db.prepare<
    VideoRow & { image_filename: string; derivation: string | null },
    { group_name: string; derivation: string | null }
  >(
    `SELECT v.*, i.filename as image_filename, i.derivation
     FROM videos v
     INNER JOIN images i ON i.id = v.image_id
     WHERE i.group_name = $group_name AND (i.derivation IS $derivation OR ($derivation IS NULL AND i.derivation IS NULL))
     ORDER BY v.video_number`
  ),
  
  getVideoById: db.prepare<VideoRow, { id: number }>(
    "SELECT * FROM videos WHERE id = $id"
  ),

  // Tags
  insertTag: db.prepare<{ id: number }, { name: string }>(
    "INSERT INTO tags (name) VALUES ($name) ON CONFLICT(name) DO UPDATE SET name = name RETURNING id"
  ),
  getAllTags: db.prepare<{ id: number; name: string }, []>("SELECT * FROM tags ORDER BY name"),
  searchTags: db.prepare<{ id: number; name: string }, { query: string }>(
    "SELECT * FROM tags WHERE name LIKE $query ORDER BY name LIMIT 20"
  ),
  getTagByName: db.prepare<{ id: number; name: string }, { name: string }>(
    "SELECT * FROM tags WHERE name = $name"
  ),

  // Video Tags
  addTagToVideo: db.prepare<null, { video_id: number; tag_id: number }>(
    "INSERT OR IGNORE INTO video_tags (video_id, tag_id) VALUES ($video_id, $tag_id)"
  ),
  removeTagFromVideo: db.prepare<null, { video_id: number; tag_id: number }>(
    "DELETE FROM video_tags WHERE video_id = $video_id AND tag_id = $tag_id"
  ),
  getTagsForVideo: db.prepare<{ id: number; name: string }, { video_id: number }>(
    `SELECT t.* FROM tags t 
     INNER JOIN video_tags vt ON vt.tag_id = t.id 
     WHERE vt.video_id = $video_id 
     ORDER BY t.name`
  ),

  // Search videos by tags
  searchVideosByTags: db.prepare<
    VideoRow & { image_filename: string; group_name: string; derivation: string | null },
    { query: string }
  >(
    `SELECT DISTINCT v.*, i.filename as image_filename, i.group_name, i.derivation
     FROM videos v
     INNER JOIN images i ON i.id = v.image_id
     INNER JOIN video_tags vt ON vt.video_id = v.id
     INNER JOIN tags t ON t.id = vt.tag_id
     WHERE t.name LIKE $query
     ORDER BY v.created_at DESC`
  ),
  
  // Get derivations for a group
  getDerivationsForGroup: db.prepare<{ derivation: string | null; image_count: number; video_count: number }, { group_name: string }>(
    `SELECT i.derivation, COUNT(DISTINCT i.id) as image_count, COUNT(DISTINCT v.id) as video_count
     FROM images i
     LEFT JOIN videos v ON v.image_id = i.id
     WHERE i.group_name = $group_name
     GROUP BY i.derivation
     ORDER BY i.derivation IS NOT NULL, i.derivation`
  ),
};

// Helper functions
export function getOrCreateTag(name: string): number {
  const result = queries.insertTag.get({ name: name.toLowerCase().trim() });
  return result!.id;
}

export function addTagToVideo(videoId: number, tagName: string): void {
  const tagId = getOrCreateTag(tagName);
  queries.addTagToVideo.run({ video_id: videoId, tag_id: tagId });
}

export function removeTagFromVideo(videoId: number, tagId: number): void {
  queries.removeTagFromVideo.run({ video_id: videoId, tag_id: tagId });
}

export function getVideoWithTags(videoId: number) {
  const video = queries.getVideoById.get({ id: videoId });
  if (!video) return null;
  const tags = queries.getTagsForVideo.all({ video_id: videoId });
  return { ...video, tags };
}

console.log("Database initialized at", DB_PATH);
