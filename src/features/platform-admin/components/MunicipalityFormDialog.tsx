import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormDialog } from '@/components/common/FormDialog'
import { TextField } from '@/components/common/TextField'
import { messages } from '@/config/messages'
import { applyFieldErrors } from '@/lib/forms'
import { useLocalities, useProvinces } from '../api/geo'
import { useCreateMunicipality, useUpdateMunicipality } from '../api/municipalities'
import type { MunicipalityDetail } from '../types'
import { CoverageBoundaryPicker } from './CoverageBoundaryPicker'
import { LocalityCombobox } from './LocalityCombobox'

/** Mínimo para encerrar área. El backend valida lo mismo. */
const MIN_BOUNDARY_POINTS = 3
const labels = messages.municipalities

const schema = z.object({
  province: z.string().trim().min(1, 'Elegí la provincia.'),
  city: z.string().trim().min(1, 'Elegí la ciudad.'),
  latitude: z.number({ message: 'Elegí la ciudad para ubicar el mapa.' }),
  longitude: z.number({ message: 'Elegí la ciudad para ubicar el mapa.' }),
  boundary: z
    .array(z.tuple([z.number(), z.number()]))
    .min(MIN_BOUNDARY_POINTS, 'Trazá el límite: hacen falta al menos tres puntos.'),
})

type MunicipalityForm = z.infer<typeof schema>

/** Nombres de campo de la API -> nombres del formulario. */
const FIELD_MAP = {} as const

interface Props {
  /** Presente para editar; ausente para dar de alta. */
  municipality?: MunicipalityDetail
  trigger: React.ReactNode
}

/**
 * Alta y edición de una municipalidad.
 *
 * El flujo es en cascada: se elige la provincia, eso carga sus localidades, y
 * elegir una deja puesto el centro del área de cobertura con el centroide
 * oficial. Al administrador solo le queda ajustar el radio.
 */
export function MunicipalityFormDialog({ municipality, trigger }: Props) {
  const isEdit = municipality !== undefined
  const [open, setOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [pickedProvinceId, setPickedProvinceId] = useState<string | null>(null)
  const createMunicipality = useCreateMunicipality()
  const updateMunicipality = useUpdateMunicipality(municipality?.id ?? 0)

  const form = useForm<MunicipalityForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      province: municipality?.province ?? '',
      city: municipality?.city ?? '',
      boundary: municipality?.boundary ?? [],
      latitude: municipality?.latitude
        ? Number(municipality.latitude)
        : (undefined as unknown as number),
      longitude: municipality?.longitude
        ? Number(municipality.longitude)
        : (undefined as unknown as number),
    },
  })

  const province = useWatch({ control: form.control, name: 'province' })
  const city = useWatch({ control: form.control, name: 'city' })
  const latitude = useWatch({ control: form.control, name: 'latitude' })
  const longitude = useWatch({ control: form.control, name: 'longitude' })
  const boundary = useWatch({ control: form.control, name: 'boundary' })

  const provincesQuery = useProvinces()
  // Al editar, la provincia viene guardada por nombre: se resuelve su id contra
  // el catálogo en lugar de arrastrarlo en un efecto.
  const provinceId =
    pickedProvinceId ??
    provincesQuery.data?.find((item) => item.name === province)?.id ??
    null
  const localitiesQuery = useLocalities(provinceId)
  const localities = localitiesQuery.data ?? []
  const catalogUnavailable =
    provinceId !== null && localitiesQuery.isSuccess && localities.length === 0

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      form.reset()
      setPickedProvinceId(null)
      setFormError(null)
    }
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null)
    try {
      if (isEdit) {
        await updateMunicipality.mutateAsync(values)
        toast.success(labels.updated)
      } else {
        await createMunicipality.mutateAsync(values)
        toast.success(labels.created)
      }
      handleOpenChange(false)
    } catch (error) {
      // El duplicado llega como error del campo `city`, así que se muestra
      // debajo del input y no como un toast genérico.
      setFormError(applyFieldErrors(error, form.setError, FIELD_MAP))
    }
  })

  return (
    <FormDialog
      open={open}
      onOpenChange={handleOpenChange}
      trigger={trigger}
      title={isEdit ? labels.editTitle : labels.createTitle}
      error={formError}
      isSubmitting={form.formState.isSubmitting}
      onSubmit={onSubmit}
    >
      <Controller
        control={form.control}
        name="province"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="province">{labels.province}</FieldLabel>
            <Select
              value={provinceId ?? ''}
              disabled={provincesQuery.isPending}
              onValueChange={(id) => {
                const selected = provincesQuery.data?.find((item) => item.id === id)
                setPickedProvinceId(id)
                field.onChange(selected?.name ?? '')
                // Cambiar de provincia invalida la ciudad y su centro: dejarlos
                // sería crear un municipio con la ciudad de otra provincia.
                form.resetField('city', { defaultValue: '' })
                form.resetField('latitude')
                form.resetField('longitude')
              }}
            >
              <SelectTrigger id="province" aria-invalid={fieldState.invalid}>
                <SelectValue
                  placeholder={
                    provincesQuery.isPending
                      ? labels.provinceLoading
                      : labels.provincePlaceholder
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {provincesQuery.data?.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {catalogUnavailable ? (
        // Georef no respondió: se escribe el nombre y el centro va a mano, en
        // lugar de dejar el formulario inutilizable.
        <TextField
          control={form.control}
          name="city"
          label={labels.city}
          description={labels.cityUnavailable}
        />
      ) : (
        <Controller
          control={form.control}
          name="city"
          render={({ fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="city">{labels.city}</FieldLabel>
              <LocalityCombobox
                id="city"
                localities={localities}
                value={city}
                isLoading={localitiesQuery.isFetching}
                disabled={provinceId === null}
                invalid={fieldState.invalid}
                onSelect={(locality) => {
                  form.setValue('city', locality.name, { shouldValidate: true })
                  // El centroide oficial deja el área de cobertura ubicada.
                  form.setValue('latitude', locality.latitude, {
                    shouldValidate: true,
                  })
                  form.setValue('longitude', locality.longitude, {
                    shouldValidate: true,
                  })
                }}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      )}

      <Field data-invalid={form.formState.errors.boundary !== undefined}>
        <FieldLabel htmlFor="coverage-map">{labels.boundary}</FieldLabel>
        <FieldDescription>{labels.boundaryHelp}</FieldDescription>
        <div id="coverage-map">
          <CoverageBoundaryPicker
            center={
              typeof latitude === 'number' && typeof longitude === 'number'
                ? [latitude, longitude]
                : null
            }
            boundary={boundary ?? []}
            onChange={(points) =>
              form.setValue('boundary', points, { shouldValidate: true })
            }
          />
        </div>
        {form.formState.errors.boundary && (
          <FieldError errors={[form.formState.errors.boundary]} />
        )}
      </Field>
    </FormDialog>
  )
}

export function CreateMunicipalityDialog() {
  return <MunicipalityFormDialog trigger={<Button>{labels.create}</Button>} />
}
