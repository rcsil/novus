import { useEffect, useRef } from "react";
import { Terminal as Xterm } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebLinksAddon } from "xterm-addon-web-links";
import "xterm/css/xterm.css";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

interface TerminalProps {
  id?: string;
  visible?: boolean;
  onClose?: () => void;
}

export default function Terminal({ id = "default", visible = true }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Xterm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (visible && fitAddonRef.current && xtermRef.current) {
      setTimeout(() => {
        fitAddonRef.current?.fit();
        if (xtermRef.current) {
          invoke("resize_terminal", {
            id,
            rows: xtermRef.current.rows,
            cols: xtermRef.current.cols,
          });
        }
      }, 50);
    }
  }, [visible, id]);

  useEffect(() => {
    if (!terminalRef.current || initialized.current) return;
    initialized.current = true;

    const term = new Xterm({
      cursorBlink: true,
      fontFamily: "'Fira Code', monospace",
      fontSize: 14,
      theme: {
        background: "#18181b",
        foreground: "#ffffff",
      },
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    invoke("create_terminal", { id });

    term.onData((data) => {
      invoke("write_terminal", { id, data });
    });

    const handleResize = () => {
      if (!terminalRef.current || terminalRef.current.offsetParent === null) return;
      fitAddon.fit();
      invoke("resize_terminal", {
        id,
        rows: term.rows,
        cols: term.cols,
      });
    };

    window.addEventListener("resize", handleResize);

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(terminalRef.current);

    setTimeout(handleResize, 100);

    const unlisten = listen<string>(`terminal-output-${id}`, (event) => {
      term.write(event.payload);
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      unlisten.then((f) => f());
      term.dispose();
      initialized.current = false;
    };
  }, [id]);

  return <div className={`h-full w-full bg-zinc-900 ${visible ? '' : 'hidden'}`} ref={terminalRef} />;
}
