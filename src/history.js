/**
 * Validation for the conversation history the browser sends back each turn.
 *
 * Kept in its own module so the pure part is testable: src/index.js imports
 * ui.html, which only resolves through wrangler's Text rule, not under Node.
 */

// The client resends the whole conversation on every turn, so these caps
// bound what one request can push into the model's context.
export const MAX_HISTORY_MESSAGES = 20;
export const MAX_CONTENT_CHARS = 2000;

/**
 * Reduce client-supplied history to turns the model can safely be shown.
 *
 * The history arrives from the browser, so it is untrusted. Each turn is
 * rebuilt field by field rather than passed through, which drops injected
 * roles such as "system" and stray keys such as tool_calls along with them.
 */
export function sanitizeHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter(
      (turn) =>
        (turn?.role === "user" || turn?.role === "assistant") &&
        typeof turn.content === "string",
    )
    .slice(-MAX_HISTORY_MESSAGES)
    .map(({ role, content }) => ({
      role,
      content: content.slice(0, MAX_CONTENT_CHARS),
    }));
}
