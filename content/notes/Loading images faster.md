---
categories:
  - Engineering
topics:
  - frontend
sources:
  - article
updated: 2026-01-01
---
## Using the right format

- pngs are oversized (mostly in MBs) (everytime i tried to upload screenshots it was in .png and was slower to load). So use jpg, or modern web image formats like WebP or AVIF (smaller files, but better quality.)(next.js automatically converts jpeg to webP format.)

## Compressing the image

Always compress images before uploading. There are two main types:

- Lossy Compression : (used by JPEG) Throws away parts that humans dont notice. (usually best for web). This reduces the file size drastically.
- Lossless Compressions : Lossless compression (used by PNG) preserves every single pixel while still shrinking the file.

I used [Squoosh.app](https://squoosh.app/) to compress my images manually.

## Caching

Tell the browser to store images locally so it doesn't have to re-download them on every visit. So for that the hosted platform has to tell the website, and thats done when the the hosted platform sends a header whenever a image is requested.

- Use the header `Cache-Control: max-age=31536000, immutable`. This caches the image for one year. (also called caching aggresively)

## Performace Boosters

- **Lazy Loading:** Use the `loading="lazy"` attribute on the `<img>` tags to only load images as the user scrolls to them.
- **CDNs:** For high-traffic sites, use a Content Delivery Network (CDN) to serve images from a server physically closer to the user.
- **Dimensions:** Never serve a 4000 x 4000 px image if it’s only being displayed at 400 x 400 px. Scale your images to their display size!
