export function useScrollAnimation() {
  onMounted(() => {
    const elements = document.querySelectorAll('[data-scroll-animate]')

    if (!elements.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            // Optionally unobserve after animation
            // observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '-50px 0px',
      }
    )

    elements.forEach((el) => observer.observe(el))

    onUnmounted(() => {
      elements.forEach((el) => observer.unobserve(el))
    })
  })
}
