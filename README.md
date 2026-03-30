# cch — Claude Code History

AI-powered conversation history management for [Claude Code](https://docs.anthropic.com/en/docs/claude-code).

Find any past conversation with natural language, resume it in a Zellij or tmux session — across all your projects.

## The Problem

Claude Code stores conversation history in `~/.claude/projects/`, scoped per directory. When you work across many repos:

- `claude --resume` only shows history for the **current** directory
- No way to search across all projects for a past conversation
- Closing a terminal loses the active session
- No global view of running Claude sessions

## Install

```bash
npm install -g @halooojustin/cch
ch setup          # adds shell aliases (cn, cnf, cls, cps, chs)
source ~/.zshrc   # or open a new terminal
```

### Claude Code Skill (optional)

Install the skill so Claude Code knows how to use `ch` for you:

```bash
cp -r $(npm root -g)/cch/skill ~/.claude/skills/cch
```

Then you can just tell Claude Code things like "find my iOS debugging conversation" and it will use `ch` automatically.

**Requirements:**
- Node.js >= 18
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed
- [Zellij](https://zellij.dev/) or [tmux](https://github.com/tmux/tmux) (at least one)

## Usage

### Natural Language Search (the killer feature)

Just describe what you remember. AI finds the session.

```bash
ch the iOS debugging session
ch the one where I was deploying openclaw
ch the wallet refactor last week
```

`ch` pipes your query + session list to `claude -p` (tries Haiku first for speed, falls back to default model), which returns the best matches. Pick one and it resumes in your multiplexer.

### Commands

```
ch <description>              Natural language search (default)
ch list [-n 20]               List recent sessions (interactive selector)
ch search <keyword>           Exact keyword search in conversation content
ch new [description]          New Claude session in current directory
ch new -f [description]       Force new (kill existing same-name session)
ch ls                         List active multiplexer sessions (interactive selector)
ch attach <name>              Attach to a live session
ch kill <name>                Kill a session
ch resume <session-id>        Resume by session ID
ch config                     Show configuration
ch config set <key> <value>   Set a config value
```

### Interactive Selection

Both `ch list` and `ch ls` feature an interactive selector:

- **Up/Down arrows** or **j/k** — navigate the list
- **Number keys** — type a number (e.g. `12`) then **Enter** to jump directly
- **Enter** — confirm selection (resume session or attach to live session)
- **Esc** or **q** — cancel

CJK text is properly aligned with display-width-aware column padding.

### Two-Level Resume

**Level 1 — Live sessions:** Session still running in your multiplexer?

```bash
ch ls                    # interactive list — pick one to attach
```

**Level 2 — History resume:** Session ended, but you want to pick it back up?

```bash
ch 那个讨论登录bug的对话     # AI finds it
# or
ch list                      # interactive list — pick one to resume
```

Both levels open in a Zellij/tmux session, so you can detach and reattach anytime. All sessions launch via login shell (`zsh -lc`) to inherit your full environment and auth.

### Session Management

```bash
# Start a new Claude session in current project
ch new

# With a description (shows up in ch ls and as Zellij tab name)
ch new "fix authentication bug"
ch new 修复登录bug              # Chinese descriptions work too

# Force restart (kills existing session first)
ch new -f "start fresh on auth"

# See what's running (sorted by newest first)
ch ls

# Clean up
ch kill ch-myproject-fix-auth
```

### Session Descriptions

Descriptions you pass to `ch new` are used in multiple places:

- **Zellij tab name** — visible in the tab bar when inside the session (supports Chinese)
- **`ch ls` output** — shown next to the session name
- **Session name** — English descriptions are included in the session name (e.g. `ch-myproject-fix-login-bug`), Chinese descriptions use a hash fallback (e.g. `ch-myproject-a1b2c3`) since Zellij session names don't support CJK

## Configuration

Config lives at `~/.config/cch/config.json`:

```json
{
  "backend": "auto",
  "claudeCommand": "claude",
  "claudeArgs": ["--dangerously-skip-permissions"],
  "historyLimit": 100
}
```

| Key | Default | Description |
|-----|---------|-------------|
| `backend` | `"auto"` | `"auto"`, `"zellij"`, or `"tmux"` |
| `claudeCommand` | `"claude"` | Path to Claude CLI |
| `claudeArgs` | `["--dangerously-skip-permissions"]` | Default args for new sessions and resumed sessions |
| `historyLimit` | `100` | Max sessions loaded for AI search |

```bash
ch config set backend tmux
ch config set historyLimit 200
```

## Recommended Aliases

Add to your `.zshrc` or `.bashrc`:

```bash
alias cn="ch new"
alias cnf="ch new -f"
alias cls="ch ls"
alias chs="ch search"
```

Then use:

```bash
cn fix login bug        # new session with description
cn 修复登录bug           # Chinese descriptions supported
cnf                     # force restart current project session
cls                     # interactive list of active sessions
chs 龙虾                # keyword search
```

## How It Works

1. **History scanning** — Reads `~/.claude/projects/**/*.jsonl`, extracts session metadata and first user messages. Results are cached (`~/.config/cch/cache.json`) by file mtime for fast subsequent lookups.

2. **AI search** — Builds a text table of all sessions, sends it to `claude -p` (Haiku model preferred for speed, auto-fallback to default). Parses the response to find matching session numbers.

3. **Multiplexer integration** — Creates named sessions in Zellij or tmux. For Zellij, generates temporary KDL layout/config files with `zsh -lc` to ensure full shell environment. For tmux, uses standard `new-session`/`attach` commands. Auto-detects which multiplexer is available (Zellij preferred).

4. **Session naming** — Sessions are named `ch-<dirname>[-<description-or-hash>]`. English descriptions are slugified into the name; Chinese descriptions use an MD5 hash prefix. The `ch-` prefix makes them identifiable in `zellij ls` / `tmux ls`.

5. **Session metadata** — Descriptions, cwd, and creation time are persisted in `~/.config/cch/sessions.json`, surviving reboots. Used by `ch ls` to display descriptions and sort by creation time.

## License

MIT
