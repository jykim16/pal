# pal

**pal** is your personal AI-powered CLI assistant. It helps you generate, execute, and manage shell scripts using natural language prompts.

---

## Features

- **AI-powered script generation:** Use natural language to generate shell scripts or commands.
- **Script execution:** Run saved scripts with parameters.
- **Script management:** Save, update, and organize scripts in a manifest.
- **Interactive and non-interactive modes:** Use `pal chat` for conversational script generation, or `pal exec` to run scripts directly.
- **Temporary and permanent script storage:** Scripts are stored in `~/.pal/command/`.
- **Manifest management:** All scripts are tracked in `~/.pal/command/.commandManifest.json`.

---

## Installation

Install dependencies:

```bash
bun install
```

---

## Usage

### Run the CLI

```bash
bun run index.ts
```

Or install globally with Bun and run cli command:

```bash
bun link
bun link pal
# example command
pal exec --path hello
```

---

### Main Commands

#### `pal exec --path <script_name> [--args <args>] [prompt]`

- Executes a saved script by name.
- If the script requires parameters, you can provide them with `--args`.
- If a prompt is provided, pal will try to determine the correct parameters.

#### `pal chat [prompt] [--vibe]`

- **Interactive mode:** `pal chat` (starts a REPL, not yet implemented)
- **Prompt mode:** `pal chat <prompt>`
  Generates a script for your prompt, asks for confirmation, and can execute it.
- **Vibe mode:** `pal chat --vibe <prompt>`
  Instantly generates and executes a script for your prompt, skipping confirmation.

#### `pal save <script_name> [--last]`

- Saves a script to your permanent command library.
- `--last` saves the most recently executed command.

---

## Example Usage

```bash
# Generate and execute a script from a prompt
pal chat "list all .txt files in this directory"

# Execute a saved script
pal exec --path hello --args "hi"

# Save the last executed script
pal save hello --last
```

---

## File Structure

- `~/.pal/command/` — Permanent user-saved scripts
- `~/.pal/command/tmp/` — Temporary scripts (auto-deleted after one week)
- `~/.pal/command/.commandManifest.json` — Manifest of all saved commands

---

## Development

- Main entry point: `index.ts`
- Commands are implemented in `src/commands/`
- Manifest and script management in `src/data/`
- Uses [Bun](https://bun.sh) for runtime and package management

### Running Preflight Checks

To validate changes, run:

```bash
npm run preflight
```

This will build, lint, and test the project.

---

## License

MIT
