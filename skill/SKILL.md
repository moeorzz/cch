---
name: cch
description: Claude Code History — 管理 Claude Code 对话历史和会话。当用户说"找对话"、"历史记录"、"之前的对话"、"恢复对话"、"新建会话"、"看活跃会话"、"find conversation"、"resume session"、"session history"、"/cch" 时使用。
allowed-tools: Bash
---

# CCH — Claude Code History

管理 Claude Code 跨项目的对话历史，支持自然语言搜索和 Zellij/tmux 会话管理。

## 触发词

- "找对话"、"找之前的对话"、"那个对话在哪"
- "历史记录"、"对话历史"、"history"
- "恢复对话"、"恢复会话"、"resume"
- "新建会话"、"开个新的"、"new session"
- "看活跃会话"、"哪些在跑"、"active sessions"
- "/cch"

## 前置检查

每次执行前先检查 `ch` 是否已安装：

```bash
which ch >/dev/null 2>&1 || echo "NOT_INSTALLED"
```

如果未安装，执行安装流程：

```bash
npm install -g cch
ch setup
```

然后提示用户执行 `source ~/.zshrc`（或新开终端）。

## 命令速查

| 场景 | 命令 |
|------|------|
| 自然语言搜索历史对话 | `ch <描述>` |
| 浏览历史对话列表 | `ch ls` |
| 关键词搜索 | `ch search <关键词>` |
| 新建 Claude 会话 | `ch new [描述]` |
| 强制新建（kill 旧的） | `ch new -f [描述]` |
| 查看活跃会话 | `ch ps` |
| 连接活跃会话 | `ch attach <名称>` |
| 关闭会话 | `ch kill <名称>` |
| 通过 ID 恢复 | `ch resume <session-id>` |
| 查看/修改配置 | `ch config [key] [value]` |

## 使用场景与对应操作

### 场景 1：用户想找一个之前的对话

用户说类似："帮我找那个调试 iOS 的对话"、"之前部署龙虾的那个在哪"

直接用自然语言搜索：

```bash
ch 调试iOS的对话
```

这会调用 `claude -p` 进行 AI 匹配，返回候选列表，用户选择后在 Zellij/tmux 里恢复。

如果用户描述模糊或想浏览，用交互式列表：

```bash
ch ls
```

显示交互式选择器（上下箭头导航，输入数字跳转，Enter 确认恢复）。

### 场景 2：用户想新建一个 Claude Code 会话

```bash
ch new fix login bug
ch new 修复登录bug
```

会在当前目录创建一个新的 Claude Code 会话，运行在 Zellij/tmux 中。描述会显示为 Zellij 的 tab 名。

如果要替换同名旧会话：

```bash
ch new -f 重新开始
```

### 场景 3：用户想看正在运行的会话

```bash
ch ps
```

显示所有活跃的 Zellij/tmux 会话，交互式选择后直接 attach。

### 场景 4：用户想搜索包含某个关键词的对话

```bash
ch search 龙虾
ch search authentication
```

精确匹配 .jsonl 内容，返回列表后可交互选择恢复。

## 配置说明

配置文件：`~/.config/cch/config.json`

```bash
# 查看当前配置
ch config

# 切换到 tmux 后端
ch config set backend tmux

# 修改 AI 搜索加载的最大会话数
ch config set historyLimit 200
```

默认配置：
- `backend`: `"auto"` — 自动检测 Zellij → tmux
- `claudeCommand`: `"claude"`
- `claudeArgs`: `["--dangerously-skip-permissions"]`
- `historyLimit`: `100`

## Shell 别名

安装后运行 `ch setup` 可自动添加以下别名：

| 别名 | 等价于 | 说明 |
|------|--------|------|
| `cn` | `ch new` | 新建会话 |
| `cnf` | `ch new -f` | 强制新建 |
| `cls` | `ch ls` | 浏览历史 |
| `cps` | `ch ps` | 活跃会话 |
| `chs` | `ch search` | 关键词搜索 |

## 注意事项

- `ch ls` 和 `ch ps` 都是交互式的，需要 TTY 环境
- AI 搜索优先使用 Haiku 模型（更快更便宜），失败自动回退
- 所有会话通过 `zsh -lc` 启动，继承完整的 shell 环境和认证
- 中文描述会作为 Zellij tab 名显示，会话名使用哈希缩写
- 会话元数据存储在 `~/.config/cch/sessions.json`，重启不丢失
