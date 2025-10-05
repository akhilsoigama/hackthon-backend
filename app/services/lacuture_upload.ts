import { inject } from "@adonisjs/core"
import { HttpContext } from '@adonisjs/core/http'
import Lecture from "#models/lacture_upload"
import cloudinary from "#config/cloudinary"
import { createLectureValidator, lectureIdParamValidator, updateLectureValidator } from "#validators/lacture_upload"

@inject()
export default class LectureUploadServices {

  public async create({ request, response, auth }: HttpContext) {
    const user = auth.user
    if (!user) return response.unauthorized({ message: 'User not authenticated' })

    try {
      const payload = await createLectureValidator.validate(request.all())

      // Check duplicate title
      const existing = await Lecture.query()
        .where('title', payload.title)
        .andWhere('faculty_id', user.id)
        .first()
      if (existing) return response.badRequest({ message: 'Lecture with this title already exists' })

      let videoUrl = ''
      let thumbnailUrl = ''

      // File upload
      const videoFile = request.file('videoFile', {
        size: '500mb',
        extnames: ['mp4', 'mov', 'avi', 'mkv'],
      })
      const thumbnailFile = request.file('thumbnailFile', {
        size: '5mb',
        extnames: ['png', 'jpg', 'jpeg'],
      })

      if (videoFile && videoFile.isValid) {
        const uploadedVideo = await cloudinary.uploader.upload(videoFile.tmpPath!, {
          folder: 'lectures/videos',
          resource_type: 'video',
          public_id: `lecture_video_${Date.now()}`,
          overwrite: true,
        })
        videoUrl = uploadedVideo.secure_url
      } else if (payload.content_url) {
        videoUrl = payload.content_url
      }

      if (thumbnailFile && thumbnailFile.isValid) {
        const uploadedThumbnail = await cloudinary.uploader.upload(thumbnailFile.tmpPath!, {
          folder: 'lectures/thumbnails',
          public_id: `lecture_thumb_${Date.now()}`,
          overwrite: true,
        })
        thumbnailUrl = uploadedThumbnail.secure_url
      } else if (payload.thumbnail_url) {
        thumbnailUrl = payload.thumbnail_url
      } else {
        thumbnailUrl = 'default_thumbnail.png'
      }

      if (!videoUrl) return response.badRequest({ message: 'Video file or content_url is required' })

      // Create lecture
      const lecture = await Lecture.create({
        title: payload.title,
        description: payload.description ?? null,
        videoUrl: videoUrl,
        thumbnailUrl: thumbnailUrl,
        facultyId: user.id,
        contentType: payload.content_type,
        duration: payload.duration_in_seconds ?? null,
        textContent: payload.text_content ?? null,
        subjectId: payload.subject || null
      })

      return response.created({ message: 'Lecture uploaded successfully', lecture })

    } catch (error: any) {
      return response.internalServerError({ message: 'Failed to create lecture', error: error.message })
    }
  }

  public async updateOne({ params, request, response, auth }: HttpContext) {
    const user = auth.user
    if (!user) return response.unauthorized({ message: 'User not authenticated' })

    try {
      const { id } = await lectureIdParamValidator.validate(params)
      const lecture = await Lecture.find(id)
      if (!lecture) return response.notFound({ message: 'Lecture not found' })
      if (lecture.facultyId !== user.id) return response.unauthorized({ message: 'Not your lecture' })

      const payload = await updateLectureValidator.validate(request.all())
      lecture.merge({
        title: payload.title ?? lecture.title,
        description: payload.description ?? lecture.description,
        contentType: payload.contentType ?? lecture.contentType,
        duration: payload.duration ? Number(payload.duration) : lecture.duration,
        textContent: payload.textContent ?? lecture.textContent,
      })

      let videoUrl = lecture.videoUrl
      let thumbnailUrl = lecture.thumbnailUrl

      const videoFile = request.file('videoFile', {
        size: '500mb',
        extnames: ['mp4', 'mov', 'avi', 'mkv'],
      })
      const thumbnailFile = request.file('thumbnailFile', {
        size: '5mb',
        extnames: ['png', 'jpg', 'jpeg'],
      })

      if (videoFile && videoFile.isValid) {
        const uploadedVideo = await cloudinary.uploader.upload(videoFile.tmpPath!, {
          folder: 'lectures/videos',
          resource_type: 'video',
          public_id: `lecture_video_${Date.now()}`,
          overwrite: true,
        })
        videoUrl = uploadedVideo.secure_url
      } else if (payload.contentUrl) {
        videoUrl = payload.contentUrl
      }

      if (thumbnailFile && thumbnailFile.isValid) {
        const uploadedThumbnail = await cloudinary.uploader.upload(thumbnailFile.tmpPath!, {
          folder: 'lectures/thumbnails',
          public_id: `lecture_thumb_${Date.now()}`,
          overwrite: true,
        })
        thumbnailUrl = uploadedThumbnail.secure_url
      } else if (payload.thumbnailPath) {
        thumbnailUrl = payload.thumbnailPath
      }

      lecture.videoUrl = videoUrl
      lecture.thumbnailUrl = thumbnailUrl

      await lecture.save()
      return response.ok({ message: 'Lecture updated successfully', lecture })
    } catch (error: any) {
      return response.internalServerError({ message: 'Failed to update lecture', error: error.message })
    }
  }

  public async findAll({ auth, request, response }: HttpContext) {
    try {
      const query = Lecture.query().orderBy('created_at', 'desc')

      // Dynamic filters from query string
      const filters = request.qs()

      if (filters.facultyId) query.where('faculty_id', filters.facultyId)
      else if (auth.user) query.where('faculty_id', auth.user.id) // default to auth user

      if (filters.subjectId) query.where('subject_id', filters.subjectId)
      if (filters.contentType) query.where('content_type', filters.contentType)
      if (filters.title) query.where('title', 'like', `%${filters.title}%`)
      if (filters.createdAfter) query.where('created_at', '>=', filters.createdAfter)
      if (filters.createdBefore) query.where('created_at', '<=', filters.createdBefore)

      // Pagination
      const page = Number(filters.page || 1)
      const limit = Number(filters.limit || 10)

      const lectures = await query.paginate(page, limit)
      return response.ok(lectures)
    } catch (error: any) {
      return response.internalServerError({ message: 'Failed to fetch lectures', error: error.message })
    }
  }

  public async findOne({ params, response }: HttpContext) {
    try {
      const lecture = await Lecture.find(params.id)
      if (!lecture) return response.notFound({ message: 'Lecture not found' })
      return response.ok({ lecture })
    } catch (error: any) {
      return response.internalServerError({ message: 'Failed to fetch lecture', error: error.message })
    }
  }

  public async deleteOne({ params, response, auth }: HttpContext) {
    try {
      const user = auth.user
      if (!user) return response.unauthorized({ message: 'User not authenticated' })

      const lecture = await Lecture.find(params.id)
      if (!lecture) return response.notFound({ message: 'Lecture not found' })
      if (lecture.facultyId !== user.id) return response.unauthorized({ message: 'Not your lecture' })

      await lecture.delete()
      return response.ok({ message: 'Lecture deleted successfully' })
    } catch (error: any) {
      return response.internalServerError({ message: 'Failed to delete lecture', error: error.message })
    }
  }
}
