"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../lib/api";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface Service {
  id: string;
  name: string;
  url: string;
  active: boolean;
}

interface Metrics {
  uptimePercentage: number;
  avgResponseTimeMs: number;
  openIncidents: number;
  totalChecks: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [metrics, setMetrics] = useState<Record<string, Metrics>>({});
  const [email, setEmail] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedEmail = localStorage.getItem("email");
    if (!token) { router.push("/login"); return; }
    setEmail(savedEmail || "");
    loadData();
  }, []);
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe('/topic/checks', (message) => {
          const data = JSON.parse(message.body);
          setMetrics((prev) => {
            const current = prev[data.serviceId];
            if (!current) return prev;
            return {
              ...prev,
              [data.serviceId]: {
                ...current,
                avgResponseTimeMs: data.responseTimeMs,
                uptimePercentage: data.status === 'UP' ? current.uptimePercentage : Math.max(0, current.uptimePercentage - 1),
              },
            };
          });
        });
      },
    });
    client.activate();
    return () => { client.deactivate(); };
  }, []);
  
  const loadData = async () => {
    try {
      const projectsRes = await api.get("/api/projects");
      const projects = projectsRes.data;
      if (projects.length === 0) { setLoading(false); return; }

      const pid = projects[0].id;
      setProjectId(pid);

      const servicesRes = await api.get(`/api/projects/${pid}/services`);
      const servicesData = servicesRes.data;
      setServices(servicesData);

      const metricsData: Record<string, Metrics> = {};
      for (const service of servicesData) {
        const metricsRes = await api.get(`/api/services/${service.id}/metrics`);
        metricsData[service.id] = metricsRes.data;
      }
      setMetrics(metricsData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    router.push("/login");
  };

  const getUptimeColor = (uptime: number) => {
    if (uptime >= 99) return "text-green-400";
    if (uptime >= 95) return "text-yellow-400";
    return "text-red-400";
  };

  const getStatusDot = (uptime: number) =>
    uptime >= 95 ? "bg-green-400" : "bg-red-400";

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-zinc-400 text-sm">Loading...</p>
      </div>
    );
  }
    const statusUrl = "/status/" + projectId;

  return (
    <div className="min-h-screen bg-black text-white">
    {/* Navbar */}
    <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-white font-bold text-lg tracking-tight">⚡ Pulse</h1>
        <div className="flex items-center gap-4">
            {projectId && (
            
                <a href={statusUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-sm transition"
            >
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                Status Page
            </a>
            )}
            <span className="text-zinc-600 text-sm">|</span>
            <span className="text-zinc-400 text-sm">{email}</span>
            <button onClick={handleLogout} className="text-zinc-400 hover:text-white text-sm transition">
            Logout
            </button>
        </div>
    </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Dashboard</h2>
            <p className="text-zinc-400 text-sm mt-1">Monitoring {services.length} services</p>
          </div>
          {projectId && (
            
              <a href={`/status/${projectId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-900 hover:border-zinc-500 hover:bg-zinc-800 text-sm text-zinc-300 hover:text-white transition"
            >
              <span className="w-2 h-2 rounded-full bg-green-400" />
              View Status Page
              <svg className="w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>

        {/* Top cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-zinc-400 text-xs mb-1">Services</p>
            <p className="text-2xl font-bold text-white">{services.length}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-zinc-400 text-xs mb-1">Avg Uptime</p>
            <p className="text-2xl font-bold text-green-400">
              {services.length > 0
                ? Math.round(Object.values(metrics).reduce((a, m) => a + m.uptimePercentage, 0) / Object.values(metrics).length)
                : 0}%
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-zinc-400 text-xs mb-1">Active Incidents</p>
            <p className="text-2xl font-bold text-white">
              {Object.values(metrics).reduce((a, m) => a + m.openIncidents, 0)}
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-zinc-400 text-xs mb-1">Avg Latency</p>
            <p className="text-2xl font-bold text-white">
              {services.length > 0
                ? Math.round(Object.values(metrics).reduce((a, m) => a + m.avgResponseTimeMs, 0) / Object.values(metrics).length)
                : 0}ms
            </p>
          </div>
        </div>

        {/* Services table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800">
            <h3 className="text-white font-semibold">Services</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left text-zinc-400 text-xs px-6 py-3">Service</th>
                <th className="text-left text-zinc-400 text-xs px-6 py-3">Status</th>
                <th className="text-left text-zinc-400 text-xs px-6 py-3">Uptime</th>
                <th className="text-left text-zinc-400 text-xs px-6 py-3">Avg Latency</th>
                <th className="text-left text-zinc-400 text-xs px-6 py-3">Checks</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => {
                const m = metrics[service.id];
                return (
                  <tr
                    key={service.id}
                    onClick={() => router.push(`/dashboard/${service.id}`)}
                    className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/50 transition cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <p className="text-white text-sm font-medium">{service.name}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">{service.url}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${m ? getStatusDot(m.uptimePercentage) : "bg-zinc-600"}`} />
                        <span className="text-sm text-zinc-300">
                          {m ? (m.uptimePercentage >= 95 ? "UP" : "DOWN") : "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${m ? getUptimeColor(m.uptimePercentage) : "text-zinc-500"}`}>
                        {m ? `${m.uptimePercentage}%` : "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-zinc-300">
                        {m ? `${m.avgResponseTimeMs}ms` : "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-zinc-300">
                        {m ? m.totalChecks : "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}