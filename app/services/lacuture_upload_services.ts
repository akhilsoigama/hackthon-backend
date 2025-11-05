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

  /**
   * Create a new lecture
   */
  public async create({ request, response, auth }: HttpContext) {
    try {
      // Use the user from ctx (set by AuthMiddleware) or fall back to auth
      const user = (request.ctx as any)?.user || auth.user;

      console.log('👤 User attempting lecture creation:', {
        userId: user?.id,
        userType: user?.userType,
        facultyId: user?.facultyId,
        instituteId: user?.instituteId
      });

      if (!user) {
        return response.unauthorized({
          success: false,
          message: 'User not authenticated - Please login again'
        });
      }

      // FIX: Pass the HttpContext correctly with type assertion
      const permissionsResolver = new PermissionsResolverService(request.ctx as HttpContext, user);
      const { hasPermission, isSystemAdmin } = await permissionsResolver.permissionResolver([
        PermissionKeys.LECTURE_CREATE // Use the correct enum value
      ]);

      console.log('🔐 Permission check result:', {
        hasPermission,
        isSystemAdmin,
        userType: user.userType
      });

      if (!hasPermission && !isSystemAdmin) {
        return response.forbidden({
          success: false,
          message: 'Insufficient permissions to create lectures'
        });
      }

      const payload = await createLectureValidator.validate(request.all());

      console.log('📦 Payload received:', {
        title: payload.title,
        contentType: payload.content_type,
        hasTextContent: !!payload.text_content,
        hasMedia: !!request.file('mediaFile'),
        hasContentFile: !!request.file('contentFile')
      });

      let facultyId: number;

      // System admin can specify facultyId, others use their own
      if (isSystemAdmin && payload.faculty_id) {
        facultyId = payload.faculty_id;
        console.log('🎯 System admin specified facultyId:', facultyId);
      } else if (user.userType === 'faculty' && user.facultyId) {
        facultyId = user.facultyId;
        console.log('🎯 Faculty using own facultyId:', facultyId);
      } else if (user.userType === 'institute' && user.instituteId) {
        facultyId = user.instituteId;
        console.log('🎯 Institute using instituteId as facultyId:', facultyId);
      } else {
        return response.badRequest({
          success: false,
          message: 'User is not associated with any faculty/institute'
        });
      }

      // Verify faculty exists
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

      // Check duplicate title for this faculty
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

      // Enhanced Cloudinary upload with CORS settings
      if (payload.content_type === 'video' || payload.content_type === 'audio') {
        const mediaFile = request.file('mediaFile', {
          size: '500mb',
          extnames: payload.content_type === 'video' ? ['mp4', 'mov', 'avi', 'mkv'] : ['mp3', 'wav', 'aac'],
        });

        if (mediaFile && mediaFile.isValid) {
          console.log('🎬 Processing media file upload:', {
            type: payload.content_type,
            fileName: mediaFile.clientName,
            size: mediaFile.size
          });

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

          // Video-specific optimizations
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
          console.log('✅ Media file uploaded successfully:', contentUrl);
        } else if (payload.content_url) {
          contentUrl = payload.content_url;
          console.log('🔗 Using provided content URL');
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
        console.log('📝 Text content provided, no content URL needed');
      }
      else if (payload.content_type === 'pdf' || payload.content_type === 'image') {
        const file = request.file('contentFile', {
          size: '50mb',
          extnames: payload.content_type === 'pdf' ? ['pdf'] : ['png', 'jpg', 'jpeg', 'gif'],
        });

        if (file && file.isValid) {
          console.log('📄 Processing content file upload:', {
            type: payload.content_type,
            fileName: file.clientName,
            size: file.size
          });

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
          console.log('✅ Content file uploaded successfully:', contentUrl);
        } else if (payload.content_url) {
          contentUrl = payload.content_url;
          console.log('🔗 Using provided content URL');
        } else {
          return response.badRequest({
            success: false,
            message: `${payload.content_type} file or content_url is required`
          });
        }
      }

      // Thumbnail upload
      const thumbnailFile = request.file('thumbnailFile', {
        size: '5mb',
        extnames: ['png', 'jpg', 'jpeg'],
      });

      if (thumbnailFile && thumbnailFile.isValid) {
        console.log('🖼️ Processing thumbnail file upload:', {
          fileName: thumbnailFile.clientName,
          size: thumbnailFile.size
        });

        const uploadedThumbnail = await cloudinary.uploader.upload(thumbnailFile.tmpPath!, {
          folder: 'lectures/thumbnails',
          public_id: `lecture_thumb_${Date.now()}`,
          overwrite: true,
          type: 'upload',
          access_mode: 'public'
        });
        thumbnailUrl = this.ensureSecureUrl(uploadedThumbnail.secure_url);
        console.log('✅ Thumbnail uploaded successfully:', thumbnailUrl);
      } else if (payload.thumbnail_url) {
        thumbnailUrl = payload.thumbnail_url;
        console.log('🔗 Using provided thumbnail URL');
      } else {
        thumbnailUrl = 'default_thumbnail.png';
        console.log('🖼️ Using default thumbnail');
      }

      // Final validation for non-text content types
      if (payload.content_type !== 'text' && !contentUrl) {
        return response.badRequest({
          success: false,
          message: `${payload.content_type} file or content_url is required`
        });
      }

      // Create lecture
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

      console.log('💾 Creating lecture with data:', {
        title: lectureData.title,
        contentType: lectureData.contentType,
        facultyId: lectureData.facultyId,
        hasTextContent: !!lectureData.textContent
      });

      const lecture = await Lecture.create(lectureData);

      // Set CORS headers for response
      response.header('Access-Control-Allow-Origin', '*');
      response.header('Cross-Origin-Resource-Policy', 'cross-origin');

      console.log('✅ Lecture created successfully:', {
        lectureId: lecture.id,
        title: lecture.title
      });

      return response.created({
        success: true,
        message: 'Lecture uploaded successfully',
        lecture
      });

    } catch (error: any) {
      console.error('❌ Lecture creation error:', error);
      return response.internalServerError({
        success: false,
        message: 'Failed to create lecture',
        error: error.message
      });
    }
  }

  /**
   * Update an existing lecture
   */
  public async updateOne({ params, request, response, auth }: HttpContext) {
    try {
      const user = (request.ctx as any)?.user || auth.user;

      console.log('👤 User attempting lecture update:', {
        userId: user?.id,
        userType: user?.userType,
        facultyId: user?.facultyId
      });

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

      console.log('📚 Found lecture:', {
        lectureId: lecture.id,
        title: lecture.title,
        facultyId: lecture.facultyId,
        contentType: lecture.contentType
      });

      // FIX: Pass the HttpContext correctly
      const permissionsResolver = new PermissionsResolverService(request.ctx as HttpContext, user);
      const { hasPermission, isSystemAdmin } = await permissionsResolver.permissionResolver([
        PermissionKeys.LECTURE_UPDATE // Use the correct enum value
      ]);

      console.log('🔐 Permission check result:', {
        hasPermission,
        isSystemAdmin,
        userFacultyId: user.facultyId,
        lectureFacultyId: lecture.facultyId
      });

      // Authorization check - system admin can update any, faculty only their own
      if (isSystemAdmin) {
        console.log('🎯 System admin - bypassing ownership check');
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

      // Get raw body for debugging
      const rawBody = request.all();
      console.log('🔍 Raw Request Body Keys:', Object.keys(rawBody));
      console.log('🔍 Raw text_content:', rawBody.text_content ? `PRESENT (${rawBody.text_content.length} chars)` : 'MISSING');
      console.log('🔍 Raw textContent:', rawBody.textContent ? `PRESENT (${rawBody.textContent.length} chars)` : 'MISSING');

      const payload = await updateLectureValidator.validate(rawBody);

      console.log('📝 Validated Payload Text Fields:', {
        text_content: payload.text_content ? `PRESENT (${payload.text_content.length} chars)` : 'MISSING',
        textContent: payload.textContent ? `PRESENT (${payload.textContent.length} chars)` : 'MISSING'
      });

      const updateData: any = {};
      
      // Basic fields
      if (payload.title !== undefined) updateData.title = payload.title;
      if (payload.description !== undefined) updateData.description = payload.description;
      if (payload.subject !== undefined) updateData.subject = payload.subject;
      if (payload.std !== undefined) updateData.std = payload.std;
      if (payload.content_type !== undefined) updateData.contentType = payload.content_type;
      if (payload.duration_in_seconds !== undefined) updateData.durationInSeconds = payload.duration_in_seconds;
      
      // Handle both text_content and textContent correctly
      let textContentToUpdate = null;
      
      if (payload.text_content !== undefined) {
        console.log('📄 Using text_content field:', payload.text_content.substring(0, 50) + '...');
        textContentToUpdate = payload.text_content;
      } else if (payload.textContent !== undefined) {
        console.log('📄 Using textContent field:', payload.textContent.substring(0, 50) + '...');
        textContentToUpdate = payload.textContent;
      } else {
        console.log('📄 No text content found in payload');
      }
      
      if (textContentToUpdate !== null) {
        console.log('🔄 Setting textContent in updateData');
        updateData.textContent = textContentToUpdate;
        
        // If updating text content for text type, clear contentUrl
        if (payload.content_type === 'text' || lecture.contentType === 'text') {
          updateData.contentUrl = '';
          console.log('🔄 Cleared contentUrl for text content');
        }
      }

      console.log('📦 Update Data Keys:', Object.keys(updateData));

      // Check if textContent is actually in updateData
      if ('textContent' in updateData) {
        console.log('✅ textContent WILL be updated');
      } else {
        console.log('❌ textContent NOT in updateData');
      }

      // Merge the update data
      lecture.merge(updateData);

      console.log('💾 After merge - lecture.textContent:', 
        lecture.textContent ? lecture.textContent.substring(0, 50) + '...' : 'NULL'
      );

      // Handle file updates
      const contentFile = request.file('contentFile');
      const thumbnailFile = request.file('thumbnailFile');

      // Content file handling
      if (contentFile && contentFile.isValid) {
        console.log('📁 Processing content file upload:', {
          fileName: contentFile.clientName,
          size: contentFile.size
        });
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
        console.log('✅ Content file updated:', lecture.contentUrl);
      } else if (payload.content_url !== undefined) {
        lecture.contentUrl = payload.content_url;
        console.log('🔗 Using provided content URL');
      }

      // Thumbnail file handling
      if (thumbnailFile && thumbnailFile.isValid) {
        console.log('🖼️ Processing thumbnail file upload:', {
          fileName: thumbnailFile.clientName,
          size: thumbnailFile.size
        });
        const uploadedThumbnail = await cloudinary.uploader.upload(thumbnailFile.tmpPath!, {
          folder: 'lectures/thumbnails',
          public_id: `lecture_thumb_${Date.now()}`,
          overwrite: true,
          type: 'upload',
          access_mode: 'public'
        });
        lecture.thumbnailUrl = this.ensureSecureUrl(uploadedThumbnail.secure_url);
        console.log('✅ Thumbnail updated:', lecture.thumbnailUrl);
      } else if (payload.thumbnail_url !== undefined) {
        lecture.thumbnailUrl = payload.thumbnail_url;
        console.log('🔗 Using provided thumbnail URL');
      }

      // Save the lecture
      console.log('💾 Saving to database...');
      await lecture.save();
      console.log('✅ Save completed');

      // Refresh to get the latest data
      await lecture.refresh();

      console.log('✅ FINAL UPDATED LECTURE:', {
        id: lecture.id,
        title: lecture.title,
        contentType: lecture.contentType,
        textContent: lecture.textContent ? lecture.textContent.substring(0, 50) + '...' : 'NULL',
        contentUrl: lecture.contentUrl,
        thumbnailUrl: lecture.thumbnailUrl
      });
      
      return response.ok({
        success: true,
        message: 'Lecture updated successfully',
        lecture
      });
    } catch (error: any) {
      console.error('❌ Update Error:', error);
      return response.internalServerError({
        success: false,
        message: 'Failed to update lecture',
        error: error.message
      });
    }
  }

  /**
   * Get all lectures with filtering and pagination
   */
  public async findAll({ auth, request, response }: HttpContext) {
    try {
      const user = (request.ctx as any)?.user || auth.user;

      console.log('👤 User fetching lectures:', {
        userId: user?.id,
        userType: user?.userType,
        facultyId: user?.facultyId,
        instituteId: user?.instituteId
      });

      if (!user) {
        return response.unauthorized({
          success: false,
          message: 'User not authenticated'
        });
      }

      // FIX: Pass the HttpContext correctly
      const permissionsResolver = new PermissionsResolverService(request.ctx as HttpContext, user);
      const { hasPermission, isSystemAdmin } = await permissionsResolver.permissionResolver([
        PermissionKeys.LECTURE_LIST // Use the correct enum value
      ]);

      console.log('🔐 Permission check result:', {
        hasPermission,
        isSystemAdmin
      });

      if (!hasPermission && !isSystemAdmin) {
        return response.forbidden({
          success: false,
          message: 'Insufficient permissions to view lectures'
        });
      }

      const query = Lecture.query().orderBy('created_at', 'desc');
      const filters = request.qs();

      console.log('🔍 Filters applied:', filters);

      // System admin can see all lectures, others are filtered
      if (!isSystemAdmin) {
        if (user.userType === 'faculty' && user.facultyId) {
          query.where('faculty_id', user.facultyId);
          console.log('🎯 Filtering by faculty ID:', user.facultyId);
        } else if (user.userType === 'institute' && user.instituteId) {
          const FacultyModel = (await import('#models/faculty')).default;
          const facultyIds = await FacultyModel.query()
            .where('institute_id', user.instituteId)
            .select('id');

          if (facultyIds.length > 0) {
            const ids = facultyIds.map(f => f.id);
            query.whereIn('faculty_id', ids);
            console.log('🎯 Filtering by institute faculty IDs:', ids);
          } else {
            console.log('ℹ️ No faculties found for institute');
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
      } else {
        console.log('🎯 System admin - no faculty filtering applied');
      }

      // Apply additional filters
      if (filters.subject) {
        query.where('subject', 'like', `%${filters.subject}%`);
        console.log('🎯 Filtering by subject:', filters.subject);
      }
      if (filters.contentType) {
        query.where('content_type', filters.contentType);
        console.log('🎯 Filtering by content type:', filters.contentType);
      }
      if (filters.title) {
        query.where('title', 'like', `%${filters.title}%`);
        console.log('🎯 Filtering by title:', filters.title);
      }
      if (filters.faculty_id && isSystemAdmin) {
        query.where('faculty_id', filters.faculty_id);
        console.log('🎯 System admin filtering by faculty ID:', filters.faculty_id);
      }

      // Pagination
      const page = Number(filters.page || 1);
      const limit = Number(filters.limit || 50);

      console.log('📄 Pagination:', { page, limit });

      const lectures = await query.paginate(page, limit);

      console.log('✅ Lectures fetched:', {
        total: lectures.total,
        currentPage: lectures.currentPage,
        perPage: lectures.perPage,
        count: lectures.all().length
      });

      // Set CORS headers
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
      console.error('❌ Fetch lectures error:', error);
      return response.internalServerError({
        success: false,
        message: 'Failed to fetch lectures',
        error: error.message
      });
    }
  }

  /**
   * Get a single lecture by ID
   */
  public async findOne({ params, request, response }: HttpContext) {
    try {
      const user = (request.ctx as any)?.user;
      
      console.log('👤 User fetching single lecture:', {
        userId: user?.id,
        userType: user?.userType,
        facultyId: user?.facultyId
      });

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

      console.log('📚 Found lecture:', {
        lectureId: lecture.id,
        title: lecture.title,
        facultyId: lecture.facultyId,
        contentType: lecture.contentType
      });

      // FIX: Pass the HttpContext correctly
      const permissionsResolver = new PermissionsResolverService(request.ctx as HttpContext, user);
      const { hasPermission, isSystemAdmin } = await permissionsResolver.permissionResolver([
        PermissionKeys.LECTURE_VIEW // Use the correct enum value
      ]);

      console.log('🔐 Permission check result:', {
        hasPermission,
        isSystemAdmin,
        userFacultyId: user.facultyId,
        lectureFacultyId: lecture.facultyId
      });

      // System admin can see any lecture, others need permission and ownership
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

      // Set CORS headers
      response.header('Access-Control-Allow-Origin', '*');
      response.header('Cross-Origin-Resource-Policy', 'cross-origin');

      console.log('✅ Lecture access granted');

      return response.ok({
        success: true,
        lecture
      });
    } catch (error: any) {
      console.error('❌ Fetch single lecture error:', error);
      return response.internalServerError({
        success: false,
        message: 'Failed to fetch lecture',
        error: error.message
      });
    }
  }

  /**
   * Delete a lecture
   */
  public async deleteOne({ params, request, response, auth }: HttpContext) {
    try {
      const user = (request.ctx as any)?.user || auth.user;
      
      console.log('👤 User attempting lecture deletion:', {
        userId: user?.id,
        userType: user?.userType,
        facultyId: user?.facultyId
      });

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

      console.log('📚 Found lecture to delete:', {
        lectureId: lecture.id,
        title: lecture.title,
        facultyId: lecture.facultyId
      });

      // FIX: Pass the HttpContext correctly
      const permissionsResolver = new PermissionsResolverService(request.ctx as HttpContext, user);
      const { hasPermission, isSystemAdmin } = await permissionsResolver.permissionResolver([
        PermissionKeys.LECTURE_DELETE // Use the correct enum value
      ]);

      console.log('🔐 Permission check result:', {
        hasPermission,
        isSystemAdmin,
        userFacultyId: user.facultyId,
        lectureFacultyId: lecture.facultyId
      });

      // System admin can delete any, faculty only their own
      if (isSystemAdmin) {
        console.log('🎯 System admin - bypassing ownership check');
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

      console.log('✅ Lecture deleted successfully:', lecture.id);

      // Set CORS headers
      response.header('Access-Control-Allow-Origin', '*');

      return response.ok({
        success: true,
        message: 'Lecture deleted successfully'
      });
    } catch (error: any) {
      console.error('❌ Delete lecture error:', error);
      return response.internalServerError({
        success: false,
        message: 'Failed to delete lecture',
        error: error.message
      });
    }
  }

  /**
   * Ensure URL uses HTTPS and has proper CORS-friendly format
   */
  private ensureSecureUrl(url: string): string {
    if (!url) return url;

    // Ensure HTTPS
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