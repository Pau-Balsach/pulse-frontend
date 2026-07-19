'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface ServiceStatus {
  id: string;
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

interface Metrics {
  serviceId: string;
  uptimePercentage: number;
  avgResponseTimeMs: number;
}

const statusConfig = {
  OPERATIONAL: {
    label: 'Operational',
    color: 'bg-emerald-500',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
  },
  DEGRADED: {
    label: 'Degraded',
    color: 'bg-yellow-500',
    text: 'text-yellow-400',
    border: 'border-yellow-500/20',
  },
  OUTAGE: {
    label: 'Outage',
    color: 'bg-red-500',
    text: 'text-red-400',
    border: 'border-red-500/20',
  },
};

const overallBanner = {
  OPERATIONAL: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    icon: '✓',
    message: 'All systems operational',
  },
  DEGRADED: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    icon: '⚠',
    message: 'Partial degradation detected',
  },
  OUTAGE: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    icon: '✕',
    message: 'Service outage detected',
  },
};

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function StatusPage() {
  const { projectId } = useParams();

  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [loadedServices, setLoadedServices] = useState(0);
  const [totalServices, setTotalServices] = useState(0);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadStatusAndMetrics = async () => {
    try {
      setError(false);
      setLoadedServices(0);

      // 1. Cargar información pública básica
      const statusRes = await fetch(
        `${BASE_URL}/public/status/${projectId}`,
        { cache: 'no-store' }
      );

      if (!statusRes.ok) throw new Error('Failed to load status');

      const statusJson: StatusResponse = await statusRes.json();

      setData(statusJson);
      setTotalServices(statusJson.services.length);
      setLoading(false);

      // 2. Cargar métricas progresivamente
      if (statusJson.services.length > 0) {
        setLoadingMetrics(true);

        await Promise.all(
          statusJson.services.map(async (service) => {
            try {
              const metricsRes = await fetch(
                `${BASE_URL}/api/services/${service.id}/metrics`,
                { cache: 'no-store' }
              );

              if (metricsRes.ok) {
                const metrics: Metrics =
                  await metricsRes.json();

                // Actualizar solo el servicio correspondiente
                setData((prev) => {
                  if (!prev) return prev;

                  return {
                    ...prev,
                    services: prev.services.map((s) =>
                      s.id === service.id
                        ? {
                            ...s,
                            uptimePercentage: metrics.uptimePercentage,
                            avgResponseTimeMs: metrics.avgResponseTimeMs,
                          }
                        : s
                    ),
                  };
                });
              }
            } catch (e) {
              console.error(
                `Failed to load metrics for ${service.name}`,
                e
              );
            } finally {
              setLoadedServices((prev) => prev + 1);
            }
          })
        );

        setLoadingMetrics(false);
      }

      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
      setError(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatusAndMetrics();

    const interval = setInterval(loadStatusAndMetrics, 60000);

    return () => clearInterval(interval);
  }, [projectId]);

  if (loading) {
    return (
      <div className='min-h-screen bg-[#0a0a0a] flex items-center justify-center'>
        <div className='flex flex-col items-center gap-3'>
          <div className='w-8 h-8 border-2 border-white/10 border-t-white/60 rounded-full animate-spin' />
          <p className='text-white/40 text-sm'>Loading status page...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className='min-h-screen bg-[#0a0a0a] flex items-center justify-center'>
        <p className='text-white/40 text-sm'>
          Could not load status page.
        </p>
      </div>
    );
  }

  const banner = overallBanner[data.overallStatus];
  const progress =
    totalServices === 0
      ? 0
      : Math.round((loadedServices / totalServices) * 100);

  return (
    <div className='min-h-screen bg-[#0a0a0a] text-white'>
      <div className='max-w-2xl mx-auto px-4 py-16'>
        {/* Header */}
        <div className='mb-10'>
          <h1 className='text-2xl font-semibold tracking-tight'>
            {data.projectName}
          </h1>
          <p className='text-white/40 text-sm mt-1'>Status Page</p>
        </div>

        {/* Overall banner */}
        <div
          className={`rounded-xl border px-5 py-4 mb-6 flex items-center gap-3 ${banner.bg} ${banner.border}`}
        >
          <span className={`text-lg font-bold ${banner.text}`}>
            {banner.icon}
          </span>
          <span className={`font-medium ${banner.text}`}>
            {banner.message}
          </span>
        </div>

        {/* Progress bar */}
        {loadingMetrics && (
          <div className='mb-8 rounded-xl border border-white/8 bg-white/[0.03] p-4'>
            <div className='flex items-center mb-2'>
            <div className='w-4 h-4 mr-2 border-2 border-white/20 border-t-emerald-400 rounded-full animate-spin' />

            <span className='text-sm font-medium'>
              Loading service metrics ({loadedServices}/{totalServices})
            </span>

            <div className='flex-1' />

            <span className='text-sm text-white/50'>
              {progress}%
            </span>
          </div>

            <div className='w-full h-2 bg-white/10 rounded-full overflow-hidden'>
              <div
                className='h-full bg-emerald-500 transition-all duration-300 ease-out'
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className='text-xs text-white/40 mt-2'>
              Calculating uptime and latency for each service.
            </p>
          </div>
        )}

        {/* Services list */}
        <div className='flex flex-col gap-3 mb-10'>
          {data.services.map((service) => {
            const cfg = statusConfig[service.status];

            const metricsLoaded =
              service.uptimePercentage >= 0 &&
              service.avgResponseTimeMs >= 0;

            return (
              <div
                key={service.id}
                className='rounded-xl border border-white/8 bg-white/[0.03] px-5 py-4 flex items-center justify-between'
              >
                <div className='flex flex-col gap-0.5 min-w-0'>
                  <span className='font-medium text-sm'>{service.name}</span>
                  <span className='text-white/30 text-xs truncate max-w-xs'>
                    {service.url}
                  </span>
                </div>

                <div className='flex items-center gap-4 ml-4 shrink-0'>
                  <div className='text-right hidden sm:block min-w-[140px]'>
                    {metricsLoaded ? (
                      <>
                        <p className='text-white/60 text-xs'>
                          {service.uptimePercentage.toFixed(2)}% uptime
                        </p>
                        <p className='text-white/30 text-xs'>
                          {service.avgResponseTimeMs.toFixed(0)} ms avg
                        </p>
                      </>
                    ) : (
                    <div className='flex items-center justify-end gap-2 text-white/40 text-xs'>
                      <div className='w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin' />
                      <span>Loading...</span>
                    </div>
                    )}
                  </div>

                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border ${cfg.border}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${cfg.color}`}
                    />
                    <span className={`text-xs font-medium ${cfg.text}`}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className='flex items-center justify-between text-white/25 text-xs border-t border-white/8 pt-6'>
          <span>
            Powered by{' '}
            <span className='text-white/40 font-medium'>Pulse</span>
          </span>

          {lastUpdated && (
            <span>
              Updated at {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}