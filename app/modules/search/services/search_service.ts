// app/modules/search/services/search_service.ts
import Lecture from '#models/lacture_upload'
import Assignment from '#models/assignment'
import Quizzes from '#models/quizzes'
import GovtEvent from '#models/govt_event'
import InstituteEvent from '#models/institute_event'
import Institute from '#models/institute'
import Student from '#models/student'
import Faculty from '#models/faculty'
import RagCourse from '#models/rag_course'
import Material from '#models/material'

export interface SearchResultItem {
  id: number
  title: string
  subtitle: string
  category:
    | 'institute'
    | 'student'
    | 'faculty'
    | 'course'
    | 'lecture'
    | 'material'
    | 'assignment'
    | 'quiz'
    | 'event'
  link: string
  date?: string | null
  badge?: string | null
}

export interface GroupedSearchResults {
  institutes: SearchResultItem[]
  students: SearchResultItem[]
  faculties: SearchResultItem[]
  courses: SearchResultItem[]
  materials: SearchResultItem[]
  lectures: SearchResultItem[]
  assignments: SearchResultItem[]
  quizzes: SearchResultItem[]
  events: SearchResultItem[]
  total: number
}

export default class SearchService {
  public async search(
    queryStr: string,
    options: {
      instituteId?: number | null
      limitPerCategory?: number
    } = {}
  ): Promise<GroupedSearchResults> {
    const q = (queryStr || '').trim()
    if (!q || q.length < 1) {
      return {
        institutes: [],
        students: [],
        faculties: [],
        courses: [],
        materials: [],
        lectures: [],
        assignments: [],
        quizzes: [],
        events: [],
        total: 0,
      }
    }

    const limit = options.limitPerCategory || 5
    const likePattern = `%${q}%`

    // Run parallel queries across all core educational and management entities
    const [
      institutes,
      students,
      faculties,
      courses,
      materials,
      lectures,
      assignments,
      quizzes,
      govtEvents,
      instituteEvents,
    ] = await Promise.all([
      // 1. Institutes (Table: institutes)
      Institute.query()
        .whereNull('deleted_at')
        .where((builder) => {
          builder
            .whereILike('institute_name', likePattern)
            .orWhereILike('institute_code', likePattern)
            .orWhereILike('institute_city', likePattern)
            .orWhereILike('institute_email', likePattern)
        })
        .limit(limit)
        .catch(() => []),

      // 2. Students (Table: students)
      Student.query()
        .whereNull('deleted_at')
        .where((builder) => {
          builder
            .whereILike('student_name', likePattern)
            .orWhereILike('student_email', likePattern)
            .orWhereILike('student_std', likePattern)
            .orWhereILike('student_mobile', likePattern)
        })
        .if(options.instituteId, (b) => b.where('institute_id', options.instituteId!))
        .limit(limit)
        .catch(() => []),

      // 3. Faculties (Table: faculties)
      Faculty.query()
        .whereNull('deleted_at')
        .where((builder) => {
          builder
            .whereILike('faculty_name', likePattern)
            .orWhereILike('faculty_email', likePattern)
            .orWhereILike('designation', likePattern)
            .orWhereILike('faculty_id', likePattern)
        })
        .if(options.instituteId, (b) => b.where('institute_id', options.instituteId!))
        .limit(limit)
        .catch(() => []),

      // 4. Skill Learning Courses (Table: rag_courses)
      RagCourse.query()
        .where((builder) => {
          builder
            .whereILike('title', likePattern)
            .orWhereILike('category', likePattern)
            .orWhereILike('sub_category', likePattern)
            .orWhereILike('description', likePattern)
        })
        .limit(limit)
        .catch(() => []),

      // 5. Materials (Table: materials)
      Material.query()
        .where((builder) => {
          builder
            .whereILike('title', likePattern)
            .orWhereILike('subject', likePattern)
            .orWhereILike('description', likePattern)
        })
        .if(options.instituteId, (b) => b.where('institute_id', options.instituteId!))
        .limit(limit)
        .catch(() => []),

      // 6. Lectures (Table: lacture_uploads)
      Lecture.query()
        .whereNull('deleted_at')
        .where((builder) => {
          builder
            .whereILike('title', likePattern)
            .orWhereILike('description', likePattern)
            .orWhereILike('subject', likePattern)
        })
        .if(options.instituteId, (b) => b.where('institute_id', options.instituteId!))
        .limit(limit)
        .catch(() => []),

      // 7. Assignments (Table: assignments)
      Assignment.query()
        .whereNull('deleted_at')
        .where((builder) => {
          builder
            .whereILike('assignment_title', likePattern)
            .orWhereILike('assignment_description', likePattern)
            .orWhereILike('subject', likePattern)
        })
        .if(options.instituteId, (b) => b.where('institute_id', options.instituteId!))
        .limit(limit)
        .catch(() => []),

      // 8. Quizzes (Table: quizzes)
      Quizzes.query()
        .whereNull('deleted_at')
        .where((builder) => {
          builder
            .whereILike('quiz_title', likePattern)
            .orWhereILike('quiz_description', likePattern)
            .orWhereILike('subject', likePattern)
        })
        .if(options.instituteId, (b) => b.where('institute_id', options.instituteId!))
        .limit(limit)
        .catch(() => []),

      // 9. Govt Events (Table: govt_events)
      GovtEvent.query()
        .whereNull('deleted_at')
        .where((builder) => {
          builder
            .whereILike('event_title', likePattern)
            .orWhereILike('event_description', likePattern)
            .orWhereILike('event_organizer', likePattern)
        })
        .limit(limit)
        .catch(() => []),

      // 10. Institute Events (Table: institute_events)
      InstituteEvent.query()
        .whereNull('deleted_at')
        .where((builder) => {
          builder
            .whereILike('event_title', likePattern)
            .orWhereILike('event_description', likePattern)
            .orWhereILike('event_venue', likePattern)
        })
        .if(options.instituteId, (b) => b.where('institute_id', options.instituteId!))
        .limit(limit)
        .catch(() => []),
    ])

    // Format results with direct dashboard links and descriptive subtitles
    const formattedInstitutes: SearchResultItem[] = institutes.map((inst) => ({
      id: inst.id,
      title: inst.instituteName || 'Institute',
      subtitle: `${inst.instituteCode ? `Code: ${inst.instituteCode}` : 'Institute'} • ${inst.instituteCity || inst.instituteState || 'Campus'}`,
      category: 'institute',
      link: `/dashboard/admin/institute/list`,
      badge: inst.instituteType || 'Institute',
    }))

    const formattedStudents: SearchResultItem[] = students.map((st) => ({
      id: st.id,
      title: st.studentName || 'Student',
      subtitle: `Class: ${st.studentStd || 'General'} • GR: ${st.studentGrNo || 'N/A'} • ${st.studentEmail}`,
      category: 'student',
      link: `/dashboard/institute-management/student/list`,
      badge: `Std ${st.studentStd || ''}`,
    }))

    const formattedFaculties: SearchResultItem[] = faculties.map((fac) => ({
      id: fac.id,
      title: fac.facultyName || 'Faculty',
      subtitle: `${fac.designation || 'Faculty Member'} • ${fac.facultyEmail}`,
      category: 'faculty',
      link: `/dashboard/institute-management/faculty/list`,
      badge: fac.designation || 'Faculty',
    }))

    const formattedCourses: SearchResultItem[] = courses.map((c) => ({
      id: c.id,
      title: c.title || 'Skill Course',
      subtitle: `Skill Learning • ${c.category || 'Skill'} ${c.subCategory ? `• ${c.subCategory}` : ''}`,
      category: 'course',
      link: `/dashboard/skills/rag`,
      badge: c.category || 'Skill',
    }))

    const formattedMaterials: SearchResultItem[] = materials.map((m) => ({
      id: m.id,
      title: m.title || 'Study Material',
      subtitle: `Material • ${m.subject || 'General'} • ${m.contentType ? m.contentType.toUpperCase() : 'DOC'}`,
      category: 'material',
      link: `/dashboard/student-upload/materials`,
      badge: m.contentType || 'Material',
    }))

    const formattedLectures: SearchResultItem[] = lectures.map((l) => ({
      id: l.id,
      title: l.title || 'Lecture',
      subtitle: `Lecture • ${l.subject || 'General'} • ${l.contentType ? l.contentType.toUpperCase() : 'Video'}`,
      category: 'lecture',
      link: `/dashboard/student-upload/materials`,
      badge: 'Lecture',
    }))

    const formattedAssignments: SearchResultItem[] = assignments.map((a) => ({
      id: a.id,
      title: a.assignmentTitle || 'Assignment',
      subtitle: `Assignment • ${a.subject || 'General'}`,
      category: 'assignment',
      link: `/dashboard/faculty-management/assignment/list`,
      date: a.dueDate ? a.dueDate.toISODate() : null,
      badge: a.subject || 'Assignment',
    }))

    const formattedQuizzes: SearchResultItem[] = quizzes.map((qz) => ({
      id: qz.id,
      title: qz.quizTitle || 'Quiz',
      subtitle: `Quiz • ${qz.subject || 'General'}`,
      category: 'quiz',
      link: `/dashboard/student-upload/quiz-attempt/list`,
      badge: qz.subject || 'Quiz',
    }))

    const formattedEvents: SearchResultItem[] = [
      ...govtEvents.map((ge) => ({
        id: ge.id,
        title: ge.eventTitle || 'Government Event',
        subtitle: `Govt Event • Organizer: ${ge.eventOrganizer || 'Government'}`,
        category: 'event' as const,
        link: `/dashboard/admin/govtEvent-master/list`,
        date: ge.eventDate ? new Date(ge.eventDate).toLocaleDateString() : null,
        badge: 'Govt Event',
      })),
      ...instituteEvents.map((ie) => ({
        id: ie.id,
        title: ie.eventTitle || 'Campus Event',
        subtitle: `Campus Event ${ie.eventVenue ? `• ${ie.eventVenue}` : ''}`,
        category: 'event' as const,
        link: `/dashboard/institute-management/institute-event/list`,
        date: ie.eventDate ? new Date(ie.eventDate).toLocaleDateString() : null,
        badge: 'Campus Event',
      })),
    ].slice(0, limit)

    const total =
      formattedInstitutes.length +
      formattedStudents.length +
      formattedFaculties.length +
      formattedCourses.length +
      formattedMaterials.length +
      formattedLectures.length +
      formattedAssignments.length +
      formattedQuizzes.length +
      formattedEvents.length

    return {
      institutes: formattedInstitutes,
      students: formattedStudents,
      faculties: formattedFaculties,
      courses: formattedCourses,
      materials: formattedMaterials,
      lectures: formattedLectures,
      assignments: formattedAssignments,
      quizzes: formattedQuizzes,
      events: formattedEvents,
      total,
    }
  }
}
