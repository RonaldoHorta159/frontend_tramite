<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CircleUser } from 'lucide-vue-next'

const authStore = useAuthStore()
const router = useRouter()

function handleLogout() {
  authStore.logout()
  router.push('/')
}
</script>

<template>
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
</template>
