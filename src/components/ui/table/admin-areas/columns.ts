// src/components/tables/admin-areas/columns.ts

import type { ColumnDef } from '@tanstack/vue-table'
import { h } from 'vue'
import { Button } from '../../button'
import { Badge } from '../../badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '../../dropdown-menu'
import { MoreHorizontal } from 'lucide-vue-next'

export interface Area {
  id: number
  nombre: string
  estado: 'ACTIVO' | 'INACTIVO'
}

export const columns: ColumnDef<Area>[] = [
  {
    accessorKey: 'nombre',
    header: 'Nombre del Área',
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
      const area = row.original
      const meta = table.options.meta as {
        openEditModal: (area: Area) => void
        handleDeactivate: (areaId: number) => void
      }

      return h(DropdownMenu, () => [
        h(DropdownMenuTrigger, { asChild: true }, () =>
          h(Button, { variant: 'ghost', class: 'h-8 w-8 p-0' }, () =>
            h(MoreHorizontal, { class: 'h-4 w-4' }),
          ),
        ),
        h(DropdownMenuContent, { align: 'end' }, () => [
          h(DropdownMenuLabel, () => 'Acciones'),
          h(DropdownMenuItem, { onClick: () => meta.openEditModal(area) }, () => 'Editar'),
          h(
            DropdownMenuItem,
            {
              class: 'text-red-600',
              onClick: () => meta.handleDeactivate(area.id),
            },
            () => 'Desactivar',
          ),
        ]),
      ])
    },
  },
]
