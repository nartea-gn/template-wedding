# ADR-002: Incremental evolution

- Estado: aceptado
- Fecha: 2026-07-11

## Contexto y opciones

La aplicación ya funciona y se despliega. Se valoró reescribir, mantener dos aplicaciones o sustituir piezas
verticalmente.

## Decisión

Evolucionar la aplicación actual. Cada hito mantiene el despliegue funcional y elimina la pieza anterior al validar su
reemplazo.

## Consecuencias

Habrá adaptadores temporales, pero no una carpeta `legacy` permanente ni una migración final masiva.

