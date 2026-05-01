// app/services/lecture_upload_services.ts
import { inject } from "@adonisjs/core"
import { HttpContext } from '@adonisjs/core/http'
import Lecture from "#models/lacture_upload"
import cloudinary from "#config/cloudinary"
import { createLectureValidator, lectureIdParamValidator, updateLectureValidator } from "#validators/lacture_upload"
import PermissionsResolverService from "./permissions_resolver_service.js"
import { PermissionKeys } from "#database/constants/permission"
import apiCacheService from "#services/api_cache_service"

@inject()
export default class LectureUploadServices {
  private readonly lectureListCacheTtlMs = 30_000

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error'
  }

  private getAuthUser(rawUser: unknown): { userType?: string; facultyId?: number | null; instituteId?: number | null; id?: number } | null {
    if (typeof rawUser !== 'object' || rawUser === null) {
      return null
    }
    return rawUser as { userType?: string; facultyId?: number | null; instituteId?: number | null; id?: number }
  }

  private invalidateLectureCaches() {
    apiCacheService.invalidateByPrefix('lectures:list:')
  }

  private buildLectureListCacheKey(
    user: { id?: number; userType?: string; facultyId?: number | null; instituteId?: number | null },
    isSystemAdmin: boolean,
    filters: Record<string, unknown>,
    page: number,
    limit: number
  ) {
    const normalizedFilters = {
      subject: typeof filters.subject === 'string' ? filters.subject : '',
      contentType: typeof filters.contentType === 'string' ? filters.contentType : '',
      title: typeof filters.title === 'string' ? filters.title : '',
      faculty_id: typeof filters.faculty_id === 'string' || typeof filters.faculty_id === 'number' ? String(filters.faculty_id) : '',
    }

    return `lectures:list:${user.id ?? 'guest'}:${user.userType ?? 'unknown'}:${user.facultyId ?? 'none'}:${user.instituteId ?? 'none'}:${isSystemAdmin ? 'admin' : 'scoped'}:${page}:${limit}:${JSON.stringify(normalizedFilters)}`
  }

  public async create({ request, response, auth }: HttpContext) {
    try {
      const rawUser = (request.ctx as unknown as { user?: unknown })?.user ?? auth.user
      const user = this.getAuthUser(rawUser)

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
      } else if (user.userType === 'faculty' && typeof user.facultyId === 'number') {
        facultyId = user.facultyId;
      } else if (user.userType === 'institute' && typeof user.instituteId === 'number') {
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
          const uploadOptions: Record<string, unknown> = {
            folder: `lectures/${payload.content_type}s`,
            resource_type: payload.content_type === 'video' ? 'video' : 'raw',
            public_id: `lecture_${payload.content_type}_${Date.now()}`,
            overwrite: true,
            type: 'upload',
            access_mode: 'public',
            headers: {
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
            access_mode: 'public'
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
        departmentId: payload.department_id ?? null,
        chapterTopic: payload.chapter_topic ?? null,
        learningObjectives: payload.learning_objectives ?? null,
        difficultyLevel: payload.difficulty_level ?? null,
        contentType: payload.content_type,
        facultyId: facultyId,
        contentUrl: contentUrl,
        thumbnailUrl: thumbnailUrl,
        durationInSeconds: payload.duration_in_seconds ?? null,
        textContent: payload.text_content ?? null,
      };

      const lecture = await Lecture.create(lectureData);
      this.invalidateLectureCaches();

      response.header('Cross-Origin-Resource-Policy', 'cross-origin');

      return response.created({
        success: true,
        message: 'Lecture uploaded successfully',
        lecture
      });

    } catch (error: unknown) {
      return response.internalServerError({
        success: false,
        message: 'Failed to create lecture',
        error: this.getErrorMessage(error)
      });
    }
  }

  public async updateOne({ params, request, response, auth }: HttpContext) {
    try {
      const rawUser = (request.ctx as unknown as { user?: unknown })?.user ?? auth.user
      const user = this.getAuthUser(rawUser)

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

      const updateData: Record<string, unknown> = {};
      
      if (payload.title !== undefined) updateData.title = payload.title;
      if (payload.description !== undefined) updateData.description = payload.description;
      if (payload.subject !== undefined) updateData.subject = payload.subject;
      if (payload.std !== undefined) updateData.std = payload.std;
      if (payload.department_id !== undefined) updateData.departmentId = payload.department_id;
      if (payload.chapter_topic !== undefined) updateData.chapterTopic = payload.chapter_topic;
      if (payload.learning_objectives !== undefined) updateData.learningObjectives = payload.learning_objectives;
      if (payload.difficulty_level !== undefined) updateData.difficultyLevel = payload.difficulty_level;
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
        const uploadOptions: Record<string, unknown> = {
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
      this.invalidateLectureCaches();
      
      return response.ok({
        success: true,
        message: 'Lecture updated successfully',
        lecture
      });
    } catch (error: unknown) {
      return response.internalServerError({
        success: false,
        message: 'Failed to update lecture',
        error: this.getErrorMessage(error)
      });
    }
  }

  public async findAll({ auth, request, response }: HttpContext) {
    try {
      const rawUser = (request.ctx as unknown as { user?: unknown })?.user ?? auth.user
      const user = this.getAuthUser(rawUser)

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

      const filters = request.qs();
      const page = Number(filters.page || 1);
      const limit = Number(filters.limit || 50);
      const cacheKey = this.buildLectureListCacheKey(user, isSystemAdmin, filters, page, limit)

      const cachedResult = await apiCacheService.getOrSet(
        cacheKey,
        this.lectureListCacheTtlMs,
        async () => {
          const query = Lecture.query()
            .select([
              'id',
              'title',
              'description',
              'subject',
              'std',
              'department_id',
              'chapter_topic',
              'learning_objectives',
              'difficulty_level',
              'content_type',
              'faculty_id',
              'content_url',
              'thumbnail_url',
              'duration_in_seconds',
              'created_at',
            ])
            .orderBy('created_at', 'desc')

          if (!isSystemAdmin) {
            if (user.userType === 'faculty' && typeof user.facultyId === 'number') {
              query.where('faculty_id', user.facultyId)
            } else if (user.userType === 'institute' && typeof user.instituteId === 'number') {
              const FacultyModel = (await import('#models/faculty')).default
              const facultyIds = await FacultyModel.query().where('institute_id', user.instituteId).select('id')

              if (facultyIds.length > 0) {
                query.whereIn('faculty_id', facultyIds.map((f) => f.id))
              } else {
                return {
                  success: true,
                  message: 'Lectures fetched successfully',
                  data: [],
                  meta: {
                    total: 0,
                    currentPage: page,
                    perPage: limit,
                    lastPage: 0,
                  },
                }
              }
            } else {
              return {
                success: false,
                message: 'User type not supported for lecture access',
                statusCode: 400,
              }
            }
          }

          if (filters.subject) {
            query.where('subject', 'like', `%${filters.subject}%`)
          }
          if (filters.contentType) {
            query.where('content_type', filters.contentType)
          }
          if (filters.title) {
            query.where('title', 'like', `%${filters.title}%`)
          }
          if (filters.faculty_id && isSystemAdmin) {
            query.where('faculty_id', filters.faculty_id)
          }

          const lectures = await query.paginate(page, limit)
          return {
            success: true,
            message: 'Lectures fetched successfully',
            data: lectures.all(),
            meta: {
              total: lectures.total,
              currentPage: lectures.currentPage,
              perPage: lectures.perPage,
              lastPage: lectures.lastPage,
            },
          }
        },
        ['lectures-list']
      )

      if (!cachedResult.success && cachedResult.statusCode === 400) {
        return response.badRequest({
          success: false,
          message: cachedResult.message,
        })
      }

      response.header('Cross-Origin-Resource-Policy', 'cross-origin');
      return response.ok(cachedResult);
    } catch (error: unknown) {
      return response.internalServerError({
        success: false,
        message: 'Failed to fetch lectures',
        error: this.getErrorMessage(error)
      });
    }
  }

  public async findOne({ params, request, response }: HttpContext) {
    try {
      const rawUser = (request.ctx as unknown as { user?: unknown })?.user
      const user = this.getAuthUser(rawUser)
      
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

      response.header('Cross-Origin-Resource-Policy', 'cross-origin');

      return response.ok({
        success: true,
        lecture
      });
    } catch (error: unknown) {
      return response.internalServerError({
        success: false,
        message: 'Failed to fetch lecture',
        error: this.getErrorMessage(error)
      });
    }
  }

  public async deleteOne({ params, request, response, auth }: HttpContext) {
    try {
      const rawUser = (request.ctx as unknown as { user?: unknown })?.user ?? auth.user
      const user = this.getAuthUser(rawUser)
      
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
      this.invalidateLectureCaches();

      return response.ok({
        success: true,
        message: 'Lecture deleted successfully'
      });
    } catch (error: unknown) {
      return response.internalServerError({
        success: false,
        message: 'Failed to delete lecture',
        error: this.getErrorMessage(error)
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

