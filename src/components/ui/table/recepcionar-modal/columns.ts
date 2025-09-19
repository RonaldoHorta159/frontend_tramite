import type { ColumnDef } from '@tanstack/vue-table'
import { h } from 'vue'
import { Button } from '@/components/ui/button'

export interface DocumentoPendiente {
  id: number
  codigo_unico: string
  asunto: string
  latest_movement: {
    // Usamos snake_case para coincidir con la API
    proveido: string
    area_origen: { nombre: string }
  } | null
}

// --- ASEGÚRATE DE QUE 'export' ESTÉ AQUÍ ---
export const columns: ColumnDef<DocumentoPendiente>[] = [
  {
    accessorKey: 'codigo_unico',
    header: 'Código',
  },
  {
    header: 'Origen (Quien Deriva)',
    cell: ({ row }) => h('div', row.original.latest_movement?.area_origen?.nombre || 'N/A'),
  },
  {
    accessorKey: 'asunto',
    header: 'Asunto',
  },
  {
    header: 'Proveído',
    cell: ({ row }) => h('div', row.original.latest_movement?.proveido || 'N/A'),
  },
  {
    id: 'opciones',
    header: 'Opciones',
    cell: ({ row, table }) => {
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
