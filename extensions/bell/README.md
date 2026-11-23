# Bell extension

**Implementation:** `extensions/bell/index.ts`

Rings terminal bell when an agent run settles and Pi is ready for input. Uses `agent_settled` so retries and queued follow-up work do not ring early.
