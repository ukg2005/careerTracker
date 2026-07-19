<script lang="ts">
  import { onMount } from 'svelte';
  import { Calendar, Check, Trash2, Video, Link, User, X, Plus } from '@lucide/svelte';
  import api from '$lib/api';
  import { notifications } from '$lib/toast';
  import { TYPE_COLORS, formatDateTime } from '$lib/utils';

  let { jobId }: { jobId: string } = $props();

  interface Interview {
      id: number;
      interview_at: string;
      meeting_link: string;
      interview_with: string;
      type: string;
      feedback: string;
      job: number;
  }

  const INTERVIEW_TYPES = [
      { value: 'HR', label: 'HR Screen' },
      { value: 'TECHNICAL', label: 'Technical' },
      { value: 'BEHAVIOURAL', label: 'Behavioural' },
      { value: 'MANAGERIAL', label: 'Managerial' },
      { value: 'GD', label: 'Group Discussion' },
      { value: 'OTHERS', label: 'Others' },
  ];

  let interviews: Interview[] = $state([]);
  let isModalOpen = $state(false);

  let form = $state({
      type: 'HR',
      interview_at: '',
      meeting_link: '',
      interview_with: '',
      feedback: '',
  });

  async function fetchInterviews() {
      try {
          const response = await api.get('jobs/interviews/');
          interviews = response.data.filter((i: any) => i.job === Number(jobId));
      } catch (error) {
          console.error('Failed to load interviews', error);
      }
  }

  onMount(() => {
      fetchInterviews();
  });

  async function handleSubmit(e: Event) {
      e.preventDefault();
      try {
          await api.post('jobs/interviews/', {
              job: Number(jobId),
              interview_at: new Date(form.interview_at).toISOString(),
              meeting_link: form.meeting_link || 'https://placeholder.com',
              interview_with: form.interview_with || 'TBD',
              type: form.type,
              feedback: form.feedback || '',
          });
          notifications.show({ title: 'Scheduled', message: 'Interview added', color: 'green' });
          isModalOpen = false;
          form = {
              type: 'HR',
              interview_at: '',
              meeting_link: '',
              interview_with: '',
              feedback: '',
          };
          fetchInterviews();
      } catch (error: any) {
          notifications.show({ title: 'Error', message: 'Failed to schedule', color: 'red' });
      }
  }

  async function handleDelete(id: number) {
      if (!confirm('Delete this interview?')) return;
      try {
          await api.delete(`jobs/interviews/${id}/`);
          interviews = interviews.filter(i => i.id !== id);
          notifications.show({ title: 'Deleted', message: 'Interview removed', color: 'gray' });
      } catch (error) {
          notifications.show({ title: 'Error', message: 'Failed to delete', color: 'red' });
      }
  }
</script>

<div class="glass rounded-2xl border border-slate-200/60 p-6 mt-6 shadow-sm">
  <div class="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
      <h4 class="text-base font-extrabold text-slate-800 flex items-center gap-2">
          <Calendar size={18} class="text-blue-500" /> Interview Timeline
      </h4>
      <button 
          class="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100/80 px-3.5 py-1.5 rounded-xl border border-blue-100/30 transition-all hover:scale-[1.02]"
          onclick={() => isModalOpen = true}
      >
          <Plus size={12} /> Schedule Round
      </button>
  </div>

  {#if interviews.length === 0}
      <div class="text-center py-10 text-slate-400 bg-slate-50/20 rounded-xl border border-dashed border-slate-200/60 flex flex-col items-center justify-center">
          <Calendar size={24} class="text-slate-300 mb-1" />
          <p class="text-xs font-medium">No interviews scheduled yet</p>
      </div>
  {:else}
      <div class="relative border-l border-slate-200 ml-4 pl-6 space-y-6">
          {#each interviews as interview}
              <div class="relative group">
                  <!-- Timeline indicator dot -->
                  <span class="absolute -left-[31px] top-1.5 flex items-center justify-center w-4 h-4 rounded-full ring-4 ring-white bg-blue-500 border border-white"></span>
                  
                  <div class="flex items-center gap-2 mb-2">
                      <span class="inline-flex items-center rounded-lg px-2.5 py-0.5 text-[10px] font-extrabold border {TYPE_COLORS[interview.type] || 'bg-gray-100 text-gray-800'}">
                          {INTERVIEW_TYPES.find(t => t.value === interview.type)?.label || interview.type}
                      </span>
                  </div>

                  <div class="glass rounded-xl border border-slate-200/60 p-4 hover:shadow-md hover:border-slate-300/80 transition-all relative">
                      <div class="flex flex-wrap gap-4 mb-2">
                          <div class="flex items-center gap-1.5 text-slate-500">
                              <Calendar size={13} class="text-slate-400" />
                              <span class="text-xs font-semibold">{formatDateTime(interview.interview_at)}</span>
                          </div>
                          {#if interview.interview_with && interview.interview_with !== 'TBD'}
                              <div class="flex items-center gap-1.5 text-slate-500">
                                  <User size={13} class="text-slate-400" />
                                  <span class="text-xs font-semibold">{interview.interview_with}</span>
                              </div>
                          {/if}
                      </div>
                      
                      {#if interview.meeting_link && !interview.meeting_link.includes('placeholder')}
                          <div class="flex items-center gap-1.5 mb-2 bg-slate-50/50 p-2 rounded-lg border border-slate-100 max-w-max">
                              <Video size={13} class="text-cyan-500" />
                              <a href={interview.meeting_link} target="_blank" rel="noreferrer" class="text-xs font-bold text-blue-600 hover:underline">
                                  Join Meeting Link
                              </a>
                          </div>
                      {/if}
                      
                      {#if interview.feedback}
                          <p class="text-xs text-slate-500 italic mt-3 border-t border-slate-100 pt-2 bg-slate-50/30 p-2 rounded-lg">"{interview.feedback}"</p>
                      {/if}

                      <button 
                          class="absolute top-3.5 right-3.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          onclick={() => handleDelete(interview.id)}
                      >
                          <Trash2 size={13} />
                      </button>
                  </div>
              </div>
          {/each}
      </div>
  {/if}
</div>

<!-- Modal -->
{#if isModalOpen}
  <div class="relative z-50 animate-fade-in" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"></div>
      
      <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div class="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md border border-slate-100 animate-slide-up">
                  <div class="bg-white px-6 pb-6 pt-6">
                      <div class="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                          <h3 class="text-lg font-extrabold text-slate-800" id="modal-title">
                              Schedule Interview Round
                          </h3>
                          <button onclick={() => isModalOpen = false} class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-colors">
                              <X size={18} />
                          </button>
                      </div>
                      
                      <form id="interview-form" onsubmit={handleSubmit} class="space-y-4">
                          <div>
                              <label for="type" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Interview Type</label>
                              <select required id="type" bind:value={form.type} class="block w-full rounded-xl border border-slate-200 py-2 px-3 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all sm:text-sm bg-white">
                                  {#each INTERVIEW_TYPES as type}
                                      <option value={type.value}>{type.label}</option>
                                  {/each}
                              </select>
                          </div>
                          
                          <div>
                              <label for="interview_at" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Date & Time</label>
                              <input required type="datetime-local" id="interview_at" bind:value={form.interview_at} class="block w-full rounded-xl border border-slate-200 py-2 px-3 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all sm:text-sm" />
                          </div>
                          
                          <div>
                              <label for="interview_with" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Interviewer Name</label>
                              <div class="relative">
                                  <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                      <User size={14} />
                                  </div>
                                  <input type="text" id="interview_with" bind:value={form.interview_with} placeholder="e.g. John Smith" class="block w-full rounded-xl border border-slate-200 py-2 pl-10 pr-3 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all sm:text-sm" />
                              </div>
                          </div>
                          
                          <div>
                              <label for="meeting_link" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Meeting Link</label>
                              <div class="relative">
                                  <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                      <Link size={14} />
                                  </div>
                                  <input type="url" id="meeting_link" bind:value={form.meeting_link} placeholder="https://zoom.us/..." class="block w-full rounded-xl border border-slate-200 py-2 pl-10 pr-3 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all sm:text-sm" />
                              </div>
                          </div>
                          
                          <div class="pt-2">
                              <label for="feedback" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Notes & Reminders</label>
                              <textarea id="feedback" bind:value={form.feedback} rows="3" placeholder="Questions to ask, topics to cover, or feedback..." class="block w-full rounded-xl border border-slate-200 py-2 px-3 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all sm:text-sm bg-white/50"></textarea>
                          </div>
                      </form>
                  </div>
                  <div class="bg-slate-50 px-6 py-4 sm:flex sm:flex-row-reverse rounded-b-2xl border-t border-slate-100">
                      <button type="submit" form="interview-form" class="inline-flex w-full justify-center rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-sm font-bold text-white shadow-md sm:ml-3 sm:w-auto transition-all">
                          Schedule Round
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
