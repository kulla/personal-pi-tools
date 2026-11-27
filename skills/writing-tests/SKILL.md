---
name: writing-tests
description: Apply when writing, reviewing or changing unit, integration, and end-to-end tests. Assert observable behavior rather than implementation details.
license: MIT
---

# Writing Tests

## Test Behavior, Not Implementation

A test is a claim about what users of the code can observe through its interface: return values, errors, state they can read back, and effects on outside systems. Private helpers, internal call order, and intermediate data are implementation.

Judge each test against two imagined edits:

- **Break the behavior** (a wrong value, a skipped or doubled effect). If the test still passes, it proves nothing. The usual causes are a loose assertion, an expected value computed by the code under test, and an assertion on data the test built itself.
- **Change the internals** and keep every observable result. If the test fails, it is pinned to the implementation.

Keep a test that catches the first edit and survives the second. Rewrite or delete the rest. Drive the code through its public interface with a concrete input, and derive the expected value from the requirement. What an external service receives is behavior. A call to an internal helper is not. Pair "this never happens" with a case where it does happen. Assert the error type that callers branch on, not the message.

## Test Behavior Where It Belongs

A unit test should assert only behavior owned by the function or module under test. Do not repeat tests for a dependency's behavior just because the unit calls it. Delete redundant tests; move unique cases to the owning module's tests or merge them with existing cases there. Keep unit tests concise. Integration and end-to-end tests may verify behavior across modules.

## Other principles

- **Scope:** Test one logical behavior per test. Multiple assertions
  are acceptable when verifying the same behavior.
- **Isolation:** Never depend on shared mutable state, other tests,
  or execution order.
- **Mocking:** Prefer real dependencies when practical. Mock only
  when necessary for isolation or determinism.
- **Structure:** Follow Arrange–Act–Assert. Separate phases with
  blank lines rather than redundant comments.
- **Readability:** Name tests by scenario and expected behavior.
  Keep relevant inputs and expected outputs explicit.
- **Simplicity:** Prefer duplication over unnecessary abstractions.
  Avoid branching, complex calculations, and reproducing production
  logic to derive expected results.
