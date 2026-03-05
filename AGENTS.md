# AI Development Instructions

This repository supports development with AI coding agents.

## Required Reading Order

Before making changes, read:

1. PROJECT_RULES.md
2. docs/ai-context.md
3. docs/architecture.md
4. docs/todo.md
5. AI_COMMANDS.md

## Command Invocation Rule

When the user uses the format `执行【命令名称】`:

1. Match the command name in `AI_COMMANDS.md`.
2. Execute the matched template steps in order.
3. If not found, report unavailable command and list available commands from `AI_COMMANDS.md`.

## Workflow

1. Understand project context
2. Choose a task from todo.md
3. Plan the implementation
4. Modify code
5. Update documentation if needed

## Documentation Rules

If the project changes:

update:

- ai-context.md
- architecture.md
- todo.md
- dev-log.md
