use std::fs;
use std::path::PathBuf;
use crate::fs::errors::RenameError;
use crate::fs::validate::{validate_new_name, validate_exists};

#[tauri::command]
pub fn rename_file(
    path: String,
    new_name: String,
) -> Result<(), RenameError> {
    let old_path = PathBuf::from(&path);

    validate_new_name(&new_name)?;
    validate_exists(&old_path)?;

    let parent = old_path
        .parent()
        .ok_or(RenameError::InvalidPath)?;

    let new_path = parent.join(&new_name);

    if new_path.exists() {
        return Err(RenameError::AlreadyExists);
    }

    fs::rename(old_path, new_path)
        .map_err(|_| RenameError::Io)?;

    Ok(())
}