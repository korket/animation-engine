# Git and Commit Conventions

## Logical Commits

A commit should represent one logical change.

Avoid mixing unrelated work.

Examples of good boundaries:

- add scene duration validation;
- preserve anchor offsets during parent transforms;
- add a minimal JSON-to-MP4 render fixture;
- separate asset identity from asset version.

## Commit Messages

Prefer concise subject lines in the form:

```text
area: imperative description
```

Examples:

```text
engine: reject animations past scene duration
layouts: preserve anchor offsets during parent transforms
renderer: add minimal JSON-to-MP4 fixture
assets: separate asset identity from asset version
```

Avoid vague messages such as:

```text
fix stuff
cleanup
update code
changes
improvements
```

## Commit Body

For non-trivial changes, explain:

1. what problem existed;
2. why it mattered;
3. what changed;
4. important constraints or trade-offs.

The diff should support the claims made in the message.

## Bisectability

Keep commits buildable and testable when practical.

Do not intentionally create intermediate commits that depend on undocumented future commits to become correct.

## Automation Rule

Do not create commits, tags, branches, or push changes unless the user or active workflow explicitly requests it.
