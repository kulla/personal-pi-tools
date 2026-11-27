---
name: writing-tests
description: Write or review unit, integration, and end-to-end tests. Use when adding coverage, fixing a bug, choosing a test level, or improving brittle tests. Assert observable behavior rather than implementation details.
license: MIT
---

# Writing Tests

Test behavior, not implementation. A test should fail when a user-visible contract breaks and keep passing when internals change without changing that contract.

## Choose the boundary

- **Unit:** Exercise a small public contract with concrete inputs and outputs. Use for domain rules and edge cases; avoid testing private helpers directly.
- **Integration:** Exercise real interactions between components, such as application code and a database. Mock only external systems that cannot be used reliably in the test environment.
- **End-to-end:** Exercise a critical user journey through the deployed interface. Check outcomes a user can observe, not internal calls or markup unrelated to the behavior.

Use the narrowest level that can prove the requirement; add broader tests when the interaction between components is the risk. Prefer a few meaningful cases over repeating the same assertion at every level.

## Write the claim

- Start with a concrete requirement and an input that could expose a defect. Derive expected results from the requirement, never from the code under test.
- Drive code through the interface its consumers use. Assert returned values, observable errors, read-back state, and external effects. An external service receiving a request is behavior; an internal helper being called is not.
- Cover meaningful success, failure, and boundary cases. Pair a claim that something never happens with a case where it should happen. Assert error types or codes callers use, not incidental wording.
- For a bug fix, make a regression test fail on the faulty behavior before applying the fix when feasible.

## Keep tests trustworthy

- Isolate each test's state. Use deterministic inputs, controlled time, and explicit cleanup; avoid sleeps and dependence on test order.
- Mock at external boundaries, not between units whose integration matters. Avoid assertions on mock call order unless that order is part of the contract.
- Ask two questions: If observable behavior breaks, does this test fail? If internals change but behavior stays correct, does this test pass? Rewrite or remove tests that fail either check.
- Run the relevant tests and inspect failures. A passing build, snapshot, or assertion on data created by the test itself does not prove the behavior.
