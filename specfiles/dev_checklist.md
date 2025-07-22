Pal Development Checklist
A list of tasks to guide the implementation of the pal CLI application based on the API specification.

✅ Core Application & Command Routing
[x] Main Entry Point: Create the main application entry point that parses the primary command (chat, exec, save, help) and routes to the appropriate handler function.

💬 pal chat Command
[ ] Prompt Mode: Implement pal chat [prompt].

[x] Check if a relevant script exists by querying the .commandManifest.json.

[ ] If a script exists, formulate a pal exec command and ask the user for confirmation.

[ ] If no script exists, send the prompt to the LLM to generate a script, save it to the tmp directory, and ask the user for confirmation to execute it.

[ ] Vibe Mode: Implement pal chat --vibe <prompt>.

[ ] Call the LLM to determine if a simple shell command or a full script is required.

[ ] Execute the returned command or script immediately without a confirmation prompt.

[ ] Store the last executed command in memory so it can be saved with pal save --last.

[ ] Interactive Mode: Implement pal chat without arguments to start a read-eval-print loop (REPL) for continuous conversation.

🚀 pal exec Command
[ ] Script Execution: Implement pal exec <script_name> [prompt] to run a script from the ~/.pal/command/ directory.

[ ] Parameter Handling:

[ ] If a [prompt] is provided, use the LLM to parse the prompt and the script's manifest entry to generate the correct --param flags. Present the full command to the user for confirmation.

[ ] Implement the --param '<key>=<value>' logic to pass arguments to the script.

[ ] Script Update Flow:

[ ] When pal exec is used with a prompt for a non-configurable script, implement the logic to ask the user if they want to update it.

[ ] If the user agrees, send the original script and new requirements to the LLM, save the returned script to the tmp directory, and ask for execution confirmation.

[ ] Temporary Script Execution: Implement pal exec --temp <script_name> to execute scripts from the tmp directory and suggest saving them afterward.

💾 pal save Command
[ ] Save from Temp: Implement pal save <script_name> to move a script from ~/.pal/command/tmp/ to ~/.pal/command/.

[ ] Overwrite Protection: Add a check to see if a script with the same name already exists and prompt the user for confirmation before overwriting.

[ ] Save Last Command: Implement pal save <script_name> --last to take the most recently executed command (from vibe mode) and save it as a new script.

[ ] Manifest Update: After any successful save operation, the agent must read, update, and write to ~/.pal/commands/.commandManifest.json. This may require an LLM call to generate a description.

📁 File System & State Management
[ ] Initial Setup: On first run, create the necessary directory structure: ~/.pal/command/, ~/.pal/command/tmp/, and ~/.pal/commands/.

[ ] Manifest Management: Create robust functions to read, write, and query the .commandManifest.json file.

[ ] Temporary File Cleanup: Implement a mechanism to delete scripts in ~/.pal/command/tmp/ that are older than one week.

[ ] Last Command State: Implement a way to store the last executed command in-memory or in a temporary state file to be accessed by pal save --last.
