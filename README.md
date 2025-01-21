# MindStudio Chrome Extension

Chrome extension for MindStudio that allows users to interact with MindStudio workers directly from any webpage.

## Development

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

### VS Code Setup

Required extensions:

- ESLint
- Prettier

Files will be automatically formatted on save.
