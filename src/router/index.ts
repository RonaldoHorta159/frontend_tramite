import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'vue-sonner'

import LoginView from '../views/LoginView.vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import DashboardView from '../views/DashboardView.vue'
import EmitirTramiteView from '../views/EmitirTramiteView.vue'
import BandejaEntradaView from '../views/BandejaEntradaView.vue'
import AdminAreasView from '../views/admin/AreasView.vue'
import AdminTiposView from '../views/admin/TiposView.vue'
import AdminUsuariosView from '../views/admin/UsuariosView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'login', component: LoginView },
    {
      path: '/dashboard',
      component: DashboardLayout,
      meta: { requiresAuth: true, breadcrumb: 'Inicio' },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: DashboardView,
        },
        {
          path: 'emitir',
          name: 'emitir-tramite',
          component: EmitirTramiteView,
          meta: { breadcrumb: 'Emitir Trámite' },
        },
        {
          path: 'bandeja',
          name: 'bandeja-entrada',
          component: BandejaEntradaView,
          meta: { breadcrumb: 'Bandeja de Entrada' },
        },
        {
          path: 'admin/areas',
          name: 'admin-areas',
          component: AdminAreasView,
          meta: { requiresAdmin: true, breadcrumb: 'Admin / Áreas' },
        },
        {
          path: 'admin/tipos-documento',
          name: 'admin-tipos',
          component: AdminTiposView,
          meta: { requiresAdmin: true, breadcrumb: 'Admin / Tipos de Documento' },
        },
        {
          path: 'admin/usuarios',
          name: 'admin-usuarios',
          component: AdminUsuariosView,
          meta: { requiresAdmin: true, breadcrumb: 'Admin / Usuarios' },
        },
      ],
    },
  ],
})

// Lógica de seguridad actualizada
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const requiresAdmin = to.matched.some((record) => record.meta.requiresAdmin)

  if (requiresAuth && !authStore.isAuthenticated) {
    // Si la ruta requiere login y el usuario no está autenticado, va al login
    next({ name: 'login' })
  } else if (requiresAdmin && authStore.user?.rol !== 'Administrador') {
    // Si la ruta requiere ser admin y el usuario autenticado no lo es,
    // se le notifica y se le redirige al dashboard principal.
    toast.error('Acceso Denegado', {
      description: 'No tienes permisos para acceder a esta sección.',
    })
    next({ name: 'dashboard' })
  } else {
    // En cualquier otro caso, se permite el acceso.
    next()
  }
})

export default router
