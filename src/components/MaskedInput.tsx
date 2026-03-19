import { IMaskInput } from 'react-imask'
import { Controller, Control, FieldValues, Path } from 'react-hook-form'

interface MaskedInputProps<T extends FieldValues> {
  name: Path<T>
  control: Control<T>
  mask: string
  placeholder?: string
  className?: string
}

export default function MaskedInput<T extends FieldValues>({
  name,
  control,
  mask,
  placeholder,
  className = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500',
}: MaskedInputProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <IMaskInput
          mask={mask}
          value={field.value ?? ''}
          onAccept={(value) => field.onChange(value)}
          onBlur={field.onBlur}
          placeholder={placeholder}
          className={className}
        />
      )}
    />
  )
}
