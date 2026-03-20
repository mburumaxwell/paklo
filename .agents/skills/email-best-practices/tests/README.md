# Skill Tests

Tests for the `email-best-practices` skill using the RED-GREEN methodology from [writing-skills](https://github.com/yourorg/writing-skills).

## Skill Type

This is a **reference/technique** skill (not discipline-enforcing), so tests focus on:

- **Retrieval** — Does the agent find the right resource for a given problem?
- **Application** — Does the agent produce correct, specific guidance?
- **Gap** — Are common email scenarios adequately covered?

## Test Scenarios

| # | Scenario | Tests | Key Resource(s) |
|---|----------|-------|-----------------|
| 1 | Emails going to spam | Retrieval + Application | deliverability.md |
| 2 | Multi-region compliance | Retrieval + Application | compliance.md |
| 3 | Retry logic + idempotency | Application | sending-reliability.md |
| 4 | Webhook bounce/complaint handling | Application | webhooks-events.md, list-management.md |
| 5 | New SaaS email infrastructure | Retrieval + Application + Gap | All resources |

## Running Tests

Each scenario in `scenarios/` is a self-contained prompt. Run with a subagent:

**RED (baseline):** Run the prompt as-is — no skill loaded. The agent uses only general knowledge.

**GREEN (with skill):** Prepend: `You have access to an email best practices skill with resources in <path>. Read SKILL.md first, then read the relevant resource file(s).`

Compare outputs against `results.md` for expected correctness criteria.

## Results

See `results.md` for the full RED vs GREEN comparison and gap analysis from the initial test campaign.
