import { readdirSync } from "node:fs";
import { join } from "node:path";
import { db, queries } from "../db";

export const MEDIA_PATH = process.env.MEDIA_PATH || "./media";

/**
 * Parses an image filename to extract the group name and derivation.
 * - "name.jpg" -> { groupName: "name", derivation: null }
 * - "name_a.jpg" -> { groupName: "name", derivation: "a" }
 */
function parseImageFilename(filename: string): { groupName: string; derivation: string | null; baseName: string } | null {
  const match = filename.match(/^(.+)\.jpg$/i);
  if (!match) return null;
  
  const baseName = match[1];
  
  // Check for derivation suffix (_a, _b, etc.)
  const derivationMatch = baseName.match(/^(.+)_([a-z])$/i);
  if (derivationMatch) {
    return {
      groupName: derivationMatch[1],
      derivation: derivationMatch[2].toLowerCase(),
      baseName,
    };
  }
  
  return {
    groupName: baseName,
    derivation: null,
    baseName,
  };
}

/**
 * Parses a video filename to extract the base name and video number.
 * - "name-1.mp4" -> { baseName: "name", videoNumber: 1 }
 * - "name_a-2.mp4" -> { baseName: "name_a", videoNumber: 2 }
 */
function parseVideoFilename(filename: string): { baseName: string; videoNumber: number } | null {
  const match = filename.match(/^(.+)-(\d+)\.mp4$/i);
  if (!match) return null;
  return {
    baseName: match[1],
    videoNumber: parseInt(match[2], 10),
  };
}

/**
 * Idempotent sync function that scans the media folder and populates the database.
 * - Finds all .jpg files and inserts them as images (with group_name and derivation)
 * - Finds all .mp4 files matching the pattern "name-N.mp4" and links them to images
 * - Uses INSERT OR IGNORE for idempotency
 */
export function syncMediaFolder(): { images: number; videos: number; errors: string[] } {
  const errors: string[] = [];
  let imagesAdded = 0;
  let videosAdded = 0;

  let files: string[];
  try {
    files = readdirSync(MEDIA_PATH);
  } catch (err) {
    console.error(`Failed to read media folder: ${MEDIA_PATH}`, err);
    return { images: 0, videos: 0, errors: [`Failed to read media folder: ${MEDIA_PATH}`] };
  }

  // First pass: find all jpg files and insert as images
  const jpgFiles = files.filter((f) => f.toLowerCase().endsWith(".jpg"));
  const imageMap = new Map<string, number>(); // baseName -> image id

  const insertImages = db.transaction(() => {
    for (const jpg of jpgFiles) {
      const parsed = parseImageFilename(jpg);
      if (!parsed) {
        errors.push(`Skipped ${jpg}: couldn't parse filename`);
        continue;
      }
      
      const result = queries.insertImage.get({ 
        filename: jpg,
        group_name: parsed.groupName,
        derivation: parsed.derivation,
      });
      
      if (result) {
        imageMap.set(parsed.baseName, result.id);
        imagesAdded++;
      } else {
        // Already exists, fetch the id
        const existing = queries.getImageByFilename.get({ filename: jpg });
        if (existing) {
          imageMap.set(parsed.baseName, existing.id);
        }
      }
    }
  });

  insertImages();

  // Second pass: find all mp4 files and link to images
  const mp4Files = files.filter((f) => f.toLowerCase().endsWith(".mp4"));

  const insertVideos = db.transaction(() => {
    for (const mp4 of mp4Files) {
      const parsed = parseVideoFilename(mp4);
      if (!parsed) {
        errors.push(`Skipped ${mp4}: doesn't match expected pattern "name-N.mp4"`);
        continue;
      }

      let imageId = imageMap.get(parsed.baseName);
      if (!imageId) {
        // Try to find the image in the database (might have been added in a previous sync)
        const jpg = `${parsed.baseName}.jpg`;
        const existing = queries.getImageByFilename.get({ filename: jpg });
        if (!existing) {
          errors.push(`Skipped ${mp4}: no matching image "${parsed.baseName}.jpg" found`);
          continue;
        }
        imageId = existing.id;
        imageMap.set(parsed.baseName, existing.id);
      }

      const result = queries.insertVideo.get({
        image_id: imageId,
        filename: mp4,
        video_number: parsed.videoNumber,
      });

      if (result) {
        videosAdded++;
      }
    }
  });

  insertVideos();

  console.log(`Sync complete: ${imagesAdded} images, ${videosAdded} videos added`);
  if (errors.length > 0) {
    console.log(`Errors: ${errors.length}`);
    errors.forEach((e) => console.log(`  - ${e}`));
  }

  return { images: imagesAdded, videos: videosAdded, errors };
}

// Run directly if executed as a script
if (import.meta.main) {
  console.log(`Syncing media folder: ${MEDIA_PATH}`);
  const result = syncMediaFolder();
  console.log("Result:", result);
}
