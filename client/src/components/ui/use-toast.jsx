import { useContext } from "react"
import { toast as showToast } from "sonner"

export const useToast = () => {
  return {
    toast: ({ title, description, variant = "default", ...props }) => {
      if (variant === "destructive") {
        return showToast.error(title, {
          description,
          ...props
        })
      }
      
      return showToast(title, {
        description,
        ...props
      })
    }
  }
} 