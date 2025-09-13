import type { ColumnDef } from '@tanstack/vue-table'
import { h } from 'vue'
import { FileText } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'

// --- INTERFAZ UNIFICADA ---
// Asegúrate de que tenga 'export' para poder importarla en otros archivos
export interface Movimiento {
  id: number
  created_at: string
  area_origen: { nombre: string }
  area_destino: { nombre: string }
  archivo_adjunto: string | null
  estado_movimiento: string
  proveido: string

  // Campos añadidos desde el documento padre por el backend
  codigo_unico: string
  documento_completo: string // Ej: "INFORME 93"
  asunto: string
  nro_folios: number
}

// --- HELPER PARA FECHAS ---
const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

// --- COLUMNAS ---
export const columns: ColumnDef<Movimiento>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'codigo_unico',
    header: 'Código Único',
  },
  {
    accessorKey: 'created_at',
    header: 'F. / Envio',
    cell: ({ row }) => h('div', { class: 'min-w-[140px]' }, formatDate(row.getValue('created_at'))),
  },
  {
    accessorKey: 'area_origen',
    header: 'Origen',
    cell: ({ row }) => h('div', row.original.area_origen.nombre),
  },
  {
    accessorKey: 'area_destino',
    header: 'Destino',
    cell: ({ row }) => h('div', row.original.area_destino.nombre),
  },
  {
    accessorKey: 'documento_completo',
    header: 'Documento',
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
    accessorKey: 'archivo_adjunto',
    header: 'PDF',
    cell: ({ row }) => {
      const adjunto = row.getValue('archivo_adjunto') as string | null
      if (adjunto) {
        // Ajusta la URL base según tu backend
        const url = `http://127.0.0.1:8000/storage/${adjunto.replace('public/', '')}`
        return h(
          'a',
          { href: url, target: '_blank', class: 'flex justify-center' },
          h(FileText, { class: 'h-5 w-5 text-red-600' }),
        )
      }
      return h('span', { class: 'text-muted-foreground' }, '-')
    },
  },
  {
    accessorKey: 'estado_movimiento',
    header: 'Estado',
    cell: ({ row }) => h(Badge, { variant: 'outline' }, () => row.getValue('estado_movimiento')),
  },
  {
    accessorKey: 'proveido',
    header: 'Observación / Proveído',
  },
]
