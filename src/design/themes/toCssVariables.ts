import {motion, spacing, statusColors} from '../tokens'
import type {ThemeDefinition} from './types'

export function toCssVariables(theme: ThemeDefinition): Record<string, string> {
    return {
        '--color-wedding-bg': theme.colors.background,
        '--color-wedding-bg-rgb': theme.colors.backgroundRgb,
        '--color-wedding-primary': theme.colors.primary,
        '--color-wedding-primary-rgb': theme.colors.primaryRgb,
        '--color-wedding-text': theme.colors.text,
        '--color-wedding-text-rgb': theme.colors.textRgb,
        '--color-wedding-surface': theme.colors.surface,
        '--color-wedding-surface-rgb': theme.colors.surfaceRgb,
        '--color-wedding-border': theme.colors.border,
        '--color-wedding-border-rgb': theme.colors.borderRgb,
        '--color-wedding-muted': theme.colors.muted,
        '--color-wedding-muted-rgb': theme.colors.mutedRgb,
        '--color-wedding-success': statusColors.success,
        '--color-wedding-warning': statusColors.warning,
        '--color-wedding-error': statusColors.error,
        '--color-wedding-info': statusColors.info,
        '--font-heading': theme.typography.heading,
        '--font-body': theme.typography.body,
        '--shadow-card': theme.shadows.card,
        '--shadow-card-lg': theme.shadows.cardLarge,
        '--shadow-card-sm': theme.shadows.cardSmall,
        '--radius-card': theme.radius.card,
        '--radius-sm': theme.radius.small,
        '--radius-lg': theme.radius.large,
        '--radius-xl': theme.radius.extraLarge,
        '--spacing-18': spacing.sectionCompact,
        '--spacing-88': spacing.contentWide,
        '--spacing-128': spacing.contentMax,
        '--duration-400': motion.durationNormal,
        '--duration-600': motion.durationSlow,
    }
}

