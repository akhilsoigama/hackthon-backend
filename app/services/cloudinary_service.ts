import cloudinary from "#config/cloudinary"
import * as streamifier from 'streamifier'


type ResourceType = 'raw' | 'video' | 'image' | 'auto'

type UploadOptions = {
  folder?: string
  public_id?: string
  resource_type?: ResourceType
}

export async function uploadBuffer(buffer: Buffer, options: UploadOptions = {}) {
  return new Promise<any>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: options.folder, public_id: options.public_id, resource_type: options.resource_type || 'auto' },
      (error, result) => {
        if (error) return reject(error)
        resolve(result)
      }
    )

    streamifier.createReadStream(buffer).pipe(uploadStream)
  })
}

export async function uploadPath(filePath: string, options: UploadOptions = {}) {
  return cloudinary.uploader.upload(filePath, { folder: options.folder, public_id: options.public_id, resource_type: options.resource_type || 'auto' })
}

export async function destroy(publicId: string, options: { resource_type?: ResourceType } = {}) {
  return cloudinary.uploader.destroy(publicId, { resource_type: options.resource_type || 'image' })
}

export default {
  uploadBuffer,
  uploadPath,
  destroy,
}
