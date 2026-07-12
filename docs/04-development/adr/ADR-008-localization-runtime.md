# ADR-008: Universal Core localization runtime

- Estado: aceptado e implementado
- Fecha: 2026-07-11

## Decisión

El Core define `DEFAULT_LOCALE = 'es'`, contratos, validación y utilidades independientes del tipo de evento. La
aplicación aporta un provider React pequeño; cada invitación declara sus locales y aporta catálogos y loaders propios.

El catálogo predeterminado se carga síncronamente y los secundarios mediante imports dinámicos. La preferencia se
persiste por invitación únicamente cuando existen varios idiomas. No se incorpora una librería i18n hasta necesitar
plurales o interpolación avanzada.

## Consecuencias

- Bodas y futuros eventos comparten el mismo runtime.
- Un único idioma no muestra selector ni solicita otros catálogos.
- Las claves tienen paridad TypeScript entre idiomas.
- `html[lang]`, fechas y selector responden al locale activo.
- Los valores almacenados en Supabase permanecen estables y separados de sus etiquetas.
