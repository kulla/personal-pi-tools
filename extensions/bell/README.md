# Bell extension

**Implementation:** `extensions/bell/index.ts`

Rings terminal bell in interactive TUI mode when an agent run settles and Pi is ready for input. Uses `agent_settled` so retries and queued follow-up work do not ring early. Does not write bell characters into print, JSON, or RPC output. Audible sound depends on terminal bell settings.
