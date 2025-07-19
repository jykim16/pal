export interface LLMService {
  generateScript(prompt: string): Promise<string>;
  generateDescription(
    scriptName: string,
    scriptContent: string,
  ): Promise<string>;
}

export class MockLLMService implements LLMService {
  async generateScript(prompt: string): Promise<string> {
    // Mock implementation - in a real implementation, this would call an actual LLM API
    const scriptName = this.generateScriptName(prompt);

    return `#!/bin/bash
# Generated script for: ${prompt}
# Script name: ${scriptName}

echo "Executing: ${prompt}"
echo "This is a mock script generated for demonstration purposes."
echo "In a real implementation, this would contain the actual logic for: ${prompt}"

# Example logic based on common patterns
if [[ "${prompt.toLowerCase()}" == *"list"* ]]; then
    echo "Listing files..."
    ls -la
elif [[ "${prompt.toLowerCase()}" == *"search"* ]]; then
    echo "Searching..."
    find . -name "*.txt" 2>/dev/null
elif [[ "${prompt.toLowerCase()}" == *"backup"* ]]; then
    echo "Creating backup..."
    cp -r . ../backup_$(date +%Y%m%d_%H%M%S)
else
    echo "Default action for: ${prompt}"
fi

echo "Script execution completed."
`;
  }

  async generateDescription(
    scriptName: string,
    scriptContent: string,
  ): Promise<string> {
    // Mock implementation - in a real implementation, this would call an actual LLM API
    return `Script to ${scriptName
      .replace(/([A-Z])/g, " $1")
      .toLowerCase()
      .trim()}`;
  }

  private generateScriptName(prompt: string): string {
    // Convert prompt to a camelCase script name
    const words = prompt.toLowerCase().split(/\s+/);
    const filteredWords = words.filter((word) => word.length > 0);

    if (filteredWords.length === 0) return "defaultScript";

    const firstWord = filteredWords[0];
    const remainingWords = filteredWords
      .slice(1)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1));

    return firstWord + remainingWords.join("");
  }
}
