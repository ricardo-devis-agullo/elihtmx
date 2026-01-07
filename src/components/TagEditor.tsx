import { Html } from "@elysiajs/html";

interface Tag {
  id: number;
  name: string;
}

export function TagEditor({ videoId, tags }: { videoId: number; tags: Tag[] }) {
  return (
    <div id={`tags-${videoId}`} class="space-y-3">
      <label class="text-sm font-medium text-zinc-400">Tags</label>
      
      {/* Current tags */}
      <div class="flex flex-wrap gap-2 min-h-[2rem]">
        {tags.length === 0 ? (
          <span class="text-sm text-zinc-600 italic">No tags yet</span>
        ) : (
          tags.map((tag) => (
            <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 text-amber-300 rounded-full text-sm border border-amber-500/30">
              {tag.name}
              <button
                type="button"
                class="hover:text-amber-100 transition-colors ml-0.5"
                hx-delete={`/api/videos/${videoId}/tags/${tag.id}`}
                hx-target={`#tags-${videoId}`}
                hx-swap="outerHTML"
                title="Remove tag"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))
        )}
      </div>

      {/* Add tag form */}
      <form
        class="relative"
        hx-post={`/api/videos/${videoId}/tags`}
        hx-target={`#tags-${videoId}`}
        hx-swap="outerHTML"
        _="on submit halt the event's default then send htmx:trigger to me"
      >
        <div class="relative">
          <input
            id="tag-input"
            type="text"
            name="tag"
            placeholder="Add a tag..."
            class="w-full px-3 py-2 pr-20 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-sm"
            autocomplete="off"
            hx-get="/api/tags/suggest"
            hx-trigger="input changed delay:200ms, focus"
            hx-target={`#suggestions-${videoId}`}
            _="on keydown[key is 'Escape'] set my value to '' then remove .show from #suggestions-${videoId}"
          />
          <button
            type="submit"
            class="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black rounded text-sm font-medium transition-colors"
          >
            Add
          </button>
        </div>
        
        {/* Suggestions dropdown */}
        <div
          id={`suggestions-${videoId}`}
          class="empty:hidden"
          _="on htmx:afterSwap add .show to me
             on click elsewhere remove .show from me"
        />
      </form>
    </div>
  );
}
