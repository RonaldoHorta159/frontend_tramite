// src/components/tables/recepcionar-modal/columns.ts
import type { ColumnDef } from '@tanstack/vue-table'
import { h } from 'vue'
import { Button } from '@/components/ui/button'

export interface DocumentoPendiente {
  id: number
  codigo_unico: string
  asunto: string
  proveido: string
  area_origen: { nombre: string }
}

export const columns: ColumnDef<DocumentoPendiente>[] = [
  {
    accessorKey: 'codigo_unico',
    header: 'Código',
  },
  {
    accessorKey: 'area_origen',
    header: 'Origen',
    cell: ({ row }) => h('div', row.original.area_origen.nombre),
  },
  {
    accessorKey: 'asunto',
    header: 'Asunto',
  },
  {
    accessorKey: 'proveido',
    header: 'Proveído',
  },
  {
    id: 'opciones',
    header: 'Opciones',
    cell: ({ row, table }) => {
      // Obtenemos la función desde la metadata de la tabla
      const handleRecepcionar = table.options.meta?.handleRecepcionar as (id: number) => void
      return h(
        'div',
        { class: 'text-right' },
        h(
          Button,
          {
            size: 'sm',
            onClick: () => handleRecepcionar?.(row.original.id),
          },
          () => 'Recepcionar',
        ),
      )
    },
  },
]
