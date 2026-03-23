<script lang="ts">
  import '../app.css';
  import favicon from '$lib/assets/favicon.svg';
  import { onMount } from 'svelte';
  import { themeStore } from '$lib/stores/themeStore.svelte.js';
  import Navbar from '$lib/components/Navbar.svelte';
  import CommandPalette from '$lib/components/CommandPalette.svelte';

  let { children } = $props();

  onMount(() => {
    themeStore.initTheme();
  });
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<Navbar />
<CommandPalette />
{@render children()}
