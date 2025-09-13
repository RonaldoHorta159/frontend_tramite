<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
// Ya no necesitamos importar el Checkbox de shadcn/vue, usamos el nativo
import { toast } from 'vue-sonner'

const authStore = useAuthStore()
const router = useRouter()

const nombre_usuario = ref('')
const password = ref('')
const remember = ref(false)
const isLoading = ref(false)

// Esta función se ejecuta cuando el componente se carga por primera vez
onMounted(() => {
  // Busca un usuario guardado en el localStorage
  const rememberedUser = localStorage.getItem('rememberedUser')
  if (rememberedUser) {
    // Si lo encuentra, rellena el campo de usuario y marca la casilla
    nombre_usuario.value = rememberedUser
    remember.value = true
  }
})

// Esta función maneja el envío del formulario
const handleLogin = async () => {
  isLoading.value = true
  const success = await authStore.login({
    nombre_usuario: nombre_usuario.value,
    password: password.value,
    remember: remember.value,
  })
  if (success) {
    router.push('/dashboard')
    toast.success('Bienvenido', {
      description: `Hola, ${authStore.user?.nombre_usuario}!`,
    })
  } else {
    toast.error('Error de inicio de sesión', {
      description: 'Credenciales inválidas o error de conexión.',
    })
  }
  isLoading.value = false
}

console.log("45795743")
console.log("archivo 47372011")
</script>

<template>
  <div class="w-full h-screen overflow-hidden lg:grid lg:grid-cols-2">
    <div class="hidden lg:block bg-cover bg-center dark:brightness-[0.4]"
      :style="{ backgroundImage: `url('/src/assets/images/fondo-login.webp')` }"></div>

    <div class="flex items-center justify-center py-12">
      <div class="mx-auto grid w-[350px] gap-6">
        <Card class="border-none shadow-none">
          <CardHeader class="space-y-1 text-center">
            <CardTitle class="text-xl font-normal">Acceso</CardTitle>
            <CardDescription class="text-muted-foreground text-sm">
              Ingresa con tus credenciales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form @submit.prevent="handleLogin" class="grid gap-4">
              <div class="grid gap-2">
                <Label for="nombre_usuario">Usuario</Label>
                <Input id="nombre_usuario" v-model="nombre_usuario" placeholder="Dni" required
                  class="border-b focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none h-10" />
              </div>
              <div class="grid gap-2">
                <Label for="password">Contraseña</Label>
                <Input id="password" v-model="password" type="password" required placeholder="Contraseña"
                  class="border-b focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none h-10" />
              </div>

              <div class="flex items-center space-x-2">
                <input id="remember" v-model="remember" type="checkbox"
                  class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                <Label for="remember" class="text-sm">Recordarme</Label>
              </div>

              <Button type="submit" class="w-full bg-red-500 hover:bg-red-600 text-white h-10" :disabled="isLoading">
                {{ isLoading ? 'Cargando...' : 'Ingresar' }}
              </Button>
            </form>
            <p class="mt-8 text-center text-sm text-muted-foreground">
              Protegido con autenticación segura
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
