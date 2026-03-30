---
name: cch
description: 安装和配置 CCH (Claude Code History) — 跨项目对话历史管理 CLI 工具。当用户说"安装 cch"、"install cch"、"配置 cch"、"setup cch"、"/cch" 时使用。
allowed-tools: Bash, Read, AskUserQuestion
---

# CCH — Claude Code History 安装配置

帮助用户安装和配置 CCH，一个管理 Claude Code 跨项目对话历史的命令行工具。

安装完成后，用户在终端里直接使用 `ch` 命令（不在 Claude Code 内使用）。

## 触发词

- "安装 cch"、"install cch"
- "配置 cch"、"setup cch"
- "/cch"

## 执行步骤

### 1. 检查前置条件

```bash
node --version
which claude
which zellij || which tmux
```

- Node.js >= 18：如果没有，提示 `brew install node`
- Claude Code CLI：如果没有，提示 `npm install -g @anthropic-ai/claude-code`
- Zellij 或 tmux（至少一个）：如果都没有，推荐 `brew install zellij`

### 2. 安装 cch

```bash
npm install -g cch
```

### 3. 设置 shell 别名

```bash
ch setup
```

会自动向用户的 `.zshrc` 或 `.bashrc` 追加以下别名：

| 别名 | 等价于 | 说明 |
|------|--------|------|
| `cn` | `ch new` | 新建 Claude 会话 |
| `cnf` | `ch new -f` | 强制新建（先关旧的） |
| `cls` | `ch ls` | 浏览历史对话 |
| `cps` | `ch ps` | 查看活跃会话 |
| `chs` | `ch search` | 关键词搜索 |

### 4. 生效配置

```bash
source ~/.zshrc
```

### 5. 验证安装

```bash
ch --version
ch ls
```

`ch ls` 应该显示用户的 Claude Code 历史对话列表。

## 安装完成后

告诉用户以下信息：

> CCH 安装完成！这是一个**终端命令行工具**，在 Claude Code 外面使用。
>
> 常用命令：
> - `cls` — 浏览历史对话，选一个恢复
> - `cps` — 查看正在运行的会话
> - `cn 修复登录bug` — 新建 Claude 会话（带描述）
> - `ch 上次调试iOS的对话` — 自然语言搜索历史
> - `chs 关键词` — 精确搜索
>
> 所有会话在 Zellij/tmux 中运行，关掉终端也不丢失。

## 故障排查

**`ch: command not found`**
```bash
npm root -g    # 检查全局 node_modules 路径是否在 PATH 中
```

**`ch ls` 没有显示任何历史**
```bash
ls ~/.claude/projects/    # 检查是否有 Claude Code 历史
```
如果目录为空，说明用户还没用过 Claude Code，先用几次再回来。

**`ch new` 报错找不到 Zellij/tmux**
```bash
brew install zellij    # 安装推荐的终端复用器
```
或切换后端：
```bash
ch config set backend tmux
```
