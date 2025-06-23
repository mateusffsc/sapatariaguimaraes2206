import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  
  // Verificar se a data é válida
  if (isNaN(date.getTime())) {
    return '-';
  }
  
  return new Intl.DateTimeFormat('pt-BR').format(date);
}
