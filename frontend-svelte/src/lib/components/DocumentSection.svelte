<script lang="ts">
  import { onMount } from 'svelte';
  import { FileText, Trash2, Upload, File, HelpCircle } from '@lucide/svelte';
  import api from '$lib/api';
  import { notifications } from '$lib/toast';

  let { jobId }: { jobId: string } = $props();

  interface Document {
      id: number;
      file: string;
      doc_types: string;
      uploaded_at: string;
      job: number;
  }

  let docs: Document[] = $state([]);
  let loading = $state(true);
  let file: File | null = $state(null);
  let docType = $state('RESUME');
  let fileInput: HTMLInputElement;

  function getFileUrl(fileUrl: string) {
      if (!fileUrl) return '#';
      if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
          let url = fileUrl;
          if (url.includes('backend:8000')) {
              url = url.replace('backend:8000', '127.0.0.1:8000');
          }
          return url;
      }
      // If relative, build the host URL manually
      const base = 'http://127.0.0.1:8000';
      return `${base}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
  }

  async function fetchDocs() {
      try {
          const response = await api.get('jobs/documents/');
          docs = response.data.filter((d: any) => d.job === Number(jobId));
      } catch (error) {
          console.error('Failed to load documents');
      } finally {
          loading = false;
      }
  }

  onMount(() => {
      fetchDocs();
  });

  async function handleUpload() {
      if (!file || !docType) return;

      try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('doc_types', docType || 'RESUME');
          formData.append('job', jobId);

          await api.post('jobs/documents/', formData);
          
          notifications.show({
              title: 'Success',
              message: 'File uploaded successfully',
              color: 'teal',
          });
          
          file = null;
          if (fileInput) fileInput.value = '';
          fetchDocs();
      } catch (error) {
          notifications.show({
              title: 'Error',
              message: 'Failed to upload file. Please try again.',
              color: 'red'
          });
      }
  }

  async function handleDelete(id: number) {
      if (!confirm('Delete this file?')) return;
      try {
          await api.delete(`jobs/documents/${id}/`);
          notifications.show({title: 'Deleted', message: 'File deleted', color: 'gray'});
          docs = docs.filter(d => d.id !== id);
      } catch (error) {
          notifications.show({title: 'Error', message: 'Delete failed', color: 'red'});
      }
  }
</script>

<div class="glass rounded-2xl border border-slate-200/60 p-6 mt-6 shadow-sm">
  <h4 class="text-base font-extrabold text-slate-800 mb-5 pb-3 border-b border-slate-100 flex items-center gap-2">
      <FileText size={18} class="text-indigo-500" /> Documents & Attachments
  </h4>

  <!-- Upload Area -->
  <div class="flex items-center gap-3 mb-6 flex-wrap bg-slate-50/50 p-4 rounded-xl border border-slate-100/60">
      <div>
          <button 
              onclick={() => fileInput.click()}
              class="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 text-xs font-bold rounded-xl shadow-sm transition-all"
          >
              <Upload size={14} /> Select File
          </button>
          <input 
              type="file" 
              class="hidden" 
              bind:this={fileInput}
              onchange={(e) => file = (e.target as HTMLInputElement).files?.[0] || null}
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          />
      </div>
      
      {#if file}
          <span class="text-xs font-semibold text-slate-600 truncate max-w-[200px] bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200/30 flex items-center gap-1.5">
              <File size={12} class="text-blue-500" /> {file.name}
          </span>
      {/if}
      
      <div class="w-36">
          <select 
              bind:value={docType}
              class="block w-full rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all text-xs font-bold"
          >
              {#each ['RESUME', 'COVER LETTER', 'COLD EMAIL', 'OTHERS'] as type}
                  <option value={type}>{type}</option>
              {/each}
          </select>
      </div>
      
      <button 
          disabled={!file} 
          onclick={handleUpload}
          class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-xs font-bold rounded-xl shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all ml-auto"
      >
          Upload
      </button>
  </div>

  <!-- List Area -->
  {#if loading}
      <div class="flex justify-center py-6">
          <div class="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
  {:else if docs.length === 0}
      <div class="text-center py-8 text-slate-400 bg-slate-50/20 rounded-xl border border-dashed border-slate-200/60 flex flex-col items-center justify-center">
          <HelpCircle size={24} class="text-slate-300 mb-1" />
          <p class="text-xs font-medium">No documents attached yet</p>
      </div>
  {:else}
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {#each docs as doc}
              <div class="flex items-center justify-between p-3.5 bg-white/60 hover:bg-white rounded-xl border border-slate-100 hover:shadow-sm transition-all group">
                  <div class="flex items-center gap-3 min-w-0">
                      <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                          <FileText size={16} />
                      </div>
                      <div class="min-w-0">
                          <p class="text-xs font-extrabold text-slate-850 truncate">{doc.doc_types}</p>
                          <p class="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                              <a href={getFileUrl(doc.file)} target="_blank" rel="noreferrer" class="text-blue-600 font-bold hover:underline">View / Download</a>
                              <span>•</span>
                              <span>{new Date(doc.uploaded_at).toLocaleDateString('en-GB')}</span>
                          </p>
                      </div>
                  </div>
                  <button 
                      class="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                      onclick={() => handleDelete(doc.id)}
                  >
                      <Trash2 size={14} />
                  </button>
              </div>
          {/each}
      </div>
  {/if}
</div>
