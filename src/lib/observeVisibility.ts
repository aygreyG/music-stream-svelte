export function observeVisibility(
  node: HTMLElement | Element,
  { onVisible, onHidden }: { onVisible?: () => void; onHidden?: () => void }
) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        onVisible?.();
        break;
      }
    }
    if (onHidden && !entries.some((entry) => entry.isIntersecting)) {
      onHidden();
    }
  });

  observer.observe(node);

  return {
    destroy() {
      observer.disconnect();
    }
  };
}
