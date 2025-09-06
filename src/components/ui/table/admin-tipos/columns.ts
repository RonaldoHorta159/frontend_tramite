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

export interface TipoDoc {
  id: number
  nombre: string
  estado: 'ACTIVO' | 'INACTIVO'
}

export const columns: ColumnDef<TipoDoc>[] = [
  {
    accessorKey: 'nombre',
    header: 'Nombre del Tipo de Documento',
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => {
      const isActive = row.getValue('estado') === 'ACTIVO'
      return h(
        Badge,
        {
          variant: isActive ? 'default' : 'destructive',
          class: 'text-white',
        },
        () => (isActive ? 'Activo' : 'Inactivo'),
      )
    },
  },
  {
    id: 'opciones',
    cell: ({ row, table }) => {
      const tipoDoc = row.original
      const meta = table.options.meta as {
        openEditModal: (tipo: TipoDoc) => void
        handleDeactivate: (id: number) => void
      }

      return h(DropdownMenu, () => [
        h(DropdownMenuTrigger, { asChild: true }, () =>
          h(Button, { variant: 'ghost', class: 'h-8 w-8 p-0' }, () =>
            h(MoreHorizontal, { class: 'h-4 w-4' }),
          ),
        ),
        h(DropdownMenuContent, { align: 'end' }, () => [
          h(DropdownMenuLabel, () => 'Acciones'),
          h(DropdownMenuItem, { onClick: () => meta.openEditModal(tipoDoc) }, () => 'Editar'),
          h(
            DropdownMenuItem,
            {
              class: 'text-red-600',
              onClick: () => meta.handleDeactivate(tipoDoc.id),
            },
            () => 'Desactivar',
          ),
        ]),
      ])
    },
  },
]
