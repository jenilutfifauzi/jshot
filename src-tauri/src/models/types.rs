use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Region {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CaptureResult {
    pub id: String,
    pub width: u32,
    pub height: u32,
    /// base64 PNG data URL: "data:image/png;base64,...."
    pub data_url: String,
}
