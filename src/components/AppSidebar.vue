<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Home, Send, Inbox, ShieldCheck, FileText, Users } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/authStore'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  useSidebar,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const authStore = useAuthStore()
const { state } = useSidebar()

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Inicio' },
  { to: '/dashboard/emitir', icon: Send, label: 'Emitir Trámite' },
  { to: '/dashboard/bandeja', icon: Inbox, label: 'Bandeja de Entrada' },
]

const adminNavItems = [
  { to: '/dashboard/admin/areas', icon: ShieldCheck, label: 'Admin: Áreas' },
  { to: '/dashboard/admin/tipos-documento', icon: FileText, label: 'Admin: Tipos de Doc.' },
  { to: '/dashboard/admin/usuarios', icon: Users, label: 'Admin: Usuarios' },
]
</script>

<template>
  <Sidebar>
    <SidebarHeader>
      <RouterLink to="/dashboard" class="flex items-center ">
        <img src="../assets/images/logo-tramusa.png" alt="Logo" class="h-8 w-8">
        <span class="font-semibold text-lg group-data-[state=closed]:hidden">TRAMUSA S.A.</span>
      </RouterLink>
    </SidebarHeader>

    <SidebarContent class="flex-1 p-2">
      <TooltipProvider :delay-duration="100">
        <SidebarMenu>
          <SidebarMenuItem v-for="item in navItems" :key="item.label">
            <Tooltip :disabled="state !== 'collapsed'">
              <TooltipTrigger as-child>
                <SidebarMenuButton as-child>
                  <RouterLink :to="item.to" class="flex items-center gap-3 rounded-lg">
                    <component :is="item.icon" class="h-4 w-4" />
                    <span class="group-data-[state=closed]:hidden">{{ item.label }}</span>
                  </RouterLink>
                </SidebarMenuButton>
              </TooltipTrigger>
              <TooltipContent side="right" :side-offset="5">
                <p>{{ item.label }}</p>
              </TooltipContent>
            </Tooltip>
          </SidebarMenuItem>
        </SidebarMenu>

        <div v-if="authStore.user?.rol === 'Administrador'" class="mt-4 pt-4 border-t">
          <p class="px-3 py-2 text-xs font-semibold text-muted-foreground group-data-[state=closed]:text-center">
            <span class="group-data-[state=closed]:hidden">Gestión</span>
            <span v-if="state === 'collapsed'">---</span>
          </p>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in adminNavItems" :key="item.label">
              <Tooltip :disabled="state !== 'collapsed'">
                <TooltipTrigger as-child>
                  <SidebarMenuButton as-child>
                    <RouterLink :to="item.to" class="flex items-center gap-3 rounded-lg">
                      <component :is="item.icon" class="h-4 w-4" />
                      <span class="group-data-[state=closed]:hidden">{{ item.label }}</span>
                    </RouterLink>
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent side="right" :side-offset="5">
                  <p>{{ item.label }}</p>
                </TooltipContent>
              </Tooltip>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </TooltipProvider>
    </SidebarContent>

    <SidebarFooter>
      <TooltipProvider :delay-duration="100">
        <Tooltip :disabled="state !== 'collapsed'">
          <TooltipTrigger class="w-full">
            <div class="flex items-center gap-4 cursor-pointer p-2 rounded-lg hover:bg-accent">
              <Avatar class="h-9 w-9">
                <AvatarImage src="/placeholder-user.jpg" alt="USUARIO" />
                <AvatarFallback>
                  {{ authStore.user?.nombre_usuario.substring(0, 2).toUpperCase() }}
                </AvatarFallback>
              </Avatar>
              <div class="grid gap-0.5 text-left group-data-[state=closed]:hidden">
                <p class="text-sm font-medium leading-none">
                  {{ authStore.user?.nombre_usuario }}
                </p>
                <p class="text-xs text-muted-foreground">
                  {{ authStore.user?.rol }}
                </p>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" :side-offset="5">
            <p>{{ authStore.user?.nombre_usuario }}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </SidebarFooter>
  </Sidebar>
</template>
