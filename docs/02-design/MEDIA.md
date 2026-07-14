# Media guidelines

## Purpose

Media must support the event narrative without becoming an unconditional cost for every guest. Configuration decides
which asset and loading policy an invitation uses; components own playback and accessible states.

## Video contract

Each video section may define:

- `assetId`: required video asset.
- `posterAssetId`: optional lightweight preview resolved by the invitation asset registry.
- `preload`: native `none`, `metadata` or `auto`; new invitations should start with `none` unless measurement justifies
  another value.
- `aspectRatio`: explicit CSS ratio such as `9 / 16` or `16 / 9`.
- localized labels for the video, playback, loading and error states.

`auto` is supported for completeness but must be an explicit product decision. It is not the default.

## Provisional budgets

These are review thresholds, not automatic build failures:

| Asset | Preferred budget | Review threshold |
|---|---:|---:|
| Poster | <= 150 KB | 250 KB |
| Short invitation video | <= 6 MB | 8 MB |
| Content image | <= 250 KB | 500 KB |
| Favicon / app icon | <= 100 KB | 400 KB |

Video should be compressed outside Core using a reproducible media workflow. The repository does not own a video
transcoding engine. The exact Windows procedure is documented in
[`MEDIA_WORKFLOW.md`](../04-development/MEDIA_WORKFLOW.md).

## Fonts

The current HTML request includes every family required by the five existing themes. Loading only the selected theme's
families requires font metadata in the theme contract and therefore belongs to Theme Engine v2. Until then, new font
families must not be added without removing or consolidating an existing need.

## Current invitation

- `video.mp4`: reduced from 12.5 MB to approximately 4.56 MB, with H.264/AAC and verified `faststart`; configured with
  `preload: 'none'` so the file is not eagerly fetched.
- `video-poster.webp`: representative frame at 450×806 and approximately 46 KB.
- `favico.png`: reduced from 4096×4096 / 15 MB to 512×512 / approximately 375 KB and connected through Vite's
  `%BASE_URL%` so GitHub Pages resolves it correctly.
