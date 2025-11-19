# hashkitteh Hashcat GUI

A modern, user-friendly Windows desktop GUI application for hashcat password recovery tool built with Electron, React, TypeScript, and Tailwind CSS.

# File Download

https://www.red5labs.com/project.php?slug=hashkitteh

## Features

- 🎯 **Modern UI**: Clean, dark-themed interface with intuitive navigation
- 🔍 **Hash Input**: Paste hashes or import lists / `.22000` Wi-Fi handshakes with auto-detected hash modes
- ⚙️ **Multiple Attack Modes**: Dictionary, Combinator, Brute-force, and Hybrid attacks
- 📊 **Real-time Monitoring**: Live progress tracking with speed, time, and recovery statistics
- 💾 **Session Management**: Save and restore your work sessions
- 📤 **Results Export**: Export cracked passwords in CSV, JSON, or TXT formats
- 🎨 **Dark Mode**: Beautiful dark theme optimized for extended use

## Prerequisites

- **Hashcat** installed on the target system

You can find them here: https://hashcat.net/hashcat/

- **GPU drivers** for GPU acceleration with hashcat (GPU acceleration can be disabled in Settings)

## Installation

No installation required. Just run the executable file.

## Quick Start

1. Open **Settings** and point **Hashcat Binary Path** to your `hashcat` executable.
2. Convert any captured Wi-Fi handshakes (`.pcap/.pcapng`) into Hashcat’s `.22000` format with `hcxpcapngtool capture.pcapng -o handshake.22000`.
3. In **Hash Input**, paste hashes or upload your `.22000` file; the app will auto-detect hash mode 22000.
4. In **Attack Config**, pick a dictionary (ideally tens of thousands of entries or more), optional mask/rules, and adjust workload.
5. Use the **Force CPU-Only** and **Disable GPU Hardware Monitoring** toggles if your drivers lack OpenCL/CUDA or expose limited NVML sensors.
6. Head to **Execute**, verify the auto-built hashcat command, and start the attack while monitoring console output and progress.

## Configuration

Before using the application, configure the hashcat binary path in Settings:

1. Navigate to Settings in the sidebar
2. Click "Browse" next to "Hashcat Binary Path"
3. Select your hashcat executable (e.g., `hashcat.exe` on Windows, `hashcat` on Linux/macOS)

## Usage

### Creating a New Task

1. Click "New Task" in the sidebar
2. **Hash Input Tab**: 
   - Paste hashes directly or upload a hash file
   - Hash type will be auto-detected (can be manually changed)
3. **Attack Config Tab**:
   - Select attack mode (Dictionary, Brute-force, etc.)
   - Configure wordlist, rules, or mask patterns
   - Set workload profile and other advanced options
   - Toggle **Disable GPU Hardware Monitoring** if your GPU driver reports errors such as `nvmlDeviceGetFanSpeed(): Not Supported`
4. **Execute Tab**:
   - Review configuration
   - Click "Start" to begin the attack
   - Monitor progress in real-time
   - View console output

### WPA/WPA2 Handshake Files (.22000)

1. Convert your `.pcap`/`.pcapng` capture into Hashcat's 22000 format (PMKID/EAPOL) with a tool such as [`hcxpcapngtool`](https://github.com/ZerBea/hcxtools):
   ```bash
   hcxpcapngtool capture.pcapng -o handshake.22000
   ```
2. In **Hash Input**, choose **Upload Hash / .22000 File** and select the converted file (`.22000` or `.hc22000`).
3. Hashkitteh will auto-detect the hash type as **WPA/WPA2 PMKID+EAPOL (mode 22000)** so you can immediately configure your attack (typically dictionary or hybrid).
4. Continue configuring wordlists/masks as usual and start the attack.

### Viewing Results

- Navigate to "Results" to see all recovered passwords
- Search/filter results
- Export to CSV, JSON, or TXT
- Copy individual passwords

### Session Management

- Sessions are automatically saved (if enabled in settings)
- View all sessions in the "Sessions" view
- Load previous sessions to continue or review

## Attack Modes

- **Mode 0 - Dictionary Attack**: Uses a wordlist file
- **Mode 1 - Combinator Attack**: Combines two wordlists
- **Mode 3 - Brute-force Attack**: Uses mask patterns
- **Mode 6 - Hybrid Wordlist + Mask**: Wordlist followed by mask
- **Mode 7 - Hybrid Mask + Wordlist**: Mask followed by wordlist

## Security & Legal

⚠️ **Important**: This tool is intended for:
- Legitimate security testing
- Authorized password recovery
- Educational purposes

Users are responsible for ensuring proper authorization before attempting to recover passwords. Unauthorized access to computer systems is illegal.

## Technical Stack

- **Framework**: Electron
- **Frontend**: React 18+ with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **UI Components**: Radix UI (shadcn/ui style)
- **Build Tool**: Vite

## Project Structure

```
hashcat-gui/
├── electron/          # Electron main process
│   ├── main.ts        # Main process entry
│   └── preload.ts     # IPC bridge
├── src/
│   ├── components/    # React components
│   ├── store/         # Zustand state management
│   ├── utils/         # Utility functions
│   └── types/         # TypeScript types
└── package.json
```

## Development

The project uses:
- `electron-vite` for building Electron apps
- `vite` for fast HMR in development
- `tailwindcss` for styling
- `zustand` for state management

## Roadmap

Future versions for Linux and Mac may be available.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue at https://github.com/red5labs/hashkitteh/issues.







