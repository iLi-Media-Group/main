import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get request body
    const { trackId, trackData } = await req.json()

    if (!trackId) {
      throw new Error('Track ID is required')
    }

    console.log('🗑️ Starting storage cleanup for track:', trackId)

    const filesToDelete: Array<{ bucket: string, path: string, description: string }> = []

    // Add files based on track data URLs
    if (trackData) {
      // Track image
      if (trackData.image_url && !trackData.image_url.startsWith('http')) {
        filesToDelete.push({
          bucket: 'track-images',
          path: trackData.image_url,
          description: 'Track image'
        })
      }

      // MP3 file
      if (trackData.mp3_url && !trackData.mp3_url.startsWith('http')) {
        filesToDelete.push({
          bucket: 'track-audio',
          path: trackData.mp3_url,
          description: 'MP3 file'
        })
      }

      // Trackouts
      if (trackData.trackouts_url && !trackData.trackouts_url.startsWith('http')) {
        filesToDelete.push({
          bucket: 'trackouts',
          path: trackData.trackouts_url,
          description: 'Trackouts'
        })
      }

      // Stems
      if (trackData.stems_url && !trackData.stems_url.startsWith('http')) {
        filesToDelete.push({
          bucket: 'stems',
          path: trackData.stems_url,
          description: 'Stems'
        })
      }

      // Split sheet
      if (trackData.split_sheet_url && !trackData.split_sheet_url.startsWith('http')) {
        filesToDelete.push({
          bucket: 'split-sheets',
          path: trackData.split_sheet_url,
          description: 'Split sheet'
        })
      }

      // Also check for files in the track's folder structure
      if (trackData.track_producer_id && trackData.title) {
        const trackFolder = `${trackData.track_producer_id}/${trackData.title.replace(/\s+/g, '_')}`
        const trackIdFolder = `${trackData.track_producer_id}/${trackId}`

        // Add folder-based file paths
        filesToDelete.push(
          { bucket: 'track-images', path: `${trackFolder}/image.jpg`, description: 'Track image (folder path)' },
          { bucket: 'track-images', path: `${trackFolder}/image.png`, description: 'Track image (folder path)' },
          { bucket: 'track-audio', path: `${trackFolder}/main.mp3`, description: 'MP3 file (folder path)' },
          { bucket: 'trackouts', path: `${trackFolder}/trackouts.zip`, description: 'Trackouts (folder path)' },
          { bucket: 'stems', path: `${trackFolder}/stems.zip`, description: 'Stems (folder path)' },
          { bucket: 'split-sheets', path: `${trackFolder}/split_sheet.pdf`, description: 'Split sheet (folder path)' },
          // Also check track ID based paths
          { bucket: 'track-images', path: `${trackIdFolder}/image.jpg`, description: 'Track image (ID path)' },
          { bucket: 'track-images', path: `${trackIdFolder}/image.png`, description: 'Track image (ID path)' },
          { bucket: 'track-audio', path: `${trackIdFolder}/main.mp3`, description: 'MP3 file (ID path)' },
          { bucket: 'trackouts', path: `${trackIdFolder}/trackouts.zip`, description: 'Trackouts (ID path)' },
          { bucket: 'stems', path: `${trackIdFolder}/stems.zip`, description: 'Stems (ID path)' },
          { bucket: 'split-sheets', path: `${trackIdFolder}/split_sheet.pdf`, description: 'Split sheet (ID path)' }
        )
      }
    }

    // Also try to find files by listing the track's folder
    if (trackData?.track_producer_id) {
      const trackFolder = `${trackData.track_producer_id}/${trackData.title?.replace(/\s+/g, '_') || trackId}`
      const trackIdFolder = `${trackData.track_producer_id}/${trackId}`

      // List files in track folders for each bucket
      const buckets = ['track-images', 'track-audio', 'trackouts', 'stems', 'split-sheets']
      
      for (const bucket of buckets) {
        try {
          // List files in track folder
          const { data: folderFiles, error: folderError } = await supabaseClient.storage
            .from(bucket)
            .list(trackFolder)

          if (!folderError && folderFiles) {
            for (const file of folderFiles) {
              filesToDelete.push({
                bucket,
                path: `${trackFolder}/${file.name}`,
                description: `${file.name} (discovered)`
              })
            }
          }

          // List files in track ID folder
          const { data: idFolderFiles, error: idFolderError } = await supabaseClient.storage
            .from(bucket)
            .list(trackIdFolder)

          if (!idFolderError && idFolderFiles) {
            for (const file of idFolderFiles) {
              filesToDelete.push({
                bucket,
                path: `${trackIdFolder}/${file.name}`,
                description: `${file.name} (discovered)`
              })
            }
          }
        } catch (listError) {
          console.warn(`⚠️ Error listing files in ${bucket}/${trackFolder}:`, listError)
        }
      }
    }

    // Remove duplicates based on bucket and path
    const uniqueFiles = filesToDelete.filter((file, index, self) => 
      index === self.findIndex(f => f.bucket === file.bucket && f.path === file.path)
    )

    console.log(`🗑️ Found ${uniqueFiles.length} files to delete for track ${trackId}`)

    // Delete each file
    const deletedFiles: string[] = []
    const failedFiles: string[] = []

    for (const file of uniqueFiles) {
      try {
        const { error } = await supabaseClient.storage
          .from(file.bucket)
          .remove([file.path])

        if (error) {
          console.warn(`⚠️ Failed to delete ${file.description} from ${file.bucket}/${file.path}:`, error)
          failedFiles.push(`${file.bucket}/${file.path}`)
        } else {
          console.log(`✅ Deleted ${file.description} from ${file.bucket}/${file.path}`)
          deletedFiles.push(`${file.bucket}/${file.path}`)
        }
      } catch (fileError) {
        console.warn(`⚠️ Error deleting ${file.description} from ${file.bucket}/${file.path}:`, fileError)
        failedFiles.push(`${file.bucket}/${file.path}`)
      }
    }

    console.log('🗑️ Completed storage cleanup for track:', trackId)

    return new Response(
      JSON.stringify({
        success: true,
        trackId,
        deletedFiles,
        failedFiles,
        totalFiles: uniqueFiles.length,
        deletedCount: deletedFiles.length,
        failedCount: failedFiles.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Error in delete-track-storage function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
