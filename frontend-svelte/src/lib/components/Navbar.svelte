<script lang="ts">
  import { Briefcase, LogOut, LayoutDashboard, BarChart3, User } from '@lucide/svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';

  function handleLogout() {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      goto('/login');
  }

  function isActive(path: string) {
      return page.url.pathname === path || page.url.pathname.startsWith(path + '/');
  }
</script>

<header class="sticky top-0 z-40 w-full glass border-b border-slate-200/50 backdrop-blur-md">
  <div class="mx-auto max-w-5xl px-4">
      <div class="flex h-16 items-center justify-between">
          <!-- Logo with solid colors -->
          <button 
              class="flex items-center gap-2 cursor-pointer group transition-transform duration-200 hover:scale-[1.02]" 
              onclick={() => goto('/dashboard')}
          >
              <div class="bg-blue-600 text-white p-2 rounded-lg shadow-md shadow-blue-500/5">
                  <Briefcase size={18} />
              </div>
              <span class="font-extrabold text-lg tracking-tight text-slate-800 hover:text-blue-600 transition-colors">
                  CareerTracker
              </span>
          </button>

          <!-- Navigation Links with premium pill-design -->
          <nav class="flex items-center gap-1.5 bg-slate-100/60 p-1 rounded-xl border border-slate-200/30">
              <button 
                  class="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 {isActive('/dashboard') ? 'bg-white text-blue-600 shadow-sm shadow-slate-200/80' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'}"
                  onclick={() => goto('/dashboard')}
              >
                  <LayoutDashboard size={13} />
                  Dashboard
              </button>
              <button 
                  class="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 {isActive('/analytics') ? 'bg-white text-blue-600 shadow-sm shadow-slate-200/80' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'}"
                  onclick={() => goto('/analytics')}
              >
                  <BarChart3 size={13} />
                  Analytics
              </button>
              <button 
                  class="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 {isActive('/profile') ? 'bg-white text-blue-600 shadow-sm shadow-slate-200/80' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'}"
                  onclick={() => goto('/profile')}
              >
                  <User size={13} />
                  Profile
              </button>
          </nav>

          <!-- Logout Action -->
          <div>
              <button 
                  class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100/50 transition-all duration-200"
                  onclick={handleLogout}
              >
                  <LogOut size={13} />
                  <span>Logout</span>
              </button>
          </div>
      </div>
  </div>
</header>
