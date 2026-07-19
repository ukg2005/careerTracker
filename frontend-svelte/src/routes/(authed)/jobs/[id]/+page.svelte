<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { 
      ArrowLeft, ExternalLink, MapPin, IndianRupee, 
      Calendar, User, Link, Briefcase, Clock, Save, FileText, CheckSquare
  } from '@lucide/svelte';
  import api from '$lib/api';
  import { notifications } from '$lib/toast';
  import { STATUS_COLORS, CONFIDENCE_COLORS } from '$lib/utils';
  
  import DocumentSection from '$lib/components/DocumentSection.svelte';
  import InterviewSection from '$lib/components/InterviewSection.svelte';

  let id = page.params.id;
  
  let loading = $state(true);
  let job: any = $state(null);

  let form = $state({
      company: '', job_title: '', status: '', location: '',
      application_link: '', notes: '', confidence: '',
      salary_est: '', source: '', role_type: '', duration: '', contacts: '',
  });

  onMount(async () => {
      try {
          const response = await api.get(`jobs/${id}/`);
          job = response.data;
          
          form = {
              company: job.company || '',
              job_title: job.job_title || '',
              status: job.status || '',
              location: job.location || '',
              application_link: job.application_link || '',
              notes: job.notes || '',
              contacts: job.contacts || '',
              confidence: job.confidence || '',
              salary_est: job.salary_est != null ? String(job.salary_est) : '',
              source: job.source || '',
              role_type: job.role_type || '',
              duration: job.duration || '',
          };
      } catch (error) {
          notifications.show({ title: 'Error', message: 'Job not found', color: 'red' });
          goto('/dashboard');
      } finally {
          loading = false;
      }
  });

  async function handleUpdate(e: Event) {
      e.preventDefault();
      try {
          const payload = {
              ...form,
              salary_est: form.salary_est === '' ? null : Number(form.salary_est),
          };
          await api.patch(`jobs/${id}/`, payload);
          notifications.show({ title: 'Saved', message: 'Job details updated', color: 'green' });
          
          job = { ...job, ...payload };
      } catch (error: any) {
          notifications.show({ title: 'Error', message: 'Failed to update', color: 'red' });
      }
  }

  let companyInitial = $derived((form.company?.[0]?.toUpperCase()) || '?');
</script>

<svelte:head>
  <title>{form.company ? `${form.company} - CareerTracker` : 'Job Details'}</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-8">
  {#if loading}
      <div class="flex justify-center items-center h-[60vh]">
          <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
  {:else}
      <button 
          onclick={() => goto('/dashboard')}
          class="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-bold mb-6 transition-colors text-xs px-3 py-2 rounded-lg hover:bg-slate-100/50 -ml-2"
      >
          <ArrowLeft size={14} /> Back to Dashboard
      </button>

      <form onsubmit={handleUpdate}>
          <!-- Hero Header (Glass Card) -->
          <div class="glass rounded-2xl shadow-sm border border-slate-200/60 mb-6 p-6 relative overflow-hidden">
              <!-- Left border accent -->
              <div class="absolute left-0 top-0 bottom-0 w-1.5" style="background-color: {STATUS_COLORS[form.status]?.includes('#') ? STATUS_COLORS[form.status] : '#3b82f6'}"></div>
              
              <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-5 pl-2">
                  <div class="flex items-start gap-5">
                      <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 text-2xl font-extrabold shadow-inner border border-blue-100/50">
                          {companyInitial}
                      </div>
                      <div>
                          <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{form.role_type || 'Job Application'}</p>
                          <h1 class="text-3xl font-black text-slate-900 leading-none mb-1.5">{form.company || '—'}</h1>
                          <p class="text-base text-slate-500 font-bold">{form.job_title || '—'}</p>
                          
                          <div class="flex flex-wrap gap-2 mt-3.5">
                              <span class="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold border {STATUS_COLORS[form.status] || 'bg-gray-100 text-gray-800 border-gray-200'}">
                                  {form.status || 'No Status'}
                              </span>
                              {#if form.confidence}
                                  <span class="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold border {CONFIDENCE_COLORS[form.confidence] || 'border-gray-200 text-gray-600'} bg-white">
                                      {form.confidence} Confidence
                                  </span>
                              {/if}
                          </div>
                      </div>
                  </div>

                  <div class="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
                      <button 
                          type="submit" 
                          class="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-xs font-bold rounded-xl shadow-md transition-all"
                      >
                          <Save size={14} /> Save Details
                      </button>
                      {#if form.application_link}
                          <a 
                              href={form.application_link} 
                              target="_blank" 
                              rel="noreferrer"
                              class="flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-5 py-2 text-xs font-bold rounded-xl shadow-sm transition-all"
                          >
                              <ExternalLink size={13} /> View Posting
                          </a>
                      {/if}
                  </div>
              </div>

              <!-- Quick stats row -->
              <hr class="my-6 border-slate-100" />
              
              <div class="flex flex-wrap gap-x-8 gap-y-4 px-2">
                  {#if form.location}
                      <div class="flex items-center gap-2 text-slate-500">
                          <MapPin size={15} class="text-slate-400" />
                          <span class="text-xs font-semibold">{form.location}</span>
                      </div>
                  {/if}
                  {#if form.salary_est}
                      <div class="flex items-center gap-2 text-slate-500">
                          <IndianRupee size={15} class="text-slate-400" />
                          <span class="text-xs font-semibold">₹{Number(form.salary_est).toLocaleString()}</span>
                      </div>
                  {/if}
                  {#if form.duration}
                      <div class="flex items-center gap-2 text-slate-500">
                          <Clock size={15} class="text-slate-400" />
                          <span class="text-xs font-semibold">{form.duration}</span>
                      </div>
                  {/if}
                  {#if job?.applied_at}
                      <div class="flex items-center gap-2 text-slate-500">
                          <Calendar size={15} class="text-slate-400" />
                          <span class="text-xs font-semibold">Applied {new Date(job.applied_at).toLocaleDateString('en-GB')}</span>
                      </div>
                  {/if}
              </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <!-- LEFT COLUMN -->
              <div class="md:col-span-2 space-y-6">
                  
                  <!-- Details -->
                  <div class="glass rounded-2xl shadow-sm border border-slate-200/60 p-6">
                      <h3 class="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 pb-3 border-b border-slate-100">
                          <Briefcase size={18} class="text-blue-500" /> Job Details
                      </h3>
                      
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                          <div>
                              <label for="company" class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Company</label>
                              <input type="text" id="company" bind:value={form.company} class="block w-full rounded-xl border border-slate-200 py-2 px-3 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all sm:text-sm" />
                          </div>
                          
                          <div>
                              <label for="job_title" class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Job Title</label>
                              <input type="text" id="job_title" bind:value={form.job_title} class="block w-full rounded-xl border border-slate-200 py-2 px-3 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all sm:text-sm" />
                          </div>
                          
                          <div>
                              <label for="location" class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Location</label>
                              <input type="text" id="location" bind:value={form.location} class="block w-full rounded-xl border border-slate-200 py-2 px-3 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all sm:text-sm" />
                          </div>
                          
                          <div>
                              <label for="salary_est" class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Estimated Salary (₹)</label>
                              <input type="number" id="salary_est" bind:value={form.salary_est} class="block w-full rounded-xl border border-slate-200 py-2 px-3 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all sm:text-sm" />
                          </div>
                          
                          <div>
                              <label for="contacts" class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Point of Contact</label>
                              <input type="text" id="contacts" bind:value={form.contacts} placeholder="HR Name, Email..." class="block w-full rounded-xl border border-slate-200 py-2 px-3 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all sm:text-sm" />
                          </div>
                          
                          <div>
                              <label for="application_link" class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Job Posting URL</label>
                              <input type="url" id="application_link" bind:value={form.application_link} class="block w-full rounded-xl border border-slate-200 py-2 px-3 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all sm:text-sm" />
                          </div>
                      </div>
                  </div>

                  <!-- Notes -->
                  <div class="glass rounded-2xl shadow-sm border border-slate-200/60 p-6">
                      <h3 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 pb-3 border-b border-slate-100">
                          <CheckSquare size={18} class="text-indigo-500" /> Application Notes
                      </h3>
                      <textarea 
                          id="notes" 
                          bind:value={form.notes} 
                          rows="6" 
                          placeholder="Write down application notes, research, interview preparations..."
                          class="block w-full rounded-xl border border-slate-200 py-2 px-3 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all sm:text-sm bg-white/50"
                      ></textarea>
                  </div>

                  <!-- Documents Section -->
                  <DocumentSection jobId={id as string} />
              </div>

              <!-- RIGHT COLUMN -->
              <div class="space-y-6">
                  <!-- Classifications (Glass Card) -->
                  <div class="glass rounded-2xl shadow-sm border border-slate-200/60 p-6">
                      <h3 class="text-lg font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100">Funnel Placement</h3>
                      
                      <div class="space-y-4">
                          <div>
                              <label for="status" class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Application Status</label>
                              <select id="status" bind:value={form.status} class="block w-full rounded-xl border border-slate-200 py-2 px-3 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all sm:text-sm bg-white">
                                  {#each ['APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED', 'GHOSTED', 'REPLIED'] as status}
                                      <option value={status}>{status}</option>
                                  {/each}
                              </select>
                          </div>
                          
                          <div>
                              <label for="confidence" class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Confidence Level</label>
                              <select id="confidence" bind:value={form.confidence} class="block w-full rounded-xl border border-slate-200 py-2 px-3 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all sm:text-sm bg-white">
                                  {#each ['HIGH', 'MEDIUM', 'LOW'] as conf}
                                      <option value={conf}>{conf}</option>
                                  {/each}
                              </select>
                          </div>
                          
                          <div>
                              <label for="source" class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Source Channel</label>
                              <select id="source" bind:value={form.source} class="block w-full rounded-xl border border-slate-200 py-2 px-3 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all sm:text-sm bg-white">
                                  {#each ['LINKEDIN', 'REFERRAL', 'JOB_PORTAL', 'COMPANY_WEBSITE', 'COLLEGE', 'NETWORKING', 'RECRUITER', 'OTHER'] as src}
                                      <option value={src}>{src}</option>
                                  {/each}
                              </select>
                          </div>
                          
                          <div>
                              <label for="role_type" class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Employment Type</label>
                              <select id="role_type" bind:value={form.role_type} class="block w-full rounded-xl border border-slate-200 py-2 px-3 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all sm:text-sm bg-white">
                                  {#each ['Full Time', 'Part Time', 'Internship', 'Contract'] as role}
                                      <option value={role}>{role}</option>
                                  {/each}
                              </select>
                          </div>
                          
                          <div>
                              <label for="duration" class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Duration</label>
                              <input 
                                  type="text" 
                                  id="duration" 
                                  list="durations"
                                  bind:value={form.duration} 
                                  placeholder="e.g. Permanent, 6 Months"
                                  class="block w-full rounded-xl border border-slate-200 py-2 px-3 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all sm:text-sm"
                              />
                              <datalist id="durations">
                                  <option value="2 Months"></option>
                                  <option value="3 Months"></option>
                                  <option value="6 Months"></option>
                                  <option value="1 Year"></option>
                                  <option value="Permanent"></option>
                              </datalist>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </form>

      <!-- Outside the form to prevent nesting form issues -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div class="md:col-span-2">
              <!-- Timeline Section -->
              <InterviewSection jobId={id as string} />
          </div>
      </div>
  {/if}
</div>
