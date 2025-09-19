<script setup lang="ts">
import { ref, onMounted } from 'vue'
import apiClient from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Inbox, Send } from 'lucide-vue-next'
import DocumentStepper from '@/components/DocumentStepper.vue'

// Interfaces
interface Movimiento {
  id: number;
  estado_movimiento: string;
  created_at: string;
  proveido: string;
  area_destino: { nombre: string };
  area_origen: { nombre: string };
}

// Estado del componente
const latestDocMovements = ref<Movimiento[]>([])
const isLoading = ref(true)

// Las estadísticas ahora son refs simples, no computadas
const totalEnviados = ref(0)
const totalEnBandeja = ref(0)
const totalFinalizados = ref(0)

onMounted(async () => {
  isLoading.value = true
  try {
    // Hacemos dos peticiones: una para las estadísticas y otra para el último trámite
    const [resStats, resMisDocs] = await Promise.all([
      apiClient.get('/dashboard/stats'),
      apiClient.get('/documentos?page=1'), // Solo necesitamos la lista para encontrar el más reciente
    ])

    // Asignamos los totales desde la nueva API de estadísticas
    totalEnviados.value = resStats.data.totalEnviados
    totalEnBandeja.value = resStats.data.totalEnBandeja
    totalFinalizados.value = resStats.data.totalFinalizados

    // Lógica para el stepper del último documento
    const misDocumentos = resMisDocs.data.data
    if (misDocumentos.length > 0) {
      const latestDocId = misDocumentos[0].id
      const resLatestDoc = await apiClient.get(`/documentos/${latestDocId}`)
      latestDocMovements.value = resLatestDoc.data.movimientos
    }

  } catch (error) {
    console.error('Error al cargar los datos del dashboard:', error)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="flex flex-col gap-6">

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Enviados</CardTitle>
          <Send class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ totalEnviados }}</div>
          <p class="text-sm text-muted-foreground">Total de trámites que has iniciado</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Bandeja de Entrada</CardTitle>
          <Inbox class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ totalEnBandeja }}</div>
          <p class="text-sm text-muted-foreground">Documentos pendientes de recepción</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Finalizados</CardTitle>
          <FileText class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ totalFinalizados }}</div>
          <p class="text-sm text-muted-foreground">Trámites completados en tu gestión</p>
        </CardContent>
      </Card>
    </div>

    <div>
      <h2 class="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">Último
        Trámite</h2>
      <template v-if="isLoading">
        <div class="text-center py-10 text-muted-foreground">Cargando seguimiento...</div>
      </template>
      <template v-else-if="latestDocMovements.length === 0">
        <div class="text-center py-10 text-muted-foreground">Aún no has creado ningún trámite.</div>
      </template>
      <template v-else>
        <DocumentStepper :movements="latestDocMovements" />
      </template>
    </div>
  </div>
</template>
