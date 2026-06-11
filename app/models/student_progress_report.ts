import { BaseModel, column, scope } from "@adonisjs/lucid/orm";
import { DateTime } from "luxon";
import SubjectProgress from "./subject_progress.js";

export default class StudentProgressReport extends BaseModel{
     static softDeletes = scope((query) => {
        query.whereNull('deleted_at')
      })
      @column({ isPrimary: true })
      declare id: number;
      
      @column()
      declare studentId: number;
      
      @column()
      declare instituteId: number;
      
      @column()
      declare subjectProgress: SubjectProgress[];
      
      @column()
      declare totalOverAllScore: number;

      @column()
      declare strengths: string;

      @column()
      declare weaknesses: string;

      @column()
      declare generatedAt:string;

      @column.dateTime({ autoCreate: true })
      declare createdAt: DateTime;
      
      @column.dateTime({ autoCreate: true, autoUpdate: true })
      declare updatedAt: DateTime;
      
      @column.dateTime({ columnName: 'deleted_at' })
      declare deletedAt: DateTime | null
}