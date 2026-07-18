<script setup lang="ts">
defineProps<{ title: string }>();
</script>

<template>
  <div class="pair">
    <div class="pair-head">
      <h3>{{ title }}</h3>
      <p><slot name="desc" /></p>
    </div>
    <div class="pair-cards">
      <div class="pair-card">
        <span class="pair-tag">Inline picker</span>
        <slot name="picker" />
      </div>
      <div class="pair-card">
        <span class="pair-tag">Form input</span>
        <slot name="field" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.pair {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow:
    0 0 0 1px rgb(15 23 42 / 0.02),
    0 1px 3px 0 rgb(15 23 42 / 0.04);
}
.pair-head {
  margin-bottom: 1.25rem;
}
.pair-head h3 {
  font-size: 0.9375rem;
  font-weight: 600;
  margin: 0 0 0.25rem;
}
.pair-head p {
  color: var(--ink-muted);
  font-size: 0.8125rem;
  margin: 0;
  line-height: 1.55;
}
.pair-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  align-items: start;
}
@media (max-width: 720px) {
  .pair-cards {
    grid-template-columns: 1fr;
  }
}
.pair-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.25rem;
  border: 1px dashed var(--card-border);
  border-radius: 0.75rem;
  background: rgb(15 23 42 / 0.015);
}
.pair-tag {
  align-self: flex-start;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-muted);
  background: rgb(15 23 42 / 0.05);
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
}
</style>
