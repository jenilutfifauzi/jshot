use crate::models::types::CaptureResult;
use std::collections::HashMap;
use std::sync::Mutex;

/// Shared app state. Holds captures in-flight between overlay -> editor windows.
#[derive(Default)]
pub struct AppState {
    pub captures: Mutex<HashMap<String, CaptureResult>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            captures: Mutex::new(HashMap::new()),
        }
    }
}
