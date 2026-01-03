use portable_pty::{CommandBuilder, NativePtySystem, PtySize, PtySystem, MasterPty};
use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use std::io::{Read, Write};
use tauri::{AppHandle, Emitter, State};
use std::thread;

pub struct TerminalState {
    pub ptys: Arc<Mutex<HashMap<String, Box<dyn MasterPty + Send>>>>,
    pub writers: Arc<Mutex<HashMap<String, Box<dyn Write + Send>>>>,
}

impl Default for TerminalState {
    fn default() -> Self {
        Self {
            ptys: Arc::new(Mutex::new(HashMap::new())),
            writers: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

#[tauri::command]
pub fn create_terminal(
    id: String,
    state: State<'_, TerminalState>,
    app: AppHandle,
) -> Result<(), String> {
    let pty_system = NativePtySystem::default();
    let size = PtySize {
        rows: 24,
        cols: 80,
        pixel_width: 0,
        pixel_height: 0,
    };

    let pair = pty_system.openpty(size).map_err(|e| e.to_string())?;

    let shell = if cfg!(target_os = "windows") {
        "powershell.exe"
    } else {
        std::env::var("SHELL").unwrap_or_else(|_| "/bin/bash".to_string()).leak()
    };

    let mut cmd = CommandBuilder::new(shell);
    cmd.cwd(std::env::current_dir().unwrap_or_default());

    let _child = pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;

    let mut reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;
    let writer = pair.master.take_writer().map_err(|e| e.to_string())?;
    state.ptys.lock().unwrap().insert(id.clone(), pair.master);
    state.writers.lock().unwrap().insert(id.clone(), writer);

    let id_clone = id.clone();
    
    thread::spawn(move || {
        let mut buf = [0u8; 1024];
        loop {
            match reader.read(&mut buf) {
                Ok(n) if n > 0 => {
                    let data = String::from_utf8_lossy(&buf[..n]).to_string();
                    let _ = app.emit(&format!("terminal-output-{}", id_clone), data);
                }
                Ok(_) => break,
                Err(_) => break,
            }
        }
    });

    Ok(())
}

#[tauri::command]
pub fn write_terminal(id: String, data: String, state: State<'_, TerminalState>) -> Result<(), String> {
    if let Some(writer) = state.writers.lock().unwrap().get_mut(&id) {
        writer.write_all(data.as_bytes()).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn resize_terminal(id: String, rows: u16, cols: u16, state: State<'_, TerminalState>) -> Result<(), String> {
    if let Some(pty) = state.ptys.lock().unwrap().get_mut(&id) {
        pty.resize(PtySize { rows, cols, pixel_width: 0, pixel_height: 0 }).map_err(|e| e.to_string())?;
    }
    Ok(())
}
