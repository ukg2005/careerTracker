<script lang="ts">
  import { onMount } from 'svelte';
  import { Briefcase, Trophy, Calendar, X, ArrowUpRight } from '@lucide/svelte';
  import api from '$lib/api';
  import { notifications } from '$lib/toast';
  import RingProgress from '$lib/components/RingProgress.svelte';
  
  interface Analytics {
      total_applications: number;
      status_breakdown: { status: string; count: number }[];
      analytics: {
          offer_rate: number;
          rejection_rate: number;
          interview_rate: number;
          total_offers: number;
          interview_count: number;
      };
  }

  const STATUS_COLORS: Record<string, string> = {
      APPLIED: '#3b82f6', // blue-500
      INTERVIEW: '#06b6d4', // cyan-500
      OFFER: '#10b981', // emerald-500
      REJECTED: '#ef4444', // red-500
      GHOSTED: '#6b7280', // gray-500
      REPLIED: '#f59e0b', // amber-500
  };

  let data: Analytics | null = $state(null);
  let loading = $state(true);

  onMount(async () => {
      try {
          const response = await api.get('jobs/stats/');
          data = response.data;
      } catch (error) {
          notifications.show({ title: 'Error', message: 'Failed to load analytics', color: 'red' });
      } finally {
          loading = false;
      }
  });

  // Direct derived array for Svelte 5
  let ringData = $derived(
      data ? data.status_breakdown.map(s => ({
          value: data!.total_applications > 0 ? Math.round((s.count / data!.total_applications) * 100) : 0,
          color: STATUS_COLORS[s.status] || '#9ca3af',
          tooltip: `${s.status}: ${s.count}`,
      })) : []
  );
</script>

<svelte:head>
  <title>Analytics - CareerTracker</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-10">
  <div class="mb-8">
      <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight">Analytics Dashboard</h2>
      <p class="text-slate-500 text-sm mt-1">Deep dive into your application funnel performance.</p>
  </div>

  {#if loading}
      <div class="flex justify-center items-center h-[40vh]">
          <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
  {:else if data}
      <!-- Premium Stat Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 mb-8">
          <!-- Total Applications -->
          <div class="glass rounded-xl shadow-sm border border-slate-200/60 p-6 hover:-translate-y-1 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div class="absolute -right-3 -bottom-3 text-blue-500/10 group-hover:scale-110 transition-transform duration-300">
                  <Briefcase size={96} />
              </div>
              <div class="flex items-center justify-between relative z-10">
                  <div>
                      <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Apps</p>
                      <p class="text-4xl font-extrabold mt-2 text-slate-900 leading-none">{data.total_applications}</p>
                  </div>
              </div>
          </div>
          
          <!-- Interviews -->
          <div class="glass rounded-xl shadow-sm border border-slate-200/60 p-6 hover:-translate-y-1 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div class="absolute -right-3 -bottom-3 text-cyan-500/10 group-hover:scale-110 transition-transform duration-300">
                  <Calendar size={96} />
              </div>
              <div class="flex items-center justify-between relative z-10">
                  <div>
                      <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Interviews</p>
                      <p class="text-4xl font-extrabold mt-2 text-slate-900 leading-none">{data.analytics.interview_count}</p>
                  </div>
              </div>
          </div>
          
          <!-- Offers -->
          <div class="glass rounded-xl shadow-sm border border-slate-200/60 p-6 hover:-translate-y-1 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div class="absolute -right-3 -bottom-3 text-emerald-500/10 group-hover:scale-110 transition-transform duration-300">
                  <Trophy size={96} />
              </div>
              <div class="flex items-center justify-between relative z-10">
                  <div>
                      <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Offers Received</p>
                      <p class="text-4xl font-extrabold mt-2 text-emerald-600 leading-none">{data.analytics.total_offers}</p>
                  </div>
              </div>
          </div>
          
          <!-- Rejection Rate -->
          <div class="glass rounded-xl shadow-sm border border-slate-200/60 p-6 hover:-translate-y-1 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div class="absolute -right-3 -bottom-3 text-rose-500/10 group-hover:scale-110 transition-transform duration-300">
                  <X size={96} />
              </div>
              <div class="flex items-center justify-between relative z-10">
                  <div>
                      <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Rejection Rate</p>
                      <p class="text-4xl font-extrabold mt-2 text-rose-600 leading-none">{data.analytics.rejection_rate}%</p>
                  </div>
              </div>
          </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
          <!-- Ring Chart -->
          <div class="md:col-span-5 glass rounded-xl shadow-sm border border-slate-200/60 p-6 flex flex-col justify-between">
              <div>
                  <h3 class="text-lg font-bold text-slate-800 mb-1">Application Breakdown</h3>
                  <p class="text-xs text-slate-400 mb-6">Visual percentage breakdown by current application status.</p>
              </div>
              
              {#if data.total_applications === 0}
                  <div class="text-center text-slate-400 py-12 flex-1 flex flex-col items-center justify-center">
                      <Briefcase size={36} class="text-slate-300 mb-2" />
                      <p class="text-sm">No applications added yet</p>
                  </div>
              {:else}
                  <div class="flex flex-col items-center justify-center flex-1 py-4">
                      <RingProgress 
                          size={180} 
                          thickness={20} 
                          sections={ringData} 
                      >
                          {#snippet label()}
                              <div class="flex flex-col items-center justify-center">
                                  <span class="text-2xl font-black text-slate-800">{data.total_applications}</span>
                                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Applications</span>
                              </div>
                          {/snippet}
                      </RingProgress>
                      
                      <div class="grid grid-cols-2 gap-x-4 gap-y-2 mt-8 w-full border-t border-slate-100 pt-5">
                          {#each data.status_breakdown as s}
                              <div class="flex items-center gap-2">
                                  <div class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: {STATUS_COLORS[s.status] || '#9ca3af'}"></div>
                                  <span class="text-xs font-semibold text-slate-600 truncate">{s.status}</span>
                                  <span class="text-xs font-bold text-slate-800 ml-auto">{s.count}</span>
                              </div>
                          {/each}
                      </div>
                  </div>
              {/if}
          </div>

          <!-- Conversion Rates -->
          <div class="md:col-span-7 glass rounded-xl shadow-sm border border-slate-200/60 p-6">
              <h3 class="text-lg font-bold text-slate-800 mb-1">Funnel Conversion Rates</h3>
              <p class="text-xs text-slate-400 mb-8">Performance metrics detailing progression success rates.</p>
              
              <div class="space-y-6">
                  <!-- Interview Rate -->
                  <div class="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                      <div class="flex justify-between items-center mb-2">
                          <div class="flex items-center gap-2">
                              <div class="w-2 h-2 rounded-full bg-cyan-500"></div>
                              <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">Interview Rate</span>
                          </div>
                          <span class="text-sm font-extrabold text-slate-900">{data.analytics.interview_rate}%</span>
                      </div>
                      <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div class="bg-cyan-500 h-full rounded-full transition-all duration-700 ease-out" style="width: {data.analytics.interview_rate}%"></div>
                      </div>
                      <p class="text-[10px] text-slate-400 mt-2">Percentage of applications that advanced to the interview phase.</p>
                  </div>
                  
                  <!-- Offer Rate -->
                  <div class="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                      <div class="flex justify-between items-center mb-2">
                          <div class="flex items-center gap-2">
                              <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
                              <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">Offer Rate</span>
                          </div>
                          <span class="text-sm font-extrabold text-slate-900">{data.analytics.offer_rate}%</span>
                      </div>
                      <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div class="bg-emerald-500 h-full rounded-full transition-all duration-700 ease-out" style="width: {data.analytics.offer_rate}%"></div>
                      </div>
                      <p class="text-[10px] text-slate-400 mt-2">Percentage of total applications resulting in an employment offer.</p>
                  </div>
                  
                  <!-- Rejection Rate -->
                  <div class="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                      <div class="flex justify-between items-center mb-2">
                          <div class="flex items-center gap-2">
                              <div class="w-2 h-2 rounded-full bg-rose-500"></div>
                              <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">Rejection Rate</span>
                          </div>
                          <span class="text-sm font-extrabold text-slate-900">{data.analytics.rejection_rate}%</span>
                      </div>
                      <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div class="bg-rose-500 h-full rounded-full transition-all duration-700 ease-out" style="width: {data.analytics.rejection_rate}%"></div>
                      </div>
                      <p class="text-[10px] text-slate-400 mt-2">Percentage of applications that resulted in rejection.</p>
                  </div>
              </div>
          </div>
      </div>
  {/if}
</div>
