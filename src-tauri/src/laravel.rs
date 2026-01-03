use std::process::Command;
use std::path::Path;
use std::fs;

#[tauri::command]
pub fn check_is_laravel(path: String) -> bool {
    let artisan_path = Path::new(&path).join("artisan");
    artisan_path.exists()
}

#[tauri::command]
pub fn get_laravel_routes(path: String) -> Result<String, String> {
    let output = Command::new("php")
        .arg("artisan")
        .arg("route:list")
        .arg("--json")
        .current_dir(&path)
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

#[tauri::command]
pub fn get_laravel_logs(path: String) -> Result<String, String> {
    let log_path = Path::new(&path).join("storage/logs/laravel.log");
    if !log_path.exists() {
        return Ok("No logs found.".to_string());
    }

    // Read last 2000 characters or so to avoid huge payload
    let content = fs::read_to_string(&log_path).map_err(|e| e.to_string())?;
    // Simple truncation for now, better approach would be `seek` from end
    let len = content.len();
    let start = if len > 10000 { len - 10000 } else { 0 };
    Ok(content[start..].to_string())
}

#[tauri::command]
pub fn create_laravel_project(parent_path: String, name: String) -> Result<String, String> {
    // This is a long running task. In a real app we'd want to stream this or run it in a terminal.
    // For this MVP we will try to run it and hope it doesn't time out the frontend request, 
    // or arguably we should just spawn it and let the user know it's running.
    
    // Better UX: Return OK immediately, and run in background? 
    // But then we don't know when it finishes.
    // Let's rely on the frontend showing a spinner.
    
    let output = Command::new("composer")
        .arg("create-project")
        .arg("laravel/laravel")
        .arg(&name)
        .current_dir(&parent_path)
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

#[tauri::command]
pub fn get_laravel_version(path: String) -> Result<String, String> {
    let output = Command::new("php")
        .arg("artisan")
        .arg("--version")
        .current_dir(&path)
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

#[tauri::command]
pub fn run_artisan_command(path: String, command: String) -> Result<String, String> {
    let parts: Vec<&str> = command.split_whitespace().collect();
    if parts.is_empty() {
        return Err("Empty command".to_string());
    }

    let output = Command::new("php")
        .arg("artisan")
        .args(parts)
        .current_dir(&path)
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}
