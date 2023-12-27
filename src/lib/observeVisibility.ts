export function observeVisibility(
  node: HTMLElement | Element,
  { onVisible }: { onVisible: () => void }
) {
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      onVisible();
    }
  });

  observer.observe(node);

  return {
    destroy() {
      observer.disconnect();
    }
  };
}
