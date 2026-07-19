<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  onMount(() => {
      const token = localStorage.getItem('access_token');
      if (token) {
          goto('/dashboard');
      } else {
          goto('/login');
      }
  });
</script>
