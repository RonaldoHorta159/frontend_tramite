<script setup lang="ts">
// --- IMPORTACIONES COMPLETAS DE COMPONENTES DE UI ---
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Download, Send } from 'lucide-vue-next'
import DataTable from '@/components/ui/table/DataTable.vue'
import { useBandejaEntrada } from '@/composables/useBandejaEntrada'

// --- INVOCAMOS EL COMPOSABLE ---
// Obtenemos toda la lógica y el estado desde un solo lugar.
const {
  isLoading, mainFilter, modalFilter, documentosPendientes, areas, tiposDocumento,
  mainTable, modalTable, seguimientoTable,
  isSeguimientoModalOpen, selectedDocHistory,
  isDerivarModalOpen, docToDerive, derivarFormData, handleDerivarSubmit,
  isResponderModalOpen, isSubmittingResponse, isNumeroLoading, docToRespond,
  respuestaFormData, handleFileChangeRespuesta, handleSubmitRespuesta,
} = useBandejaEntrada()
</script>

<template>
  <div class="flex flex-col gap-4 mt-15">
    <header class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Bandeja de Entrada</h1>
      <Dialog>
        <DialogTrigger as-child>
          <Button>
            <Download class="w-4 h-4 mr-2" />Recepcionar Documentos ({{ documentosPendientes.length }})
          </Button>
        </DialogTrigger>
        <DialogContent class="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Documentos Pendientes de Recepción</DialogTitle>
            <DialogDescription>
              Selecciona los documentos para confirmar su recepción.
            </DialogDescription>
          </DialogHeader>
          <div class="flex flex-col gap-4 py-4">
            <Input v-model="modalFilter" placeholder="Buscar en pendientes..." class="max-w-sm" />
            <DataTable :table="modalTable" />
          </div>
        </DialogContent>
      </Dialog>
    </header>

    <Input v-model="mainFilter" placeholder="Buscar en toda la bandeja..." class="max-w-sm" />
    <template v-if="isLoading">
      <div class="text-center text-muted-foreground py-10">Cargando...</div>
    </template>
    <template v-else>
      <DataTable :table="mainTable" />
    </template>

    <!-- Modal Seguimiento -->
    <Dialog v-model:open="isSeguimientoModalOpen">
      <DialogContent class="max-w-7xl">
        <DialogHeader>
          <DialogTitle>Seguimiento del Trámite: {{ selectedDocHistory?.codigo_unico }}</DialogTitle>
          <DialogDescription>
            Historial completo de movimientos del documento.
          </DialogDescription>
        </DialogHeader>
        <div class="py-4 max-h-[70vh] overflow-y-auto">
          <DataTable v-if="selectedDocHistory" :table="seguimientoTable" />
        </div>
      </DialogContent>
    </Dialog>

    <!-- Modal Derivar -->
    <Dialog v-model:open="isDerivarModalOpen">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Derivar Documento: {{ docToDerive?.codigo_unico }}</DialogTitle>
          <DialogDescription>
            Seleccione un destino y añada un proveído para continuar el trámite.
          </DialogDescription>
        </DialogHeader>
        <form @submit.prevent="handleDerivarSubmit" class="grid gap-4 py-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right">Destino</Label>
            <Select v-model="derivarFormData.area_destino_id">
              <SelectTrigger class="col-span-3">
                <SelectValue placeholder="Seleccione un área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="area in areas" :key="area.id" :value="String(area.id)">
                  {{ area.nombre }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right">Proveído</Label>
            <Textarea v-model="derivarFormData.proveido" class="col-span-3" placeholder="Escriba su proveído aquí..." />
          </div>
          <DialogFooter>
            <Button type="submit">Derivar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Modal Respuesta -->
    <Dialog v-model:open="isResponderModalOpen">
      <DialogContent class="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle class="text-lg font-semibold">
            Responder Trámite: {{ docToRespond?.codigo_unico }}
          </DialogTitle>
          <DialogDescription>
            Complete los campos para generar el documento de respuesta.
          </DialogDescription>
        </DialogHeader>
        <form @submit.prevent="handleSubmitRespuesta">
          <div class="grid gap-6 py-4">
            <div class="grid grid-cols-3 gap-4">
              <div class="flex flex-col gap-2">
                <Label>Tipo de Documento</Label>
                <Select v-model="respuestaFormData.tipo_documento_id">
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="tipo in tiposDocumento" :key="tipo.id" :value="String(tipo.id)">
                      {{ tipo.nombre }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="flex flex-col gap-2">
                <Label>Nro de Documento</Label>
                <Input v-model="respuestaFormData.nro_documento" readonly class="bg-muted" />
              </div>
              <div class="flex flex-col gap-2">
                <Label>Nro de Folios</Label>
                <Input v-model="respuestaFormData.nro_folios" type="number" min="1" />
              </div>
            </div>
            <div class="flex flex-col gap-2">
              <Label>Destino</Label>
              <Select v-model="respuestaFormData.area_destino_id">
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="area in areas" :key="area.id" :value="String(area.id)">
                    {{ area.nombre }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="flex flex-col gap-2">
              <Label>Asunto</Label>
              <Textarea v-model="respuestaFormData.asunto" />
            </div>
            <div class="flex flex-col gap-2">
              <Label>Adjuntar archivo (PDF)</Label>
              <Input type="file" @change="handleFileChangeRespuesta" accept=".pdf" />
            </div>
          </div>
          <DialogFooter class="sm:justify-start gap-2">
            <Button type="submit" :disabled="isSubmittingResponse || isNumeroLoading">
              <Send class="w-4 h-4 mr-2" />
              {{ isSubmittingResponse ? 'Enviando...' : 'Enviar Respuesta' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
