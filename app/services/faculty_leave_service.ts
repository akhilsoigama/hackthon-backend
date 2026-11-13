import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import FacultyLeave, { FacultyLeaveStatus } from '#models/faculty_leave'
import {
  createFacultyLeaveValidator,
  reviewFacultyLeaveValidator,
  updateFacultyLeaveValidator,
} from '#validators/faculty_leave'
import messages from '#database/constants/messages'
import { errorHandler } from '../helper/error_handler.js'

@inject()
export default class FacultyLeaveService {
  constructor(protected ctx: HttpContext) {}

  async create() {
    try {
      const user = await this.ctx.auth.authenticate()

      if (user.userType !== 'faculty' || !user.facultyId || !user.instituteId) {
        return this.ctx.response.forbidden({
          status: false,
          message: messages.faculty_leave_only_faculty_can_create,
        })
      }

      const payload = await createFacultyLeaveValidator.validate(this.ctx.request.all())
      const startDate = DateTime.fromJSDate(payload.startDate)
      const endDate = DateTime.fromJSDate(payload.endDate)

      if (endDate < startDate) {
        return this.ctx.response.badRequest({
          status: false,
          message: messages.faculty_leave_invalid_date_range,
        })
      }

      const totalDays = Math.floor(endDate.diff(startDate, 'days').days) + 1

      const leave = await FacultyLeave.create({
        facultyId: user.facultyId,
        instituteId: user.instituteId,
        leaveType: payload.leaveType,
        reason: payload.reason,
        startDate,
        endDate,
        totalDays,
        status: 'pending',
      })

      // Non-blocking notification dispatch
      ;(async () => {
        try {
          const { default: NotificationsService } = await import(
            '#modules/notifications/services/notifications_service'
          )
          const notificationService = new NotificationsService()

          if (user.id) {
            await notificationService
              .notifyUser(user.id, {
                title: 'Leave Request Submitted',
                message: `Your ${payload.leaveType} leave application (${totalDays} days) has been sent for approval.`,
                type: 'system',
                link: '/dashboard/leave',
                metadata: { leaveId: leave.id },
              })
              .catch(() => {})
          }

          if (user.instituteId) {
            await notificationService
              .notifyInstitute(
                user.instituteId,
                {
                  title: 'New Faculty Leave Request',
                  message: `A faculty member submitted a ${payload.leaveType} leave request. Tap to review.`,
                  type: 'system',
                  link: '/dashboard/leave',
                  metadata: { leaveId: leave.id },
                },
                ['institute']
              )
              .catch(() => {})
          }
        } catch (err) {
          console.error('[Notification Trigger] Faculty leave create notify error:', err)
        }
      })()

      return {
        status: true,
        message: messages.faculty_leave_created_successfully,
        data: leave,
      }
    } catch (error) {
      return {
        status: false,
        message: messages.common_messages_error,
        error: errorHandler(error),
      }
    }
  }

  async list() {
    try {
      const user = await this.ctx.auth.authenticate()
      const { status, facultyId } = this.ctx.request.qs()

      let query = FacultyLeave.query()
        .apply((scope) => scope.softDeletes())
        .preload('faculty', (facultyQuery) => {
          facultyQuery.preload('department')
        })
        .preload('institute')
        .orderBy('created_at', 'desc')

      if (status) {
        query = query.where('status', String(status))
      }

      if (user.userType === 'faculty') {
        if (!user.facultyId) {
          return {
            status: false,
            message: messages.faculty_leave_faculty_profile_missing,
            data: [],
          }
        }

        query = query.where('faculty_id', user.facultyId)
      } else if (user.userType === 'institute') {
        if (!user.instituteId) {
          return {
            status: false,
            message: messages.faculty_leave_institute_profile_missing,
            data: [],
          }
        }

        query = query.where('institute_id', user.instituteId)
        if (facultyId) {
          query = query.where('faculty_id', Number(facultyId))
        }
      } else {
        return this.ctx.response.forbidden({
          status: false,
          message: messages.faculty_leave_only_faculty_or_institute_can_list,
        })
      }

      const leaves = await query

      return {
        status: true,
        message: leaves.length ? messages.common_messages_record_available : messages.common_messages_no_record_found,
        data: leaves,
      }
    } catch (error) {
      return {
        status: false,
        message: messages.common_messages_error,
        error: errorHandler(error),
      }
    }
  }

  async update() {
    try {
      const user = await this.ctx.auth.authenticate()

      if (user.userType !== 'faculty' || !user.facultyId || !user.instituteId) {
        return this.ctx.response.forbidden({
          status: false,
          message: messages.faculty_leave_only_faculty_can_create,
        })
      }

      const id = this.ctx.request.param('id')
      if (!id || Number.isNaN(Number(id))) {
        return this.ctx.response.badRequest({
          status: false,
          message: messages.faculty_leave_invalid_id,
        })
      }

      const payload = await updateFacultyLeaveValidator.validate(this.ctx.request.all())

      const leave = await FacultyLeave.query().apply((scope) => scope.softDeletes()).where('id', id).first()

      if (!leave) {
        return this.ctx.response.notFound({
          status: false,
          message: messages.faculty_leave_not_found,
        })
      }

      if (leave.facultyId !== user.facultyId || leave.instituteId !== user.instituteId) {
        return this.ctx.response.forbidden({
          status: false,
          message: messages.faculty_leave_access_denied_other_institute,
        })
      }

      if (leave.status !== 'pending') {
        return this.ctx.response.badRequest({
          status: false,
          message: 'Only pending leave requests can be updated',
        })
      }

      const nextStartDate = payload.startDate ? DateTime.fromJSDate(payload.startDate) : leave.startDate
      const nextEndDate = payload.endDate ? DateTime.fromJSDate(payload.endDate) : leave.endDate

      if (nextEndDate < nextStartDate) {
        return this.ctx.response.badRequest({
          status: false,
          message: messages.faculty_leave_invalid_date_range,
        })
      }

      leave.merge({
        leaveType: payload.leaveType ?? leave.leaveType,
        reason: payload.reason ?? leave.reason,
        startDate: nextStartDate,
        endDate: nextEndDate,
        totalDays: Math.floor(nextEndDate.diff(nextStartDate, 'days').days) + 1,
      })

      await leave.save()

      return {
        status: true,
        message: messages.common_messages_record_updated,
        data: leave,
      }
    } catch (error) {
      return {
        status: false,
        message: messages.common_messages_error,
        error: errorHandler(error),
      }
    }
  }

  async delete() {
    try {
      const user = await this.ctx.auth.authenticate()

      if (user.userType !== 'faculty' || !user.facultyId || !user.instituteId) {
        return this.ctx.response.forbidden({
          status: false,
          message: messages.faculty_leave_only_faculty_can_create,
        })
      }

      const id = this.ctx.request.param('id')
      if (!id || Number.isNaN(Number(id))) {
        return this.ctx.response.badRequest({
          status: false,
          message: messages.faculty_leave_invalid_id,
        })
      }

      const leave = await FacultyLeave.query().apply((scope) => scope.softDeletes()).where('id', id).first()

      if (!leave) {
        return this.ctx.response.notFound({
          status: false,
          message: messages.faculty_leave_not_found,
        })
      }

      if (leave.facultyId !== user.facultyId || leave.instituteId !== user.instituteId) {
        return this.ctx.response.forbidden({
          status: false,
          message: messages.faculty_leave_access_denied_other_institute,
        })
      }

      if (leave.status !== 'pending') {
        return this.ctx.response.badRequest({
          status: false,
          message: 'Only pending leave requests can be deleted',
        })
      }

      leave.deletedAt = DateTime.now()
      await leave.save()

      return {
        status: true,
        message: messages.common_messages_record_deleted,
      }
    } catch (error) {
      return {
        status: false,
        message: messages.common_messages_error,
        error: errorHandler(error),
      }
    }
  }

  async review(status: Extract<FacultyLeaveStatus, 'approved' | 'rejected'>, instituteRemark?: string) {
    try {
      const user = await this.ctx.auth.authenticate()

      if (user.userType !== 'institute' || !user.instituteId) {
        return this.ctx.response.forbidden({
          status: false,
          message: messages.faculty_leave_only_institute_can_review,
        })
      }

      const id = this.ctx.request.param('id')
      if (!id || Number.isNaN(Number(id))) {
        return this.ctx.response.badRequest({
          status: false,
          message: messages.faculty_leave_invalid_id,
        })
      }

      const validatedReview = await reviewFacultyLeaveValidator.validate({ instituteRemark })

      const leave = await FacultyLeave.query().apply((scope) => scope.softDeletes()).where('id', id).first()

      if (!leave) {
        return this.ctx.response.notFound({
          status: false,
          message: messages.faculty_leave_not_found,
        })
      }

      if (leave.instituteId !== user.instituteId) {
        return this.ctx.response.forbidden({
          status: false,
          message: messages.faculty_leave_access_denied_other_institute,
        })
      }

      if (leave.status !== 'pending') {
        return this.ctx.response.badRequest({
          status: false,
          message: `Leave request already ${leave.status}`,
        })
      }

      leave.status = status
      leave.instituteRemark = validatedReview.instituteRemark ?? null
      leave.reviewedByUserId = user.id
      leave.reviewedAt = DateTime.now()
      await leave.save()

      // Non-blocking notification dispatch
      ;(async () => {
        try {
          const { default: NotificationsService } = await import(
            '#modules/notifications/services/notifications_service'
          )
          const { default: User } = await import('#models/user')
          const notificationService = new NotificationsService()

          if (leave.facultyId) {
            const facultyUser = await User.query().where('facultyId', leave.facultyId).first()
            if (facultyUser) {
              await notificationService
                .notifyUser(facultyUser.id, {
                  title: `Leave Application ${status === 'approved' ? 'Approved' : 'Rejected'}`,
                  message: `Your leave request has been ${status}.${validatedReview.instituteRemark ? ' Remark: ' + validatedReview.instituteRemark : ''}`,
                  type: 'system',
                  link: '/dashboard/leave',
                  metadata: { leaveId: leave.id, status },
                })
                .catch(() => {})
            }
          }
        } catch (err) {
          console.error('[Notification Trigger] Faculty leave review notify error:', err)
        }
      })()

      return {
        status: true,
        message:
          status === 'approved'
            ? messages.faculty_leave_approved_successfully
            : messages.faculty_leave_rejected_successfully,
        data: leave,
      }
    } catch (error) {
      return {
        status: false,
        message: messages.common_messages_error,
        error: errorHandler(error),
      }
    }
  }
}

