import { BaseModel, belongsTo, column } from "@adonisjs/lucid/orm"
import Faculty from "./faculty.js"
import type{ BelongsTo } from "@adonisjs/lucid/types/relations"

export default class Lecture extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare title: string

    @column()
    declare description: string

    @column()
    declare videoPath: string 

    @column()
    declare thumbnailPath: string

    @column()
    declare facultyId: number

    @belongsTo(() => Faculty, {
      foreignKey: 'facultyId'
    })
    declare faculty: BelongsTo<typeof Faculty>
}
