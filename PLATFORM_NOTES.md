# Platform-Specific Notes

## Windows 11 Setup

### What You Need
1. **Node.js 18+** - Download from [nodejs.org](https://nodejs.org/)
   - Choose the LTS version
   - Install with default options
   - Verify: `node --version` and `npm --version`

2. **Git** (optional) - For cloning repositories
   - Download from [git-scm.com](https://git-scm.com/)

### Running the App
```bash
# Install dependencies (one-time)
npm install

# Run in development mode
npm run dev
```

### Troubleshooting Windows Issues

**Issue: "node-gyp" or native module compilation errors**
- Install Visual Studio Build Tools:
  1. Download from: https://visualstudio.microsoft.com/downloads/
  2. Install "Desktop development with C++" workload
  3. Restart terminal and try again

**Issue: Electron window doesn't open**
- Check if port 5173 is available (Vite dev server)
- Try: `npm run dev` again
- Check Windows Firewall settings

**Issue: Hashcat not found**
- Download hashcat from: https://hashcat.net/hashcat/
- Extract to a folder (e.g., `C:\hashcat\`)
- In app Settings, browse to `hashcat.exe`

## Cross-Platform Compatibility

### Code Compatibility
The application code is designed to work on all platforms:
- ✅ File paths use Node.js `path.join()` (cross-platform)
- ✅ Process spawning uses Node.js `child_process` (cross-platform)
- ✅ File dialogs use Electron's built-in dialogs (cross-platform)
- ✅ No platform-specific code paths needed

### Platform-Specific Considerations

#### Hashcat Binary Paths
- **Windows**: `hashcat.exe` (e.g., `C:\hashcat\hashcat.exe`)
- **macOS/Linux**: `hashcat` (usually in `/usr/bin/hashcat` or `/usr/local/bin/hashcat`)

#### File Permissions
- **Windows**: Usually no issues
- **macOS/Linux**: May need execute permissions: `chmod +x hashcat`

#### GPU Support
- **Windows**: NVIDIA/AMD drivers from manufacturer
- **macOS**: Limited GPU support (depends on model)
- **Linux**: OpenCL drivers required (varies by GPU vendor)

### Building for Other Platforms

**From Windows, build for:**
- ✅ Windows (native)
- ❌ macOS (requires macOS or CI/CD)
- ❌ Linux (possible but not recommended, use CI/CD)

**Recommended Approach:**
- Use GitHub Actions or similar CI/CD for cross-platform builds
- Or build on each target platform

### Testing Checklist

Before distributing, test on:
- [ ] Windows 10/11
- [ ] macOS (Intel and Apple Silicon if possible)
- [ ] Linux (Ubuntu/Debian and one other distribution)

### Distribution

**Windows:**
- NSIS installer (recommended)
- Portable executable (no installation needed)

**macOS:**
- DMG file (standard macOS installer)
- Code signing recommended for Gatekeeper

**Linux:**
- AppImage (universal, no installation)
- Debian package (`.deb`)

## Development Tips

### Hot Reload
- Changes to React components reload automatically
- Changes to Electron main process require restart: `Ctrl+C` then `npm run dev`

### Debugging
- DevTools open automatically in development
- Main process: Check terminal output
- Renderer process: Use DevTools console

### Performance
- Development builds are slower
- Production builds are optimized
- GPU acceleration requires proper drivers

