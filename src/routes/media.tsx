import { Elysia, file } from "elysia";
import { Html } from "@elysiajs/html";
import { queries, addTagToVideo, removeTagFromVideo, getVideoWithTags } from "../db";
import { syncMediaFolder, MEDIA_PATH } from "../scripts/sync";
import { join } from "node:path";
import { ImageGrid } from "../pages/ImageGrid";
import { VideoList } from "../pages/VideoList";
import { BaseHtml } from "../BaseHtml";
import { TagEditor } from "../components/TagEditor";
import { SearchResults } from "../components/SearchResults";

export const mediaRoutes = new Elysia()
  // Serve media files
  .get("/media/:filename", ({ params }) => {
    const filePath = join(MEDIA_PATH, params.filename);
    return file(filePath);
  })

  // Sync endpoint
  .post("/api/sync", () => {
    const result = syncMediaFolder();
    return { success: true, ...result };
  })

  // Home page - shows grouped images
  .get("/", () => {
    const groups = queries.getAllGroups.all().map(g => ({
      ...g,
      // Use source image if available, otherwise first derivation
      filename: g.source_filename || g.first_filename,
    }));
    return (
      <BaseHtml>
        <ImageGrid groups={groups} />
      </BaseHtml>
    );
  })

  // Group detail page - shows all videos in a group with derivation filter
  .get("/group/:name", ({ params, query }) => {
    const groupName = decodeURIComponent(params.name);
    const derivationFilter = query.derivation as string | undefined;
    
    // Get all images in this group
    const images = queries.getImagesByGroup.all({ group_name: groupName });
    if (images.length === 0) {
      return (
        <BaseHtml>
          <div class="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
            <p>Group not found</p>
          </div>
        </BaseHtml>
      );
    }

    // Get derivations for filter tabs
    const derivations = queries.getDerivationsForGroup.all({ group_name: groupName });
    
    // Get videos based on filter
    let videos;
    if (derivationFilter === undefined || derivationFilter === "all") {
      videos = queries.getVideosByGroup.all({ group_name: groupName });
    } else {
      const deriv = derivationFilter === "source" ? null : derivationFilter;
      videos = queries.getVideosByDerivation.all({ group_name: groupName, derivation: deriv });
    }
    
    const videosWithTags = videos.map((v) => ({
      ...v,
      tags: queries.getTagsForVideo.all({ video_id: v.id }),
    }));

    // Find source image for display
    const sourceImage = images.find(i => i.derivation === null) || images[0];

    return (
      <BaseHtml>
        <VideoList 
          groupName={groupName}
          sourceImage={sourceImage}
          images={images}
          videos={videosWithTags}
          derivations={derivations}
          currentFilter={derivationFilter || "all"}
        />
      </BaseHtml>
    );
  })

  // Videos partial for HTMX derivation filter
  .get("/api/group/:name/videos", ({ params, query }) => {
    const groupName = decodeURIComponent(params.name);
    const derivationFilter = query.derivation as string | undefined;
    
    let videos;
    if (derivationFilter === undefined || derivationFilter === "all") {
      videos = queries.getVideosByGroup.all({ group_name: groupName });
    } else {
      const deriv = derivationFilter === "source" ? null : derivationFilter;
      videos = queries.getVideosByDerivation.all({ group_name: groupName, derivation: deriv });
    }
    
    const videosWithTags = videos.map((v) => ({
      ...v,
      tags: queries.getTagsForVideo.all({ video_id: v.id }),
    }));

    return (
      <VideoListPartial videos={videosWithTags} groupName={groupName} />
    );
  })

  // Play video in MPV
  .get("/api/play/:id", async ({ params }) => {
    const video = queries.getVideoById.get({ id: parseInt(params.id) });
    if (!video) {
      return { success: false, error: "Video not found" };
    }

    const videoPath = join(MEDIA_PATH, video.filename);
    
    try {
      Bun.spawn(["mpv", "--loop=inf", videoPath], {
        stdout: "inherit",
        stderr: "inherit",
      });
      return { success: true, video: video.filename };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  })

  // Tag management
  .get("/api/tags", ({ query }) => {
    if (query.q) {
      return queries.searchTags.all({ query: `%${query.q}%` });
    }
    return queries.getAllTags.all();
  })

  .post("/api/videos/:id/tags", async ({ params, body }) => {
    const videoId = parseInt(params.id);
    const { tag } = body as { tag: string };
    
    if (!tag || !tag.trim()) {
      return { success: false, error: "Tag name required" };
    }

    addTagToVideo(videoId, tag.trim());
    const video = getVideoWithTags(videoId);
    
    return <TagEditor videoId={videoId} tags={video?.tags || []} />;
  })

  .delete("/api/videos/:id/tags/:tagId", ({ params }) => {
    const videoId = parseInt(params.id);
    const tagId = parseInt(params.tagId);
    
    removeTagFromVideo(videoId, tagId);
    const video = getVideoWithTags(videoId);
    
    return <TagEditor videoId={videoId} tags={video?.tags || []} />;
  })

  // Get tag editor component (for refreshing)
  .get("/api/videos/:id/tags/editor", ({ params }) => {
    const videoId = parseInt(params.id);
    const video = getVideoWithTags(videoId);
    
    if (!video) {
      return <div>Video not found</div>;
    }
    
    return <TagEditor videoId={videoId} tags={video.tags} />;
  })

  // Search videos by tags
  .get("/api/search", ({ query }) => {
    const q = query.q || "";
    
    if (!q.trim()) {
      return <SearchResults videos={[]} query="" />;
    }

    const videos = queries.searchVideosByTags.all({ query: `%${q}%` });
    const videosWithTags = videos.map((v) => ({
      ...v,
      tags: queries.getTagsForVideo.all({ video_id: v.id }),
    }));

    return <SearchResults videos={videosWithTags} query={q} />;
  })

  // Tag suggestions for autocomplete
  .get("/api/tags/suggest", ({ query }) => {
    const q = query.q || "";
    const tags = q.trim() 
      ? queries.searchTags.all({ query: `%${q}%` })
      : queries.getAllTags.all();
    
    return (
      <div class="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl max-h-48 overflow-y-auto z-50">
        {tags.length === 0 ? (
          <div class="px-3 py-2 text-zinc-500 text-sm">
            {q.trim() ? `No tags matching "${q}"` : "No tags yet"}
          </div>
        ) : (
          tags.map((tag) => (
            <button
              type="button"
              class="w-full text-left px-3 py-2 hover:bg-zinc-700 text-zinc-200 text-sm transition-colors"
              _={`on click set #tag-input.value to '${tag.name}' then trigger submit on closest <form/>`}
            >
              {tag.name}
            </button>
          ))
        )}
      </div>
    );
  });


// Partial component for video list (used by HTMX)
function VideoListPartial({ videos, groupName }: { videos: any[]; groupName: string }) {
  if (videos.length === 0) {
    return (
      <div class="text-center py-12">
        <div class="text-4xl mb-2">🎬</div>
        <p class="text-zinc-400">No videos in this selection</p>
      </div>
    );
  }

  return (
    <div class="grid gap-6">
      {videos.map((video) => (
        <div class="bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden">
          <div class="grid md:grid-cols-2 gap-6 p-6">
            {/* Video player */}
            <div class="relative">
              <video
                src={`/media/${video.filename}`}
                class="w-full rounded-xl bg-black"
                controls
                preload="metadata"
                loop
              />
              {/* Play in MPV button */}
              <button
                class="absolute top-3 right-3 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 shadow-lg"
                hx-get={`/api/play/${video.id}`}
                hx-swap="none"
                title="Open in MPV (loop)"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                MPV
              </button>
              {/* Derivation badge */}
              {video.derivation && (
                <span class="absolute top-3 left-3 px-2 py-1 bg-zinc-900/80 text-zinc-300 rounded text-xs font-medium">
                  _{video.derivation}
                </span>
              )}
            </div>

            {/* Video info & tags */}
            <div class="flex flex-col">
              <div class="mb-4">
                <h3 class="text-lg font-semibold mb-1">
                  {video.filename.replace(/\.mp4$/i, "")}
                </h3>
                <p class="text-sm text-zinc-500">{video.filename}</p>
              </div>

              {/* Tag editor */}
              <div class="flex-1">
                <TagEditor videoId={video.id} tags={video.tags} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
