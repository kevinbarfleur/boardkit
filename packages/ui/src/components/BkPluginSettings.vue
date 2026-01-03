<script setup lang="ts">
import { ref, computed } from "vue";
import BkIcon from "./BkIcon.vue";
import BkButton from "./BkButton.vue";
import BkInput from "./BkInput.vue";
import BkFormSection from "./BkFormSection.vue";
import BkPluginCard, { type PluginInfo } from "./BkPluginCard.vue";
import BkModal from "./BkModal.vue";

const props = defineProps<{
  plugins: PluginInfo[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: "install", url: string): void;
  (e: "toggle", pluginId: string, enabled: boolean): void;
  (e: "update", pluginId: string): void;
  (e: "uninstall", pluginId: string): void;
  (e: "check-updates"): void;
}>();

// Install dialog state
const showInstallDialog = ref(false);
const installUrl = ref("");
const installError = ref("");

const hasPlugins = computed(() => props.plugins.length > 0);

function openInstallDialog() {
  installUrl.value = "";
  installError.value = "";
  showInstallDialog.value = true;
}

function closeInstallDialog() {
  showInstallDialog.value = false;
  installUrl.value = "";
  installError.value = "";
}

function handleInstall() {
  const url = installUrl.value.trim();
  if (!url) {
    installError.value = "Please enter a GitHub URL";
    return;
  }

  // Basic validation
  if (!url.includes("github.com") && !url.startsWith("github:")) {
    installError.value = "URL must be a GitHub repository";
    return;
  }

  emit("install", url);
  closeInstallDialog();
}

function handleToggle(pluginId: string, enabled: boolean) {
  emit("toggle", pluginId, enabled);
}

function handleUpdate(pluginId: string) {
  emit("update", pluginId);
}

function handleUninstall(pluginId: string) {
  emit("uninstall", pluginId);
}

function handleCheckUpdates() {
  emit("check-updates");
}

function handleOpenSource(source: string) {
  // Open GitHub URL in new tab
  let url = source;
  if (!url.startsWith("http")) {
    url = `https://github.com/${source.replace("github:", "")}`;
  }
  window.open(url, "_blank");
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header with actions -->
    <div class="flex items-stretch gap-2">
      <BkButton
        size="sm"
        variant="default"
        :disabled="loading"
        class="flex-1 justify-center"
        @click="openInstallDialog"
      >
        <BkIcon icon="plus" :size="14" class="mr-1.5" />
        Add plugin
      </BkButton>

      <BkButton
        v-if="hasPlugins"
        size="sm"
        variant="secondary"
        :disabled="loading"
        class="px-2.5"
        title="Check for updates"
        @click="handleCheckUpdates"
      >
        <BkIcon icon="refresh-cw" :size="14" />
      </BkButton>
    </div>

    <!-- Installed plugins -->
    <BkFormSection v-if="hasPlugins" title="Installed">
      <div class="space-y-2 p-1">
        <BkPluginCard
          v-for="plugin in plugins"
          :key="plugin.id"
          :plugin="plugin"
          :loading="loading"
          @toggle="(enabled) => handleToggle(plugin.id, enabled)"
          @update="handleUpdate(plugin.id)"
          @uninstall="handleUninstall(plugin.id)"
          @open-source="handleOpenSource(plugin.source || '')"
        />
      </div>
    </BkFormSection>

    <!-- Empty state -->
    <div v-else class="py-8 text-center">
      <div
        class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted"
      >
        <BkIcon icon="puzzle" :size="24" class="text-muted-foreground" />
      </div>
      <p class="text-sm text-muted-foreground mb-1">No plugins installed</p>
      <p class="text-xs text-muted-foreground">
        Add plugins from GitHub to extend Boardkit
      </p>
    </div>

    <!-- Security warning -->
    <div class="rounded-lg bg-warning/10 border border-warning/20 p-3">
      <div class="flex items-start gap-2">
        <BkIcon
          icon="alert-triangle"
          :size="14"
          class="text-warning shrink-0 mt-0.5"
        />
        <div>
          <p class="text-xs text-warning font-medium">Third-party code</p>
          <p class="text-xs text-warning/80 mt-0.5">
            Plugins are developed by third parties. Only install plugins from
            sources you trust.
          </p>
        </div>
      </div>
    </div>

    <!-- Install Dialog -->
    <BkModal
      :open="showInstallDialog"
      title="Install Plugin"
      hide-keyboard-hint
      @close="closeInstallDialog"
      @submit="handleInstall"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">
            GitHub URL
          </label>
          <BkInput
            v-model="installUrl"
            placeholder="github.com/author/plugin-name"
            :error="!!installError"
          />
          <p v-if="installError" class="mt-1 text-xs text-destructive">
            {{ installError }}
          </p>
          <p class="mt-1.5 text-xs text-muted-foreground">
            Enter the full URL to a plugin repository on GitHub.
            <br />
            For plugins in a monorepo, include the path:
            <br />
            <code class="text-[10px] bg-muted px-1 py-0.5 rounded">
              github.com/author/repo/plugins/plugin-name
            </code>
          </p>
        </div>

        <div class="flex justify-end gap-2">
          <BkButton variant="ghost" size="sm" @click="closeInstallDialog">
            Cancel
          </BkButton>
          <BkButton
            variant="default"
            size="sm"
            :disabled="!installUrl.trim() || loading"
            @click="handleInstall"
          >
            <BkIcon icon="download" :size="14" class="mr-1" />
            Install
          </BkButton>
        </div>
      </div>
    </BkModal>
  </div>
</template>
