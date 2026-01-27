# Novus IDE

Novus is a modern, high-performance, and open-source Integrated Development Environment (IDE) tailored specifically for **Laravel** developers. Built with the speed of **Rust** and the flexibility of **React** via the **Tauri** framework, Novus provides a lightweight yet powerful experience that keeps you focused on your code.

![Novus UI](public/tauri.svg) *(Placeholder for UI Screenshot)*

## 🚀 Features

- **Laravel-First Workflow**: Automatic detection of Laravel projects and built-in support for common Artisan commands.
- **Integrated Laravel Monitor**: 
    - **One-Click Serve**: Start your development server directly from the IDE.
    - **Real-time Log Viewer**: Stream `storage/logs/laravel.log` with filtering by level (Error, Warning, Info).
    - **Performance Metrics**: Monitor system CPU and Memory usage in real-time.
    - **Request Stream**: A live feed of incoming HTTP requests for rapid debugging.
- **Native Performance**: Powered by a Rust backend for fast file system operations and terminal execution.
- **Modern Terminal**: Integrated multi-tab terminal support (PowerShell/Bash).
- **Beautiful UI**: A dark, focused interface inspired by modern design principles (Kiro.dev), optimized for long coding sessions.

## 🛠️ Tech Stack

- **Core**: [Rust](https://www.rust-lang.org/)
- **Frontend**: [React](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Desktop Framework**: [Tauri v2](https://tauri.app/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Terminal Emulation**: [xterm.js](https://xtermjs.org/)
- **Icons**: [Tabler Icons](https://tabler-icons.io/)

## 📥 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [Rust toolchain](https://www.rust-lang.org/tools/install)
- [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (for Windows users)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/novus.git
   cd novus
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run in development mode:
   ```bash
   npm run tauri dev
   ```

4. Build for production:
   ```bash
   npm run tauri build
   ```

## 🤝 Contributing

Novus is an open-source project and we welcome contributions! Whether it's a bug report, a feature suggestion, or a pull request, your help is appreciated.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git checkout origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 🌟 Acknowledgments

- [Tauri Framework](https://tauri.app/)
- [Laravel](https://laravel.com/)
- [React](https://reactjs.org/)
- [Rust Community](https://www.rust-lang.org/community)

---

Made with ❤️ by rcsil.