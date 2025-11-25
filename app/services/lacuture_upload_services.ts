// app/services/lecture_upload_services.ts
import { inject } from "@adonisjs/core"
import { HttpContext } from '@adonisjs/core/http'
import Lecture from "#models/lacture_upload"
import cloudinary from "#config/cloudinary"
import { createLectureValidator, lectureIdParamValidator, updateLectureValidator } from "#validators/lacture_upload"
import PermissionsResolverService from "./permissions_resolver_service.js"
import { PermissionKeys } from "#database/constants/permission"

@inject()
export default class LectureUploadServices {

  public async create({ request, response, auth }: HttpContext) {
    try {
      const user = (request.ctx as any)?.user || auth.user;

      if (!user) {
        return response.unauthorized({
          success: false,
          message: 'User not authenticated - Please login again'
        });
      }

      const permissionsResolver = new PermissionsResolverService(request.ctx as HttpContext, user);
      const { hasPermission, isSystemAdmin } = await permissionsResolver.permissionResolver([
        PermissionKeys.LECTURE_CREATE
      ]);

      if (!hasPermission && !isSystemAdmin) {
        return response.forbidden({
          success: false,
          message: 'Insufficient permissions to create lectures'
        });
      }

      const payload = await createLectureValidator.validate(request.all());

      let facultyId: number;

      if (isSystemAdmin && payload.faculty_id) {
        facultyId = payload.faculty_id;
      } else if (user.userType === 'faculty' && user.facultyId) {
        facultyId = user.facultyId;
      } else if (user.userType === 'institute' && user.instituteId) {
        facultyId = user.instituteId;
      } else {
        return response.badRequest({
          success: false,
          message: 'User is not associated with any faculty/institute'
        });
      }

      try {
        const FacultyModel = (await import('#models/faculty')).default;
        const facultyExists = await FacultyModel.find(facultyId);
        if (!facultyExists) {
          return response.badRequest({
            success: false,
            message: `Faculty with ID ${facultyId} not found in database`
          });
        }
      } catch (error) {
        return response.internalServerError({
          success: false,
          message: 'Error verifying faculty information'
        });
      }

      const existingLecture = await Lecture.query()
        .where('title', payload.title)
        .andWhere('faculty_id', facultyId)
        .first();

      if (existingLecture) {
        return response.badRequest({
          success: false,
          message: 'Lecture with this title already exists for this faculty'
        });
      }

      let contentUrl = payload.content_url || '';
      let thumbnailUrl = payload.thumbnail_url || '';

      if (payload.content_type === 'video' || payload.content_type === 'audio') {
        const mediaFile = request.file('mediaFile', {
          size: '500mb',
          extnames: payload.content_type === 'video' ? ['mp4', 'mov', 'avi', 'mkv'] : ['mp3', 'wav', 'aac'],
        });

        if (mediaFile && mediaFile.isValid) {
          const uploadOptions: any = {
            folder: `lectures/${payload.content_type}s`,
            resource_type: payload.content_type === 'video' ? 'video' : 'raw',
            public_id: `lecture_${payload.content_type}_${Date.now()}`,
            overwrite: true,
            type: 'upload',
            access_mode: 'public',
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Cross-Origin-Resource-Policy': 'cross-origin'
            }
          };

          if (payload.content_type === 'video') {
            uploadOptions.chunk_size = 6000000;
            uploadOptions.eager = [
              {
                quality: "auto",
                fetch_format: "mp4",
                streaming_profile: "hd"
              }
            ];
          }

          const uploadedFile = await cloudinary.uploader.upload(mediaFile.tmpPath!, uploadOptions);
          contentUrl = this.ensureSecureUrl(uploadedFile.secure_url);
        } else if (payload.content_url) {
          contentUrl = payload.content_url;
        } else {
          return response.badRequest({
            success: false,
            message: `${payload.content_type} file or content_url is required`
          });
        }
      }
      else if (payload.content_type === 'text') {
        if (!payload.text_content) {
          return response.badRequest({
            success: false,
            message: 'text_content is required for text type lectures'
          });
        }
        contentUrl = '';
      }
      else if (payload.content_type === 'pdf' || payload.content_type === 'image') {
        const file = request.file('contentFile', {
          size: '50mb',
          extnames: payload.content_type === 'pdf' ? ['pdf'] : ['png', 'jpg', 'jpeg', 'gif'],
        });

        if (file && file.isValid) {
          const uploadedFile = await cloudinary.uploader.upload(file.tmpPath!, {
            folder: `lectures/${payload.content_type}s`,
            public_id: `lecture_${payload.content_type}_${Date.now()}`,
            overwrite: true,
            type: 'upload',
            access_mode: 'public',
            headers: {
              'Access-Control-Allow-Origin': '*'
            }
          });
          contentUrl = this.ensureSecureUrl(uploadedFile.secure_url);
        } else if (payload.content_url) {
          contentUrl = payload.content_url;
        } else {
          return response.badRequest({
            success: false,
            message: `${payload.content_type} file or content_url is required`
          });
        }
      }

      const thumbnailFile = request.file('thumbnailFile', {
        size: '5mb',
        extnames: ['png', 'jpg', 'jpeg'],
      });

      if (thumbnailFile && thumbnailFile.isValid) {
        const uploadedThumbnail = await cloudinary.uploader.upload(thumbnailFile.tmpPath!, {
          folder: 'lectures/thumbnails',
          public_id: `lecture_thumb_${Date.now()}`,
          overwrite: true,
          type: 'upload',
          access_mode: 'public'
        });
        thumbnailUrl = this.ensureSecureUrl(uploadedThumbnail.secure_url);
      } else if (payload.thumbnail_url) {
        thumbnailUrl = payload.thumbnail_url;
      } else {
        thumbnailUrl = 'default_thumbnail.png';
      }

      if (payload.content_type !== 'text' && !contentUrl) {
        return response.badRequest({
          success: false,
          message: `${payload.content_type} file or content_url is required`
        });
      }

      const lectureData = {
        title: payload.title,
        description: payload.description ?? null,
        subject: payload.subject || null,
        std: payload.std || null,
        contentType: payload.content_type,
        facultyId: facultyId,
        contentUrl: contentUrl,
        thumbnailUrl: thumbnailUrl,
        durationInSeconds: payload.duration_in_seconds ?? null,
        textContent: payload.text_content ?? null,
      };

      const lecture = await Lecture.create(lectureData);

      response.header('Access-Control-Allow-Origin', '*');
      response.header('Cross-Origin-Resource-Policy', 'cross-origin');

      return response.created({
        success: true,
        message: 'Lecture uploaded successfully',
        lecture
      });

    } catch (error: any) {
      return response.internalServerError({
        success: false,
        message: 'Failed to create lecture',
        error: error.message
      });
    }
  }

  public async updateOne({ params, request, response, auth }: HttpContext) {
    try {
      const user = (request.ctx as any)?.user || auth.user;

      if (!user) {
        return response.unauthorized({
          success: false,
          message: 'User not authenticated'
        });
      }

      const { id } = await lectureIdParamValidator.validate(params);
      const lecture = await Lecture.find(id);

      if (!lecture) {
        return response.notFound({
          success: false,
          message: 'Lecture not found'
        });
      }

      const permissionsResolver = new PermissionsResolverService(request.ctx as HttpContext, user);
      const { hasPermission, isSystemAdmin } = await permissionsResolver.permissionResolver([
        PermissionKeys.LECTURE_UPDATE
      ]);

      if (isSystemAdmin) {
      } else if (user.userType === 'faculty' && lecture.facultyId !== user.facultyId) {
        return response.unauthorized({
          success: false,
          message: 'You can only update your own lectures'
        });
      } else if (!hasPermission) {
        return response.forbidden({
          success: false,
          message: 'Insufficient permissions to update lectures'
        });
      }

      const payload = await updateLectureValidator.validate(request.all());

      const updateData: any = {};
      
      if (payload.title !== undefined) updateData.title = payload.title;
      if (payload.description !== undefined) updateData.description = payload.description;
      if (payload.subject !== undefined) updateData.subject = payload.subject;
      if (payload.std !== undefined) updateData.std = payload.std;
      if (payload.content_type !== undefined) updateData.contentType = payload.content_type;
      if (payload.duration_in_seconds !== undefined) updateData.durationInSeconds = payload.duration_in_seconds;
      
      let textContentToUpdate = null;
      
      if (payload.text_content !== undefined) {
        textContentToUpdate = payload.text_content;
      } else if (payload.textContent !== undefined) {
        textContentToUpdate = payload.textContent;
      }
      
      if (textContentToUpdate !== null) {
        updateData.textContent = textContentToUpdate;
        
        if (payload.content_type === 'text' || lecture.contentType === 'text') {
          updateData.contentUrl = '';
        }
      }

      lecture.merge(updateData);

      const contentFile = request.file('contentFile');
      const thumbnailFile = request.file('thumbnailFile');

      if (contentFile && contentFile.isValid) {
        const uploadOptions: any = {
          folder: `lectures/${lecture.contentType}s`,
          resource_type: lecture.contentType === 'video' ? 'video' : 'raw',
          public_id: `lecture_${lecture.contentType}_${Date.now()}`,
          overwrite: true,
          type: 'upload',
          access_mode: 'public',
        };

        const uploadedFile = await cloudinary.uploader.upload(contentFile.tmpPath!, uploadOptions);
        lecture.contentUrl = this.ensureSecureUrl(uploadedFile.secure_url);
      } else if (payload.content_url !== undefined) {
        lecture.contentUrl = payload.content_url;
      }

      if (thumbnailFile && thumbnailFile.isValid) {
        const uploadedThumbnail = await cloudinary.uploader.upload(thumbnailFile.tmpPath!, {
          folder: 'lectures/thumbnails',
          public_id: `lecture_thumb_${Date.now()}`,
          overwrite: true,
          type: 'upload',
          access_mode: 'public'
        });
        lecture.thumbnailUrl = this.ensureSecureUrl(uploadedThumbnail.secure_url);
      } else if (payload.thumbnail_url !== undefined) {
        lecture.thumbnailUrl = payload.thumbnail_url;
      }

      await lecture.save();
      await lecture.refresh();
      
      return response.ok({
        success: true,
        message: 'Lecture updated successfully',
        lecture
      });
    } catch (error: any) {
      return response.internalServerError({
        success: false,
        message: 'Failed to update lecture',
        error: error.message
      });
    }
  }

  public async findAll({ auth, request, response }: HttpContext) {
    try {
      const user = (request.ctx as any)?.user || auth.user;

      if (!user) {
        return response.unauthorized({
          success: false,
          message: 'User not authenticated'
        });
      }

      const permissionsResolver = new PermissionsResolverService(request.ctx as HttpContext, user);
      const { hasPermission, isSystemAdmin } = await permissionsResolver.permissionResolver([
        PermissionKeys.LECTURE_LIST
      ]);

      if (!hasPermission && !isSystemAdmin) {
        return response.forbidden({
          success: false,
          message: 'Insufficient permissions to view lectures'
        });
      }

      const query = Lecture.query().orderBy('created_at', 'desc');
      const filters = request.qs();

      if (!isSystemAdmin) {
        if (user.userType === 'faculty' && user.facultyId) {
          query.where('faculty_id', user.facultyId);
        } else if (user.userType === 'institute' && user.instituteId) {
          const FacultyModel = (await import('#models/faculty')).default;
          const facultyIds = await FacultyModel.query()
            .where('institute_id', user.instituteId)
            .select('id');

          if (facultyIds.length > 0) {
            const ids = facultyIds.map(f => f.id);
            query.whereIn('faculty_id', ids);
          } else {
            return response.ok({
              success: true,
              data: [],
              meta: { total: 0 }
            });
          }
        } else {
          return response.badRequest({
            success: false,
            message: 'User type not supported for lecture access'
          });
        }
      }

      if (filters.subject) {
        query.where('subject', 'like', `%${filters.subject}%`);
      }
      if (filters.contentType) {
        query.where('content_type', filters.contentType);
      }
      if (filters.title) {
        query.where('title', 'like', `%${filters.title}%`);
      }
      if (filters.faculty_id && isSystemAdmin) {
        query.where('faculty_id', filters.faculty_id);
      }

      const page = Number(filters.page || 1);
      const limit = Number(filters.limit || 50);

      const lectures = await query.paginate(page, limit);

      response.header('Access-Control-Allow-Origin', '*');
      response.header('Cross-Origin-Resource-Policy', 'cross-origin');

      return response.ok({
        success: true,
        message: 'Lectures fetched successfully',
        data: lectures.all(),
        meta: {
          total: lectures.total,
          currentPage: lectures.currentPage,
          perPage: lectures.perPage,
          lastPage: lectures.lastPage
        }
      });
    } catch (error: any) {
      return response.internalServerError({
        success: false,
        message: 'Failed to fetch lectures',
        error: error.message
      });
    }
  }

  public async findOne({ params, request, response }: HttpContext) {
    try {
      const user = (request.ctx as any)?.user;
      
      if (!user) {
        return response.unauthorized({
          success: false,
          message: 'User not authenticated'
        });
      }

      const lecture = await Lecture.find(params.id);
      if (!lecture) {
        return response.notFound({
          success: false,
          message: 'Lecture not found'
        });
      }

      const permissionsResolver = new PermissionsResolverService(request.ctx as HttpContext, user);
      const { hasPermission, isSystemAdmin } = await permissionsResolver.permissionResolver([
        PermissionKeys.LECTURE_VIEW
      ]);

      if (!isSystemAdmin) {
        if (user.userType === 'faculty' && lecture.facultyId !== user.facultyId) {
          return response.unauthorized({
            success: false,
            message: 'You can only view your own lectures'
          });
        } else if (!hasPermission) {
          return response.forbidden({
            success: false,
            message: 'Insufficient permissions to view this lecture'
          });
        }
      }

      response.header('Access-Control-Allow-Origin', '*');
      response.header('Cross-Origin-Resource-Policy', 'cross-origin');

      return response.ok({
        success: true,
        lecture
      });
    } catch (error: any) {
      return response.internalServerError({
        success: false,
        message: 'Failed to fetch lecture',
        error: error.message
      });
    }
  }

  public async deleteOne({ params, request, response, auth }: HttpContext) {
    try {
      const user = (request.ctx as any)?.user || auth.user;
      
      if (!user) {
        return response.unauthorized({
          success: false,
          message: 'User not authenticated'
        });
      }

      const lecture = await Lecture.find(params.id);
      if (!lecture) {
        return response.notFound({
          success: false,
          message: 'Lecture not found'
        });
      }

      const permissionsResolver = new PermissionsResolverService(request.ctx as HttpContext, user);
      const { hasPermission, isSystemAdmin } = await permissionsResolver.permissionResolver([
        PermissionKeys.LECTURE_DELETE
      ]);

      if (isSystemAdmin) {
      } else if (user.userType === 'faculty' && lecture.facultyId !== user.facultyId) {
        return response.unauthorized({
          success: false,
          message: 'You can only delete your own lectures'
        });
      } else if (!hasPermission) {
        return response.forbidden({
          success: false,
          message: 'Insufficient permissions to delete lectures'
        });
      }

      await lecture.delete();

      response.header('Access-Control-Allow-Origin', '*');

      return response.ok({
        success: true,
        message: 'Lecture deleted successfully'
      });
    } catch (error: any) {
      return response.internalServerError({
        success: false,
        message: 'Failed to delete lecture',
        error: error.message
      });
    }
  }

  private ensureSecureUrl(url: string): string {
    if (!url) return url;

    let secureUrl = url.replace('http://', 'https://');

    if (secureUrl.includes('res.cloudinary.com') && secureUrl.includes('/video/')) {
      if (!secureUrl.includes('?')) {
        secureUrl += '?';
      } else {
        secureUrl += '&';
      }
      secureUrl += '_a=AVAAAAAAAAAA';
    }

    return secureUrl;
  }
}