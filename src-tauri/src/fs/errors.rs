use serde::Serialize;

#[derive(Debug, Serialize)]
pub enum RenameError {
    EmptyName,
    InvalidCharacters,
    InvalidPath,
    NotFound,
    AlreadyExists,
    Io,
}