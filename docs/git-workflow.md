# Git Workflow

## Purpose
用于在多设备（家/公司）和多会话下，保持开发进度一致、可恢复、可交接。

## Branch Strategy
- `main`：稳定主线，只合并已完成任务
- `feature/*`：新功能开发
- `fix/*`：缺陷修复
- `chore/*`：文档/配置/非功能改动

## Task Branch Naming
- 格式：`<type>/<short-task-name>`
- 示例：
  - `feature/wechat-parser`
  - `fix/image-filter-null-check`
  - `chore/update-docs`

## Daily Start (Any Device)
```bash
git checkout main
git fetch origin
git pull --rebase origin main
```

## Start a New Task
```bash
git checkout -b feature/<short-task-name>
```

如果远端已有同名分支：
```bash
git checkout feature/<short-task-name>
git pull --rebase origin feature/<short-task-name>
```

## During Development
```bash
git add .
git commit -m "feat: short description"
```

建议：每 30-90 分钟做一次小提交，避免大块未提交改动。

## End of Session / Switch Device
```bash
git status
git add .
git commit -m "wip: handoff before switching device"
git push -u origin feature/<short-task-name>
```

同时更新：
- `docs/ai-context.md`
- `docs/todo.md`
- `docs/dev-log.md`

## Continue on Another Device
```bash
git fetch origin
git checkout feature/<short-task-name>
git pull --rebase origin feature/<short-task-name>
```

## Merge Back to Main
```bash
git checkout main
git pull --rebase origin main
git merge --no-ff feature/<short-task-name>
git push origin main
git branch -d feature/<short-task-name>
git push origin --delete feature/<short-task-name>
```

## Conflict Handling
遇到冲突后：
```bash
git status
# 手动解决冲突后
git add <conflicted-files>
git rebase --continue
```

放弃本次 rebase：
```bash
git rebase --abort
```

## Collaboration Tips
1. GitHub 是代码进度唯一真相源，iCloud 不用于同步 `.git` 状态。
2. 切设备前必须 `commit + push`。
3. 开工前必须 `pull --rebase`。
4. 一个任务一个分支，不在同一分支混做多个任务。
5. `main` 不直接开发，保持随时可发布。
