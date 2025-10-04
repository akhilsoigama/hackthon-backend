import { inject } from "@adonisjs/core";
import { HttpContext } from '@adonisjs/core/http';
import { createLectureValidator, lectureIdParamValidator, updateLectureValidator } from "#validators/lacture_upload";
import Lecture from "#models/lacture_upload";
import cloudinary from "#config/cloudinary";

@inject()
export default class LectureUploadServices {
  public async create({ request, response, auth }: HttpContext) {
    const user = auth.user;
    if (!user) return response.unauthorized({ message: 'User not authenticated' });

    try {
      const payload = await createLectureValidator.validate(request.all());
      const existing = await Lecture.query()
        .where('title', payload.title)
        .andWhere('facultyId', user.id)
        .first();
      if (existing) return response.badRequest({ message: 'Lecture with this title already exists' });

      const videoFile = request.file('videoFile', {
        size: '500mb',
        extnames: ['mp4', 'mov', 'avi', 'mkv'],
      });
      if (!videoFile) return response.badRequest({ message: 'Video file is required' });
      if (!videoFile.isValid) return response.badRequest({ message: videoFile.errors?.[0]?.message || 'Invalid video file' });

      const lecture = await Lecture.create({
        title: payload.title,
        description: payload.description,
        videoPath: '',
        thumbnailPath: '',
        facultyId: user.id,
      });

      const uploadedVideo = await cloudinary.uploader.upload(videoFile.tmpPath!, {
        folder: 'lectures/videos',
        resource_type: 'video',
        public_id: `lecture_video_${lecture.id}`,
        overwrite: true,
      });
      lecture.videoPath = uploadedVideo.secure_url;

      const thumbnailFile = request.file('thumbnailFile', {
        size: '5mb',
        extnames: ['png', 'jpg', 'jpeg'],
      });
      if (thumbnailFile && thumbnailFile.isValid) {
        const uploadedThumbnail = await cloudinary.uploader.upload(thumbnailFile.tmpPath!, {
          folder: 'lectures/thumbnails',
          public_id: `lecture_thumb_${lecture.id}`,
          overwrite: true,
        });
        lecture.thumbnailPath = uploadedThumbnail.secure_url;
      } else {
        lecture.thumbnailPath = 'default_thumbnail.png';
      }

      await lecture.save();
      return response.created({ message: 'Lecture uploaded successfully', lecture });
    } catch (error: any) {
      return response.internalServerError({ message: 'Failed to create lecture', error: error.message });
    }
  }

  public async findAll({ auth, response }: HttpContext) {
    try {
      const lectures = await Lecture.query()
        .where('facultyId', auth.user!.id)
        .orderBy('created_at', 'desc');
      return response.ok({ lectures });
    } catch (error: any) {
      return response.internalServerError({ message: 'Failed to fetch lectures', error: error.message });
    }
  }

  public async findOne({ params, response }: HttpContext) {
    try {
      const lecture = await Lecture.find(params.id);
      if (!lecture) return response.notFound({ message: 'Lecture not found' });
      return response.ok({ lecture });
    } catch (error: any) {
      return response.internalServerError({ message: 'Failed to fetch lecture', error: error.message });
    }
  }

  public async updateOne({ params, request, response, auth }: HttpContext) {
    const user = auth.user;
    if (!user) return response.unauthorized({ message: 'User not authenticated' });

    try {
      const { id } = await lectureIdParamValidator.validate(params);
      const lecture = await Lecture.find(id);
      if (!lecture) return response.notFound({ message: 'Lecture not found' });
      if (lecture.facultyId !== user.id) return response.unauthorized({ message: 'Not your lecture' });

      const payload = await updateLectureValidator.validate(request.all());
      lecture.merge({
        title: payload.title ?? lecture.title,
        description: payload.description ?? lecture.description,
      });

      const thumbnailFile = request.file('thumbnailFile', {
        size: '5mb',
        extnames: ['png', 'jpg', 'jpeg'],
      });
      if (thumbnailFile && thumbnailFile.isValid) {
        const uploadedThumbnail = await cloudinary.uploader.upload(thumbnailFile.tmpPath!, {
          folder: 'lectures/thumbnails',
          public_id: `lecture_thumb_${lecture.id}`,
          overwrite: true,
        });
        lecture.thumbnailPath = uploadedThumbnail.secure_url;
      }

      const videoFile = request.file('videoFile', {
        size: '500mb',
        extnames: ['mp4', 'mov', 'avi', 'mkv'],
      });
      if (videoFile && videoFile.isValid) {
        const uploadedVideo = await cloudinary.uploader.upload(videoFile.tmpPath!, {
          folder: 'lectures/videos',
          resource_type: 'video',
          public_id: `lecture_video_${lecture.id}`,
          overwrite: true,
        });
        lecture.videoPath = uploadedVideo.secure_url;
      }

      await lecture.save();
      return response.ok({ message: 'Lecture updated successfully', lecture });
    } catch (error: any) {
      return response.internalServerError({ message: 'Failed to update lecture', error: error.message });
    }
  }

  public async deleteOne({ params, response, auth }: HttpContext) {
    try {
      const user = auth.user;
      if (!user) return response.unauthorized({ message: 'User not authenticated' });

      const lecture = await Lecture.find(params.id);
      if (!lecture) return response.notFound({ message: 'Lecture not found' });
      if (lecture.facultyId !== user.id) return response.unauthorized({ message: 'Not your lecture' });

      await lecture.delete();
      return response.ok({ message: 'Lecture deleted successfully' });
    } catch (error: any) {
      return response.internalServerError({ message: 'Failed to delete lecture', error: error.message });
    }
  }
}
