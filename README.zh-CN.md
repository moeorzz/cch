# cch — Claude Code History

为 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) 打造的 AI 对话历史管理工具。

用自然语言找到任何一个过去的对话，在 Zellij 或 tmux 里恢复它——跨所有项目。

## 痛点

Claude Code 的对话历史存在 `~/.claude/projects/` 下，按项目目录隔离。当你同时在多个 repo 工作时：

- `claude --resume` 只能看到**当前目录**的历史
- 无法跨项目搜索某个对话
- 关掉终端就丢失活跃会话
- 没有全局视图查看正在运行的 Claude 会话

## 安装

```bash
npm install -g @halooojustin/cch
ch setup          # 自动添加 shell 别名 (cn, cnf, cls, cps, chs)
source ~/.zshrc   # 或新开终端
```

### Claude Code Skill（可选）

安装 skill 后，Claude Code 就能自动帮你用 `ch` 命令：

```bash
cp -r $(npm root -g)/cch/skill ~/.claude/skills/cch
```

安装后直接对 Claude Code 说"帮我找之前调试 iOS 的对话"，它会自动调用 `ch` 搜索。

**前置条件：**
- Node.js >= 18
- 已安装 [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code)
- 已安装 [Zellij](https://zellij.dev/)（推荐）或 [tmux](https://github.com/tmux/tmux) — 安装：`brew install zellij`

## 使用方法

### 自然语言搜索（核心功能）

随便描述你记得的内容，AI 帮你找到对应的对话。

```bash
ch 上次帮我调试 iOS 的那个对话
ch 帮我部署虾的那几个
ch demo 钱包重构的那个
```

`ch` 会把你的描述和会话列表一起发给 `claude -p`（优先使用 Haiku 模型加速，失败自动回退到默认模型），返回最匹配的结果。选中后直接在终端复用器里恢复。

### 命令一览

```
ch <描述>                     自然语言搜索（默认行为）
ch list [-n 20]               列出最近的历史会话（交互式选择器）
ch search <关键词>            精确关键词搜索对话内容
ch new [描述]                 在当前目录新建 Claude 会话
ch new -f [描述]              强制新建（先关闭同名旧会话）
ch ls                         查看活跃的终端复用器会话（交互式选择器）
ch attach <会话名>            连接到一个活跃会话
ch kill <会话名>              关闭一个会话
ch resume <session-id>        通过 session ID 恢复
ch config                     查看配置
ch config set <key> <value>   修改配置
```

### 交互式选择器

`ch list` 和 `ch ls` 都支持交互式选择：

- **上下箭头** 或 **j/k** — 导航选择
- **数字键** — 输入数字（如 `12`）然后 **Enter** 直接跳转
- **Enter** — 确认选择（恢复历史会话或连接活跃会话）
- **Esc** 或 **q** — 取消退出

中文文本使用显示宽度感知的列对齐，不会错位。

### 两级恢复

**第一级 — 活跃会话：** 会话还在终端复用器里运行？

```bash
ch ls                    # 交互式列表 — 选一个直接连接
```

**第二级 — 历史恢复：** 会话已结束，想重新捡起来？

```bash
ch 那个讨论登录bug的对话     # AI 帮你找
# 或者
ch list                      # 交互式列表 — 选一个恢复
```

两种方式都会在 Zellij/tmux 会话里打开，通过登录 shell（`zsh -lc`）启动以继承完整环境和认证信息。随时可以断开和重连。

### 会话管理

```bash
# 在当前项目启动新的 Claude 会话
ch new

# 带描述（会显示在 ch ls 和 Zellij tab 名中）
ch new "fix authentication bug"
ch new 修复登录bug              # 支持中文描述

# 强制重启（先关闭旧会话）
ch new -f "重新开始搞认证"

# 查看正在运行的会话（按创建时间倒序，最新的在最上面）
ch ls

# 清理
ch kill ch-myproject-fix-auth
```

### 会话描述

传给 `ch new` 的描述会用在多个地方：

- **Zellij tab 名** — 进入会话后在 tab 栏可见（支持中文）
- **`ch ls` 输出** — 显示在会话名旁边
- **会话名** — 英文描述直接拼入会话名（如 `ch-myproject-fix-login-bug`），中文描述使用哈希缩写（如 `ch-myproject-a1b2c3`），因为 Zellij 会话名不支持 CJK 字符

## 配置

配置文件位于 `~/.config/cch/config.json`：

```json
{
  "backend": "auto",
  "claudeCommand": "claude",
  "claudeArgs": ["--dangerously-skip-permissions"],
  "historyLimit": 100
}
```

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `backend` | `"auto"` | `"auto"`、`"zellij"` 或 `"tmux"` |
| `claudeCommand` | `"claude"` | Claude CLI 路径 |
| `claudeArgs` | `["--dangerously-skip-permissions"]` | 新建会话和恢复会话时的默认参数 |
| `historyLimit` | `100` | AI 搜索时加载的最大会话数 |

```bash
ch config set backend tmux
ch config set historyLimit 200
```

## 推荐别名

加到你的 `.zshrc` 或 `.bashrc`：

```bash
alias cn="ch new"
alias cnf="ch new -f"
alias cls="ch ls"
alias chs="ch search"
```

然后使用：

```bash
cn fix login bug        # 带描述新建会话
cn 修复登录bug           # 支持中文描述
cnf                     # 强制重启当前项目会话
cls                     # 交互式查看活跃会话
chs 龙虾                # 关键词搜索
```

## 工作原理

1. **历史扫描** — 读取 `~/.claude/projects/**/*.jsonl`，提取会话元信息和用户的前几条消息。按文件修改时间缓存到 `~/.config/cch/cache.json`，后续查询秒开。

2. **AI 搜索** — 构建所有会话的文本列表，连同你的自然语言描述一起发给 `claude -p`（优先使用 Haiku 模型加速，自动回退到默认模型）。解析返回的编号找到匹配的会话。

3. **终端复用器集成** — 在 Zellij 或 tmux 中创建命名会话。Zellij 通过生成临时 KDL 布局/配置文件，使用 `zsh -lc` 启动以确保完整的 shell 环境。tmux 使用标准的 `new-session`/`attach` 命令。自动检测可用的复用器（优先 Zellij）。

4. **会话命名** — 格式为 `ch-<目录名>[-<描述或哈希>]`。英文描述会 slug 化拼入名称；中文描述使用 MD5 哈希前缀。`ch-` 前缀方便在 `zellij ls` / `tmux ls` 中识别。

5. **会话元数据** — 描述、工作目录和创建时间持久化存储在 `~/.config/cch/sessions.json`，重启不丢失。`ch ls` 用它来显示描述和按创建时间排序。

## 许可证

MIT
