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

export interface Usuario {
  id: number
  nombre_usuario: string
  rol: 'Administrador' | 'Usuario'
  estado: 'ACTIVO' | 'INACTIVO'
  empleado: {
    nombres: string
    apellido_paterno: string
    apellido_materno: string
    dni: string
    email: string
  }
  area: {
    id: number
    nombre: string
  }
}

export const columns: ColumnDef<Usuario>[] = [
  {
    accessorKey: 'empleado.nombres',
    header: 'Nombre Completo',
    cell: ({ row }) => {
      const emp = row.original.empleado
      return h('div', `${emp.nombres} ${emp.apellido_paterno} ${emp.apellido_materno}`)
    },
  },
  {
    accessorKey: 'empleado.dni',
    header: 'DNI',
  },
  {
    accessorKey: 'nombre_usuario',
    header: 'Usuario',
  },
  {
    accessorKey: 'empleado.email',
    header: 'Email',
  },
  {
    accessorKey: 'area.nombre',
    header: 'Área',
  },
  {
    accessorKey: 'rol',
    header: 'Rol',
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => {
      const isActive = row.getValue('estado') === 'ACTIVO'
      return h(Badge, { variant: isActive ? 'default' : 'destructive', class: 'text-white' }, () =>
        isActive ? 'Activo' : 'Inactivo',
      )
    },
  },
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
            { class: 'text-red-600', onClick: () => meta.handleDeactivate(usuario.id) },
            () => 'Desactivar',
          ),
        ]),
      ])
    },
  },
]
