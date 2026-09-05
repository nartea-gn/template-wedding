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

| Asset                  | Preferred budget | Review threshold |
|------------------------|-----------------:|-----------------:|
| Poster                 |        <= 150 KB |           250 KB |
| Short invitation video |          <= 6 MB |             8 MB |
| Content image          |        <= 250 KB |           500 KB |
| Favicon / app icon     |        <= 100 KB |           400 KB |

Video should be compressed outside Core using a reproducible media workflow. The repository does not own a video
transcoding engine. The exact Windows procedure is documented in
[`MEDIA_WORKFLOW.md`](../04-development/MEDIA_WORKFLOW.md).

## Fonts

Each theme declares the families it needs in `googleFonts`, and the build injects only those of the deployed theme into
`index.html`. Requesting all of them cost eight render-blocking downloads on the LCP path to use one.

The list is declared, not derived: the weights never appear in the CSS stack, and a stack can quote a system face
("Times New Roman") that is not a webfont. An empty list therefore means "this theme uses system fonts only" -- never
"inherit another theme's". A theme that leaves it empty by mistake deploys with no webfonts at all.

## Current invitation

- `video.mp4`: reduced from 12.5 MB to approximately 4.56 MB, with H.264/AAC and verified `faststart`; configured with
  `preload: 'none'` so the file is not eagerly fetched.
- `video-poster.webp`: representative frame at 450×806 and approximately 46 KB.
- `favico.png`: reduced from 4096×4096 / 15 MB to 512×512 / approximately 375 KB and connected through Vite's
  `%BASE_URL%`, which keeps the reference correct whatever base the host serves the site from.
