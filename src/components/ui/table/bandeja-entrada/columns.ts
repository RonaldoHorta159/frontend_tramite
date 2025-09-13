// src/components/tables/bandeja-entrada/columns.ts
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
import { useAuthStore } from '@/stores/authStore'

// Helpers
const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

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

// Interface
export interface DocumentoRecibido {
  id: number
  codigo_unico: string
  nro_libro: string | null
  created_at: string
  tipo_documento: { nombre: string }
  asunto: string
  nro_folios: number
  area_origen: { id: number; nombre: string }
  archivo_pdf: string | null
  estado_general: string
  latestMovement: { proveido: string } | null
  area_actual_id: number
  respuesta_para_documento_id: number | null
  fue_recibido_en_area_actual: boolean
}

export const columns: ColumnDef<DocumentoRecibido>[] = [
  {
    id: 'opciones',
    cell: ({ row, table }) => {
      const doc = row.original
      const meta = table.options.meta as {
        handleSeguimiento?: (documento: DocumentoRecibido) => void
        handleDerivar?: (documento: DocumentoRecibido) => void
        handleOpenResponderModal?: (documento: DocumentoRecibido) => void
        handleFinalizar?: (documento: DocumentoRecibido) => void
      }

      const authStore = useAuthStore()
      const accessibleAreaIds = [
        ...(authStore.user?.areas.map((a) => a.id) || []),
        authStore.user?.primary_area_id,
      ]

      // --- Lógica de visibilidad ---
      const estaEnMiOficina = accessibleAreaIds.includes(doc.area_actual_id)
      const noEstaFinalizado = doc.estado_general !== 'FINALIZADO'
      const esProcesable =
        estaEnMiOficina && noEstaFinalizado && doc.respuesta_para_documento_id === null

      return h(DropdownMenu, () => [
        h(DropdownMenuTrigger, { asChild: true }, () =>
          h(Button, { variant: 'ghost', class: 'h-8 w-8 p-0' }, () =>
            h(MoreHorizontal, { class: 'h-4 w-4' }),
          ),
        ),
        h(DropdownMenuContent, { align: 'end' }, () => [
          h(DropdownMenuLabel, () => 'Opciones'),

          // Siempre disponible
          h(
            DropdownMenuItem,
            { onClick: () => meta.handleSeguimiento?.(doc) },
            () => 'Dar Seguimiento',
          ),

          // Opciones condicionales
          esProcesable &&
            h(DropdownMenuItem, { onClick: () => meta.handleDerivar?.(doc) }, () => 'Derivar'),

          esProcesable &&
            doc.fue_recibido_en_area_actual &&
            h(
              DropdownMenuItem,
              { onClick: () => meta.handleOpenResponderModal?.(doc) },
              () => 'Responder',
            ),

          esProcesable &&
            doc.fue_recibido_en_area_actual &&
            h(
              DropdownMenuItem,
              { class: 'text-red-600', onClick: () => meta.handleFinalizar?.(doc) },
              () => 'Finalizar Trámite',
            ),
        ]),
      ])
    },
  },
  { accessorKey: 'codigo_unico', header: 'Código Único' },
  {
    accessorKey: 'nro_libro',
    header: 'N° Libro',
    cell: ({ row }) => h('div', row.getValue('nro_libro') || 'N/A'),
  },
  {
    accessorKey: 'created_at',
    header: 'Fecha',
    cell: ({ row }) => h('div', formatDate(row.getValue('created_at'))),
  },
  {
    accessorKey: 'tipo_documento',
    header: 'Documento',
    cell: ({ row }) => h('div', row.original.tipo_documento.nombre),
  },
  { accessorKey: 'asunto', header: 'Asunto' },
  { accessorKey: 'nro_folios', header: 'Folios' },
  {
    accessorKey: 'area_origen',
    header: 'Origen',
    cell: ({ row }) => h('div', row.original.area_origen.nombre),
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
    accessorKey: 'latestMovement',
    header: 'Proveído',
    cell: ({ row }) => h('div', row.original.latestMovement?.proveido || 'N/A'),
  },
]
