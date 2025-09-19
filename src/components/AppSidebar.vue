<script setup lang="ts">
import { computed } from 'vue'
import type { SidebarProps } from "@/components/ui/sidebar"
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

// Importaciones de componentes de UI
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  useSidebar,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// Importaciones de iconos
import { Home, Send, Inbox, ShieldCheck, FileText, Users, ChevronDown } from 'lucide-vue-next'

// --- Lógica y Estado ---

const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: 'icon',
})

const authStore = useAuthStore()
const { state: sidebarState } = useSidebar()

const isCollapsed = computed(() => sidebarState.value === 'collapsed')

const primaryAreaName = computed(() => {
  // Accede directamente al nombre del área principal del usuario.
  return authStore.user?.primary_area?.nombre || 'Área Desconocida'
})

const primaryAreaCode = computed(() => {
  // Accede al código del área; si no existe, usa las 2 primeras letras del nombre.
  return authStore.user?.primary_area?.codigo || authStore.user?.primary_area?.nombre.substring(0, 2).toUpperCase() || 'SA'
})

// Estructura de datos para los elementos de navegación
const navItems = [
  { to: '/dashboard', icon: Home, label: 'Inicio' },
  { to: '/dashboard/emitir', icon: Send, label: 'Emitir Trámite' },
  { to: '/dashboard/bandeja', icon: Inbox, label: 'Bandeja de Entrada' },
  {
    label: 'Administración',
    icon: ShieldCheck,
    requiredRole: 'Administrador',
    items: [
      { to: '/dashboard/admin/areas', icon: ShieldCheck, label: 'Admin: Áreas' },
      { to: '/dashboard/admin/tipos-documento', icon: FileText, label: 'Admin: Tipos de Doc.' },
      { to: '/dashboard/admin/usuarios', icon: Users, label: 'Admin: Usuarios' },
    ],
  },
]
</script>

<template>
  <Sidebar v-bind="props">
    <SidebarHeader>
      <RouterLink to="/dashboard" class="flex items-center gap-2">
        <img src="../assets/images/logo-tramusa.png" alt="Logo" class="h-8 w-8 transition-all"
          :class="{ 'scale-110': !isCollapsed, 'ml-1': isCollapsed }">
        <span v-if="!isCollapsed" class="font-semibold text-lg">TRAMUSA S.A.</span>
      </RouterLink>
    </SidebarHeader>

    <SidebarContent class="flex-1 p-2">
      <TooltipProvider :delay-duration="100">
        <nav class="grid gap-1">
          <template v-for="item in navItems" :key="item.label">
            <div v-if="!item.requiredRole || item.requiredRole === authStore.user?.rol">
              <Tooltip v-if="!item.items" :disabled="!isCollapsed">
                <TooltipTrigger as-child>
                  <RouterLink :to="item.to!"
                    class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
                    <component :is="item.icon" class="h-4 w-4" />
                    <span v-if="!isCollapsed">{{ item.label }}</span>
                  </RouterLink>
                </TooltipTrigger>
                <TooltipContent side="right" :side-offset="5">
                  <p>{{ item.label }}</p>
                </TooltipContent>
              </Tooltip>

              <Accordion v-else type="single" collapsible class="w-full">
                <AccordionItem value="item-1" class="border-none">
                  <Tooltip :disabled="!isCollapsed">
                    <TooltipTrigger as-child>
                      <AccordionTrigger
                        class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:no-underline [&[data-state=open]>svg.chevron]:rotate-180">
                        <component :is="item.icon" class="h-4 w-4" />
                        <span v-if="!isCollapsed" class="flex-1 text-left">{{ item.label }}</span>
                        <ChevronDown v-if="!isCollapsed"
                          class="h-4 w-4 shrink-0 transition-transform duration-200 chevron" />
                      </AccordionTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="right" :side-offset="5">
                      <p>{{ item.label }}</p>
                    </TooltipContent>
                  </Tooltip>
                  <AccordionContent class="pl-8">
                    <nav class="grid gap-1">
                      <RouterLink v-for="subItem in item.items" :key="subItem.label" :to="subItem.to"
                        class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
                        <component :is="subItem.icon" class="h-4 w-4" />
                        <span>{{ subItem.label }}</span>
                      </RouterLink>
                    </nav>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </template>
        </nav>
      </TooltipProvider>
    </SidebarContent>

    <SidebarFooter>
      <TooltipProvider :delay-duration="100">
        <Tooltip :disabled="!isCollapsed">
          <TooltipTrigger class="w-full">
            <div class="flex items-center gap-4 cursor-pointer p-2 rounded-lg hover:bg-accent">
              <Avatar class="h-9 w-9">
                <AvatarImage src="/placeholder-user.jpg" alt="Usuario" />
                <AvatarFallback>
                  {{ primaryAreaCode }}
                </AvatarFallback>
              </Avatar>
              <div v-if="!isCollapsed" class="grid gap-0.5 text-left">
                <p class="text-sm font-medium leading-none">
                  {{ primaryAreaName }}
                </p>
                <p class="text-xs text-muted-foreground">
                  {{ authStore.user?.rol }}
                </p>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" :side-offset="5">
            <p>{{ primaryAreaName }}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </SidebarFooter>

    <SidebarRail />
  </Sidebar>
</template>
