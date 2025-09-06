<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import DataTable from '../../components/ui/table/DataTable.vue'
import { useAdminAreas } from '../../composables/useAdminAreas'

const {
    table,
    isLoading,
    isModalOpen,
    isEditing,
    formData,
    openCreateModal,
    handleSubmit,
} = useAdminAreas()
</script>

<template>
    <div class="flex flex-col gap-4 mt-15">
        <header class="flex items-center justify-between">
            <h1 class="text-2xl font-bold">Gestión de Áreas</h1>
            <Button @click="openCreateModal">Crear Nueva Área</Button>
        </header>

        <template v-if="isLoading">
            <div class="text-center py-10">Cargando...</div>
        </template>
        <template v-else>
            <DataTable :table="table" />
        </template>

        <Dialog v-model:open="isModalOpen">
            <DialogContent class="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{{ isEditing ? 'Editar Área' : 'Crear Nueva Área' }}</DialogTitle>
                    <DialogDescription>
                        Completa la información del área. Haz clic en guardar para finalizar.
                    </DialogDescription>
                </DialogHeader>
                <form @submit.prevent="handleSubmit">
                    <div class="grid gap-4 py-4">
                        <div class="grid grid-cols-4 items-center gap-4">
                            <Label for="nombre" class="text-right">Nombre</Label>
                            <Input id="nombre" v-model="formData.nombre" class="col-span-3" />
                        </div>
                        <div class="grid grid-cols-4 items-center gap-4">
                            <Label for="estado" class="text-right">Estado</Label>
                            <Select v-model="formData.estado">
                                <SelectTrigger class="col-span-3">
                                    <SelectValue placeholder="Seleccione un estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ACTIVO">Activo</SelectItem>
                                    <SelectItem value="INACTIVO">Inactivo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Guardar Cambios</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </div>
</template>