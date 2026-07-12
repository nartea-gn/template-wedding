import videoSrc from '../../assets/video.mp4'

const weddingAssets: Readonly<Record<string, string>> = {
    'wedding-hero-video': videoSrc,
}

export function resolveWeddingAsset(assetId: string): string {
    const asset = weddingAssets[assetId]
    if (!asset) throw new Error(`Unknown wedding asset: ${assetId}`)
    return asset
}
