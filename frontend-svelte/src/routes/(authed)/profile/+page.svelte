<script lang="ts">
  import { onMount } from 'svelte';
  import { User, MapPin, Briefcase, Mail, Phone, Calendar, Save, Link, Globe, Shield } from '@lucide/svelte';
  import api from '$lib/api';
  import { notifications } from '$lib/toast';

  interface UserProfile {
      id: number;
      email: string;
      name: string;
      phone_number: string;
      bio: string;
      location: string;
      linkedin_url: string;
      github_url: string;
      portfolio_url: string;
      years_of_experience: number;
      current_company: string;
      current_role: string;
      created_at: string;
  }

  let profile: UserProfile | null = $state(null);
  let loading = $state(true);
  let saving = $state(false);

  onMount(async () => {
      try {
          const response = await api.get('users/profile/');
          profile = response.data;
      } catch (error) {
          notifications.show({ title: 'Error', message: 'Failed to load profile', color: 'red' });
      } finally {
          loading = false;
      }
  });

  async function handleSave(e: Event) {
      e.preventDefault();
      if (!profile) return;
      
      saving = true;
      try {
          await api.patch('users/profile/', profile);
          notifications.show({ title: 'Success', message: 'Profile updated', color: 'green' });
      } catch (error) {
          notifications.show({ title: 'Error', message: 'Failed to update profile', color: 'red' });
      } finally {
          saving = false;
      }
  }
</script>

<svelte:head>
  <title>Profile - CareerTracker</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-10">
  <div class="mb-8">
      <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight">My Profile</h2>
      <p class="text-slate-500 text-sm mt-1">Manage your professional information, contact details, and social links.</p>
  </div>

  {#if loading}
      <div class="flex justify-center items-center h-[40vh]">
          <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
  {:else if profile}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Left Column (Avatar & Quick Info) -->
          <div class="space-y-6 lg:col-span-1">
              <!-- Avatar Card -->
              <div class="glass rounded-2xl shadow-sm border border-slate-200/60 p-6 text-center">
                  <div class="mx-auto h-24 w-24 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-3xl font-black mb-4 shadow-lg shadow-blue-500/10">
                      {profile.name ? profile.name.charAt(0).toUpperCase() : (profile.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <h3 class="text-lg font-bold text-slate-800">{profile.name || 'Your Name'}</h3>
                  <p class="text-xs font-bold text-slate-400 mt-1">
                      {#if profile.current_role}
                          {profile.current_role} @ {profile.current_company || 'Unemployed'}
                      {:else}
                          Job Seeker
                      {/if}
                  </p>
                  
                  <div class="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 bg-slate-100/50 border border-slate-200/30 py-2.5 px-3 rounded-xl mt-5">
                      <Mail size={13} class="text-slate-400" />
                      <span class="truncate">{profile.email}</span>
                  </div>
                  
                  <div class="flex items-center justify-center gap-3 mt-6 border-t border-slate-150/40 pt-5">
                      <a href={profile.linkedin_url || '#'} class="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-100 transition-all" title="LinkedIn" target="_blank" rel="noreferrer">
                          <Link size={16} />
                      </a>
                      <a href={profile.github_url || '#'} class="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-250 transition-all" title="GitHub" target="_blank" rel="noreferrer">
                          <Link size={16} />
                      </a>
                      <a href={profile.portfolio_url || '#'} class="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 hover:border-emerald-100 transition-all" title="Portfolio" target="_blank" rel="noreferrer">
                          <Globe size={16} />
                      </a>
                  </div>
              </div>
              
              <!-- Quick Stats Card -->
              <div class="glass rounded-2xl shadow-sm border border-slate-200/60 p-6">
                  <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Meta Data</h4>
                  <div class="space-y-4">
                      <div class="flex items-center gap-3 text-sm">
                          <div class="p-2 rounded-lg bg-blue-50 text-blue-600">
                              <Calendar size={15} />
                          </div>
                          <div>
                              <p class="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Member Since</p>
                              <p class="font-bold text-slate-800 mt-0.5 text-xs">{new Date(profile.created_at).toLocaleDateString('en-GB')}</p>
                          </div>
                      </div>
                      <div class="flex items-center gap-3 text-sm">
                          <div class="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                              <Briefcase size={15} />
                          </div>
                          <div>
                              <p class="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Experience Level</p>
                              <p class="font-bold text-slate-800 mt-0.5 text-xs">{profile.years_of_experience || 0} Years</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
          
          <!-- Right Column (Profile Information Form) -->
          <div class="lg:col-span-2 glass rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
              <div class="px-6 py-5 border-b border-slate-150/40 bg-slate-50/50">
                  <h3 class="text-lg font-bold text-slate-850">Personal Details</h3>
                  <p class="text-xs text-slate-400 mt-0.5">Please populate the fields below to customize your profile representation.</p>
              </div>
              
              <form onsubmit={handleSave} class="p-6 space-y-6">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                          <label for="name" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                          <div class="relative">
                              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                  <User size={15} />
                              </div>
                              <input type="text" id="name" bind:value={profile.name} class="block w-full rounded-xl border border-slate-200 py-2 pl-10 pr-3 text-slate-855 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all sm:text-sm" />
                          </div>
                      </div>
                      
                      <div>
                          <label for="phone" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                          <div class="relative">
                              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                  <Phone size={15} />
                              </div>
                              <input type="tel" id="phone" bind:value={profile.phone_number} class="block w-full rounded-xl border border-slate-200 py-2 pl-10 pr-3 text-slate-855 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all sm:text-sm" />
                          </div>
                      </div>
                      
                      <div>
                          <label for="current_company" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Current Company</label>
                          <div class="relative">
                              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                  <Briefcase size={15} />
                              </div>
                              <input type="text" id="current_company" bind:value={profile.current_company} class="block w-full rounded-xl border border-slate-200 py-2 pl-10 pr-3 text-slate-855 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all sm:text-sm" />
                          </div>
                      </div>
                      
                      <div>
                          <label for="current_role" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Current Job Role</label>
                          <input type="text" id="current_role" bind:value={profile.current_role} class="block w-full rounded-xl border border-slate-200 py-2 px-3.5 text-slate-855 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all sm:text-sm" />
                      </div>
                      
                      <div>
                          <label for="experience" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Years of Experience</label>
                          <input type="number" step="0.5" id="experience" bind:value={profile.years_of_experience} class="block w-full rounded-xl border border-slate-200 py-2 px-3.5 text-slate-855 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all sm:text-sm" />
                      </div>
                      
                      <div>
                          <label for="location" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Location</label>
                          <div class="relative">
                              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                  <MapPin size={15} />
                              </div>
                              <input type="text" id="location" bind:value={profile.location} class="block w-full rounded-xl border border-slate-200 py-2 pl-10 pr-3 text-slate-855 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all sm:text-sm" />
                          </div>
                      </div>
                  </div>
                  
                  <div>
                      <label for="bio" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Professional Bio</label>
                      <textarea id="bio" bind:value={profile.bio} rows="4" class="block w-full rounded-xl border border-slate-200 py-2 px-3 text-slate-855 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all sm:text-sm bg-white/50" placeholder="A brief summary of your achievements and interests..."></textarea>
                  </div>
                  
                  <div class="border-t border-slate-150/40 pt-5">
                      <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Web presence Links</h4>
                      
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div>
                              <label for="linkedin" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">LinkedIn Profile URL</label>
                              <input type="url" id="linkedin" bind:value={profile.linkedin_url} placeholder="https://linkedin.com/in/..." class="block w-full rounded-xl border border-slate-200 py-2 px-3 text-slate-855 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all sm:text-sm" />
                          </div>
                          
                          <div>
                              <label for="github" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">GitHub Profile URL</label>
                              <input type="url" id="github" bind:value={profile.github_url} placeholder="https://github.com/..." class="block w-full rounded-xl border border-slate-200 py-2 px-3 text-slate-855 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all sm:text-sm" />
                          </div>
                          
                          <div class="sm:col-span-2">
                              <label for="portfolio" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Portfolio / Blog Website</label>
                              <input type="url" id="portfolio" bind:value={profile.portfolio_url} placeholder="https://yourwebsite.com" class="block w-full rounded-xl border border-slate-200 py-2 px-3 text-slate-855 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all sm:text-sm" />
                          </div>
                      </div>
                  </div>
                  
                  <div class="flex justify-end pt-5 border-t border-slate-150/40">
                      <button 
                          type="submit" 
                          disabled={saving}
                          class="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
                      >
                          <Save size={15} />
                          {saving ? 'Saving...' : 'Save Profile'}
                      </button>
                  </div>
              </form>
          </div>
      </div>
  {/if}
</div>
