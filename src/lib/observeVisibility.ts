export function observeVisibility(
  node: HTMLElement | Element,
  { onVisible }: { onVisible: () => void }
) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        onVisible();
        break;
      }
    }
  });

  observer.observe(node);

  return {
    destroy() {
      observer.disconnect();
    }
  };
}
