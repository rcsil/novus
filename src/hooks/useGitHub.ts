import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  clone_url: string;
}

export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export function useGitHub() {
  const [token, setToken] = useState<string | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [deviceCodeData, setDeviceCodeData] = useState<DeviceCodeResponse | null>(null);
  const [status, setStatus] = useState<string[]>([]);
  const [branches, setBranches] = useState<string[]>([]);

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    try {
      const t = await invoke<string>('get_cached_token');
      if (t) {
        setToken(t);
        fetchRepos(t);
      }
    } catch (e) {
      console.log("No cached token");
    }
  };

  const startAuth = async () => {
    try {
      setLoading(true);
      const data = await invoke<DeviceCodeResponse>('start_github_auth');
      setDeviceCodeData(data);
      // Start polling
      poll(data.device_code, data.interval);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const poll = async (deviceCode: string, interval: number) => {
    const intervalMs = (interval + 1) * 1000;
    const pollId = setInterval(async () => {
      try {
        const t = await invoke<string>('poll_github_token', { deviceCode });
        if (t === 'pending') return;
        
        clearInterval(pollId);
        setToken(t);
        setDeviceCodeData(null);
        setLoading(false);
        fetchRepos(t);
      } catch (e) {
        // Stop on hard error
        console.error(e);
        // if error is not just pending, clear interval
        if (typeof e === 'string' && !e.includes('pending')) {
            clearInterval(pollId);
            setLoading(false);
        }
      }
    }, intervalMs);
  };

  const fetchRepos = async (t: string) => {
    setLoading(true);
    try {
      const data = await invoke<GitHubRepo[]>('list_repos', { token: t });
      setRepos(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await invoke('logout_github');
      setToken(null);
      setRepos([]);
    } catch (e) {
      console.error(e);
    }
  };

  const clone = async (url: string, targetPath: string) => {
    await invoke('clone_repo', { url, targetPath, token });
  };

  const getStatus = async (path: string) => {
      try {
          const s = await invoke<string[]>('get_repo_status', { path });
          setStatus(s);
          listBranches(path); // Update branches too
      } catch (e) {
          console.error(e);
          setStatus([]);
      }
  }
  
  const listBranches = async (path: string) => {
      try {
          const b = await invoke<string[]>('list_branches', { path });
          setBranches(b);
      } catch (e) {
          console.error(e);
      }
  };
  
  const createBranch = async (path: string, name: string) => {
      await invoke('create_branch', { path, name });
      listBranches(path);
  };
  
  const switchBranch = async (path: string, name: string) => {
      await invoke('switch_branch', { path, name });
      getStatus(path);
  };
  
  const pull = async (path: string) => {
      await invoke('pull_repo', { path, token });
      getStatus(path);
  };
  
  const push = async (path: string) => {
      await invoke('push_repo', { path, token });
  };

  return {
    token,
    repos,
    loading,
    deviceCodeData,
    startAuth,
    logout,
    clone,
    status,
    getStatus,
    branches,
    createBranch,
    switchBranch,
    pull,
    push
  };
}
