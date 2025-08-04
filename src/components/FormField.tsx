import type React from "react"

interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  helper?: string
  children: React.ReactNode
}

const FormField: React.FC<FormFieldProps> = ({ label, required = false, error, helper, children }) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-900">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {helper && !error && <p className="text-sm text-gray-500">{helper}</p>}
    </div>
  )
}

export default FormField
