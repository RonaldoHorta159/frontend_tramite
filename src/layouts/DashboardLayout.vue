<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { CircleUser, PanelLeft } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'

const route = useRoute()
const authStore = useAuthStore()
const router = useRouter()

function handleLogout() {
  authStore.logout()
  router.push('/')
}

const breadcrumbs = computed(() => {
  return route.matched
    .filter(item => item.meta?.breadcrumb)
    .map((item, index, arr) => ({
      text: item.meta.breadcrumb as string,
      to: item.path,
      isLast: index === arr.length - 1,
    }))
})
</script>

<template>
  <SidebarProvider>
    <AppSidebar />

    <SidebarInset>
      <header
        class="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <SidebarTrigger as-child>
          <Button size="icon" variant="outline" class="sm:flex">
            <PanelLeft class="h-5 w-5" />
            <span class="sr-only">Toggle Menu</span>
          </Button>
        </SidebarTrigger>

        <Breadcrumb class="hidden md:flex">
          <BreadcrumbList>
            <template v-for="(crumb) in breadcrumbs" :key="crumb.to">
              <BreadcrumbItem>
                <BreadcrumbPage v-if="crumb.isLast">
                  {{ crumb.text }}
                </BreadcrumbPage>
                <BreadcrumbLink v-else as-child>
                  <RouterLink :to="crumb.to">
                    {{ crumb.text }}
                  </RouterLink>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator v-if="!crumb.isLast" />
            </template>
          </BreadcrumbList>
        </Breadcrumb>

        <div class="relative ml-auto flex-1 md:grow-0" />

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="secondary" size="icon" class="rounded-full">
              <CircleUser class="h-5 w-5" />
              <span class="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Configuración</DropdownMenuItem>
            <DropdownMenuItem>Soporte</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="handleLogout">
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <main class="flex-1 overflow-y-auto p-4 sm:p-6">
        <RouterView />
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>
