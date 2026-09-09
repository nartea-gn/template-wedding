import {readdirSync} from 'node:fs'
import {join} from 'node:path'
import {describe, expect, it} from 'vitest'

/**
 * The version the production project already recorded before this repository adopted migrations.
 *
 * Documented in `ADR-012 §Sprint 7.1` and confirmed by `SUPABASE_BASELINE_AUDIT.md`. It is the
 * line `supabase db push` reconciles against: a local file ordered before it makes the CLI refuse
 * the whole push with "Found local migration files to be inserted before the last migration on
 * remote database", apply nothing, and fail every deploy step that follows.
 */
const REMOTE_HEAD = '20260712'

/**
 * The one file that predates the remote head on purpose.
 *
 * `pg_cron` and `pg_net` have to exist before `20260901` and `20260903` reference them, and this
 * project already carried later migrations when that need appeared. It is why `deploy.yml` passes
 * `--include-all`. Grandfathered here so the rule can catch the *next* one, which would break the
 * pipeline exactly the same way and, on a fresh database, pass every other check in the suite.
 */
const GRANDFATHERED = new Set(['20260000'])

const MIGRATIONS = join(process.cwd(), 'supabase', 'migrations')
const NAME_PATTERN = /^(\d+)_[a-z0-9_]+\.sql$/

describe('supabase/migrations', () => {
    const files = readdirSync(MIGRATIONS).filter(name => name.endsWith('.sql')).sort()

    it('is not empty, so a broken glob cannot make this suite vacuously pass', () => {
        expect(files.length).toBeGreaterThan(0)
    })

    it.each(files)('%s follows the <version>_snake_case.sql convention', name => {
        expect(name).toMatch(NAME_PATTERN)
    })

    it('carries strictly increasing versions', () => {
        const versions = files.map(name => NAME_PATTERN.exec(name)?.[1] ?? name)

        expect(versions).toEqual([...versions].sort())
        expect(new Set(versions).size).toBe(versions.length)
    })

    // The check that would have caught the outage: `db reset` and `db:verify` both start from an
    // empty database and apply the directory in name order, where an out-of-order file is
    // perfectly valid. Only a remote with existing history rejects it, and nothing local models
    // that -- so the rule is expressed against the recorded head instead.
    it('adds nothing ordered before the version production already recorded', () => {
        const offenders = files
            .map(name => NAME_PATTERN.exec(name)?.[1] ?? name)
            .filter(version => version < REMOTE_HEAD)
            .filter(version => !GRANDFATHERED.has(version))

        expect(offenders).toEqual([])
    })
})
