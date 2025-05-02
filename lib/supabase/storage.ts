import { getSupabaseClient } from "./client"

export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
): Promise<{ url: string | null; error: Error | null }> {
  const supabase = getSupabaseClient()

  try {
    const { error } = await supabase.storage.from(bucket).upload(path, file)

    if (error) {
      throw error
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path)

    return { url: data.publicUrl, error: null }
  } catch (error) {
    console.error("Error uploading file:", error)
    return { url: null, error: error as Error }
  }
}

export async function deleteFile(bucket: string, path: string): Promise<{ error: Error | null }> {
  const supabase = getSupabaseClient()

  try {
    const { error } = await supabase.storage.from(bucket).remove([path])

    if (error) {
      throw error
    }

    return { error: null }
  } catch (error) {
    console.error("Error deleting file:", error)
    return { error: error as Error }
  }
}

export async function getPublicUrl(bucket: string, path: string): string {
  const supabase = getSupabaseClient()
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
