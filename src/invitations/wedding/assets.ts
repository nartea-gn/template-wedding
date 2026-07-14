import videoSrc from '../../assets/video.mp4'
import videoPosterSrc from '../../assets/video-poster.webp'

const weddingAssets: Readonly<Record<string, string>> = {
    'wedding-hero-video': videoSrc,
    'wedding-hero-video-poster': videoPosterSrc,
}

export function resolveWeddingAsset(assetId: string): string {
    const asset = weddingAssets[assetId]
    if (!asset) throw new Error(`Unknown wedding asset: ${assetId}`)
    return asset
}
