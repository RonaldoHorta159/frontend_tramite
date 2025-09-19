// src/components/tables/admin-usuarios/columns.ts
import type { ColumnDef } from '@tanstack/vue-table'
import { h } from 'vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-vue-next'

// --- Interfaz de apoyo ---
interface Area {
  id: number
  nombre: string
}

// --- Interfaz Usuario corregida ---
export interface Usuario {
  id: number
  nombre_usuario: string
  rol: 'Administrador' | 'Usuario'
  estado: 'ACTIVO' | 'INACTIVO'
  created_at: string
  empleado: {
    nombres: string
    apellido_paterno: string
    apellido_materno: string
    dni: string
    email: string
  }
  primary_area_id: number
  primary_area: Area | null // <- puede ser null
  areas: Area[]
}

// --- Helpers ---
const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

export const columns: ColumnDef<Usuario>[] = [
  {
    id: 'opciones',
    cell: ({ row, table }) => {
      const usuario = row.original
      const meta = table.options.meta as {
        openEditModal: (user: Usuario) => void
        handleDeactivate: (userId: number) => void
      }

      return h(DropdownMenu, () => [
        h(DropdownMenuTrigger, { asChild: true }, () =>
          h(Button, { variant: 'ghost', class: 'h-8 w-8 p-0' }, () =>
            h(MoreHorizontal, { class: 'h-4 w-4' }),
          ),
        ),
        h(DropdownMenuContent, { align: 'end' }, () => [
          h(DropdownMenuLabel, () => 'Acciones'),
          h(DropdownMenuItem, { onClick: () => meta.openEditModal(usuario) }, () => 'Editar'),
          h(
            DropdownMenuItem,
            {
              class: 'text-red-600',
              onClick: () => meta.handleDeactivate(usuario.id),
            },
            () => 'Desactivar',
          ),
        ]),
      ])
    },
  },
  {
    accessorKey: 'empleado.dni',
    header: 'DNI',
    cell: ({ row }) => h('div', row.original.empleado.dni),
  },
  {
    accessorKey: 'nombre_usuario',
    header: 'Usuario',
  },
  {
    accessorKey: 'empleado.email',
    header: 'Email',
    cell: ({ row }) => h('div', row.original.empleado.email),
  },
  {
    accessorKey: 'primary_area',
    header: 'Área Principal',
    // --- CORREGIDO: verificamos si existe antes de acceder a .nombre ---
    cell: ({ row }) => {
      const areaName = row.original.primary_area ? row.original.primary_area.nombre : 'No Asignada'
      return h('div', areaName)
    },
  },
  {
    accessorKey: 'rol',
    header: 'Rol',
    cell: ({ row }) =>
      h(
        Badge,
        {
          variant: row.original.rol === 'Administrador' ? 'default' : 'secondary',
        },
        () => row.original.rol,
      ),
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => {
      const isActive = row.original.estado === 'ACTIVO'
      return h(
        Badge,
        {
          variant: isActive ? 'outline' : 'destructive',
          class: isActive ? '' : 'text-white',
        },
        () => (isActive ? 'Activo' : 'Inactivo'),
      )
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Fecha de Creación',
    cell: ({ row }) => h('div', formatDate(row.getValue('created_at'))),
  },
]
