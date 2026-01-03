import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { FileTab } from "../../../types/components/layouts/App";
import { FileEntry } from "../../../types/FileSystem";

export default function useApp() {
  const [files, setFiles] = useState<FileTab[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [rootFolder, setRootFolder] = useState<FileEntry[]>([]);
  const [rootPath, setRootPath] = useState<string | null>(null);

  useEffect(() => {
    if (files.length === 0) {
      handleNewFile();
    }
  }, []);

  const handleNewFile = () => {
    const newId = Date.now().toString();
    const newFile: FileTab = {
      id: newId,
      name: `Untitled-${files.length + 1}`,
      path: `untitled-${newId}.php`,
      content: "<?php\n\n",
      isDirty: false,
    };
    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newId);
  };

  const handleOpenFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });

      if (selected && typeof selected === 'string') {
        setRootPath(selected);
        const entries = await invoke<FileEntry[]>("read_directory", { path: selected });
        setRootFolder(entries);
      }
    } catch (error) {
       console.error("Failed to open folder:", error);
    }
  };

  const handleOpenFile = async (path?: string) => {
    try {
      let selected: string | null = null;
      
      if (path) {
        selected = path;
      } else {
        const result = await open({
          multiple: false,
        });
        if (result && typeof result === 'string') {
          selected = result;
        }
      }

      if (selected) {
        const existing = files.find(f => f.path === selected);
        if (existing) {
          setActiveFileId(existing.id);
          return;
        }

        const text = await invoke<string>("read_file_content", { path: selected });
        const newId = Date.now().toString();
        const name = selected.split(/[\\/]/).pop() || selected;
        
        const newFile: FileTab = {
          id: newId,
          name,
          path: selected,
          content: text,
          isDirty: false
        };

        setFiles((prev) => [...prev, newFile]);
        setActiveFileId(newId);
      }
    } catch (error) {
      console.error("Failed to open file:", error);
    }
  };

  const handleSave = async () => {
    if (!activeFileId) return; 
    
    const file = files.find(f => f.id === activeFileId);
    if (!file) return;

    if (file.path.startsWith('untitled-')) {
      try {
        const selected = await save({
          filters: [{
            name: 'Code File',
            extensions: ['php', 'js', 'ts', 'tsx', 'html', 'css', 'json', 'txt']
          }]
        });

        if (selected) {
          await invoke("write_file_content", { path: selected, content: file.content });
          const name = selected.split(/[\\/]/).pop() || selected;
          
          setFiles((prev) => prev.map(f => {
            if (f.id === activeFileId) {
              return { ...f, path: selected, name: name, isDirty: false };
            }
            return f;
          }));
        }
      } catch (error) {
        console.error("Failed to save file as:", error);
      }
    } else {
      try {
        await invoke("write_file_content", { path: file.path, content: file.content });
        setFiles((prev) => prev.map(f => f.id === activeFileId ? { ...f, isDirty: false } : f));
      } catch (error) {
        console.error("Failed to save file:", error);
      }
    }
  };

  const handleCloseTab = (id: string) => {
    const fileIndex = files.findIndex(f => f.id === id);
    if (fileIndex === -1) return;

    const newFiles = files.filter(f => f.id !== id);
    setFiles(newFiles);

    if (activeFileId === id) {
      if (newFiles.length > 0) {
        const newIndex = Math.max(0, fileIndex - 1);
        setActiveFileId(newFiles[newIndex].id);
      } else {
        setActiveFileId(null);
      }
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && activeFileId) {
      setFiles((prev) => prev.map(f => {
        if (f.id === activeFileId) {
          return { ...f, content: value, isDirty: true };
        }
        return f;
      }));
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFileId, files]);

  useEffect(() => {
    const dirtyFiles = files.filter(f => f.isDirty && !f.path.startsWith('untitled-'));
    if (dirtyFiles.length === 0) return;

    const timer = setTimeout(() => {
      dirtyFiles.forEach(async (file) => {
        try {
          await invoke("write_file_content", { path: file.path, content: file.content });
          console.log("Auto-saved:", file.path);
          setFiles((prev) => prev.map(f => f.id === file.id ? { ...f, isDirty: false } : f));
        } catch (error) {
          console.error("Failed to auto-save file:", error);
        }
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [files]);

  const activeFile = files.find(f => f.id === activeFileId);

  return {
    files,
    activeFileId,
    activeFile,
    rootFolder,
    rootPath,
    setActiveFileId,
    handleNewFile,
    handleOpenFile,
    handleOpenFolder,
    handleSave,
    handleCloseTab,
    handleEditorChange
  };
}
