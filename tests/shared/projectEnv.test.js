/**
 * Tests for src/shared/projectEnv.js
 *
 * Covers `.env` parsing and the rules that decide which stored project values are
 * injected into child processes as real overrides.
 */
import { describe, it, expect } from 'vitest';

const { parseEnvContent, isBlankEnvValue, buildEnvOverrides } = require('../../src/shared/projectEnv');

describe('shared/projectEnv', () => {
    describe('parseEnvContent', () => {
        it('parses simple key/value pairs and skips comments and blanks', () => {
            const parsed = parseEnvContent('# comment\nAPP_NAME=Demo\n\nDB_PORT=3306\n');

            expect(parsed).toEqual({ APP_NAME: 'Demo', DB_PORT: '3306' });
        });

        it('strips quotes and supports the export prefix', () => {
            const parsed = parseEnvContent('export APP_NAME="Demo App"\nMAIL_FROM=\'dev@test\'\n');

            expect(parsed).toEqual({ APP_NAME: 'Demo App', MAIL_FROM: 'dev@test' });
        });

        it('reads multi-line quoted values', () => {
            const parsed = parseEnvContent('PRIVATE_KEY="line1\nline2"\nMAIL_FROM=dev@test\n');

            expect(parsed).toEqual({ PRIVATE_KEY: 'line1\nline2', MAIL_FROM: 'dev@test' });
        });

        it('returns an empty object for non-string input', () => {
            expect(parseEnvContent(undefined)).toEqual({});
            expect(parseEnvContent(null)).toEqual({});
            expect(parseEnvContent('')).toEqual({});
        });
    });

    describe('isBlankEnvValue', () => {
        it('treats undefined, null and empty strings as blank', () => {
            expect(isBlankEnvValue(undefined)).toBe(true);
            expect(isBlankEnvValue(null)).toBe(true);
            expect(isBlankEnvValue('')).toBe(true);
            expect(isBlankEnvValue(0)).toBe(false);
            expect(isBlankEnvValue('false')).toBe(false);
        });
    });

    describe('buildEnvOverrides', () => {
        it('drops empty values so they cannot shadow real .env values', () => {
            const overrides = buildEnvOverrides({ DB_PASSWORD: '', DB_HOST: '127.0.0.1' }, {});

            expect(overrides).toEqual({ DB_HOST: '127.0.0.1' });
        });

        it('drops values that already match the .env file', () => {
            const overrides = buildEnvOverrides(
                { APP_ENV: 'local', DB_DATABASE: 'hulamko' },
                { APP_ENV: 'local', DB_DATABASE: 'hulamko' }
            );

            expect(overrides).toEqual({});
        });

        it('keeps genuine overrides', () => {
            const overrides = buildEnvOverrides(
                { APP_ENV: 'local', DB_DATABASE: 'hulamko' },
                { APP_ENV: 'development', DB_DATABASE: 'hulamko' }
            );

            expect(overrides).toEqual({ APP_ENV: 'local' });
        });

        it('keeps keys that the .env file does not declare at all', () => {
            const overrides = buildEnvOverrides({ APP_DEBUG: 'true' }, { APP_ENV: 'local' });

            expect(overrides).toEqual({ APP_DEBUG: 'true' });
        });

        it('ignores a blank value in the .env file and still injects the stored value', () => {
            const overrides = buildEnvOverrides({ APP_KEY: 'abc123' }, { APP_KEY: '' });

            expect(overrides).toEqual({ APP_KEY: 'abc123' });
        });

        it('coerces numbers to strings', () => {
            const overrides = buildEnvOverrides({ DB_PORT: 3306 }, {});

            expect(overrides).toEqual({ DB_PORT: '3306' });
        });

        it('handles missing arguments', () => {
            expect(buildEnvOverrides(undefined, undefined)).toEqual({});
            expect(buildEnvOverrides(null, { APP_ENV: 'local' })).toEqual({});
        });
    });
});
