// src/components/tables/emitir-tramite/columns.ts
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
import { MoreHorizontal, FileText, ArrowUpDown } from 'lucide-vue-next'

// =======================
// Helpers
// =======================

// Formateo de fechas
const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

// Colores según estado
const getBadgeClass = (estado: string) => {
  switch (estado) {
    case 'FINALIZADO':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'RECHAZADO':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'ARCHIVADO':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    default:
      return 'bg-blue-100 text-blue-800 border-blue-200'
  }
}

// =======================
// Tipo de dato de la tabla
// =======================
export interface DocumentoEmitido {
  id: number
  codigo_unico: string
  nro_documento: string
  created_at: string
  tipo_documento: { nombre: string }
  asunto: string
  nro_folios: number
  area_actual: { nombre: string }
  estado_general: string
  archivo_pdf: string | null
  latestMovement: { proveido: string } | null
}

// =======================
// Definición de columnas
// =======================
export const columns: ColumnDef<DocumentoEmitido>[] = [
  {
    id: 'opciones',
    header: 'Opciones',
    cell: ({ row, table }) => {
      const doc = row.original
      const meta = table.options.meta as {
        handleSeguimiento?: (documento: DocumentoEmitido) => void
        handleDerivar?: (documento: DocumentoEmitido) => void
      }
      return h(DropdownMenu, () => [
        h(DropdownMenuTrigger, { asChild: true }, () =>
          h(Button, { variant: 'ghost', class: 'h-8 w-8 p-0' }, () =>
            h(MoreHorizontal, { class: 'h-4 w-4' }),
          ),
        ),
        h(DropdownMenuContent, { align: 'end' }, () => [
          h(DropdownMenuLabel, () => 'Acciones'),
          h(
            DropdownMenuItem,
            { onClick: () => meta.handleSeguimiento?.(doc) },
            () => 'Dar Seguimiento',
          ),
          h(DropdownMenuItem, { onClick: () => meta.handleDerivar?.(doc) }, () => 'Derivar'),
        ]),
      ])
    },
  },
  {
    accessorKey: 'codigo_unico',
    header: ({ column }) =>
      h(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Código Único', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
  },
  {
    accessorKey: 'nro_documento',
    header: 'N° Doc.',
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) =>
      h(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Fecha', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) => h('div', formatDate(row.getValue('created_at'))),
  },
  {
    accessorKey: 'tipo_documento',
    header: 'Documento',
    cell: ({ row }) => h('div', row.original.tipo_documento.nombre),
  },
  {
    accessorKey: 'asunto',
    header: 'Asunto',
  },
  {
    accessorKey: 'nro_folios',
    header: 'Nro Folios',
  },
  {
    accessorKey: 'area_actual',
    header: 'Destino',
    cell: ({ row }) => h('div', row.original.area_actual.nombre),
  },
  {
    accessorKey: 'estado_general',
    header: 'Estado',
    cell: ({ row }) => {
      const estado = row.getValue('estado_general') as string
      return h(Badge, { class: getBadgeClass(estado) }, () => estado)
    },
  },
  {
    accessorKey: 'archivo_pdf',
    header: 'PDF',
    cell: ({ row }) => {
      const doc = row.original
      if (doc.archivo_pdf) {
        const url = `http://127.0.0.1:8000/storage/${doc.archivo_pdf.replace('public/', '')}`
        return h(
          'a',
          { href: url, target: '_blank' },
          h(FileText, { class: 'h-5 w-5 text-red-600' }),
        )
      }
      return h('span', { class: 'text-muted-foreground' }, 'N/A')
    },
  },
  {
    accessorKey: 'latestMovement',
    header: 'Proveído',
    cell: ({ row }) => h('div', row.original.latestMovement?.proveido || 'N/A'),
  },
]
