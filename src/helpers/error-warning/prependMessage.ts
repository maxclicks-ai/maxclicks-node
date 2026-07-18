function indent(text: string, prefix: string): string {
  return text
    .split('\n')
    .map(line => `${prefix}${line}`)
    .join('\n')
}

/**
 * Prepends a prefix to a message, indenting multi-line messages.
 *
 * - Single-line: `"prefix: message"`
 * - Multi-line: prefix on its own line, message indented below
 *
 * Vendored from `@maxclicks/utilities`; keep in sync with the source of truth.
 */
export function prependMessage(prefix: string, message: string): string {
  if (!message || !prefix) return message
  if (message.includes('\n')) return `${prefix}:\n${indent(message, '  ')}`
  return `${prefix}: ${message}`
}
