import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { LaravelRoute } from '../types/Laravel';

export function useLaravel(rootPath: string | null) {
    const [isLaravel, setIsLaravel] = useState(false);
    const [routes, setRoutes] = useState<LaravelRoute[]>([]);
    const [logs, setLogs] = useState<string>("");
    const [laravelVersion, setLaravelVersion] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const checkIsLaravel = useCallback(async () => {
        if (!rootPath) {
            setIsLaravel(false);
            return;
        }
        try {
            const result = await invoke<boolean>('check_is_laravel', { path: rootPath });
            setIsLaravel(result);
        } catch (err) {
            console.error(err);
            setIsLaravel(false);
        }
    }, [rootPath]);

    const fetchVersion = useCallback(async () => {
        if (!rootPath || !isLaravel) return;
        try {
            const result = await invoke<string>('get_laravel_version', { path: rootPath });
            setLaravelVersion(result);
        } catch (err) {
            console.error(err);
        }
    }, [rootPath, isLaravel]);

    const fetchRoutes = useCallback(async () => {
        if (!rootPath || !isLaravel) return;
        setLoading(true);
        try {
            const result = await invoke<string>('get_laravel_routes', { path: rootPath });
            setRoutes(JSON.parse(result));
            setError(null);
        } catch (err: any) {
            setError(err.toString());
        } finally {
            setLoading(false);
        }
    }, [rootPath, isLaravel]);

    const fetchLogs = useCallback(async () => {
        if (!rootPath || !isLaravel) return;
        try {
            const result = await invoke<string>('get_laravel_logs', { path: rootPath });
            setLogs(result);
        } catch (err: any) {
            console.error(err);
        }
    }, [rootPath, isLaravel]);

    const createProject = async (name: string) => {
        if (!rootPath) return;
        setLoading(true);
        try {
             await invoke('create_laravel_project', { parentPath: rootPath, name });
             // After creation, maybe refresh?
        } catch (err: any) {
            setError(err.toString());
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const runArtisan = async (command: string) => {
        if (!rootPath || !isLaravel) return;
        setLoading(true);
        try {
            const result = await invoke<string>('run_artisan_command', { path: rootPath, command });
            return result;
        } catch (err: any) {
            setError(err.toString());
            throw err;
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        checkIsLaravel();
    }, [checkIsLaravel]);

    return {
        isLaravel,
        routes,
        logs,
        laravelVersion,
        loading,
        error,
        fetchRoutes,
        fetchLogs,
        fetchVersion,
        createProject,
        runArtisan
    };
}
