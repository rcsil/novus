# LaraCode 🚀

> **Note:** This project is currently in **BETA**. Many features are still under development and instabilities may occur. Contributions are very welcome!

**LaraCode** is a lightweight, modern, Open Source IDE built with **Rust** and **Tauri**, specifically designed for **Laravel** developers.

Our mission is to create a fast, focused, and integrated development environment for the PHP/Laravel ecosystem, leveraging the performance of Rust and the flexibility of the web.

## ✨ Features (Beta)

Although it is in its early stages, LaraCode already has essential features for your workflow:

- ⚡ **Native Performance:** Built on Tauri (Rust), ensuring minimal memory consumption and instant startup.
- 📝 **Code Editor:** Based on the **Monaco Editor** (the same one used by VS Code), offering syntax highlighting and a familiar editing experience.
- 🐘 **Laravel Focused:** Integrated tools designed for the framework:
    - **Route Viewer:** Visually inspect your application's routes (`php artisan route:list`).
    - **Log Reader:** Monitor Laravel logs in real-time without leaving the editor.
    - **Overview:** Project overview dashboard.
- 🖥️ **Integrated Terminal:** Built-in terminal (xterm.js) to run Artisan, Composer commands, and more.
- 🐙 **Git/GitHub Integration:** Basic version control management and sidebar visualization.
- 🎨 **Modern Interface:** Clean and customizable UI, developed with React and Tailwind CSS v4.

## 🛠️ Tech Stack

- **Core:** Rust, Tauri v2
- **Frontend:** React 19, TypeScript
- **Styling:** Tailwind CSS v4
- **Editor:** Monaco Editor
- **Terminal:** Xterm.js

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed on your machine:
- [Rust](https://www.rust-lang.org/tools/install)
- [Node.js](https://nodejs.org/) (and npm/pnpm/yarn)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/lara-code.git
   cd lara-code
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Run the development environment:
   ```bash
   npm run tauri dev
   ```
   *On the first run, Cargo will compile Rust dependencies, which may take a few minutes.*

## 🗺️ Roadmap

We are actively working to bring:
- [ ] Intelligent auto-complete for Facades and Eloquent.
- [ ] Debugging support (Xdebug).
- [ ] Integrated Database Management.
- [ ] Test execution (Pest/PHPUnit) via UI.
- [ ] Plugin System.

## 🤝 Contributing

LaraCode is an Open Source project and we would love your help to make it the best IDE for Laravel!

1. Fork the project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Made with ❤️ by rcsil.