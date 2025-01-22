# MindStudio Chrome Extension

Chrome extension for MindStudio that allows users to interact with MindStudio workers directly from any webpage.

## Overview

The extension injects a launcher dock into webpages that allows users to:

- Access their MindStudio workers from any webpage
- Execute workers with context from the current page
- Maintain authentication state across sessions

## New Architecture

We have introduced several core services to improve maintainability and feature parity with the original content script:

- **DOMService**: Handles DOM sanitization (cleanDOM) and extracting user selections (getSelectedContent).  
- **URLService**: Periodically checks for URL changes and notifies the launcher via 'url_changed'.  
- **PlayerService**: Manages showing/hiding the player, launching workers, and passing context from the current page.  
- **MessagingService**: Sends strongly-typed messages to the launcher or player.  
- **AuthService**: Manages storing/retrieving the user's auth token.

## Development

### Project Structure

```
src/
├── background/        # Chrome extension background script
├── content/          # Content script injected into pages
│   ├── services/     # Core services (frames, messaging, auth)
│   └── types/        # TypeScript types and interfaces
└── assets/          # Static assets like icons
```

### Setup

```bash
# Install dependencies
npm install

# Start development with watch mode
npm run dev

# Create production build
npm run build
```

### Loading the extension

1. Build the extension (`npm run build`)
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `dist` folder

### Commands

- `npm run dev` - Watch mode for development
- `npm run build` - Production build
- `npm run lint` - Check for linting issues
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code with Prettier
- `npm run type-check` - Check TypeScript types

### Development Features

- TypeScript support with strict type checking
- Hot reloading during development
- Source maps for debugging
- ESLint + Prettier code formatting
- Separate dev/prod webpack configurations

### VS Code Setup

Required extensions:

- ESLint
- Prettier

Files will be automatically formatted on save using the project's `.prettierrc` and `.editorconfig` configurations.

## Architecture

The extension uses a message-passing architecture between three main components:

1. **Background Script**: Handles header modifications for iframe support
2. **Content Script**: Manages iframe injection and messaging
3. **Iframes**:
   - Launcher iframe: Displays available workers
   - Player iframe: Handles worker execution and output

Communication between components is handled through strictly typed messages using PostMessage API.

## Contributing

1. Create a new branch from main
2. Make your changes
3. Run type checking and linting
4. Create a pull request
