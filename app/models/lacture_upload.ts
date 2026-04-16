import { BaseModel, belongsTo, column } from "@adonisjs/lucid/orm"
import Faculty from "./faculty.js"
import type { BelongsTo } from "@adonisjs/lucid/types/relations"

export default class Lecture extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column()
  declare description: string | null

  @column()
  declare subject: string | null

  @column()
  declare std: string | null

  @column({ columnName: 'content_type' })
  declare contentType: 'video' | 'pdf' | 'audio' | 'text' | 'image'

  @column({ columnName: 'faculty_id' })
  declare facultyId: number

  @column({ columnName: 'thumbnail_url' })
  declare thumbnailUrl: string | null

  @column({ columnName: 'content_url' }) 
  declare contentUrl: string | null 

  @column({ columnName: 'duration_in_seconds' })
  declare durationInSeconds: number | null

  @column({ columnName: 'text_content' })
  declare textContent: string | null

  @column({ columnName: 'department_id' })
  declare departmentId: number | null

  @column({ columnName: 'chapter_topic' })
  declare chapterTopic: string | null

  @column({ columnName: 'learning_objectives' })
  declare learningObjectives: string | null

  @column({ columnName: 'difficulty_level' })
  declare difficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | null

  @belongsTo(() => Faculty, {
    foreignKey: 'faculty_id',
  })
  declare faculty: BelongsTo<typeof Faculty>
}
