<script setup lang="ts">
// --- Importaciones ---
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Send } from 'lucide-vue-next'
import DataTable from '@/components/ui/table/DataTable.vue'
import { useEmitirTramite } from '@/composables/useEmitirTramite'

// --- Composable ---
const {
  mainTable,
  seguimientoTable,
  isLoading,
  globalFilter,
  isModalOpen,
  isSubmitting,
  isNumeroLoading,
  tiposDocumento,
  areas,
  newDoc,
  handleFileChange,
  resetForm,
  handleCreateDocument,
  isSeguimientoModalOpen,
  selectedDocHistory,
  isDerivarModalOpen,
  docToDerive,
  derivarFormData,
  handleDerivarSubmit,
  // --- Variables admin ---
  isAdmin,
  oficinasPermitidas, // ✅ lista dinámica según rol
  selectedAreaId,
} = useEmitirTramite()
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- 🔹 Header -->
    <header class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">
        {{ isAdmin ? 'Supervisión de Trámites Emitidos' : 'Mis Trámites Emitidos' }}
      </h1>

      <!-- Botón nuevo trámite: solo usuarios normales -->
      <Dialog v-model:open="isModalOpen">
        <DialogTrigger as-child>
          <Button class="mr-30">Nuevo Trámite</Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle class="text-lg font-semibold">EMITIR DOCUMENTO</DialogTitle>
            <DialogDescription>Rellene los campos para registrar un nuevo trámite.</DialogDescription>
          </DialogHeader>
          <form @submit.prevent="handleCreateDocument">
            <div class="grid gap-6 py-4">
              <!-- Tipo de doc / nro doc / folios -->
              <div class="grid grid-cols-3 gap-4">
                <div class="flex flex-col gap-2">
                  <Label for="tipo-doc">Tipo de Documento</Label>
                  <Select v-model="newDoc.tipo_documento_id">
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
                  <Label for="nro-doc">Nro de Documento</Label>
                  <Input id="nro-doc" v-model="newDoc.nro_documento" readonly class="bg-muted" />
                  <p class="text-xs text-muted-foreground">* Generado automáticamente</p>
                </div>
                <div class="flex flex-col gap-2">
                  <Label for="nro-folios">Nro de Folios</Label>
                  <Input id="nro-folios" v-model="newDoc.nro_folios" type="number" min="1" />
                </div>
              </div>

              <!-- Destino -->
              <div class="flex flex-col gap-2">
                <Label for="destino">Destino</Label>
                <Select v-model="newDoc.area_destino_id">
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un área de destino" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="area in areas" :key="area.id" :value="String(area.id)">
                      {{ area.nombre }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <!-- Asunto -->
              <div class="flex flex-col gap-2">
                <Label for="asunto">Asunto</Label>
                <Textarea id="asunto" v-model="newDoc.asunto" placeholder="Escriba el asunto del documento..." />
              </div>

              <!-- Archivo -->
              <div class="flex flex-col gap-2">
                <Label for="archivo">Adjuntar archivo en PDF</Label>
                <Input id="archivo" type="file" @change="handleFileChange" accept=".pdf" />
              </div>
            </div>

            <DialogFooter class="sm:justify-start gap-2">
              <Button type="submit" :disabled="isSubmitting || isNumeroLoading">
                <Send class="w-4 h-4 mr-2" />
                {{ isSubmitting ? "Enviando..." : "Enviar" }}
              </Button>
              <Button type="button" variant="secondary" @click="resetForm">Nuevo</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </header>

    <!-- 🔹 Selector de oficina -->
    <div class="flex flex-col gap-2 max-w-sm">
      <Label for="area-selector">
        {{ isAdmin ? "Seleccione una Oficina para supervisar" : "Viendo trámites de la oficina:" }}
      </Label>
      <Select v-model="selectedAreaId">
        <SelectTrigger id="area-selector">
          <SelectValue :placeholder="isAdmin ? 'Elija una oficina...' : 'Seleccione una oficina...'" />
        </SelectTrigger>
        <SelectContent>
          <!-- ✅ lista dinámica según rol -->
          <SelectItem v-for="area in oficinasPermitidas" :key="area.id" :value="String(area.id)">
            {{ area.nombre }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- 🔎 Filtro global -->
    <div class="flex items-center py-4">
      <Input v-model="globalFilter" class="max-w-sm" placeholder="Buscar trámites..." />
    </div>

    <!-- 📊 Tabla -->
    <div v-if="isAdmin && !selectedAreaId && !isLoading" class="text-center text-muted-foreground py-10">
      Por favor, seleccione una oficina para comenzar la supervisión.
    </div>
    <DataTable v-else-if="!isLoading" :table="mainTable" id="tour-step-3-tabla" />
    <div v-else class="text-center text-muted-foreground py-10">Cargando...</div>

    <!-- 🔹 Seguimiento -->
    <Dialog v-model:open="isSeguimientoModalOpen">
      <DialogContent class="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Seguimiento del Trámite: {{ selectedDocHistory?.codigo_unico }}</DialogTitle>
          <DialogDescription>Asunto: {{ selectedDocHistory?.asunto }}</DialogDescription>
        </DialogHeader>
        <div class="py-4 max-h-[70vh] overflow-y-auto">
          <DataTable v-if="selectedDocHistory" :table="seguimientoTable" />
        </div>
      </DialogContent>
    </Dialog>

    <!-- 🔹 Derivar -->
    <Dialog v-model:open="isDerivarModalOpen">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Derivar Documento: {{ docToDerive?.codigo_unico }}</DialogTitle>
          <DialogDescription>Seleccione un destino y añada un proveído.</DialogDescription>
        </DialogHeader>
        <form @submit.prevent="handleDerivarSubmit" class="grid gap-4 py-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="destino-derivar" class="text-right">Destino</Label>
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
            <Label for="proveido-derivar" class="text-right">Proveído</Label>
            <Textarea id="proveido-derivar" v-model="derivarFormData.proveido" class="col-span-3" />
          </div>
          <DialogFooter>
            <Button type="submit">Derivar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
