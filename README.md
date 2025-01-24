# MindStudio Chrome Extension

This repository contains the MindStudio Chrome Extension, allowing users to interact with MindStudio workers from any webpage. It injects a launcher dock for quick access to workers, provides page context (such as DOM content and user selections) to these workers, and maintains authentication state.

## Overview

• Injects iframes (launcher and player) onto webpages  
• Gathers page context (DOM, selected text, current URL)  
• Manages user authentication tokens  
• Communicates with the MindStudio platform via message passing

## Quick Start

1. Install dependencies:  

   ```bash
   npm install
   ```

2. For development, run:  

   ```bash
   npm run dev
   ```

   This watches for file changes and automatically rebuilds.

3. For a production build, run:  

   ```bash
   npm run build
   ```

4. Load the extension in Chrome:  
   1. Open chrome://extensions/  
   2. Enable "Developer mode"  
   3. Click "Load unpacked" and select the dist folder  

## Project Structure

```
src/
├── background/        # Chrome extension background script
├── content/          # Content script injected into pages
│   ├── services/     # Core services (frames, messaging, auth, DOM, URL)
│   └── types/        # TypeScript types and interfaces
└── assets/          # Static assets like icons
```

• background/: Handles extension events (e.g., updates, service_worker)  
• content/: Core logic that runs in webpages, injecting iframes and handling messages  

## Architecture

The extension uses a message-passing architecture among:  

1. Background Script (background/)  
2. Content Script (content/)  
3. Iframes (launcher and player)  

We have several primary services to keep the code maintainable and modular:

- DOMService: Cleans the DOM and extracts selected text  
- URLService: Detects changes in the page URL  
- PlayerService: Manages the player iframe (launching workers, showing/hiding the UI)  
- MessagingService: Sends and receives strongly-typed messages  
- AuthService: Manages storing/retrieving user authentication tokens  

## Development

• npm run dev – Watch mode for development  
• npm run build – Production build  
• npm run lint – Check for linting issues  
• npm run lint:fix – Fix linting issues  
• npm run format – Format code with Prettier  
• npm run type-check – Ensure valid TypeScript types  

### Recommended Setup

• Use Visual Studio Code  
• Install ESLint and Prettier extensions  
• The project automatically formats on save using `.editorconfig` and `.prettierrc`

## Contributing

1. Create a new branch from main  
2. Make and test your changes (lint, format, type-check)  
3. Open a pull request for review  

We welcome feedback and contributions that help improve the MindStudio Chrome Extension!
