<script lang="ts">
  export let data;
</script>

<div class="h-full flex flex-col overflow-hidden">
  <div class="text-center font-bold text-2xl px-4 pt-4">Artists</div>

  {#if data.artists.length === 0}
    <div class="text-center font-bold text-xl p-4">There are no artists 🫤</div>
  {/if}

  <div class="flex flex-col h-full overflow-auto text-lg">
    {#each data.artists as artist}
      <a
        class="hover:bg-gradient-to-r transition-colors from-zinc-600/10 p-2 pl-4"
        href="/artist/{artist.id}">{artist.name}</a
      >
    {/each}
  </div>
</div>
