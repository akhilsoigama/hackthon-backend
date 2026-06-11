import { inject } from '@adonisjs/core'

type ProgressInputRow = {
  subject: string | null
  score: number | null
  assignment_id?: number // Optional for assignment rows
}

type SubjectProgressSummary = {
  subject: string
  totalQuizzes: number
  totalAssignments: number
  quizMarksTotal: number
  quizMarksAverage: number
  assignmentSubmissionMarksTotal: number
  assignmentSubmissionMarksAverage: number
  overallScore: number
  status: 'excellent' | 'good' | 'needs_help' | 'average'
}

@inject()
export default class SubjectProgressServices {
  private readonly defaultSubject = 'Unassigned'

  buildSubjectProgress(quizRows: ProgressInputRow[], assignmentRows: ProgressInputRow[]) {
    const progressMap = new Map<
      string,
      {
        subject: string
        quizMarksTotal: number
        quizCount: number
        assignmentSubmissionMarksTotal: number
        assignmentCount: number
      }
    >()

    for (const row of quizRows) {
      const subject = this.normalizeSubject(row.subject)
      const current = progressMap.get(subject) ?? {
        subject,
        quizMarksTotal: 0,
        quizCount: 0,
        assignmentSubmissionMarksTotal: 0,
        assignmentCount: 0,
      }

      const score = Number(row.score ?? 0)
      current.quizMarksTotal += score
      current.quizCount += 1
      progressMap.set(subject, current)
      
    }

    // Process assignment rows
    for (const row of assignmentRows) {
      const subject = this.normalizeSubject(row.subject)
      const current = progressMap.get(subject) ?? {
        subject,
        quizMarksTotal: 0,
        quizCount: 0,
        assignmentSubmissionMarksTotal: 0,
        assignmentCount: 0,
      }

      const score = Number(row.score ?? 0)
      current.assignmentSubmissionMarksTotal += score
      current.assignmentCount += 1
      progressMap.set(subject, current)
      
    }

    // Convert map to array and calculate averages
    const subjects = Array.from(progressMap.values())

    const result = subjects.map((progress): SubjectProgressSummary => {
      // Calculate averages
      const quizMarksAverage = progress.quizCount > 0 
        ? (progress.quizMarksTotal / progress.quizCount) 
        : 0
      
      const assignmentSubmissionMarksAverage = progress.assignmentCount > 0
        ? (progress.assignmentSubmissionMarksTotal / progress.assignmentCount)
        : 0

      let overallScore = 0
      let totalComponents = 0

      if (progress.quizCount > 0) {
        overallScore += quizMarksAverage
        totalComponents += 1
      }
      
      if (progress.assignmentCount > 0) {
        overallScore += assignmentSubmissionMarksAverage
        totalComponents += 1
      }

      if (totalComponents > 0) {
        overallScore = overallScore / totalComponents
      }

      const status = this.resolveStatus(overallScore)

      return {
        subject: progress.subject,
        totalQuizzes: progress.quizCount,
        totalAssignments: progress.assignmentCount,
        quizMarksTotal: progress.quizMarksTotal,
        quizMarksAverage: Number(quizMarksAverage.toFixed(2)),
        assignmentSubmissionMarksTotal: progress.assignmentSubmissionMarksTotal,
        assignmentSubmissionMarksAverage: Number(assignmentSubmissionMarksAverage.toFixed(2)),
        overallScore: Number(overallScore.toFixed(2)),
        status,
      }
    })

    return result.sort((left, right) => left.subject.localeCompare(right.subject))
  }

  buildProgressReport({
    student,
    studentId,
    instituteId,
    quizRows,
    assignmentRows,
  }: {
    student: {
      id: number
      studentName: string
      studentGrNo: number
      studentStd?: string
      studentDegree?: string | null
      studentSemester?: string | null
      departmentName?: string
    } | null
    studentId: number
    instituteId: number
    quizRows: ProgressInputRow[]
    assignmentRows: ProgressInputRow[]
  }) {
    const subjectProgress = this.buildSubjectProgress(quizRows, assignmentRows)
    
    const totalOverAllScore = this.calculateOverallScore(subjectProgress)
    return {
      studentId,
      instituteId,
      student,
      subjectProgress,
      totalOverAllScore,
      strengths: subjectProgress
        .filter((subject) => subject.status === 'excellent' || subject.status === 'good')
        .map((subject) => subject.subject),
      weakSubjects: subjectProgress
        .filter((subject) => subject.status === 'needs_help' || subject.status === 'average')
        .map((subject) => subject.subject),
      generatedAt: new Date().toISOString(),
    }
  }

  calculateOverallScore(subjectProgress: SubjectProgressSummary[]) {
    if (subjectProgress.length === 0) {
      return 0
    }

    const totalScore = subjectProgress.reduce((sum, progress) => sum + progress.overallScore, 0)
    const averageScore = totalScore / subjectProgress.length
    
    return Number(averageScore.toFixed(2))
  }

  private normalizeSubject(subject: string | null) {
    const trimmedSubject = subject?.trim()
    return trimmedSubject && trimmedSubject.length > 0 ? trimmedSubject : this.defaultSubject
  }

  private resolveStatus(score: number): SubjectProgressSummary['status'] {
    if (score >= 80) {
      return 'excellent'
    }

    if (score >= 60) {
      return 'good'
    }

    if (score >= 40) {
      return 'needs_help'
    }

    return 'average'
  }
}