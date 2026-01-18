# IdeaPlayground

A collection of interactive web applications and editors.

## Projects

### FitnessWorkoutEditor
A comprehensive frontend application for creating custom follow-along workout videos.

**Quick Start:**
```bash
cd FitnessWorkoutEditor
npm install
npm run dev
```

**Build:**
```bash
cd FitnessWorkoutEditor
npm install
npm run build
```

See [FitnessWorkoutEditor/README.md](./FitnessWorkoutEditor/README.md) for detailed documentation.

### BadmintonEditor
(Coming soon)

## Common Issues

### Build Error: 'vite' is not recognized
If you encounter the error `'vite' 不是内部或外部命令，也不是可运行的程序或批处理文件` or `'vite' is not recognized as an internal or external command`, you need to install dependencies first:

```bash
cd FitnessWorkoutEditor  # or the specific project directory
npm install
```

Then you can run the build command:
```bash
npm run build
```

## Development Workflow

Each project is independent and has its own `package.json`. Always run `npm install` in the project directory before running any npm scripts.

## License

MIT
