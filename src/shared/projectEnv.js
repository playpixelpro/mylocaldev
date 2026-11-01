/**
 * Project environment helpers shared by the Electron main process and the renderer.
 *
 * MyLocalDev injects each project's stored environment into PHP-CGI, terminal and
 * supervisor processes as real OS environment variables. Those variables take
 * precedence over the project's own `.env` file, and an application that loads its
 * `.env` through an immutable Dotenv repository (the recommended default) refuses to
 * overwrite values that already exist in the environment. The result used to be that
 * a project with a perfectly valid `.env` could still look "not configured" because
 * `$_ENV` never received the injected keys.
 *
 * The fix is to keep the injected set as small as possible:
 *   - empty values are dropped, because an empty OS variable shadows a real `.env` value
 *   - values identical to the project's `.env` are dropped, because there is nothing to override
 *
 * Only genuine overrides are injected afterwards.
 *
 * NOTE: CommonJS syntax for Electron main process compatibility.
 */

'use strict';

/**
 * Parse the contents of a `.env` file into a plain object.
 *
 * Supports comments, `export` prefixes, single/double quoted values and
 * multi-line quoted values, matching the parser used by the Environment tab.
 *
 * @param {string} content - Raw `.env` file contents
 * @returns {Record<string, string>} Parsed key/value pairs
 */
function parseEnvContent(content) {
  const environment = {};

  if (typeof content !== 'string' || content.length === 0) {
    return environment;
  }

  const lines = content.split('\n');
  let currentKey = null;
  let currentValue = '';
  let inMultilineQuote = null;

  for (const line of lines) {
    if (inMultilineQuote) {
      currentValue += '\n' + line;
      const trimmedLine = line.trimEnd();
      if (trimmedLine.endsWith(inMultilineQuote) && !trimmedLine.endsWith('\\' + inMultilineQuote)) {
        currentValue = currentValue.slice(0, -1);
        environment[currentKey] = currentValue;
        currentKey = null;
        currentValue = '';
        inMultilineQuote = null;
      }
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const normalized = trimmed.startsWith('export ') ? trimmed.slice('export '.length).trim() : trimmed;
    const equalsIndex = normalized.indexOf('=');
    if (equalsIndex <= 0) {
      continue;
    }

    const key = normalized.substring(0, equalsIndex).trim();
    const value = normalized.substring(equalsIndex + 1).trim();
    if (!key) {
      continue;
    }

    const startsWithDoubleQuote = value.startsWith('"');
    const startsWithSingleQuote = value.startsWith("'");

    if (startsWithDoubleQuote || startsWithSingleQuote) {
      const quote = startsWithDoubleQuote ? '"' : "'";
      const valueWithoutStartQuote = value.slice(1);

      if (valueWithoutStartQuote.endsWith(quote) && !valueWithoutStartQuote.endsWith('\\' + quote)) {
        environment[key] = valueWithoutStartQuote.slice(0, -1);
      } else {
        currentKey = key;
        currentValue = valueWithoutStartQuote;
        inMultilineQuote = quote;
      }
    } else {
      environment[key] = value;
    }
  }

  if (currentKey && inMultilineQuote) {
    environment[currentKey] = currentValue;
  }

  return environment;
}

/**
 * @param {unknown} value
 * @returns {boolean} True when the value would do nothing useful as an OS variable
 */
function isBlankEnvValue(value) {
  return value === undefined || value === null || String(value).length === 0;
}

/**
 * Build the subset of a project's stored environment that should be injected into
 * child processes.
 *
 * Keys with empty values are skipped, and keys whose value already matches the
 * project's `.env` file are skipped as well so the application keeps reading its own
 * file through its normal Dotenv bootstrap.
 *
 * @param {Record<string, string>} projectEnvironment - Values stored by MyLocalDev
 * @param {Record<string, string>} fileEnvironment - Values parsed from the project's `.env`
 * @returns {Record<string, string>} Environment variables that are actual overrides
 */
function buildEnvOverrides(projectEnvironment, fileEnvironment) {
  const overrides = {};
  const fileEnvironmentValues = fileEnvironment || {};

  for (const [key, rawValue] of Object.entries(projectEnvironment || {})) {
    if (!key || isBlankEnvValue(rawValue)) {
      continue;
    }

    const value = String(rawValue);

    if (Object.prototype.hasOwnProperty.call(fileEnvironmentValues, key)) {
      const fileValue = fileEnvironmentValues[key];
      if (!isBlankEnvValue(fileValue) && String(fileValue) === value) {
        continue;
      }
    }

    overrides[key] = value;
  }

  return overrides;
}

module.exports = {
  parseEnvContent,
  isBlankEnvValue,
  buildEnvOverrides,
};
