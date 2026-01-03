use keyring::Entry;
use reqwest::Client;
use serde::{Deserialize, Serialize};

const GITHUB_CLIENT_ID: &str = "178c6fc778ccc68e1d6a"; // GitHub CLI Client ID (for testing)

#[derive(Serialize, Deserialize, Debug)]
pub struct DeviceCodeResponse {
    device_code: String,
    user_code: String,
    verification_uri: String,
    expires_in: u64,
    interval: u64,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct AuthTokenResponse {
    access_token: String,
    token_type: String,
    scope: String,
}

#[tauri::command]
pub async fn start_github_auth() -> Result<DeviceCodeResponse, String> {
    println!("Starting GitHub Auth...");
    let client = Client::new();
    let res = client
        .post("https://github.com/login/device/code")
        .header("Accept", "application/json")
        .form(&[("client_id", GITHUB_CLIENT_ID)]) 
        .send()
        .await
        .map_err(|e| {
            println!("Request failed: {}", e);
            e.to_string()
        })?;

    let status = res.status();
    println!("Response status: {}", status);

    if !status.is_success() {
        let text = res.text().await.unwrap_or_default();
        println!("Error body: {}", text);
        return Err(format!("Failed to start auth: {} - {}", status, text));
    }

    let data: DeviceCodeResponse = res.json().await.map_err(|e| {
        println!("JSON parse error: {}", e);
        e.to_string()
    })?;
    
    println!("Auth started successfully: {:?}", data);
    Ok(data)
}

#[tauri::command]
pub async fn poll_github_token(device_code: String) -> Result<String, String> {
    let client = Client::new();
    // In a real app, we'd loop. Here we let the frontend loop.
    let res = client
        .post("https://github.com/login/oauth/access_token")
        .header("Accept", "application/json")
        .form(&[
            ("client_id", "Ov23liiyYqurLLNFx3ie"), 
            ("device_code", device_code.as_str()),
            ("grant_type", "urn:ietf:params:oauth:grant-type:device_code"),
        ])
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err(format!("Polling failed: {}", res.status()));
    }

    let text = res.text().await.map_err(|e| e.to_string())?;
    
    // Check for error in JSON
    if text.contains("\"error\"") {
        // e.g., authorization_pending
        return Err("pending".to_string());
    }

    let token_res: AuthTokenResponse = serde_json::from_str(&text).map_err(|e| e.to_string())?;
    
    // Save to keyring
    let entry = Entry::new("lara-code", "github_token").map_err(|e| e.to_string())?;
    entry.set_password(&token_res.access_token).map_err(|e| e.to_string())?;

    Ok(token_res.access_token)
}

#[tauri::command]
pub fn get_cached_token() -> Result<String, String> {
    let entry = Entry::new("lara-code", "github_token").map_err(|e| e.to_string())?;
    match entry.get_password() {
        Ok(t) => Ok(t),
        Err(_) => Err("No token found".to_string()),
    }
}

#[tauri::command]
pub fn logout_github() -> Result<(), String> {
    let entry = Entry::new("lara-code", "github_token").map_err(|e| e.to_string())?;
    entry.delete_credential().map_err(|e| e.to_string())?;
    Ok(())
}
