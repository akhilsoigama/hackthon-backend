import { BaseModel, column, manyToMany, scope } from "@adonisjs/lucid/orm";
import Department from "./department.js";
import { DEPARTMENT, INSTITUTES, ROLE_PERMISSIONS } from "#database/constants/table_names";
import type { ManyToMany } from "@adonisjs/lucid/types/relations";
import { DateTime } from "luxon";
import Institute from "./institute.js";
import Role from "./role.js";

export default class Faculty extends BaseModel {
    static softDeletes = scope((query) => {
        query.whereNull('deleted_at')
    })
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare facultyName: string

    @column()
    declare facultyId: number

    @column()
    declare designation: string

    @manyToMany(() => Department, {
        pivotTable: DEPARTMENT,
    })
    declare departmentIds: ManyToMany<typeof Department>

    @manyToMany(() => Institute, {
        pivotTable: INSTITUTES,
    })
    declare instituteIds: ManyToMany<typeof Institute>

    @manyToMany(() => Role, {
        pivotTable: ROLE_PERMISSIONS,
    })
    declare roles: ManyToMany<typeof Role>

    @column()
    declare isActive: boolean

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime

    @column.dateTime()
    declare deletedAt: DateTime | null
}
