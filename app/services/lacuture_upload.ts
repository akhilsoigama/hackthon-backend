import { inject } from "@adonisjs/core";
import { HttpContext } from '@adonisjs/core/http';
import { createLectureValidator, lectureIdParamValidator, updateLectureValidator } from "#validators/lacture_upload";
import Lecture from "#models/lacture_upload";
import cloudinary from "#config/cloudinary";

@inject()
export default class LectureUploadServices {

  /**
   * Create a new lecture
   */
  public async create({ request, response, auth }: HttpContext) {
    const user = auth.user;
    if (!user) return response.unauthorized({ message: 'User not authenticated' });

    try {
      // Validate request body
      const payload = await createLectureValidator.validate(request.all());

      // Prevent duplicate lectures by title + faculty
      const existing = await Lecture.query()
        .where('title', payload.title)
        .andWhere('facultyId', user.id)
        .first();
      if (existing) {
        return response.badRequest({ message: 'Lecture with this title already exists' });
      }

      // Video file
      const videoFile = request.file('videoFile', {
        size: '500mb',
        extnames: ['mp4', 'mov', 'avi', 'mkv'],
      });
      if (!videoFile) return response.badRequest({ message: 'Video file is required' });
      if (!videoFile.isValid) return response.badRequest({ message: videoFile.errors?.[0]?.message || 'Invalid video file' });

      // Upload video to Cloudinary
      const uploadedVideo = await cloudinary.uploader.upload(videoFile.tmpPath!, {
        folder: 'lectures/videos',
        resource_type: 'video',
        public_id: `lecture_video_${Date.now()}`,
        overwrite: true,
      });

      let videoUrl = uploadedVideo.secure_url;

      // Thumbnail file (optional)
      let thumbnailUrl = 'default_thumbnail.png';
      const thumbnailFile = request.file('thumbnailFile', {
        size: '5mb',
        extnames: ['png', 'jpg', 'jpeg'],
      });
      if (thumbnailFile && thumbnailFile.isValid) {
        const uploadedThumbnail = await cloudinary.uploader.upload(thumbnailFile.tmpPath!, {
          folder: 'lectures/thumbnails',
          public_id: `lecture_thumb_${Date.now()}`,
          overwrite: true,
        });
        thumbnailUrl = uploadedThumbnail.secure_url;
      }

      // Create lecture in DB
      const lecture = await Lecture.create({
        title: payload.title,
        description: payload.description,
        videoPath: videoUrl,
        thumbnailPath: thumbnailUrl,
        facultyId: user.id,
      });

      return response.created({ message: 'Lecture uploaded successfully', lecture });

    } catch (error: any) {
      return response.internalServerError({ message: 'Failed to create lecture', error: error.message });
    }
  }

  /**
   * Get all lectures of the authenticated faculty
   */
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

  /**
   * Get single lecture
   */
  public async findOne({ params, response }: HttpContext) {
    try {
      const lecture = await Lecture.find(params.id);
      if (!lecture) return response.notFound({ message: 'Lecture not found' });
      return response.ok({ lecture });
    } catch (error: any) {
      return response.internalServerError({ message: 'Failed to fetch lecture', error: error.message });
    }
  }

  /**
   * Update a lecture
   */
  public async updateOne({ params, request, response, auth }: HttpContext) {
    const user = auth.user;
    if (!user) return response.unauthorized({ message: 'User not authenticated' });

    try {
      // Validate params
      const { id } = await lectureIdParamValidator.validate(params);

      // Find lecture
      const lecture = await Lecture.find(id);
      if (!lecture) return response.notFound({ message: 'Lecture not found' });
      if (lecture.facultyId !== user.id) return response.unauthorized({ message: 'Not your lecture' });

      // Validate body
      const payload = await updateLectureValidator.validate(request.all());

      lecture.merge({
        title: payload.title ?? lecture.title,
        description: payload.description ?? lecture.description,
      });

      // Update thumbnail if provided
      const thumbnailFile = request.file('thumbnailFile', {
        size: '5mb',
        extnames: ['png', 'jpg', 'jpeg'],
      });
      if (thumbnailFile && thumbnailFile.isValid) {
        const uploadedThumbnail = await cloudinary.uploader.upload(thumbnailFile.tmpPath!, {
          folder: 'lectures/thumbnails',
          public_id: `lecture_thumb_${Date.now()}`,
          overwrite: true,
        });
        lecture.thumbnailPath = uploadedThumbnail.secure_url;
      }

      // Update video if provided
      const videoFile = request.file('videoFile', {
        size: '500mb',
        extnames: ['mp4', 'mov', 'avi', 'mkv'],
      });
      if (videoFile && videoFile.isValid) {
        const uploadedVideo = await cloudinary.uploader.upload(videoFile.tmpPath!, {
          folder: 'lectures/videos',
          resource_type: 'video',
          public_id: `lecture_video_${Date.now()}`,
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

  /**
   * Delete a lecture
   */
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
