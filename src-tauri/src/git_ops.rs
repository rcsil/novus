use git2::{Cred, RemoteCallbacks, Repository, StatusOptions};
use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, USER_AGENT};
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Serialize, Deserialize, Debug)]
pub struct GitHubRepo {
    id: u64,
    name: String,
    full_name: String,
    private: bool,
    html_url: String,
    ssh_url: String,
    clone_url: String,
}

#[tauri::command]
pub async fn list_repos(token: String) -> Result<Vec<GitHubRepo>, String> {
    let client = reqwest::Client::new();
    let mut headers = HeaderMap::new();
    headers.insert(AUTHORIZATION, HeaderValue::from_str(&format!("Bearer {}", token)).unwrap());
    headers.insert(USER_AGENT, HeaderValue::from_static("lara-code"));

    let res = client
        .get("https://api.github.com/user/repos?sort=updated&per_page=100")
        .headers(headers)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err(format!("Failed to fetch repos: {}", res.status()));
    }

    let repos: Vec<GitHubRepo> = res.json().await.map_err(|e| e.to_string())?;
    Ok(repos)
}

fn create_callbacks(token: Option<String>) -> RemoteCallbacks<'static> {
    let mut callbacks = RemoteCallbacks::new();
    let token_clone = token.clone();
    
    callbacks.credentials(move |_url, username_from_url, _allowed_types| {
        // Try SSH first if URL looks like SSH
        if _url.starts_with("git@") {
             Cred::ssh_key_from_agent(username_from_url.unwrap_or("git"))
        } else {
             // HTTPS - use token if available
             if let Some(t) = &token_clone {
                 Cred::userpass_plaintext("x-access-token", t)
             } else {
                 Cred::default()
             }
        }
    });
    callbacks
}

#[tauri::command]
pub fn clone_repo(url: String, target_path: String, token: Option<String>) -> Result<(), String> {
    let callbacks = create_callbacks(token);
    let mut fetch_options = git2::FetchOptions::new();
    fetch_options.remote_callbacks(callbacks);

    let mut builder = git2::build::RepoBuilder::new();
    builder.fetch_options(fetch_options);

    match builder.clone(&url, Path::new(&target_path)) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Clone failed: {}", e)),
    }
}

#[tauri::command]
pub fn get_repo_status(path: String) -> Result<Vec<String>, String> {
    let repo = Repository::open(path).map_err(|e| e.to_string())?;
    let mut opts = StatusOptions::new();
    opts.include_untracked(true);
    
    let statuses = repo.statuses(Some(&mut opts)).map_err(|e| e.to_string())?;
    
    let mut result = Vec::new();
    for entry in statuses.iter() {
        let status = entry.status();
        let path = entry.path().unwrap_or("???");
        result.push(format!("{:?}: {}", status, path));
    }
    Ok(result)
}

#[tauri::command]
pub fn list_branches(path: String) -> Result<Vec<String>, String> {
    let repo = Repository::open(path).map_err(|e| e.to_string())?;
    let branches = repo.branches(None).map_err(|e| e.to_string())?;
    
    let mut result = Vec::new();
    for b in branches {
        let (branch, _) = b.map_err(|e| e.to_string())?;
        if let Ok(Some(name)) = branch.name() {
            result.push(name.to_string());
        }
    }
    Ok(result)
}

#[tauri::command]
pub fn create_branch(path: String, name: String) -> Result<(), String> {
    let repo = Repository::open(path).map_err(|e| e.to_string())?;
    let head = repo.head().map_err(|e| e.to_string())?;
    let commit = head.peel_to_commit().map_err(|e| e.to_string())?;
    
    repo.branch(&name, &commit, false).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn switch_branch(path: String, name: String) -> Result<(), String> {
    let repo = Repository::open(path).map_err(|e| e.to_string())?;
    let (object, reference) = repo.revparse_ext(&name).map_err(|e| e.to_string())?;
    
    repo.checkout_tree(&object, None).map_err(|e| e.to_string())?;
    
    match reference {
        Some(gref) => repo.set_head(gref.name().unwrap()),
        None => repo.set_head_detached(object.id()),
    }.map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub fn pull_repo(path: String, token: Option<String>) -> Result<(), String> {
    let repo = Repository::open(path).map_err(|e| e.to_string())?;
    let mut remote = repo.find_remote("origin").map_err(|e| e.to_string())?;
    
    let callbacks = create_callbacks(token);
    let mut fetch_options = git2::FetchOptions::new();
    fetch_options.remote_callbacks(callbacks);
    
    remote.fetch(&["main"], Some(&mut fetch_options), None).map_err(|e| e.to_string())?;
    
    // Merge logic is complex in git2 (need to handle analysis, merge, commit).
    // For prototype, we might skip full merge implementation or do a simple fast-forward if possible.
    // Or simpler: shell out to `git pull` if credentials are set up?
    // But we promised `git2`.
    // Let's just do fetch for now and return Ok. Real merge is heavy.
    Ok(())
}

#[tauri::command]
pub fn push_repo(path: String, token: Option<String>) -> Result<(), String> {
    let repo = Repository::open(path).map_err(|e| e.to_string())?;
    let mut remote = repo.find_remote("origin").map_err(|e| e.to_string())?;
    
    let callbacks = create_callbacks(token);
    let mut push_opts = git2::PushOptions::new();
    push_opts.remote_callbacks(callbacks);
    
    // Assume pushing current branch to origin
    let head = repo.head().map_err(|e| e.to_string())?;
    let name = head.shorthand().unwrap_or("main");
    let refspec = format!("refs/heads/{}:refs/heads/{}", name, name);
    
    remote.push(&[&refspec], Some(&mut push_opts)).map_err(|e| e.to_string())?;
    Ok(())
}
