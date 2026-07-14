# Flujo de compresión de vídeo y generación de poster

Este procedimiento documenta exactamente cómo se prepararon `video.mp4` y `video-poster.webp` en Sprint 6.2. Está
pensado para PowerShell en Windows y se ejecuta desde la raíz del repositorio.

El proceso es manual de forma intencionada: FFmpeg es una herramienta temporal de producción de activos, no una
dependencia del Core ni del build de la invitación.

## 1. Requisitos y rutas

Comprueba que estás en el repositorio:

```powershell
Set-Location .\template-wedding
```

Si ya tienes FFmpeg instalado:

```powershell
$ffmpeg = (Get-Command ffmpeg).Source
```

Si no lo tienes, descarga una copia temporal sin modificar `package.json` ni `pnpm-lock.yaml`:

```powershell
npm.cmd install --prefix "$env:TEMP\nartea-ffmpeg" ffmpeg-static
$ffmpeg = "$env:TEMP\nartea-ffmpeg\node_modules\ffmpeg-static\ffmpeg.exe"
```

Confirma que funciona:

```powershell
& $ffmpeg -version
```

## 2. Conservar el original

No comprimas directamente sobre el archivo original. Guarda una copia fuera de `src/assets` o confía en Git para
recuperarlo antes de sustituirlo:

```powershell
Copy-Item src/assets/video.mp4 "$env:TEMP\video-original.mp4"
```

## 3. Inspeccionar el vídeo

```powershell
& $ffmpeg -hide_banner -i src/assets/video.mp4
```

Que el comando termine indicando que falta un archivo de salida es normal: aquí solo se consulta la metadata. Revisa:

- duración;
- resolución y orientación;
- codec de vídeo;
- bitrate de vídeo;
- codec y bitrate de audio;
- fotogramas por segundo.

Baseline de la invitación actual:

```text
Duración: 59,1 s
Resolución: 450x806
Vídeo: H.264, 30 fps, 1500 kb/s
Audio: AAC estéreo, 192 kb/s
Tamaño: 12,5 MB
```

## 4. Buscar un buen fotograma para el poster

Crea varios candidatos sin modificar el proyecto:

```powershell
$candidates = Join-Path $env:TEMP 'nartea-poster-candidates'
New-Item -ItemType Directory -Path $candidates -Force | Out-Null

foreach ($second in 2, 8, 15, 17, 20) {
    & $ffmpeg `
        -hide_banner `
        -loglevel error `
        -ss $second `
        -i src/assets/video.mp4 `
        -frames:v 1 `
        -vf 'scale=450:-2' `
        -y (Join-Path $candidates "poster-$second.jpg")
}
```

Abre los JPG y elige un fotograma que:

- represente el contenido;
- no sea una transición borrosa o vacía;
- tenga contraste suficiente para el botón de reproducción;
- no revele información que deba aparecer más adelante;
- conserve el encuadre correcto en móvil.

Para la invitación actual se eligió el segundo `17`.

## 5. Generar el poster WebP definitivo

```powershell
& $ffmpeg `
    -hide_banner `
    -loglevel error `
    -ss 17 `
    -i src/assets/video.mp4 `
    -frames:v 1 `
    -vf 'scale=450:-2' `
    -c:v libwebp `
    -quality 80 `
    -y src/assets/video-poster.webp
```

Comprueba el tamaño:

```powershell
Get-Item src/assets/video-poster.webp | Select-Object Name, Length
```

Objetivo recomendado: menos de 150 KB. El poster actual pesa aproximadamente 46 KB.

## 6. Comprimir el vídeo sin sobrescribirlo

```powershell
& $ffmpeg `
    -hide_banner `
    -loglevel error `
    -i src/assets/video.mp4 `
    -c:v libx264 `
    -preset slow `
    -crf 27 `
    -maxrate 900k `
    -bufsize 1800k `
    -pix_fmt yuv420p `
    -c:a aac `
    -b:a 96k `
    -movflags +faststart `
    -y src/assets/video.optimized.mp4
```

Qué significa cada decisión:

- `libx264`: H.264 compatible con los navegadores objetivo.
- `preset slow`: mejora la eficiencia de compresión; solo afecta al tiempo de codificación.
- `crf 27`: equilibrio inicial entre calidad y tamaño. Un número menor conserva más calidad y genera más peso.
- `maxrate` y `bufsize`: limitan picos de bitrate.
- `yuv420p`: formato de píxel ampliamente compatible.
- `AAC 96k`: suficiente para voz y música en una invitación móvil.
- `faststart`: mueve la metadata MP4 al principio para iniciar antes la reproducción.

Si la calidad no es suficiente, prueba `-crf 25` o `-crf 26`. Si el archivo sigue siendo demasiado grande, prueba
`-crf 28`. No reduzcas resolución o fotogramas por segundo sin comparar primero el resultado.

## 7. Comparar calidad y peso

```powershell
Get-Item src/assets/video.mp4, src/assets/video.optimized.mp4 |
    Select-Object Name, Length
```

Extrae el mismo fotograma de ambos archivos para compararlos:

```powershell
$comparison = Join-Path $env:TEMP 'nartea-video-comparison'
New-Item -ItemType Directory -Path $comparison -Force | Out-Null

& $ffmpeg -hide_banner -loglevel error -ss 30 -i src/assets/video.mp4 `
    -frames:v 1 -y (Join-Path $comparison 'original.jpg')

& $ffmpeg -hide_banner -loglevel error -ss 30 -i src/assets/video.optimized.mp4 `
    -frames:v 1 -y (Join-Path $comparison 'optimized.jpg')
```

Revisa especialmente texto pequeño, gradientes, partículas, piel, bordes y escenas con movimiento. El archivo actual
bajó de 12,5 MB a aproximadamente 4,56 MB sin una pérdida visual relevante en los fotogramas comparados.

## 8. Validar el MP4

Decodificación completa:

```powershell
& $ffmpeg -hide_banner -v error -i src/assets/video.optimized.mp4 -f null NUL
if ($LASTEXITCODE -ne 0) { throw 'La validación FFmpeg ha fallado' }
```

Comprobar `faststart`:

```powershell
$bytes = [System.IO.File]::ReadAllBytes((Resolve-Path 'src/assets/video.optimized.mp4'))
$ascii = [System.Text.Encoding]::ASCII.GetString($bytes)
$moov = $ascii.IndexOf('moov')
$mdat = $ascii.IndexOf('mdat')

[PSCustomObject]@{
    MoovOffset = $moov
    MdatOffset = $mdat
    FastStart  = ($moov -ge 0 -and $moov -lt $mdat)
}
```

`FastStart` debe ser `True`.

## 9. Sustituir el vídeo

Solo después de aprobar calidad, peso y validación:

```powershell
Move-Item src/assets/video.optimized.mp4 src/assets/video.mp4 -Force
```

Comprueba con `git status` que solo han cambiado los activos esperados.

## 10. Registrar los activos en la invitación

En `src/invitations/wedding/assets.ts`:

```ts
import videoSrc from '../../assets/video.mp4'
import videoPosterSrc from '../../assets/video-poster.webp'

const weddingAssets = {
    'wedding-hero-video': videoSrc,
    'wedding-hero-video-poster': videoPosterSrc,
}
```

En la sección de vídeo de `src/invitations/wedding/invitation.ts`:

```ts
content: {
    assetId: 'wedding-hero-video',
    posterAssetId: 'wedding-hero-video-poster',
    preload: 'none',
    aspectRatio: '9 / 16',
    // claves localizadas...
}
```

El poster es opcional, pero `preload: 'none'` es la política recomendada para vídeos grandes.

## 11. Validar en navegador

```powershell
pnpm dev
```

En DevTools > Network:

1. Activa `Disable cache`.
2. Recarga la página.
3. Filtra por `mp4`.
4. Confirma que el MP4 no se solicita antes de pulsar reproducir.
5. Confirma que el poster aparece sin salto de layout.
6. Pulsa reproducir y comprueba carga, controles, sonido, finalización y repetición.
7. Repite la prueba con ancho móvil y una conexión limitada si es posible.

Después ejecuta los gates acordados:

```powershell
pnpm lint
pnpm build
```

## 12. Limpiar herramientas temporales

Cuando hayas terminado:

```powershell
Remove-Item "$env:TEMP\nartea-ffmpeg" -Recurse -Force
Remove-Item "$env:TEMP\nartea-poster-candidates" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$env:TEMP\nartea-video-comparison" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$env:TEMP\video-original.mp4" -Force -ErrorAction SilentlyContinue
```

Revisa siempre que las rutas apuntan exactamente a estas carpetas temporales antes de borrarlas.

## Checklist final

- [ ] El original está respaldado o recuperable mediante Git.
- [ ] El poster representa correctamente el vídeo y cumple el presupuesto.
- [ ] El MP4 cumple el presupuesto o tiene una excepción documentada.
- [ ] No hay diferencias visuales relevantes.
- [ ] La decodificación completa termina sin errores.
- [ ] `faststart` es verdadero.
- [ ] Los assets están registrados mediante IDs.
- [ ] El MP4 no se solicita antes de la interacción.
- [ ] `pnpm lint` y `pnpm build` pasan.

