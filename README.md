# MindStudio Chrome Extension

A Chrome extension that provides seamless access to MindStudio's AI workers directly from any webpage. Currently in beta.

## Features

• **Side Panel Integration**: Native Chrome side panel for persistent access  
• **Smart Context**: Automatically captures relevant page content and selections  
• **Cross-Origin Support**: Works across different websites  
• **Customizable Settings**: Personalize your experience  

## Installation

### Development Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Build the extension:

   ```bash
   npm run dev    # Watch mode
   # or
   npm run build  # Production build
   ```

3. Load in Chrome:
   1. Open `chrome://extensions/`
   2. Enable "Developer mode"
   3. Click "Load unpacked" and select the `dist` folder

## Project Structure

```sh
src/
├── background/     # Service worker & background processes
├── common/        # Shared utilities and types
├── content/       # Content scripts and UI components
├── settings/      # Extension settings
├── sidepanel/    # Chrome side panel implementation
└── assets/       # Static assets
```

## Development

### Available Scripts

- `npm run dev`: Watch mode for development
- `npm run build`: Production build
- `npm run lint`: Check and fix linting issues
- `npm run format`: Format code with Prettier
- `npm run type-check`: TypeScript type checking

### Development Environment

- VS Code recommended
- Install ESLint and Prettier extensions
- Use Chrome DevTools for extension debugging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Open a Pull Request

## License

MIT License
