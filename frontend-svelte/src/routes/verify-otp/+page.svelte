<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Briefcase, ArrowLeft } from '@lucide/svelte';
  import api from '$lib/api';
  import { notifications } from '$lib/toast';

  let otp = $state(['', '', '', '', '', '']);
  let loading = $state(false);
  let email = $state('');
  
  let inputs: HTMLInputElement[] = [];

  onMount(() => {
      email = localStorage.getItem('pending_email') || '';
      const token = localStorage.getItem('access_token');
      
      if (!email && !token) {
          goto('/login');
      }
      
      // Focus first input
      setTimeout(() => {
          if (inputs[0]) inputs[0].focus();
      }, 50);
  });

  function handleInput(index: number, e: Event) {
      const target = e.target as HTMLInputElement;
      const val = target.value;
      
      // Handle paste of multiple digits
      if (val.length > 1) {
          const digits = val.slice(0, 6).split('');
          for (let i = 0; i < digits.length; i++) {
              if (index + i < 6) {
                  otp[index + i] = digits[i];
              }
          }
          const nextFocus = Math.min(index + digits.length, 5);
          inputs[nextFocus]?.focus();
          target.value = otp[index]; // Reset current input
          return;
      }
      
      // Single digit
      otp[index] = val;
      
      if (val && index < 5) {
          inputs[index + 1]?.focus();
      }
  }

  function handleKeyDown(index: number, e: KeyboardEvent) {
      if (e.key === 'Backspace' && !otp[index] && index > 0) {
          inputs[index - 1]?.focus();
      }
  }

  async function handleVerify() {
      const otpString = otp.join('');
      if (otpString.length !== 6) {
          notifications.show({
              title: 'Error',
              message: 'Please enter all 6 digits',
              color: 'red'
          });
          return;
      }

      loading = true;
      try {
          const response = await api.post('users/verify-otp/', { email, otp: otpString });

          localStorage.setItem('access_token', response.data.access);
          localStorage.setItem('refresh_token', response.data.refresh);
          localStorage.removeItem('pending_email');

          notifications.show({
              title: 'Success!',
              message: 'You are now logged in.',
              color: 'green'
          });
          goto('/dashboard');
      } catch (error: any) {
          notifications.show({
              title: 'Verification Failed',
              message: error.response?.data?.error || 'Invalid or expired OTP',
              color: 'red',
          });
      } finally {
          loading = false;
      }
  }
</script>

<svelte:head>
  <title>Verify OTP - CareerTracker</title>
</svelte:head>

<div class="flex min-h-[90vh] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="w-full max-w-[420px] space-y-8">
      <div class="flex flex-col items-center">
          <!-- Logo Container -->
          <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/10">
              <Briefcase size={28} />
          </div>
          <h2 class="mt-6 text-center text-3xl font-extrabold tracking-tight text-slate-900">
              Check your email
          </h2>
          <p class="mt-2 text-center text-sm text-slate-500">
              We sent a 6-digit verification code to <br/> <strong class="font-semibold text-slate-700">{email}</strong>
          </p>
      </div>

      <!-- Premium Glass Card -->
      <div class="glass p-8 shadow-xl shadow-slate-200/50 sm:rounded-2xl border border-white/60">
          <div class="flex justify-center gap-2 mb-8">
              {#each Array(6) as _, i}
                  <input
                      type="text"
                      inputmode="numeric"
                      maxlength="6"
                      bind:this={inputs[i]}
                      value={otp[i]}
                      oninput={(e) => handleInput(i, e)}
                      onkeydown={(e) => handleKeyDown(i, e)}
                      class="w-11 h-14 text-center text-xl font-bold rounded-xl border border-slate-200 bg-white/50 text-slate-800 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all"
                  />
              {/each}
          </div>
          
          <button 
              onclick={handleVerify}
              disabled={loading}
              class="flex w-full justify-center rounded-xl bg-blue-600 py-3 px-4 text-sm font-bold text-white shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
              {#if loading}
                  <div class="flex items-center gap-2">
                      <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Verifying...</span>
                  </div>
              {:else}
                  <span>Verify & Login</span>
              {/if}
          </button>
          
          <div class="mt-6 flex justify-center">
              <button 
                  onclick={() => goto('/login')}
                  class="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
              >
                  <ArrowLeft size={14} /> Back to Sign In
              </button>
          </div>
      </div>
  </div>
</div>
