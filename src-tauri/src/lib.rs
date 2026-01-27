use portable_pty::{CommandBuilder, NativePtySystem, PtySize, PtySystem};
use std::process::Command;
use std::{
    collections::HashMap,
    io::{Read, Write},
    sync::Mutex,
    thread,
};
use sysinfo::System;
use tauri::{Emitter, Manager, State};
#[cfg(target_os = "windows")]
use window_vibrancy::apply_blur;
#[cfg(target_os = "macos")]
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};

struct PtyState {
    ptys: Mutex<HashMap<String, (Box<dyn portable_pty::MasterPty + Send>, Box<dyn Write + Send>)>>,
}

struct SystemState {
    system: Mutex<System>,
}

#[derive(serde::Serialize)]
struct SystemMetrics {
    cpu_usage: f32,
    memory_usage: u64,
    total_memory: u64,
}

#[tauri::command]
fn get_system_metrics(state: State<'_, SystemState>) -> SystemMetrics {
    let mut sys = state.system.lock().unwrap();
    sys.refresh_cpu();
    sys.refresh_memory();
    
    SystemMetrics {
        cpu_usage: sys.global_cpu_info().cpu_usage(),
        memory_usage: sys.used_memory(),
        total_memory: sys.total_memory(),
    }
}

#[tauri::command]
fn check_laravel_project(path: String) -> bool {
    let artisan_path = std::path::Path::new(&path).join("artisan");
    artisan_path.exists()
}

use std::io::{Seek, SeekFrom};
use std::fs::File;

#[tauri::command]
fn read_file_tail(path: String, n_bytes: u64) -> Result<String, String> {
    let mut file = File::open(path).map_err(|e| e.to_string())?;
    let len = file.metadata().map_err(|e| e.to_string())?.len();
    
    let start_pos = if len > n_bytes { len - n_bytes } else { 0 };
    
    file.seek(SeekFrom::Start(start_pos)).map_err(|e| e.to_string())?;
    
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer).map_err(|e| e.to_string())?;
    
    let output = String::from_utf8_lossy(&buffer).to_string();
    Ok(output)
}

#[tauri::command]
fn create_terminal(
    state: State<'_, PtyState>,
    app_handle: tauri::AppHandle,
    id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let pty_system = NativePtySystem::default();

    let size = PtySize {
        rows,
        cols,
        pixel_width: 0,
        pixel_height: 0,
    };

    let cmd = if cfg!(target_os = "windows") {
        CommandBuilder::new("powershell.exe")
    } else {
        CommandBuilder::new("bash")
    };

    let pair = pty_system
        .openpty(size)
        .map_err(|e| format!("Failed to open PTY: {}", e))?;

    let _child = pair
        .slave
        .spawn_command(cmd)
        .map_err(|e| format!("Failed to spawn shell: {}", e))?;

    let mut reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;
    let writer = pair.master.take_writer().map_err(|e| e.to_string())?;

    state
        .ptys
        .lock()
        .unwrap()
        .insert(id.clone(), (pair.master, writer));

    let id_clone = id.clone();

    thread::spawn(move || {
        let mut buffer = [0u8; 1024];
        loop {
            match reader.read(&mut buffer) {
                Ok(n) if n > 0 => {
                    let data = &buffer[..n];
                    let output = String::from_utf8_lossy(data).to_string();
                    let _ = app_handle.emit(&format!("terminal-output:{}", id_clone), output);
                }
                Ok(_) => break,
                Err(_) => break,
            }
        }
    });

    Ok(())
}

#[tauri::command]
fn write_to_terminal(state: State<'_, PtyState>, id: String, data: String) -> Result<(), String> {
    let mut state_lock = state.ptys.lock().unwrap();
    if let Some((_, writer)) = state_lock.get_mut(&id) {
        write!(writer, "{}", data).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn resize_terminal(state: State<'_, PtyState>, id: String, cols: u16, rows: u16) -> Result<(), String> {
    let mut state_lock = state.ptys.lock().unwrap();
    if let Some((master, _)) = state_lock.get_mut(&id) {
        master
            .resize(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn kill_terminal(state: State<'_, PtyState>, id: String) -> Result<(), String> {
    let mut state_lock = state.ptys.lock().unwrap();
    state_lock.remove(&id);
    Ok(())
}

#[derive(serde::Serialize, Debug)]
enum FileStatus {
    New,
    Modified,
    Deleted,
    Renamed,
}

#[derive(serde::Serialize, Debug)]
struct GitFileStatus {
    path: String,
    status: FileStatus,
    is_staged: bool,
}

#[tauri::command]
fn git_status(project_path: String) -> Result<Vec<GitFileStatus>, String> {
    let output = Command::new("git")
        .arg("-C")
        .arg(&project_path)
        .arg("status")
        .arg("--porcelain")
        .arg("-u")
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut files = Vec::new();

    for line in stdout.lines() {
        let status_str = &line[0..2];
        let path = &line[3..];

        let (staged_status, unstaged_status) = status_str.split_at(1);

        let (status, is_staged) = match (staged_status, unstaged_status) {
            ("M", " ") => (FileStatus::Modified, true),
            ("A", " ") => (FileStatus::New, true),
            ("D", " ") => (FileStatus::Deleted, true),
            ("R", " ") => (FileStatus::Renamed, true),
            (" ", "M") => (FileStatus::Modified, false),
            ("?", "?") => (FileStatus::New, false),
            (" ", "D") => (FileStatus::Deleted, false),
            _ => continue,
        };

        files.push(GitFileStatus {
            path: path.to_string(),
            status,
            is_staged,
        });
    }

    Ok(files)
}

#[tauri::command]
fn git_diff(project_path: String, file_path: String) -> Result<String, String> {
    let output = Command::new("git")
        .arg("-C")
        .arg(&project_path)
        .arg("diff")
        .arg("--no-color")
        .arg("--")
        .arg(&file_path)
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

#[tauri::command]
fn git_add(project_path: String, file_path: String) -> Result<(), String> {
    let output = Command::new("git")
        .arg("-C")
        .arg(&project_path)
        .arg("add")
        .arg(&file_path)
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    Ok(())
}

#[tauri::command]
fn git_unstage(project_path: String, file_path: String) -> Result<(), String> {
    let output = Command::new("git")
        .arg("-C")
        .arg(&project_path)
        .arg("restore")
        .arg("--staged")
        .arg(&file_path)
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    Ok(())
}

#[tauri::command]
fn git_commit(project_path: String, message: String) -> Result<(), String> {
    let output = Command::new("git")
        .arg("-C")
        .arg(&project_path)
        .arg("commit")
        .arg("-m")
        .arg(&message)
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    Ok(())
}

#[derive(serde::Serialize, Debug)]
struct GitBranch {
    name: String,
    current: bool,
}

#[tauri::command]
fn git_branches(project_path: String) -> Result<Vec<GitBranch>, String> {
    let output = Command::new("git")
        .arg("-C")
        .arg(&project_path)
        .arg("branch")
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut branches = Vec::new();

    for line in stdout.lines() {
        let current = line.starts_with('*');
        let name = line.trim_start_matches('*').trim().to_string();
        branches.push(GitBranch { name, current });
    }

    Ok(branches)
}

#[tauri::command]
fn git_checkout_branch(project_path: String, branch_name: String) -> Result<(), String> {
    let output = Command::new("git")
        .arg("-C")
        .arg(&project_path)
        .arg("checkout")
        .arg(&branch_name)
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    Ok(())
}

#[tauri::command]
fn save_file(path: String, content: String) -> Result<(), String> {
    std::fs::write(path, content).map_err(|e| e.to_string())
}


#[derive(serde::Serialize)]
struct FileEntry {
    name: String,
    path: String,
    is_directory: bool,
}

#[tauri::command]
fn read_directory(path: String) -> Result<Vec<FileEntry>, String> {
    let entries = std::fs::read_dir(&path).map_err(|e| e.to_string())?;
    let mut file_entries = Vec::new();

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path_buf = entry.path();
        let metadata = entry.metadata().map_err(|e| e.to_string())?;
        
        file_entries.push(FileEntry {
            name: entry.file_name().to_string_lossy().to_string(),
            path: path_buf.to_string_lossy().to_string(),
            is_directory: metadata.is_dir(),
        });
    }

    Ok(file_entries)
}

#[tauri::command]
fn read_file_content(path: String) -> Result<String, String> {
    std::fs::read_to_string(path).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(PtyState {
            ptys: Mutex::new(HashMap::new()),
        })
        .manage(SystemState {
            system: Mutex::new(System::new_all()),
        })
        .setup(|app| {
            let _window = app.get_webview_window("main").unwrap();

            #[cfg(target_os = "macos")]
            apply_vibrancy(&_window, NSVisualEffectMaterial::HudWindow, None, None)
                .expect("Unsupported platform! 'apply_vibrancy' is only supported on macOS");

            #[cfg(target_os = "windows")]
            apply_blur(&_window, Some((18, 18, 18, 0)))
                .expect("Unsupported platform! 'apply_blur' is only supported on Windows");

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            create_terminal,
            write_to_terminal,
            resize_terminal,
            kill_terminal,
            read_file_tail,
            get_system_metrics,
            check_laravel_project,
            git_status,
            git_diff,
            git_add,
            git_unstage,
            git_commit,
            git_branches,
            git_checkout_branch,
            save_file,
            read_directory,
            read_file_content
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
