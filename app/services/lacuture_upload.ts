import { inject } from "@adonisjs/core"
import { HttpContext } from '@adonisjs/core/http'
import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import fs from 'fs'
import app from "@adonisjs/core/services/app"
import { createLectureValidator, lectureIdParamValidator, updateLectureValidator } from "#validators/lacture_upload"
import Lecture from "#models/lacture_upload"
import cloudinary from "#config/cloudinary"

@inject()
export default class LectureUploadServices {

    public async create({ request, response, auth }: HttpContext) {
        const user = auth.user
        if (!user) return response.unauthorized({ message: 'User not authenticated' })

        try {
            const payload = await createLectureValidator.validate(request.all())
            const videoFile = request.file('videoFile', {
                size: '500mb',
                extnames: ['mp4', 'mov', 'avi', 'mkv'],
            })

            if (!videoFile) {
                return response.badRequest({ message: 'Video file is required' })
            }
            if (!videoFile.isValid) {
                return response.badRequest({ 
                    message: videoFile.errors?.[0]?.message || 'Invalid video file' 
                })
            }

            const thumbnailFile = request.file('thumbnailFile', {
                size: '5mb',
                extnames: ['png', 'jpg', 'jpeg'],
            })

            const uploadPath = path.join(app.tmpPath(), 'uploads')
            if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true })

            await videoFile.move(uploadPath)
            if (!videoFile.filePath) return response.internalServerError({ message: 'Failed to save video file' })

            let compressedFileName = videoFile.clientName
            let thumbnailFileName = 'default_thumbnail.png'

            if (videoFile.size && videoFile.size > 50 * 1024 * 1024) {
                compressedFileName = `compressed_${videoFile.clientName}`
                const outputPath = path.join(uploadPath, compressedFileName)
                await new Promise((resolve, reject) => {
                    ffmpeg(videoFile.filePath!)
                        .outputOptions(['-vcodec libx264', '-crf 28', '-preset fast'])
                        .save(outputPath)
                        .on('end', resolve)
                        .on('error', (err:any) => reject(new Error(`Video compression failed: ${err.message}`)))
                })
                if (fs.existsSync(videoFile.filePath)) fs.unlinkSync(videoFile.filePath)
            }

            if (thumbnailFile) {
                if (!thumbnailFile.isValid) {
                    return response.badRequest({ 
                        message: thumbnailFile.errors?.[0]?.message || 'Invalid thumbnail file' 
                    })
                }

                const uploadedThumbnail = await cloudinary.uploader.upload(thumbnailFile.tmpPath!, {
                    folder: 'lectures/thumbnails',
                    public_id: `${Date.now()}_${thumbnailFile.clientName}`,
                    overwrite: true,
                })

                thumbnailFileName = uploadedThumbnail.secure_url
            }

            const lecture = await Lecture.create({
                title: payload.title,
                description: payload.description,
                videoPath: compressedFileName,
                thumbnailPath: thumbnailFileName,
                facultyId: user.id,
            })

            return response.created({ message: 'Lecture uploaded successfully', lecture })

        } catch (error: any) {
            return response.internalServerError({ message: 'Failed to create lecture', error: error.message })
        }
    }

    public async findAll({ auth, response }: HttpContext) {
        try {
            const lectures = await Lecture.query()
                .where('facultyId', auth.user!.id)
                .orderBy('created_at', 'desc')

            return response.ok({ lectures })
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
            })

            const thumbnailFile = request.file('thumbnailFile', {
                size: '5mb',
                extnames: ['png', 'jpg', 'jpeg'],
            })

            if (thumbnailFile) {
                if (!thumbnailFile.isValid) {
                    return response.badRequest({ message: thumbnailFile.errors?.[0]?.message || 'Invalid thumbnail file' })
                }

                const uploadedThumbnail = await cloudinary.uploader.upload(thumbnailFile.tmpPath!, {
                    folder: 'lectures/thumbnails',
                    public_id: `${Date.now()}_${thumbnailFile.clientName}`,
                    overwrite: true,
                })

                lecture.thumbnailPath = uploadedThumbnail.secure_url
            }

            await lecture.save()
            return response.ok({ message: 'Lecture updated successfully', lecture })
        } catch (error: any) {
            return response.internalServerError({ message: 'Failed to update lecture', error: error.message })
        }
    }

    public async deleteOne({ params, response, auth }: HttpContext) {
        try {
            const user = auth.user
            if (!user) return response.unauthorized({ message: 'User not authenticated' })

            const lecture = await Lecture.find(params.id)
            if (!lecture) return response.notFound({ message: 'Lecture not found' })
            if (lecture.facultyId !== user.id) return response.unauthorized({ message: 'Not your lecture' })

            const uploadPath = path.join(app.tmpPath(), 'uploads')
            const videoFullPath = path.join(uploadPath, lecture.videoPath)
            if (fs.existsSync(videoFullPath)) fs.unlinkSync(videoFullPath)

            await lecture.delete()
            return response.ok({ message: 'Lecture deleted successfully' })
        } catch (error: any) {
            return response.internalServerError({ message: 'Failed to delete lecture', error: error.message })
        }
    }
}
