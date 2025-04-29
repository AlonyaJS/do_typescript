# do_typescript

**do_typescript** is a TypeScript boilerplate for FiveM developers. It helps you get started quickly with server and client scripting in **TypeScript** without the need for any complicated setup. This project includes all the necessary configurations to get your FiveM TypeScript resource up and running.

---

## Features

- TypeScript support for FiveM client and server scripts
- Auto-compiling TypeScript with the `npm run watch` command
- Minimal setup for quick development

---

## Installation

```bash
git clone https://github.com/AlonyaJS/do_typescript.git
cd do_typescript
npm install
```

### Auto-compile TypeScript on save:

To enable auto-compiling of TypeScript files whenever you save them, run the following command:

```bash
npm run watch
```

This will start the TypeScript compiler in "watch mode", automatically recompiling your TypeScript files whenever you save a file.

---

## File Structure

The basic project structure is as follows:

```
do_typescript/
├── src/                # Source TypeScript files (client and server)
├── dist/               # Compiled JavaScript files
├── fxmanifest.lua      # FiveM resource definition file
├── package.json        # Project metadata and npm scripts
├── tsconfig.json       # TypeScript configuration
└── README.md           # Project documentation (this file)
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
