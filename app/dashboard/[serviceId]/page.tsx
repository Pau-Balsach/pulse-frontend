"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "../../lib/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Check {
  id: string;
  status: string;
  responseTimeMs: number;
  httpStatus: number;
  checkedAt: string;
  errorMessage: string | null;
}

interface Metrics {
  serviceName: string;
  uptimePercentage: number;
  avgResponseTimeMs: number;
  p95ResponseTimeMs: number;
  totalChecks: number;
  totalDown: number;
  openIncidents: number;
}

interface Incident {
  id: string;
  status: string;
  reason: string;
  startedAt: string;
  resolvedAt: string | null;
  durationSeconds: number | null;
}

export default function ServiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const serviceId = params.serviceId as string;

  const [checks, setChecks] = useState<Check[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    loadData();
  }, [serviceId]);

  const loadData = async () => {
    try {
      const projectsRes = await api.get("/api/projects");
      const projectId = projectsRes.data[0].id;

      const [checksRes, metricsRes, incidentsRes] = await Promise.all([
        api.get(`/api/projects/${projectId}/services/${serviceId}/checks`),
        api.get(`/api/services/${serviceId}/metrics`),
        api.get(`/api/services/${serviceId}/incidents`),
      ]);

      setChecks(checksRes.data);
      setMetrics(metricsRes.data);
      setIncidents(incidentsRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = checks.map((check) => ({
    time: new Date(check.checkedAt).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    latency: check.responseTimeMs,
    status: check.status,
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-zinc-400 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-zinc-400 hover:text-white text-sm transition"
        >
          ← Back
        </button>
        <h1 className="text-white font-bold text-lg tracking-tight">
          ⚡ {metrics?.serviceName}
        </h1>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">

        {/* Metrics cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-zinc-400 text-xs mb-1">Uptime</p>
            <p className={`text-2xl font-bold ${
              (metrics?.uptimePercentage ?? 0) >= 99 ? "text-green-400" :
              (metrics?.uptimePercentage ?? 0) >= 95 ? "text-yellow-400" : "text-red-400"
            }`}>
              {metrics?.uptimePercentage}%
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-zinc-400 text-xs mb-1">Avg Latency</p>
            <p className="text-2xl font-bold text-white">{metrics?.avgResponseTimeMs}ms</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-zinc-400 text-xs mb-1">p95 Latency</p>
            <p className="text-2xl font-bold text-white">{metrics?.p95ResponseTimeMs}ms</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-zinc-400 text-xs mb-1">Total Checks</p>
            <p className="text-2xl font-bold text-white">{metrics?.totalChecks}</p>
          </div>
        </div>

        {/* Latency chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
          <h3 className="text-white font-semibold mb-6">Response Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="time"
                tick={{ fill: "#71717a", fontSize: 11 }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#71717a", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                unit="ms"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                formatter={(value) => [`${value}ms`, "Latency"]}
              />
              <Line
                type="monotone"
                dataKey="latency"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#22c55e" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status heatmap */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
          <h3 className="text-white font-semibold mb-4">Check History</h3>
          <div className="flex flex-wrap gap-1">
            {checks.map((check) => (
              <div
                key={check.id}
                title={`${new Date(check.checkedAt).toLocaleString()} — ${check.status} ${check.responseTimeMs}ms`}
                className={`w-4 h-4 rounded-sm ${
                  check.status === "UP" ? "bg-green-500" : "bg-red-500"
                }`}
              />
            ))}
          </div>
          <p className="text-zinc-500 text-xs mt-3">
            Each block represents one check. Green = UP, Red = DOWN.
          </p>
        </div>

        {/* Incidents */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800">
            <h3 className="text-white font-semibold">Incidents</h3>
          </div>
          {incidents.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-zinc-500 text-sm">No incidents recorded 🎉</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left text-zinc-400 text-xs px-6 py-3">Status</th>
                  <th className="text-left text-zinc-400 text-xs px-6 py-3">Started</th>
                  <th className="text-left text-zinc-400 text-xs px-6 py-3">Resolved</th>
                  <th className="text-left text-zinc-400 text-xs px-6 py-3">Duration</th>
                  <th className="text-left text-zinc-400 text-xs px-6 py-3">Reason</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((incident) => (
                  <tr key={incident.id} className="border-b border-zinc-800 last:border-0">
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        incident.status === "OPEN"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-green-500/20 text-green-400"
                      }`}>
                        {incident.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-300 text-sm">
                      {new Date(incident.startedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-zinc-300 text-sm">
                      {incident.resolvedAt
                        ? new Date(incident.resolvedAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-zinc-300 text-sm">
                      {incident.durationSeconds
                        ? `${Math.round(incident.durationSeconds / 60)}m`
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-sm">
                      {incident.reason || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </main>
    </div>
  );
}