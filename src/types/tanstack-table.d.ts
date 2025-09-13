// src/types/tanstack-table.d.ts

import '@tanstack/vue-table'
import type { RowData } from '@tanstack/vue-table'

declare module '@tanstack/vue-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    // Funciones para la bandeja de entrada
    handleDerivar?: (documento: TData) => void
    handleSeguimiento?: (documento: TData) => void
    handleRecepcionar?: (id: number) => void

    // --- FUNCIONES AÑADIDAS PARA LOS PANELES DE ADMIN ---
    openEditModal?: (data: TData) => void
    handleDeactivate?: (id: number) => void
    handleOpenResponderModal?: (documento: DocumentoRecibido) => void
    handleFinalizar?: (documento: DocumentoRecibido) => void
  }
}
