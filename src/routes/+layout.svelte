<script lang="ts">
  import { onNavigate } from '$app/navigation';
  import '../app.css';

  onNavigate((navigation) => {
    if (!document.startViewTransition || navigation.from?.route.id === navigation.to?.route.id)
      return;

    return new Promise((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });
</script>

<div class="h-[100dvh] w-full flex justify-center">
  <div class="h-full w-full flex flex-col overflow-hidden p-1">
    <slot />
  </div>
</div>
