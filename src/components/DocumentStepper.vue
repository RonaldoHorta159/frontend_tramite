<script setup lang="ts">
import { computed } from 'vue'
import { Check, CircleDot, ArrowRightCircle } from 'lucide-vue-next'
import {
  Stepper,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperDescription,
  StepperTrigger,
} from '@/components/ui/stepper'

// La interfaz de Movimiento no cambia
interface Movimiento {
  id: number
  estado_movimiento: string
  created_at: string
  proveido: string
  area_destino: { nombre: string }
}

const props = defineProps<{
  movements: Movimiento[]
}>()

// La lógica para crear los pasos no cambia
const steps = computed(() => props.movements.map((mov, index) => ({
  id: index,
  title: mov.estado_movimiento,
  description: `Destino: ${mov.area_destino.nombre}`,
  content: mov.proveido,
})))

// La lógica para el paso activo no cambia
const activeStep = computed(() => {
  if (props.movements.length === 0) return 0
  return props.movements.length
})

// Función para obtener el ícono correcto según el estado
function getIconForState(state: string) {
  switch (state) {
    case 'FINALIZADO':
    case 'RECIBIDO':
      return Check
    case 'DERIVADO':
      return ArrowRightCircle
    default:
      return CircleDot
  }
}
</script>

<template>
  <div class="border rounded-lg p-6">
    <Stepper v-model:step="activeStep" orientation="vertical">
      <StepperItem v-for="step in steps" :key="step.id" v-slot="{ state }" :step="step.id + 1"
        :is-last-step="step.id === steps.length - 1">
        <StepperTrigger class="gap-4">
          <div class="rounded-full flex items-center justify-center size-8 shrink-0"
            :class="[state === 'active' || state === 'completed' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground']">
            <component :is="getIconForState(step.title)" class="size-5" />
          </div>
          <div class="flex flex-col items-start">
            <StepperTitle>{{ step.title }}</StepperTitle>
            <StepperDescription>{{ step.description }}</StepperDescription>
          </div>
        </StepperTrigger>

        <StepperSeparator />
      </StepperItem>
    </Stepper>
  </div>
</template>
