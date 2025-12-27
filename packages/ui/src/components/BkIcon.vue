<script setup lang="ts">
import { computed, type Component } from 'vue'
import {
  X,
  Plus,
  RotateCcw,
  Sun,
  Moon,
  Loader2,
  GripVertical,
  GripHorizontal,
  Command,
  Copy,
  Trash2,
  Layers,
  ZoomIn,
  ZoomOut,
  Search,
  ChevronRight,
  ChevronDown,
  Check,
  Circle,
  MoreHorizontal,
  Settings,
  FileText,
  CheckSquare,
  Star,
  Info,
  Scissors,
  Clipboard,
  Download,
  StickyNote,
  Folder,
  ArrowLeft,
  Edit,
  LayoutGrid,
  User,
  Mail,
  Lock,
  Undo2,
  Redo2,
  Home,
  AlertCircle,
  CheckCircle,
  Upload,
  Eye,
  EyeOff,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Zap,
  Heart,
  Bookmark,
  Share2,
  type LucideIcon,
} from 'lucide-vue-next'

const iconComponents: Record<string, LucideIcon> = {
  x: X,
  plus: Plus,
  'rotate-ccw': RotateCcw,
  sun: Sun,
  moon: Moon,
  loader: Loader2,
  grip: GripVertical,
  'grip-vertical': GripVertical,
  'grip-horizontal': GripHorizontal,
  command: Command,
  copy: Copy,
  'trash-2': Trash2,
  layers: Layers,
  'zoom-in': ZoomIn,
  'zoom-out': ZoomOut,
  search: Search,
  'chevron-right': ChevronRight,
  'chevron-down': ChevronDown,
  check: Check,
  circle: Circle,
  'more-horizontal': MoreHorizontal,
  settings: Settings,
  'file-text': FileText,
  'check-square': CheckSquare,
  star: Star,
  info: Info,
  scissors: Scissors,
  clipboard: Clipboard,
  download: Download,
  'sticky-note': StickyNote,
  folder: Folder,
  'arrow-left': ArrowLeft,
  edit: Edit,
  'layout-grid': LayoutGrid,
  user: User,
  mail: Mail,
  lock: Lock,
  'undo-2': Undo2,
  'redo-2': Redo2,
  home: Home,
  'alert-circle': AlertCircle,
  'check-circle': CheckCircle,
  upload: Upload,
  eye: Eye,
  'eye-off': EyeOff,
  'trending-up': TrendingUp,
  users: Users,
  'dollar-sign': DollarSign,
  activity: Activity,
  zap: Zap,
  heart: Heart,
  bookmark: Bookmark,
  'share-2': Share2,
}

export type IconName = keyof typeof iconComponents

interface Props {
  icon: IconName | string
  size?: number
  strokeWidth?: number
}

const props = withDefaults(defineProps<Props>(), {
  size: 16,
  strokeWidth: 1.5,
})

const iconComponent = computed<Component | null>(() => {
  return iconComponents[props.icon] || null
})
</script>

<template>
  <component
    :is="iconComponent"
    v-if="iconComponent"
    :size="props.size"
    :stroke-width="props.strokeWidth"
    class="shrink-0"
  />
</template>
