<script lang="ts">
  import Navbar from '$lib/components/Navbar.svelte';
  import { fade } from 'svelte/transition';
  import { page } from '$app/state';
  
  let { children } = $props();
</script>

<Navbar />
{#key page.url.pathname}
  <div in:fade={{ duration: 150, delay: 100 }} out:fade={{ duration: 100 }}>
    {@render children()}
  </div>
{/key}
