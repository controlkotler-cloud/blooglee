

# Plan: Fix Elementor formatting and image display for Farmacia La Explanada

## Problem

Two issues affect only this site (which uses Elementor as its page builder):

1. **Content without formatting**: When Blooglee publishes via REST API, WordPress saves the HTML as a standard Gutenberg block. In Elementor-based themes, this raw HTML renders without the theme's typography, margins, or styles. The user must manually open "Edit with Elementor" and re-publish to fix it.

2. **Featured image not visible inside the post**: The image is uploaded as `featured_media`, which Elementor single-post templates sometimes ignore. The image shows on the blog listing (archive) but not on the individual post page.

## Root cause

The publish function (`publish-to-wordpress-saas`) detects Elementor sites (`siteUsesElementorPostMarkup`) but only adds a warning — it never wraps the content or embeds the image. The `embed_image_in_content` column exists in `sites` but is never read during publishing.

## Solution (scoped to Elementor sites only)

All changes go in `supabase/functions/publish-to-wordpress-saas/index.ts`. No other sites are affected because the logic is gated by `historicalElementorPosts === true`.

### Step 1 — Load site settings before publishing

After fetching `wpConfig`, also fetch the site row to read `embed_image_in_content` and detect Elementor flag:

```sql
SELECT embed_image_in_content FROM sites WHERE id = body.site_id
```

### Step 2 — Wrap content in Elementor-compatible structure

When `historicalElementorPosts` is true and the incoming content is plain HTML (not already Elementor markup), wrap the entire `body.content` in a minimal Elementor-compatible div structure:

```html
<div class="elementor-element elementor-widget elementor-widget-theme-post-content" data-element_type="widget">
  <div class="elementor-widget-container">
    {content}
  </div>
</div>
```

This ensures the Elementor theme applies its default typography and spacing without requiring manual re-editing.

### Step 3 — Embed image in content for Elementor sites

When `historicalElementorPosts` is true OR `embed_image_in_content` is true, prepend a centered `<img>` tag with inline styles at the beginning of the content (before the Elementor wrapper if applicable):

```html
<div style="text-align:center;margin-bottom:2rem;">
  <img src="{image_url}" alt="{image_alt}" style="max-width:100%;height:auto;border-radius:8px;" />
</div>
```

This ensures the image is always visible inside the post, regardless of whether the theme's single-post template renders the featured image.

### Step 4 — Remove the warning, keep diagnostics

Replace the current Elementor warning toast with a log entry. The content is now properly formatted, so the user doesn't need to be warned.

### Safety

- All logic is gated by `historicalElementorPosts === true` — sites without Elementor history are completely unaffected.
- The `incomingLooksElementor` check prevents double-wrapping if the content already contains Elementor markup.
- Deploy only the `publish-to-wordpress-saas` function.

