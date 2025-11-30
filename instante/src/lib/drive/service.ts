import { DriveFile } from './types'

const DRIVE_API_URL = import.meta.env.VITE_DRIVE_API_URL
const DRIVE_API_KEY = import.meta.env.VITE_DRIVE_API_KEY

export async function uploadToDrive(file: File): Promise<DriveFile> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${DRIVE_API_URL}/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DRIVE_API_KEY}`
    },
    body: formData
  })

  if (!response.ok) {
    throw new Error('Error al subir el archivo a Drive')
  }

  return response.json()
}

export async function getDriveFile(fileId: string): Promise<DriveFile> {
  const response = await fetch(`${DRIVE_API_URL}/files/${fileId}`, {
    headers: {
      'Authorization': `Bearer ${DRIVE_API_KEY}`
    }
  })

  if (!response.ok) {
    throw new Error('Error al obtener el archivo de Drive')
  }

  return response.json()
}

export async function deleteDriveFile(fileId: string): Promise<void> {
  const response = await fetch(`${DRIVE_API_URL}/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${DRIVE_API_KEY}`
    }
  })

  if (!response.ok) {
    throw new Error('Error al eliminar el archivo de Drive')
  }
} 