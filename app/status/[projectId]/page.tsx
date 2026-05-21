'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface ServiceStatus {
  name: string;
  url: string;
  status: 'OPERATIONAL' | 'DEGRADED' | 'OUTAGE';
  uptimePercentage: number;
  avgResponseTimeMs: number;
}

interface StatusResponse {
  projectName: string;
  overallStatus: 'OPERATIONAL' | 'DEGRADED' | 'OUTAGE';
  services: ServiceStatus[];
}

const statusConfig = {
  OPERATIONAL: { label: 'Operational', color: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  DEGRADED:    { label: 'Degraded',    color: 'bg-yellow-500', text: 'text-yellow-400',  border: 'border-yellow-500/20'  },
  OUTAGE:      { label: 'Outage',      color: 'bg-red-500',    text: 'text-red-400',     border: 'border-red-500/20'     },
};

const overallBanner = {
  OPERATIONAL: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: '✓', message: 'All systems operational' },
  DEGRADED:    { bg: 'bg-yellow-500/10',  border: 'border-yellow-500/30',  text: 'text-yellow-400',  icon: '⚠', message: 'Partial degradation detected' },
  OUTAGE:      { bg: 'bg-red-500/10',     border: 'border-red-500/30',     text: 'text-red-400',     icon: '✕', message: 'Service outage detected' },
};

export default function StatusPage() {
  const { projectId } = useParams();
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`http://localhost:8080/public/status/${projectId}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, [projectId]);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white/60 rounded-full animate-spin" />
        <p className="text-white/40 text-sm">Loading status...</p>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <p className="text-white/40 text-sm">Could not load status page.</p>
    </div>
  );

  const banner = overallBanner[data.overallStatus];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-2xl mx-auto px-4 py-16">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-2xl font-semibold tracking-tight">{data.projectName}</h1>
          <p className="text-white/40 text-sm mt-1">Status Page</p>
        </div>

        {/* Overall banner */}
        <div className={`rounded-xl border px-5 py-4 mb-8 flex items-center gap-3 ${banner.bg} ${banner.border}`}>
          <span className={`text-lg font-bold ${banner.text}`}>{banner.icon}</span>
          <span className={`font-medium ${banner.text}`}>{banner.message}</span>
        </div>

        {/* Services list */}
        <div className="flex flex-col gap-3 mb-10">
          {data.services.map((service) => {
            const cfg = statusConfig[service.status];
            return (
              <div
                key={service.name}
                className={`rounded-xl border border-white/8 bg-white/[0.03] px-5 py-4 flex items-center justify-between`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-sm">{service.name}</span>
                  <span className="text-white/30 text-xs truncate max-w-xs">{service.url}</span>
                </div>
                <div className="flex items-center gap-4 ml-4 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-white/60 text-xs">{service.uptimePercentage.toFixed(1)}% uptime</p>
                    <p className="text-white/30 text-xs">{service.avgResponseTimeMs.toFixed(0)} ms avg</p>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border ${cfg.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.color}`} />
                    <span className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-white/25 text-xs border-t border-white/8 pt-6">
          <span>Powered by <span className="text-white/40 font-medium">Pulse</span></span>
          {lastUpdated && (
            <span>Updated at {lastUpdated.toLocaleTimeString()}</span>
          )}
        </div>
      </div>
    </div>
  );
}