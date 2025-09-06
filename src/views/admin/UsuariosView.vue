<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import DataTable from '../../components/ui/table/DataTable.vue'
import { useAdminUsuarios } from '@/composables/useAdminUsuarios'

const {
  table,
  isLoading,
  isModalOpen,
  isEditing,
  formData,
  areas,
  globalFilter,
  openCreateModal,
  handleSubmit,
} = useAdminUsuarios()
</script>

<template>
  <div class="flex flex-col gap-4 mt-15">
    <header class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Gestión de Empleados y Usuarios</h1>
      <Button @click="openCreateModal">Crear Nuevo Usuario</Button>
    </header>

    <Input v-model="globalFilter" placeholder="Buscar usuario..." class="max-w-sm" />

    <template v-if="isLoading">
      <div class="text-center py-10">Cargando...</div>
    </template>
    <template v-else>
      <DataTable :table="table" />
    </template>

    <Dialog v-model:open="isModalOpen">
      <DialogContent class="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{{ isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario' }}</DialogTitle>
          <DialogDescription>
            Rellena los datos personales y de acceso.
          </DialogDescription>
        </DialogHeader>
        <form @submit.prevent="handleSubmit">
          <div class="grid grid-cols-2 gap-4 py-4">
            <div><Label for="nombres">Nombres</Label><Input id="nombres" v-model="formData.nombres" /></div>
            <div><Label for="apellido_paterno">Apellido Paterno</Label><Input id="apellido_paterno"
                v-model="formData.apellido_paterno" /></div>
            <div><Label for="apellido_materno">Apellido Materno</Label><Input id="apellido_materno"
                v-model="formData.apellido_materno" /></div>
            <div><Label for="dni">DNI</Label><Input id="dni" v-model="formData.dni" /></div>
            <div class="col-span-2"><Label for="email">Email</Label><Input id="email" v-model="formData.email"
                type="email" /></div>

            <div class="col-span-2">
              <hr class="my-2">
            </div>

            <div><Label for="area">Área</Label>
              <Select v-model="formData.area_id">
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="area in areas" :key="area.id" :value="String(area.id)">{{ area.nombre }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label for="nombre_usuario">Nombre de Usuario</Label><Input id="nombre_usuario"
                v-model="formData.nombre_usuario" /></div>
            <div><Label for="rol">Rol</Label>
              <Select v-model="formData.rol">
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Administrador">Administrador</SelectItem>
                  <SelectItem value="Usuario">Usuario</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div v-if="isEditing"><Label for="estado">Estado</Label>
              <Select v-model="formData.estado">
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVO">Activo</SelectItem>
                  <SelectItem value="INACTIVO">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="col-span-2"><Label for="password">Contraseña</Label><Input id="password"
                v-model="formData.password" type="password"
                :placeholder="isEditing ? 'Dejar en blanco para no cambiar' : ''" /></div>
            <div class="col-span-2"><Label for="password_confirmation">Confirmar Contraseña</Label><Input
                id="password_confirmation" v-model="formData.password_confirmation" type="password" /></div>
          </div>
          <DialogFooter>
            <Button type="submit">Guardar Cambios</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
