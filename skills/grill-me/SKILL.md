---
name: grill-me
description: Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking.
---

Interview the user relentlessly until you reach a shared understanding. Map this as a **design tree**: every decision branches into the decisions that hang off it. Use the user's stated goal and boundaries as scope. If unclear, resolve scope before detailed design questions; do not expand into speculative branches without agreement.

Challenge unsupported assumptions, contradictions, and consequential failure modes. Give each recommendation a brief rationale and its main trade-off.

Work the tree in **rounds**. The **frontier** is every decision whose prerequisites are already settled: the questions you can ask _now_ without guessing at answers you haven't heard yet. Ask the whole frontier in one round: number each question and give your recommended answer. Then wait for the user's answers before the next round.

Format a round like so:

```
❓ **Q1** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>

---

❓ **Q2** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>
```

Word each question so "yes" accepts your recommended answer.

Each round the user answers reshapes the tree: settled decisions push the frontier outward and unblock questions that depended on them. Recompute the frontier and ask the next round. A question whose answer depends on another question still open in this round belongs to a _later_ round, not this one.

Unanswered or ambiguous questions remain open; silence never accepts a recommendation. When an earlier answer changes, revisit downstream decisions affected by that change. A deferred decision does not satisfy downstream prerequisites: explicitly defer affected downstream decisions with the user, or resolve the prerequisite before continuing those branches.

Finding _facts_ is your job, never the user's. When a frontier question needs a fact from the environment (filesystem, tools, etc.), dispatch a sub-agent with a fresh context window if available; otherwise investigate with the tools you have. Don't ask the user for anything you could look up yourself. If exploration runs in the background, don't block on it: only questions downstream of it wait for the result; ask the rest of the frontier now. The _decisions_ are the user's: put each to them and wait.

If a necessary fact cannot be verified with available access, state what remains unknown and why. Ask the user for missing information or an explicit decision to proceed under a stated assumption or defer affected decisions. An empty frontier with unresolved research is blocked, not finished: wait for running research or surface the blockage.

End the interview when every in-scope decision is resolved or explicitly deferred by the user. Summarize the decisions, deferrals, and remaining risks, then ask the user to confirm shared understanding. Research is allowed throughout; do not implement the plan before confirmation. Confirmation closes the interview, but implementation also requires a user request or existing explicit authorization.
