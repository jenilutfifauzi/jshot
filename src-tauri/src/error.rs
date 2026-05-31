use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Capture failed: {0}")]
    Capture(String),

    #[error("Encode failed: {0}")]
    Encode(String),

    #[error("Decode failed: {0}")]
    Decode(String),

    #[error("Clipboard error: {0}")]
    Clipboard(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("State error: {0}")]
    State(String),

    #[error("Window error: {0}")]
    Window(String),

    #[error("Upload failed: {0}")]
    Upload(String),
}

// Tauri requires command errors to be Serialize to cross the IPC boundary.
impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

pub type AppResult<T> = Result<T, AppError>;
