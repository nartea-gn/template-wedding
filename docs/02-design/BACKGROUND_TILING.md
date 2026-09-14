# Teselado de los módulos de cuerpo

Cómo se comprueba y se corrige que un módulo de cuerpo se repita sin costura, y qué tiene que
cumplir una obra nueva para no traer el problema de vuelta.

Complementa [`BACKGROUNDS.md`](./BACKGROUNDS.md), que define la dirección visual. Esto es el
criterio técnico que esa dirección tiene que satisfacer.

## El problema

La apertura de cada colección se pinta una vez; el **módulo de cuerpo** se repite en vertical con
`background-repeat: repeat-y` y `background-size: 100% auto`. A 390 px de ancho, una obra de
1024 × 1536 se dibuja a 390 × 585, así que cada 585 px empieza otra baldosa.

Si la primera fila de píxeles de la obra no continúa la última, ahí hay un corte. Y no es un punto:
es una línea horizontal a todo el ancho que se repite cada 585 px. En una landing de 3.265 px salen
cuatro, y la primera no cuenta porque queda bajo la apertura.

**El defecto está en la obra, no en el CSS.** El propio README de los assets llama a esta pieza «un
cuerpo repetible sereno», así que la intención siempre fue que no cortara.

## El criterio: ratio, no valor absoluto

La medida obvia —la diferencia media por píxel entre la primera fila y la última— **no sirve sola**.
Una obra con mucha textura tiene diferencias grandes entre cualquier par de filas, así que un corte
de 5 pasa desapercibido; una obra lisa, con diferencias de 1 entre filas vecinas, delata un corte de
3.

Lo que decide si se ve es el **ratio**:

```
ratio = (diferencia entre la primera fila y la última)
        ─────────────────────────────────────────────
        (diferencia media entre dos filas vecinas de esa misma obra)
```

Un ratio de 1 significa que la unión entre baldosas no es peor que cualquier otra transición de la
obra: **invisible por construcción**.

| Ratio | Lectura |
|---|---|
| ≤ 1,25 | La unión no se distingue. Objetivo. |
| 1,25 – 1,45 | Aceptable. Se nota mirándola a propósito. |
| > 1,45 | Visible. Pide rehacer la obra, no parchearla. |

Un umbral absoluto engaña: `linen` cumplía «corte < 1,5» no porque teselara mejor, sino porque su
obra es 2,7 veces más ruidosa que la de `royal`.

## El arreglo mecánico: fundido circular

Para una obra cuyo motivo no toca los bordes superior e inferior, la costura se elimina **sin
retocar el motivo**:

1. Se elige una banda de `N` filas.
2. Las `N` primeras filas se mezclan con las `N` últimas, con una rampa lineal: la fila 0 es la
   `h-N` del original, y en la fila `N` ya es la propia.
3. Se recorta la imagen a `h - N`.

El resultado: la última fila de una baldosa y la primera de la siguiente son **dos filas contiguas
del original**, así que la unión hereda la continuidad que la obra ya tenía ahí dentro.

Por eso las alturas de los módulos **no son redondas**: 1526, 1533, 1530, 1074, 1038… Cada una es
su altura original menos su banda.

### La banda hay que buscarla, no fijarla

No hay un ancho bueno para todas. Va de **3 px** (`boho-body-narrow`) a **48 px**
(`dark-body-medium`), y no es monótono: bandas mayores no dan siempre ratios menores, porque el
ruido del codificador WebP es del mismo orden que lo que se está midiendo. Se barre y se coge la
mejor.

### Lo que hay que comprobar además del ratio

El fundido podría cambiar un corte por una **raya dentro de la banda**. Se vigila midiendo el pico
de diferencia entre filas vecinas en toda la imagen: si tras el fundido el pico sigue donde estaba
en la obra original, el fundido no ha creado nada. Un intento anterior —una banda de color centrada
en la costura— bajaba el corte de 11,2 a 7,0 pero subía el brillo alrededor de 238,4 a 243,3: una
raya clara cada 585 px. Se revirtió.

## Qué se ejecutó, y con qué resultado

Diez de los quince módulos, cada uno con su banda y **a la calidad WebP que su propio README
documenta** (84 en `royal`, 88 en el resto):

| Asset | Banda | Ratio antes | Ratio después |
|---|---:|---:|---:|
| `royal-body-narrow` | 10 px | 2,64× | **0,88×** |
| `royal-body-medium` | 12 px | 3,54× | **1,16×** |
| `royal-body-wide` | 20 px | 2,95× | **0,96×** |
| `boho-body-narrow` | 3 px | 7,13× | 1,44× |
| `boho-body-medium` | 8 px | 3,05× | **1,04×** |
| `boho-body-wide` | 40 px | 3,15× | **1,09×** |
| `dark-body-narrow` | 6 px | 3,06× | **0,87×** |
| `dark-body-medium` | 48 px | 2,26× | **1,03×** |
| `dark-body-wide` | 8 px | 2,50× | **1,02×** |
| `magnolia-body-medium` | 24 px | 4,14× | **1,21×** |

**Sin tocar:**

- `linen-*`: ya teselan (0,18× a 0,28×). El fundido los **empeoraría**.
- `magnolia-body-narrow` (3,64×) y `magnolia-body-wide` (5,58×): el fundido las deja en 1,76× y
  1,77×, por encima del umbral. Tienen motivo pegado a un borde, así que no hay banda tranquila que
  fundir. **Piden rehacer la obra.**

El re-encode no degrada el arte: medida la diferencia media en la zona que el fundido no toca, sale
entre **0,41 y 1,39 sobre 255** —por debajo de la variación que la propia obra tiene entre filas
vecinas.

## El script

**No está en el repositorio, y es deliberado.** Carga `sharp` por una ruta del store de pnpm
(`node_modules/.pnpm/sharp@…/node_modules/sharp`) porque `sharp` **no es dependencia declarada**:
`cc7079a` sacó a `wrangler` de una versión vulnerable y el árbol no la volvió a declarar. Una ruta
del store depende del lockfile y se rompe al primer bump.

Si esto se repite lo bastante como para querer automatizarlo, hay que decidir antes si `sharp` entra
como `devDependency` del pipeline de assets — con su revisión de cadena de suministro— y entonces el
script vive en `scripts/`, junto a `vendor-fonts.mjs`. Mientras tanto es una herramienta de un solo
uso y lo que entra en la serie son los `.webp` regenerados.

Las tres piezas del script, por si hay que rehacerlo:

```js
// 1. la métrica
const delta = (a, b, {data, w, c}) => { /* diferencia media por píxel entre dos filas */ }
const ratio = delta(0, h - 1, img) / (media de delta(y, y+1) sobre toda la imagen)

// 2. el fundido circular
for (let y = 0; y < h - banda; y++)
    out[y] = y < banda
        ? mezcla(img[y], img[h - banda + y], y / banda)   // rampa lineal
        : img[y]

// 3. el barrido
for (const banda of [2,3,4,6,8,10,12,16,20,24,32,40,48,64,80,96,128]) { … }  // se queda el mejor ratio
```

**Dos trampas que costaron tiempo:**

- **`sharp.cache(false)` es obligatorio.** Sin él, leer dos ficheros distintos escritos en la misma
  ruta devuelve el primero, y el barrido entero mide la misma imagen. El síntoma fue un ratio
  idéntico —1,03×— en las doce obras, que es exactamente el tipo de resultado demasiado bueno que
  hay que desconfiar.
- **Se mide el fichero que va a entrar**, después del `toFile` final, no el del barrido. El
  codificador introduce diferencias del orden de lo que se mide.

## Encargo listo para un generador de imágenes

Lo que hay repartido por los README —dimensiones, calidad, breakpoint, paleta, prompt maestro—
describe **la apertura**, no el módulo de cuerpo, y ninguno de esos prompts menciona la única
condición que decide si el módulo sirve: que se pueda repetir. Un generador al que se le pase el
prompt maestro devolverá una obra bonita que corta.

Este es el encargo que sí funciona. Se rellena con los datos de la tabla del README del tema y con
los hexadecimales de `src/design/themes/themes.ts`.

```text
A seamlessly tileable vertical background strip for a wedding invitation website.

Size: {ancho} × {alto} px.
Palette, exact: {hex de background, surface, primary, border y muted del tema en themes.ts}.
Style: {estilo del prompt maestro del tema — acuarela, papel, botánica, lo que sea}.
Use the theme's opening artwork as the style reference; this is its continuation downwards.

HARD CONSTRAINTS, in order of importance:

1. TILEABLE. The image repeats vertically forever. Its top edge must continue its own bottom
   edge, so that stacking two copies shows no line where they meet.
2. QUIET BORDERS. The top 6% and the bottom 6% must contain no recognisable motif: no leaf,
   flower, stem or hard edge. Washes and paper texture only. This band is what allows the seam
   to be corrected afterwards if the tiling is not perfect.
3. CALM CENTRE. The middle 60% horizontally stays low-contrast: readable text sits on top of it.
4. No text, letters, numbers, people, frames, UI, logos or watermark.
5. No obvious wallpaper repetition inside the image itself.
```

**La restricción 2 es la que hay que exigir aunque el generador acierte con la 1.** Ningún modelo de
imagen garantiza el teselado: la banda tranquila es lo que permite corregirlo después sin emborronar
nada, y es exactamente lo que les falta a `magnolia-body-narrow` y `magnolia-body-wide`, que por eso
no tienen arreglo mecánico.

### Cómo comprobar lo que devuelva

No a ojo. Con la misma medida de este documento: **ratio ≤ 1,25**, y el pico interno donde ya
estaba. Si el ratio sale entre 1,25 y 3 pero la banda de los bordes está limpia, el fundido
circular lo baja; si el motivo toca un borde, se pide otra.

### Un hueco que conviene tapar de paso

`royal` documenta el prompt de sus módulos de cuerpo. **`magnolia` no**: su README solo guarda el
prompt de la apertura. Justo las dos obras que hay que rehacer son las que no tienen de dónde
partir, así que el encargo de arriba es todo lo que hay — y conviene escribir el prompt resultante
en su README cuando se generen, para no repetir el hueco.

## Para una obra nueva

Antes de aceptar un módulo de cuerpo:

1. **Ratio ≤ 1,25** entre su primera fila y su última.
2. **Ninguna zona con motivo tocando el borde superior o el inferior.** Sin banda tranquila no hay
   arreglo mecánico posible, y es lo que deja fuera a las dos de `magnolia`.
3. Si el generador puede producirla **ya teselable**, mejor que corregirla después: el fundido
   cuesta filas de obra, y en `dark-body-medium` costó 48.

La apertura no tiene este requisito: se pinta una vez y no se repite.
