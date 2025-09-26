import { BaseModel, column, scope } from "@adonisjs/lucid/orm";
import { DateTime } from "luxon";

export default class Department extends BaseModel {
    static softDeletes = scope((query) => {
        query.whereNull('deleted_at')
    })

    @column({ isPrimary: true })
    declare id: number

    @column()
    declare departmentName: string

    @column()
    declare departmentCode: string

    @column()
    declare description: string

    @column()
    declare isActive: boolean
    
    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime

    @column.dateTime()
    declare deletedAt: DateTime | null
}