<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Search, Trash2, X, MapPin, Plus, Briefcase, ExternalLink, RefreshCw } from '@lucide/svelte';
  import api from '$lib/api';
  import { notifications } from '$lib/toast';
  import { STATUS_COLORS, formatDate } from '$lib/utils';

  interface Job {
      id: number;
      company: string;
      job_title: string;
      status: string;
      applied_at: string;
      location: string;
  }

  let jobs: Job[] = $state([]);
  let loading = $state(false);
  let isModalOpen = $state(false);
  let editingJob: Job | null = $state(null);
  
  let search = $state('');
  let statusFilter = $state('');

  let form = $state({
      company: '',
      job_title: '',
      role_type: 'Full Time',
      status: 'APPLIED',
      location: '',
      application_link: '',
      duration: 'Permanent',
      confidence: 'MEDIUM',
      source: 'LINKEDIN',
  });

  async function fetchJobs() {
      loading = true;
      try {
          const params: Record<string, string> = {};
          if (search.trim()) params.search = search.trim();
          if (statusFilter) params.status = statusFilter;
          const response = await api.get('jobs/', { params });
          jobs = response.data;
      } catch (error: any) {
          if (error.response?.status === 401) {
              goto('/login');
          }
      } finally {
          loading = false;
      }
  }

  onMount(() => {
      fetchJobs();
  });

  function openCreateModal() {
      editingJob = null;
      form = {
          company: '',
          job_title: '',
          role_type: 'Full Time',
          status: 'APPLIED',
          location: '',
          application_link: '',
          duration: 'Permanent',
          confidence: 'MEDIUM',
          source: 'LINKEDIN',
      };
      isModalOpen = true;
  }

  async function handleSubmit(e: Event) {
      e.preventDefault();
      try {
          if (editingJob) {
              await api.patch(`jobs/${editingJob.id}/`, form);
              notifications.show({ title: 'Updated', message: 'Job updated successfully', color: 'green' });
          } else {
              await api.post('jobs/', form);
              notifications.show({ title: 'Success', message: 'Job added', color: 'green' });
          }
          isModalOpen = false;
          fetchJobs();
      } catch (error) {
          notifications.show({ title: 'Error', message: 'Operation failed', color: 'red' });
      }
  }

  async function handleDelete(e: Event, id: number) {
      e.stopPropagation();
      if (confirm('Are you sure you want to delete this job?')) {
          try {
              await api.delete(`jobs/${id}/`);
              notifications.show({ title: 'Deleted', message: 'Job deleted successfully', color: 'gray' });
              fetchJobs();
          } catch (error) {
              notifications.show({ title: 'Error', message: 'Failed to delete', color: 'red' });
          }
      }
  }
</script>

<svelte:head>
  <title>Dashboard - CareerTracker</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-10">
  <!-- Top bar -->
  <div class="flex items-center justify-between mb-8 flex-wrap gap-4">
      <div>
          <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight">Applications Tracker</h2>
          <p class="text-slate-500 text-sm mt-1">Organize, monitor, and update your active job applications.</p>
      </div>
      <button 
          onclick={openCreateModal}
          class="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-sm font-bold rounded-xl shadow-md transition-all hover:-translate-y-0.5"
      >
          <Plus size={16} /> Add New Job
      </button>
  </div>

  <!-- Search & Filter Area (Glass Card) -->
  <div class="glass rounded-2xl shadow-sm border border-slate-200/60 p-5 mb-8 flex gap-4 flex-wrap items-center">
      <div class="relative flex-1 min-w-[280px]">
          <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Search class="h-4 w-4" />
          </div>
          <input
              type="text"
              placeholder="Search by company, role, location..."
              bind:value={search}
              oninput={() => fetchJobs()}
              class="block w-full rounded-xl border border-slate-200 bg-white/50 py-2 pl-10 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all sm:text-sm"
          />
      </div>
      <div class="w-48 shrink-0">
          <select
              bind:value={statusFilter}
              onchange={() => fetchJobs()}
              class="block w-full rounded-xl border border-slate-200 bg-white/50 py-2 px-3 text-slate-800 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all sm:text-sm"
          >
              <option value="">All Statuses</option>
              <option value="APPLIED">APPLIED</option>
              <option value="INTERVIEW">INTERVIEW</option>
              <option value="OFFER">OFFER</option>
              <option value="REJECTED">REJECTED</option>
              <option value="GHOSTED">GHOSTED</option>
              <option value="REPLIED">REPLIED</option>
          </select>
      </div>
      
      <button 
          onclick={fetchJobs}
          class="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"
          title="Refresh Data"
      >
          <RefreshCw size={16} />
      </button>
  </div>

  <!-- Job Table Container -->
  <div class="glass rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
      {#if loading}
          <div class="flex justify-center py-16">
              <div class="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
      {:else}
          <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-slate-100">
                  <thead class="bg-slate-50/50">
                      <tr>
                          <th scope="col" class="py-3.5 pl-6 pr-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Company</th>
                          <th scope="col" class="px-3 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Job Role</th>
                          <th scope="col" class="px-3 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                          <th scope="col" class="px-3 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Applied Date</th>
                          <th scope="col" class="relative py-3.5 pl-3 pr-6">
                              <span class="sr-only">Actions</span>
                          </th>
                      </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 bg-transparent">
                      {#each jobs as job}
                          <tr 
                              class="hover:bg-white/50 cursor-pointer transition-colors group"
                              onclick={() => goto(`/jobs/${job.id}`)}
                          >
                              <!-- Company -->
                              <td class="whitespace-nowrap py-4.5 pl-6 pr-3 text-sm font-bold text-slate-800">
                                  <div class="flex items-center gap-3">
                                      <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs uppercase shadow-sm border border-blue-100/50 shrink-0">
                                          {job.company[0] || '?'}
                                      </div>
                                      <span class="font-extrabold group-hover:text-blue-600 transition-colors">{job.company}</span>
                                  </div>
                              </td>
                              
                              <!-- Role -->
                              <td class="whitespace-nowrap px-3 py-4.5 text-sm text-slate-600 font-medium">
                                  <div class="flex flex-col">
                                      <span>{job.job_title}</span>
                                      {#if job.location}
                                          <span class="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                                              <MapPin size={9} /> {job.location}
                                          </span>
                                      {/if}
                                  </div>
                              </td>
                              
                              <!-- Status badge -->
                              <td class="whitespace-nowrap px-3 py-4.5 text-sm">
                                  <span class="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold border {STATUS_COLORS[job.status] || 'bg-gray-100 text-gray-800 border-gray-200'}">
                                      {job.status}
                                  </span>
                              </td>
                              
                              <!-- Applied at -->
                              <td class="whitespace-nowrap px-3 py-4.5 text-sm text-slate-500 font-medium">
                                  {formatDate(job.applied_at)}
                              </td>
                              
                              <!-- Actions -->
                              <td class="relative whitespace-nowrap py-4.5 pl-3 pr-6 text-right text-sm font-medium">
                                  <div class="flex items-center justify-end gap-2">
                                      <span class="text-blue-600 font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                                          View <ExternalLink size={10} />
                                      </span>
                                      <button 
                                          class="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                                          onclick={(e) => handleDelete(e, job.id)}
                                      >
                                          <Trash2 size={15} />
                                      </button>
                                  </div>
                              </td>
                          </tr>
                      {/each}
                      
                      {#if jobs.length === 0}
                          <tr>
                              <td colspan="5" class="py-16 text-center text-sm text-slate-500">
                                  <div class="flex flex-col items-center justify-center">
                                      <Briefcase size={32} class="text-slate-300 mb-2" />
                                      <p class="font-medium">No job applications tracked yet</p>
                                      <button onclick={openCreateModal} class="text-xs text-blue-600 font-bold hover:underline mt-1">Add your first job application</button>
                                  </div>
                              </td>
                          </tr>
                      {/if}
                  </tbody>
              </table>
          </div>
      {/if}
  </div>
</div>

<!-- Modal -->
{#if isModalOpen}
  <div class="relative z-50 animate-fade-in" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"></div>
      
      <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div class="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-slate-100 animate-slide-up">
                  <div class="bg-white px-6 pb-6 pt-6">
                      <div class="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                          <h3 class="text-lg font-extrabold text-slate-800" id="modal-title">
                              {editingJob ? 'Edit Job Application' : 'Track New Application'}
                          </h3>
                          <button onclick={() => isModalOpen = false} class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-colors">
                              <X size={18} />
                          </button>
                      </div>
                      
                      <form id="job-form" onsubmit={handleSubmit} class="space-y-4">
                          <div class="grid grid-cols-2 gap-4">
                              <div class="col-span-2 sm:col-span-1">
                                  <label for="company" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Company</label>
                                  <input required type="text" id="company" bind:value={form.company} class="block w-full rounded-xl border border-slate-200 py-2 px-3.5 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all sm:text-sm" placeholder="e.g. Google" />
                              </div>
                              
                              <div class="col-span-2 sm:col-span-1">
                                  <label for="job_title" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Job Title</label>
                                  <input required type="text" id="job_title" bind:value={form.job_title} class="block w-full rounded-xl border border-slate-200 py-2 px-3.5 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all sm:text-sm" placeholder="e.g. Software Engineer" />
                              </div>
                          </div>
                          
                          <div class="grid grid-cols-2 gap-4">
                              <div class="col-span-2 sm:col-span-1">
                                  <label for="location" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Location</label>
                                  <input type="text" id="location" bind:value={form.location} class="block w-full rounded-xl border border-slate-200 py-2 px-3.5 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all sm:text-sm" placeholder="e.g. Remote / New York" />
                              </div>
                              
                              <div class="col-span-2 sm:col-span-1">
                                  <label for="application_link" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Application URL</label>
                                  <input type="url" id="application_link" bind:value={form.application_link} class="block w-full rounded-xl border border-slate-200 py-2 px-3.5 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all sm:text-sm" placeholder="https://..." />
                              </div>
                          </div>
                          
                          <div class="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                              <div>
                                  <label for="status" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                                  <select required id="status" bind:value={form.status} class="block w-full rounded-xl border border-slate-200 py-2 px-3.5 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all sm:text-sm bg-white">
                                      {#each ['APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED'] as status}
                                          <option value={status}>{status}</option>
                                      {/each}
                                  </select>
                              </div>
                              <div>
                                  <label for="confidence" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Confidence</label>
                                  <select required id="confidence" bind:value={form.confidence} class="block w-full rounded-xl border border-slate-200 py-2 px-3.5 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all sm:text-sm bg-white">
                                      {#each ['HIGH', 'MEDIUM', 'LOW'] as c}
                                          <option value={c}>{c}</option>
                                      {/each}
                                  </select>
                              </div>
                              <div>
                                  <label for="duration" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Duration</label>
                                  <select required id="duration" bind:value={form.duration} class="block w-full rounded-xl border border-slate-200 py-2 px-3.5 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all sm:text-sm bg-white">
                                      {#each ['Permanent', 'Contract', 'Internship'] as d}
                                          <option value={d}>{d}</option>
                                      {/each}
                                  </select>
                              </div>
                              <div>
                                  <label for="source" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Source</label>
                                  <select required id="source" bind:value={form.source} class="block w-full rounded-xl border border-slate-200 py-2 px-3.5 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all sm:text-sm bg-white">
                                      {#each ['LINKEDIN', 'REFERRAL', 'JOB_PORTAL', 'COMPANY_WEBSITE', 'OTHER'] as s}
                                          <option value={s}>{s}</option>
                                      {/each}
                                  </select>
                              </div>
                          </div>
                      </form>
                  </div>
                  <div class="bg-slate-50 px-6 py-4 sm:flex sm:flex-row-reverse rounded-b-2xl border-t border-slate-100">
                      <button type="submit" form="job-form" class="inline-flex w-full justify-center rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-sm font-bold text-white shadow-md sm:ml-3 sm:w-auto transition-all">
                          {editingJob ? 'Update Application' : 'Save Track'}
                      </button>
                      <button type="button" onclick={() => isModalOpen = false} class="mt-3 inline-flex w-full justify-center rounded-xl bg-white border border-slate-200 hover:bg-slate-50 px-5 py-2.5 text-sm font-bold text-slate-600 shadow-sm sm:mt-0 sm:w-auto transition-all">
                          Cancel
                      </button>
                  </div>
              </div>
          </div>
      </div>
  </div>
{/if}

<style>
  /* Local animations */
  .animate-fade-in {
      animation: fadeIn 0.2s ease-out forwards;
  }
  .animate-slide-up {
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
  }
  @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
  }
</style>
