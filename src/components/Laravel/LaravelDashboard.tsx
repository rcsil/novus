import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
	IconBrandLaravel,
	IconPlayerPlay,
	IconPlayerStop,
	IconSearch,
	IconRefresh,
	IconBug,
	IconInfoCircle,
	IconAlertTriangle,
	IconActivity,
	IconList,
	IconServer,
	IconCpu,
	IconDatabase
} from "@tabler/icons-react";

interface LogEntry {
	timestamp: string;
	env: string;
	level: string;
	message: string;
	raw: string;
}

interface RequestEntry {
	id: number;
	method: string;
	url: string;
	status: number;
	duration: string;
	timestamp: string;
}

interface SystemMetrics {
	cpu_usage: number;
	memory_usage: number;
	total_memory: number;
}

interface LaravelDashboardProps {
	projectPath: string | null;
	height: number;
	isOpen: boolean;
	onToggle: (isOpen: boolean) => void;
}

export default function LaravelDashboard({ projectPath, height, isOpen }: LaravelDashboardProps) {
	const [isLaravelProject, setIsLaravelProject] = useState<boolean | null>(null);
	const [activeTab, setActiveTab] = useState<"overview" | "logs" | "requests">("overview");

	const [serverStatus, setServerStatus] = useState<"stopped" | "starting" | "running">("stopped");
	const [serverPort] = useState(8000);
	const SERVER_TERM_ID = "laravel-server";

	const [logs, setLogs] = useState<LogEntry[]>([]);
	const [requests, setRequests] = useState<RequestEntry[]>([]);
	const [metrics, setMetrics] = useState<SystemMetrics>({ cpu_usage: 0, memory_usage: 0, total_memory: 0 });

	const [filterLevel, setFilterLevel] = useState<string>("ALL");
	const [searchTerm, setSearchTerm] = useState("");

	useEffect(() => {
		if (projectPath) {
			invoke<boolean>("check_laravel_project", { path: projectPath })
				.then(setIsLaravelProject)
				.catch(() => setIsLaravelProject(false));
		}
	}, [projectPath]);

	useEffect(() => {
		if (!projectPath || !isOpen || !isLaravelProject) return;

		const logPath = `${projectPath}/storage/logs/laravel.log`;

		const fetchData = async () => {
			try {
				const content = await invoke<string>("read_file_tail", { path: logPath, nBytes: 50000 });
				parseLogs(content);
			} catch (e) { }

			try {
				const m = await invoke<SystemMetrics>("get_system_metrics");
				setMetrics(m);
			} catch (e) { console.error(e); }
		};

		fetchData();
		const interval = setInterval(fetchData, 2000);
		return () => clearInterval(interval);
	}, [projectPath, isOpen, isLaravelProject]);

	useEffect(() => {
		if (serverStatus !== "running") return;

		const unlisten = listen(`terminal-output:${SERVER_TERM_ID}`, (event) => {
			const output = event.payload as string;

			const lines = output.split('\n');
			lines.forEach(line => {
				const match = line.match(/(GET|POST|PUT|DELETE|PATCH)\s+(\S+)\s.*(\d{3})/);
				if (match) {
					setRequests(prev => [{
						id: Date.now(),
						timestamp: new Date().toLocaleTimeString(),
						method: match[1],
						url: match[2],
						status: parseInt(match[3]),
						duration: "?"
					}, ...prev].slice(0, 50));
				}
			});
		});

		return () => { unlisten.then(f => f()); };
	}, [serverStatus]);

	const parseLogs = (content: string) => {
		const lines = content.split("\n");
		const parsed: LogEntry[] = [];
		const regex = /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] (\w+)\.(\w+): (.*)/;

		for (let i = lines.length - 1; i >= 0; i--) {
			const line = lines[i].trim();
			if (!line) continue;
			const match = line.match(regex);
			if (match) {
				parsed.push({
					timestamp: match[1],
					env: match[2],
					level: match[3],
					message: match[4],
					raw: line
				});
			} else if (parsed.length > 0) {
				parsed[parsed.length - 1].message += `\n${line}`;
			}
		}
		setLogs(parsed.slice(0, 100));
	};

	const toggleServer = async () => {
		if (serverStatus === "running") {
			try {
				await invoke("kill_terminal", { id: SERVER_TERM_ID });
				setServerStatus("stopped");
			} catch (e) { console.error(e); }
		} else {
			setServerStatus("starting");
			try {
				await invoke("create_terminal", { id: SERVER_TERM_ID, cols: 80, rows: 24 });
				setTimeout(async () => {
					await invoke("write_to_terminal", { id: SERVER_TERM_ID, data: "php artisan serve\r" });
					setServerStatus("running");
				}, 500);
			} catch (e) {
				setServerStatus("stopped");
			}
		}
	};

	const runArtisan = async (cmd: string) => {
		if (serverStatus === "running") {
			const TASK_ID = `artisan-${Date.now()}`;
			await invoke("create_terminal", { id: TASK_ID, cols: 80, rows: 24 });
			await invoke("write_to_terminal", { id: TASK_ID, data: `php artisan ${cmd} && exit\r` });
		}
	};

	const filteredLogs = logs.filter(log => {
		if (filterLevel !== "ALL" && log.level !== filterLevel) return false;
		if (searchTerm && !log.message.toLowerCase().includes(searchTerm.toLowerCase())) return false;
		return true;
	});

	if (!isOpen) return null;

	if (isLaravelProject === false) {
		return (
			<div className="flex flex-col items-center justify-center h-full text-gray-500 bg-[#0f1523]/95 border-t border-gray-800" style={{ height }}>
				<IconAlertTriangle size={32} className="mb-2 text-yellow-500" />
				<p>This does not appear to be a Laravel project.</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col bg-[#0f1523]/95 border-t border-gray-800 text-gray-300 font-sans" style={{ height }}>
			<div className="h-10 flex items-center px-4 border-b border-gray-800 gap-6 bg-[#0f1523]/50 shrink-0">
				<div className="flex items-center gap-2 text-[#FF2D20] font-bold select-none mr-2">
					<IconBrandLaravel size={22} />
					<span className="tracking-tight uppercase text-xs">Novus for Laravel</span>
				</div>

				<div className="flex bg-[#111827] rounded-lg p-0.5 border border-gray-700/50">
					<TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={<IconActivity size={14} />} label="Overview" />
					<TabButton active={activeTab === "logs"} onClick={() => setActiveTab("logs")} icon={<IconList size={14} />} label="Logs" count={logs.length} />
					<TabButton active={activeTab === "requests"} onClick={() => setActiveTab("requests")} icon={<IconServer size={14} />} label="Requests" />
				</div>

				<div className="flex-1" />

				<div className="flex items-center gap-3">
					{serverStatus === "running" && (
						<div className="flex items-center gap-2 text-xs text-gray-400 font-mono bg-black/20 px-2 py-1 rounded">
							<div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
							localhost:{serverPort}
						</div>
					)}
					<button
						onClick={toggleServer}
						className={`
                            flex items-center gap-2 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide transition-all
                            ${serverStatus === "running"
								? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
								: "bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20"}
                        `}
					>
						{serverStatus === "running" ? <IconPlayerStop size={12} /> : <IconPlayerPlay size={12} />}
						{serverStatus === "running" ? "Stop" : "Serve"}
					</button>
				</div>
			</div>

			<div className="flex-1 overflow-hidden relative">

				{activeTab === "overview" && (
					<div className="p-6 h-full overflow-y-auto">
						<div className="grid grid-cols-3 gap-4 mb-6">
							<div className="col-span-2 grid grid-cols-2 gap-4">
								<MetricCard
									label="System CPU"
									value={`${metrics.cpu_usage.toFixed(1)}%`}
									icon={<IconCpu size={18} className="text-blue-400" />}
									color="blue"
								/>
								<MetricCard
									label="Memory Usage"
									value={`${(metrics.memory_usage / 1024 / 1024 / 1024).toFixed(2)} GB`}
									subValue={`of ${(metrics.total_memory / 1024 / 1024 / 1024).toFixed(2)} GB`}
									icon={<IconServer size={18} className="text-purple-400" />}
									color="purple"
								/>
							</div>

							<div className="bg-[#111827]/50 border border-gray-800 rounded-lg p-4">
								<h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Quick Actions</h3>
								<div className="space-y-2">
									<ActionButton onClick={() => runArtisan("optimize:clear")} label="Clear Cache" />
									<ActionButton onClick={() => runArtisan("migrate:status")} label="Migration Status" />
									<ActionButton onClick={() => runArtisan("route:list")} label="Route List" />
								</div>
							</div>
						</div>

						<div className="bg-[#111827]/50 border border-gray-800 rounded-lg p-4 h-[200px] flex flex-col">
							<h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
								<IconDatabase size={14} />
								Recent Activity
							</h3>
							<div className="flex-1 overflow-y-auto">
								{logs.slice(0, 5).map((log, i) => (
									<div key={i} className="text-xs font-mono py-1 border-b border-gray-800/50 flex gap-2">
										<span className="text-gray-500">{log.timestamp.split(' ')[1]}</span>
										<span className={log.level === 'ERROR' ? 'text-red-400' : 'text-gray-400'}>{log.message.substring(0, 100)}...</span>
									</div>
								))}
								{logs.length === 0 && <span className="text-xs text-gray-600 italic">No recent logs</span>}
							</div>
						</div>
					</div>
				)}

				{activeTab === "logs" && (
					<div className="h-full flex flex-col">
						<div className="h-10 flex items-center px-4 border-b border-gray-800 gap-2 bg-[#0f1523]/30">
							<div className="relative">
								<IconSearch size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
								<input
									type="text"
									placeholder="Search logs..."
									className="bg-[#111827] border border-gray-700 rounded-md py-1 pl-8 pr-2 text-xs text-gray-300 focus:outline-none focus:border-[#FF2D20]"
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
								/>
							</div>
							<select
								className="bg-[#111827] border border-gray-700 rounded-md py-1 px-2 text-xs text-gray-300 focus:outline-none"
								value={filterLevel}
								onChange={(e) => setFilterLevel(e.target.value)}
							>
								<option value="ALL">All Levels</option>
								<option value="ERROR">Errors</option>
								<option value="WARNING">Warnings</option>
								<option value="INFO">Info</option>
							</select>
							<div className="flex-1" />
							<button className="p-1 hover:bg-gray-700 rounded text-gray-400" onClick={() => setLogs([])}>
								<IconRefresh size={14} />
							</button>
						</div>
						<div className="flex-1 overflow-y-auto p-0 font-mono text-xs scrollbar-thin">
							{filteredLogs.map((log, i) => (
								<div key={i} className="hover:bg-white/5 border-b border-gray-800/30 flex p-2 gap-3 group">
									<div className="w-32 shrink-0 text-gray-500">{log.timestamp}</div>
									<div className="w-16 shrink-0"><Badge level={log.level} /></div>
									<div className="text-gray-300 break-all whitespace-pre-wrap">{log.message}</div>
								</div>
							))}
						</div>
					</div>
				)}

				{activeTab === "requests" && (
					<div className="h-full flex flex-col">
						<div className="p-4">
							<h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Live Request Stream (Beta)</h3>
							{requests.length === 0 ? (
								<div className="text-center text-gray-600 mt-10">
									<p>Waiting for requests...</p>
									<p className="text-[10px] mt-1">Make sure the server is running.</p>
								</div>
							) : (
								<div className="space-y-1">
									{requests.map(req => (
										<div key={req.id} className="flex items-center gap-3 p-2 bg-[#111827]/50 border border-gray-800 rounded font-mono text-xs">
											<span className={`font-bold w-12 ${req.method === 'GET' ? 'text-blue-400' : 'text-green-400'}`}>{req.method}</span>
											<span className="flex-1 truncate text-gray-300">{req.url}</span>
											<span className={`px-1.5 py-0.5 rounded text-[10px] ${req.status >= 400 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>{req.status}</span>
											<span className="text-gray-500">{req.timestamp}</span>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				)}

			</div>
		</div>
	);
}

function TabButton({ active, onClick, icon, label, count }: any) {
	return (
		<button
			onClick={onClick}
			className={`
                flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-md transition-all
                ${active ? "bg-[#FF2D20] text-white shadow-lg shadow-red-900/20" : "text-gray-400 hover:text-gray-200 hover:bg-white/5"}
            `}
		>
			{icon}
			{label}
			{count > 0 && <span className="bg-white/20 text-white text-[9px] px-1 rounded-full">{count}</span>}
		</button>
	);
}

function MetricCard({ label, value, subValue, icon, color }: any) {
	return (
		<div className="bg-[#111827]/50 border border-gray-800 rounded-lg p-4 flex items-center gap-4 relative overflow-hidden group">
			<div className={`p-3 rounded-full bg-${color}-500/10 text-${color}-400`}>
				{icon}
			</div>
			<div>
				<div className="text-xs text-gray-500 uppercase font-bold tracking-wider">{label}</div>
				<div className="text-xl font-mono text-gray-200 mt-0.5">{value}</div>
				{subValue && <div className="text-[10px] text-gray-600">{subValue}</div>}
			</div>
			<div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-${color}-500/5 rounded-full blur-xl group-hover:bg-${color}-500/10 transition-all`} />
		</div>
	);
}

function ActionButton({ onClick, label }: any) {
	return (
		<button
			onClick={onClick}
			className="w-full text-left px-3 py-2 rounded bg-black/20 hover:bg-black/40 border border-gray-800 hover:border-gray-700 text-xs text-gray-400 hover:text-gray-200 transition-all flex items-center justify-between group"
		>
			{label}
			<IconPlayerPlay size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
		</button>
	);
}

function Badge({ level }: { level: string }) {
	let color = "bg-gray-700 text-gray-300";
	let icon = null;

	switch (level) {
		case "ERROR":
			color = "bg-red-500/20 text-red-400 border border-red-500/30";
			icon = <IconBug size={10} />;
			break;
		case "WARNING":
			color = "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
			icon = <IconAlertTriangle size={10} />;
			break;
		case "INFO":
			color = "bg-blue-500/20 text-blue-400 border border-blue-500/30";
			icon = <IconInfoCircle size={10} />;
			break;
	}

	return (
		<span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${color}`}>
			{icon}
			{level}
		</span>
	);
}
