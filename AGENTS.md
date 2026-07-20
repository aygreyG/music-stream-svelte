# General

- This is a Svelte 5 and SvelteKit repository. Ensure that all code adheres to the Svelte 5 and SvelteKit standards.
- Do not automatically stage changes to git unless explicitly instructed to do so. Same goes for committing changes.
- For icons use iconify, the preferred icon libraries are: iconamoon, ic. Preferably use the iconamoon set, but if an icon is not available, use the ic set with rounded icons. Before choosing an icon check whether it was already used in the project, if yes use the same icon set.
  Example import:
  ```javascript
  import RoundPlaylistAdd from '~icons/ic/round-playlist-add';
  ```

# Svelte MCP Server

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.
