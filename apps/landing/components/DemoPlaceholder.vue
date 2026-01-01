<script setup lang="ts">
// This component renders a browser-style frame with a screenshot placeholder
// Will be replaced with an iframe to the demo app later
</script>

<template>
  <div class="relative">
    <!-- Glow effect -->
    <div class="absolute -inset-4 bg-primary/20 rounded-3xl blur-3xl opacity-50" />

    <!-- Browser frame -->
    <div class="relative rounded-2xl border border-border overflow-hidden shadow-hero bg-card">
      <!-- Window chrome -->
      <div class="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
        <div class="flex gap-2">
          <div class="w-3 h-3 rounded-full bg-destructive/80" />
          <div class="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div class="w-3 h-3 rounded-full bg-success/80" />
        </div>
        <div class="flex-1 flex justify-center">
          <div class="px-4 py-1 rounded-md bg-background/50 text-xs text-muted-foreground font-mono">
            app.boardkit.sh
          </div>
        </div>
        <div class="w-16" />
      </div>

      <!-- Canvas placeholder -->
      <div class="aspect-[16/10] bg-background relative overflow-hidden">
        <!-- Grid background -->
        <div class="absolute inset-0 bg-grid-pattern opacity-30" />

        <!-- Mock canvas content -->
        <div class="absolute inset-0 flex items-center justify-center p-8">
          <div class="grid grid-cols-3 gap-4 w-full max-w-3xl">
            <!-- Mock Todo widget -->
            <div class="col-span-1 bg-card rounded-lg border border-border p-3">
              <div class="flex items-center gap-2 mb-3">
                <div class="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
                  <span class="i-lucide-check-square text-primary text-xs" />
                </div>
                <span class="text-xs font-medium text-foreground">Todo</span>
              </div>
              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded border border-success bg-success/20" />
                  <span class="text-xs text-muted-foreground line-through">Design landing</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded border border-border" />
                  <span class="text-xs text-foreground">Build demo</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded border border-border" />
                  <span class="text-xs text-foreground">Write docs</span>
                </div>
              </div>
            </div>

            <!-- Mock Timer widget -->
            <div class="col-span-1 bg-card rounded-lg border border-border p-3 flex flex-col items-center justify-center">
              <div class="flex items-center gap-2 mb-2">
                <div class="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
                  <span class="i-lucide-timer text-primary text-xs" />
                </div>
                <span class="text-xs font-medium text-foreground">Timer</span>
              </div>
              <div class="text-2xl font-bold font-mono text-foreground">25:00</div>
              <div class="text-xs text-muted-foreground">Focus time</div>
            </div>

            <!-- Mock Counter widget -->
            <div class="col-span-1 bg-card rounded-lg border border-border p-3 flex flex-col items-center justify-center">
              <div class="flex items-center gap-2 mb-2">
                <div class="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
                  <span class="i-lucide-hash text-primary text-xs" />
                </div>
                <span class="text-xs font-medium text-foreground">Streak</span>
              </div>
              <div class="text-2xl font-bold text-foreground">7</div>
              <div class="text-xs text-muted-foreground">days</div>
            </div>

            <!-- Mock Text widget (spanning 2 cols) -->
            <div class="col-span-2 bg-card rounded-lg border border-border p-3">
              <div class="flex items-center gap-2 mb-2">
                <div class="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
                  <span class="i-lucide-file-text text-primary text-xs" />
                </div>
                <span class="text-xs font-medium text-foreground">Notes</span>
              </div>
              <div class="text-xs text-muted-foreground leading-relaxed">
                <span class="text-foreground font-medium"># Welcome to Boardkit</span><br />
                Your personal productivity canvas...
              </div>
            </div>

            <!-- Mock Kanban widget -->
            <div class="col-span-1 bg-card rounded-lg border border-border p-3">
              <div class="flex items-center gap-2 mb-2">
                <div class="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
                  <span class="i-lucide-columns-3 text-primary text-xs" />
                </div>
                <span class="text-xs font-medium text-foreground">Kanban</span>
              </div>
              <div class="flex gap-1">
                <div class="flex-1 bg-muted rounded p-1">
                  <div class="text-[8px] text-muted-foreground mb-1">Todo</div>
                  <div class="h-3 bg-background rounded" />
                </div>
                <div class="flex-1 bg-muted rounded p-1">
                  <div class="text-[8px] text-muted-foreground mb-1">Doing</div>
                  <div class="h-3 bg-primary/30 rounded" />
                </div>
                <div class="flex-1 bg-muted rounded p-1">
                  <div class="text-[8px] text-muted-foreground mb-1">Done</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Decorative elements -->
        <div class="absolute top-4 left-4 w-8 h-8 rounded bg-muted/50 flex items-center justify-center">
          <span class="i-lucide-menu text-muted-foreground text-sm" />
        </div>
        <div class="absolute top-4 right-4 flex gap-2">
          <div class="w-8 h-8 rounded bg-muted/50 flex items-center justify-center">
            <span class="i-lucide-palette text-muted-foreground text-sm" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
