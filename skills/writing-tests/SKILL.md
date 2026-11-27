---
name: writing-tests
description: Apply when writing, reviewing or changing unit, integration, and end-to-end tests. Assert observable behavior rather than implementation details.
license: MIT
---

# Test Behavior, Not Implementation

A test is a claim about what users of the code can observe through its interface: return values, errors, state they can read back, and effects on outside systems. Private helpers, internal call order, and intermediate data are implementation.

Judge each test against two imagined edits:

- **Break the behavior** (a wrong value, a skipped or doubled effect). If the test still passes, it proves nothing. The usual causes are a loose assertion, an expected value computed by the code under test, and an assertion on data the test built itself.
- **Change the internals** and keep every observable result. If the test fails, it is pinned to the implementation.

Keep a test that catches the first edit and survives the second. Rewrite or delete the rest. Drive the code through its public interface with a concrete input, and derive the expected value from the requirement. What an external service receives is behavior. A call to an internal helper is not. Pair "this never happens" with a case where it does happen. Assert the error type that callers branch on, not the message.

## Single responsibility

Test one logical behavior or scenario. Multiple assertions are fine when they verify that behavior.

## Isolation

Avoid dependencies on other tests, shared mutable state, or execution order.

## Arrange–Act–Assert (AAA)

Prepare inputs, execute behavior, then verify results.

## Readability

Use descriptive names, explicit inputs, and clear assertions. Tests should read as executable documentation.

## Minimal mocking

Mock external dependencies only when needed; excessive mocking couples tests to implementation and can hide failures.

## Simplicity

Avoid unnecessary abstractions, branches, and complex calculations in tests. Expected results should be easy to verify.
