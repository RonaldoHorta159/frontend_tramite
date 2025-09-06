<script setup lang="ts" generic="TData">
import { type Table } from '@tanstack/vue-table'
import { FlexRender } from '@tanstack/vue-table'
import DataTablePagination from './DataTablePagination.vue'
import {
  Table as ShadcnTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useSidebar } from '@/components/ui/sidebar' // 1. Importamos el hook del sidebar
import { computed } from 'vue'

const props = defineProps<{
  table: Table<TData>
}>()

// 2. Obtenemos el estado del sidebar
const { state } = useSidebar()

// 3. Creamos una clase computada que se aplica condicionalmente
const tableContainerClass = computed(() => {
  return state.value === 'expanded'
    ? 'rounded-md border overflow-x-auto' // Con scroll si está expandido
    : 'rounded-md border'                  // Sin scroll si está colapsado
})

// 4. Creamos otra clase computada para el texto
const cellClass = computed(() => {
  return state.value === 'expanded'
    ? 'whitespace-nowrap' // No cortar texto si hay scroll
    : ''                  // Permitir cortar texto si no hay scroll
})
</script>

<template>
  <div class="space-y-4">
    <div :class="tableContainerClass">
      <ShadcnTable>
        <TableHeader>
          <TableRow v-for="headerGroup in props.table.getHeaderGroups()" :key="headerGroup.id">
            <TableHead v-for="header in headerGroup.headers" :key="header.id" :class="cellClass">
              <FlexRender v-if="!header.isPlaceholder" :render="header.column.columnDef.header"
                :props="header.getContext()" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="props.table.getRowModel().rows?.length">
            <TableRow v-for="row in props.table.getRowModel().rows" :key="row.id"
              :data-state="row.getIsSelected() && 'selected'">
              <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id" :class="cellClass">
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </TableCell>
            </TableRow>
          </template>
          <template v-else>
            <TableRow>
              <TableCell :colspan="props.table.getAllColumns().length" class="h-24 text-center">
                No hay resultados.
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </ShadcnTable>
    </div>
    <DataTablePagination :table="props.table" />
  </div>
</template>
