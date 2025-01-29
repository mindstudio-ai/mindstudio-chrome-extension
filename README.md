# MindStudio Chrome Extension

A Chrome extension that provides seamless access to MindStudio's AI workers directly from any webpage. Currently in beta.

## Features

• **Side Panel Integration**: Native Chrome side panel for persistent access  
• **Smart Context**: Automatically captures relevant page content and selections  
• **Cross-Origin Support**: Works across different websites  
• **Customizable Settings**: Personalize your experience  

## Installation

### Get Latest Release

1. Go to the [Releases page](https://github.com/youai1/mindstudio-chrome-extension/releases/latest) of this repository
2. Download the `mindstudio-chrome-extension.zip` file from the latest release
3. Unzip the downloaded file
4. Follow the "Loading in Chrome" instructions below

### Development Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Build the extension:

   ```bash
   npm run dev    # Watch mode for development
   # or
   npm run build  # Production build with type checking and linting
   ```

3. Follow the "Loading in Chrome" instructions below

### Loading in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode" in the top-right corner
3. Click "Load unpacked" and select either:
   - The `dist` folder (for development setup)
   - The unzipped extension folder (for release version)

## Project Structure

```sh
src/
├── assets/       # Static assets and resources
├── background/   # Service worker & background processes
├── content/      # Content scripts and UI components
├── settings/     # Extension settings page
├── shared/       # Shared utilities, services, and types
└── sidepanel/    # Chrome side panel implementation
```

## Development

### Available Scripts

- `npm run dev`: Watch mode for development
- `npm run build`: Production build with checks
- `npm run type-check`: TypeScript type checking
- `npm run lint`: Check for linting issues
- `npm run lint:fix`: Fix linting issues
- `npm run format`: Format code with Prettier
- `npm run format:check`: Check code formatting

### Development Requirements

- Node.js >= 14.0.0
- npm >= 6.0.0

### Development Environment

- VS Code recommended
- Install ESLint and Prettier extensions
- Use Chrome DevTools for extension debugging
- Enable developer mode in Chrome extensions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure all checks pass (`npm run build`)
5. Open a Pull Request

## License

MIT License
