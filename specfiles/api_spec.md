# **Pal CLI \- API Specification**

This document outlines the command-line interface for the pal application.

## **1\. Global Behavior**

- **Command Structure:** pal \<command\> \[sub-command\] \[options\] \[arguments\]
- **Execution Confirmation:** In standard mode, pal will prompt the user for confirmation (y/n) before executing a generated or potentially destructive command.
- **Temporary Scripts:** Scripts generated on-the-fly are stored in \~/.pal/command/tmp/. These scripts are automatically deleted after one week if not saved.
- **Saved Scripts:** User-saved scripts are stored permanently in \~/.pal/command/.
- **Manifest:** A manifest of all saved commands is maintained at \~/.pal/commands/.commandManifest.json. This file tracks available commands, their purpose, and their parameters.

## **2\. Commands**

### **2.1. pal chat**

Engages with pal's AI to generate and execute commands.

- **Usage:**
  - pal chat
  - pal chat \[prompt\]
  - pal chat \--vibe \<prompt\>
- **Description:**
  - **Interactive Mode (pal chat):** Enters a conversational mode where pal waits for prompts.
  - **Prompt Mode (pal chat \[prompt\]):** Takes a user prompt, generates a corresponding script or command, and asks for execution confirmation.
    - If a relevant saved script exists (checked via the manifest), pal will suggest using it with pal exec.
    - If no relevant script exists, pal generates a new temporary script and suggests executing it.
  - **Vibe Mode (pal chat \--vibe \<prompt\>):** Takes a user prompt and immediately executes the result.
    - The AI determines if the task requires a simple, one-line shell command or a more complex multi-step script.
    - The generated command or script is executed automatically without asking for confirmation.

### **2.2. pal exec**

Executes a pal script.

- **Usage:**
  - pal exec \<script_name\> \[prompt\]
  - pal exec \--temp \<script_name\> \[options\]
  - pal exec \<script_name\> \--param '\<key\>=\<value\>'
- **Description:**
  - **pal exec \<script_name\> \[prompt\]:** Executes a saved script.
    - If the script is configurable, pal uses the \[prompt\] to intelligently determine the correct parameters (e.g., \--param 'fileType=\[img txt\]') and asks for confirmation before executing.
    - If the script is not configurable and the \[prompt\] suggests a modification, pal will ask the user if they want to update the script. If confirmed, it generates a new temporary version of the script with the requested changes and asks for execution confirmation.
  - **pal exec \--temp \<script_name\> \[options\]:** Executes a script from the temporary directory (\~/.pal/command/tmp/). After execution, it suggests saving the script using pal save.
  - **pal exec \<script_name\> \--param '\<key\>=\<value\>':** Executes a script with explicitly provided parameters.

### **2.3. pal save**

Saves a script or command to the permanent command directory.

- **Usage:**
  - pal save \<script_name\>
  - pal save \<script_name\> \--last
- **Description:**
  - **pal save \<script_name\>:** Moves a temporary script from \~/.pal/command/tmp/\<script_name\>.sh to \~/.pal/command/\<script_name\>.sh.
    - If a script with the same name already exists in the permanent directory, it prompts the user for confirmation before overriding it.
  - **pal save \<script_name\> \--last:** Saves the last command executed by pal (e.g., from pal chat \--vibe) as a new, permanent script.
  - In both cases, the command manifest at \~/.pal/commands/.commandManifest.json is updated with the new command's details.
