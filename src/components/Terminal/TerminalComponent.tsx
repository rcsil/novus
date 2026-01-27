import { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

interface TerminalComponentProps {
  id: string;
  isActive: boolean;
}

export default function TerminalComponent({ id, isActive }: TerminalComponentProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: "#0f1523",
        foreground: "#e5e7eb",
        cursor: "#FF2D20",
        selectionBackground: "rgba(255, 45, 32, 0.3)",
        black: "#000000",
        red: "#ef4444",
        green: "#10b981",
        yellow: "#f59e0b",
        blue: "#3b82f6",
        magenta: "#d946ef",
        cyan: "#06b6d4",
        white: "#f3f4f6",
        brightBlack: "#4b5563",
        brightRed: "#f87171",
        brightGreen: "#34d399",
        brightYellow: "#fbbf24",
        brightBlue: "#60a5fa",
        brightMagenta: "#e879f9",
        brightCyan: "#22d3ee",
        brightWhite: "#ffffff",
      },
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    const initPty = async () => {
      try {
        await invoke("create_terminal", { id, cols: 80, rows: 24 });

        fitAddon.fit();
        const dims = fitAddon.proposeDimensions();
        if (dims) {
          await invoke("resize_terminal", { id, cols: dims.cols, rows: dims.rows });
        }

        setIsReady(true);
      } catch (e) {
        term.writeln(`\x1b[31mFailed to start terminal: ${e}\x1b[0m`);
      }
    };

    initPty();

    term.onData((data) => {
      invoke("write_to_terminal", { id, data });
    });

    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
        const dims = fitAddonRef.current.proposeDimensions();
        if (dims) {
          invoke("resize_terminal", { id, cols: dims.cols, rows: dims.rows });
        }
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => handleResize());
    });

    resizeObserver.observe(terminalRef.current);
    window.addEventListener("resize", handleResize);

    const unlisten = listen<string>(`terminal-output:${id}`, (event) => {
      term.write(event.payload);
    });

    return () => {
      unlisten.then(f => f());
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
      invoke("kill_terminal", { id });
      term.dispose();
    };
  }, [id]);

  useEffect(() => {
    if (isActive && fitAddonRef.current && isReady) {
      requestAnimationFrame(() => {
        fitAddonRef.current?.fit();
        const dims = fitAddonRef.current?.proposeDimensions();
        if (dims) {
          invoke("resize_terminal", { id, cols: dims.cols, rows: dims.rows });
        }
        xtermRef.current?.focus();
      });
    }
  }, [isActive, isReady, id]);

  return (
    <div
      ref={terminalRef}
      className="w-full h-full overflow-hidden"
      style={{ display: isActive ? 'block' : 'none' }}
    />
  );
}
