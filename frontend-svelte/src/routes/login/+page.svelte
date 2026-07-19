<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Briefcase, Mail } from '@lucide/svelte';
  import api from '$lib/api';
  import { notifications } from '$lib/toast';

  let email = $state('');
  let isSubmitting = $state(false);

  onMount(() => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
  });

  async function handleLogin(e: Event) {
      e.preventDefault();
      
      const trimmedEmail = email.trim();
      if (!/^\S+@\S+$/.test(trimmedEmail)) {
          notifications.show({
              title: 'Invalid email',
              message: 'Enter a valid email address to continue.',
              color: 'yellow'
          });
          return;
      }

      isSubmitting = true;
      try {
          await api.post('users/send-otp/', { email: trimmedEmail });
          
          notifications.show({
              title: 'OTP Sent',
              message: 'Check your email for the verification code.',
              color: 'green'
          });

          localStorage.setItem('pending_email', trimmedEmail);
          goto('/verify-otp');
      } catch (error: any) {
          notifications.show({
              title: 'Error',
              message: error.response?.data?.error || 'Failed to send OTP',
              color: 'red'
          });
      } finally {
          isSubmitting = false;
      }
  }
</script>

<svelte:head>
  <title>Login - CareerTracker</title>
</svelte:head>

<div class="flex min-h-[90vh] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="w-full max-w-[420px] space-y-8">
      <div class="flex flex-col items-center">
          <!-- Logo Container -->
          <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/10">
              <Briefcase size={28} />
          </div>
          <h2 class="mt-6 text-center text-3xl font-extrabold tracking-tight text-slate-900">
              Welcome to CareerTracker
          </h2>
          <p class="mt-2 text-center text-sm text-slate-500">
              Track job applications, schedule interviews, and analyze your funnel.
          </p>
      </div>
      
      <!-- Premium Glass Card -->
      <div class="glass p-8 shadow-xl shadow-slate-200/50 sm:rounded-2xl border border-white/60">
          <div class="mb-6">
              <h3 class="text-lg font-bold text-slate-800">Sign in</h3>
              <p class="text-xs text-slate-400 mt-1">We will send a 6-digit one-time password to your email.</p>
          </div>

          <form class="space-y-5" onsubmit={handleLogin}>
              <div>
                  <label for="email" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Email Address
                  </label>
                  <div class="relative">
                      <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                          <Mail size={16} />
                      </div>
                      <input 
                          id="email" 
                          name="email" 
                          type="email" 
                          autocomplete="email" 
                          required 
                          placeholder="you@domain.com"
                          bind:value={email}
                          class="block w-full rounded-xl border border-slate-200 bg-white/50 py-2.5 pl-10 pr-3 text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all sm:text-sm"
                      />
                  </div>
              </div>

              <div>
                  <button 
                      type="submit" 
                      disabled={isSubmitting}
                      class="flex w-full justify-center rounded-xl bg-blue-600 py-3 px-4 text-sm font-bold text-white shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                      {#if isSubmitting}
                          <div class="flex items-center gap-2">
                              <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Sending OTP...</span>
                          </div>
                      {:else}
                          <span>Send Code</span>
                      {/if}
                  </button>
              </div>
          </form>
      </div>
  </div>
</div>
