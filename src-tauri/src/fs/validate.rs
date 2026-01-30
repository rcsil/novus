use std::path::Path;
use super::errors::RenameError;

pub fn validate_new_name(name: &str) -> Result<(), RenameError> {
    if name.trim().is_empty() {
        return Err(RenameError::EmptyName);
    }

    if name.contains('/') || name.contains('\\') {
        return Err(RenameError::InvalidCharacters);
    }

    Ok(())
}

pub fn validate_exists(path: &Path) -> Result<(), RenameError> {
    if !path.exists() {
        return Err(RenameError::NotFound);
    }

    Ok(())
}