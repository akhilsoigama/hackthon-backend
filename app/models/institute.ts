import { BaseModel, belongsTo, column, manyToMany, scope, hasMany, beforeSave } from "@adonisjs/lucid/orm";
import { DateTime } from "luxon";
import Permission from "./permission.js";
import { ROLE_PERMISSIONS } from "#database/constants/table_names";
import type { BelongsTo, ManyToMany, HasMany } from '@adonisjs/lucid/types/relations'
import Role from "./role.js";
import User from "./user.js";
import Faculty from "./faculty.js";
import hash from '@adonisjs/core/services/hash'

export default class Institute extends BaseModel {
    static softDeletes = scope((query) => {
        query.whereNull('deleted_at')
    })

    @column({ isPrimary: true })
    declare id: number

    @column()
    declare instituteName: string

    @column()
    declare institutePassword: string

    @column()
    declare instituteAddress: string

    @column()
    declare institutePhone: string

    @column()
    declare instituteEmail: string

    @column()
    declare instituteWebsite: string

    @column()
    declare instituteCode: string

    @column()
    declare affiliation: string

    @column()
    declare establishedYear: number

    @column()
    declare principalName: string

    @column()
    declare principalEmail: string

    @column()
    declare principalPhone: string

    @column()
    declare instituteCity: string

    @column()
    declare instituteState: string

    @column()
    declare instituteCountry: string

    @column()
    declare institutePinCode: string

    @column()
    declare principalQualification: string

    @column()
    declare principalExperience: number

    @column()
    declare isActive: boolean

    @column()
    declare createdBy: number

    // Fix: Add proper column definition with default value
    @column({
        serializeAs: null // Optional: hide from API responses if needed
    })
    declare roleId: number | null

    // Relationships
    @manyToMany(() => Permission, {
        pivotTable: ROLE_PERMISSIONS,
    })
    declare permissions: ManyToMany<typeof Permission>

    @belongsTo(() => Role, {
        foreignKey: 'roleId',
    })
    declare role: BelongsTo<typeof Role>

    @hasMany(() => User)
    declare users: HasMany<typeof User>

    @hasMany(() => Faculty)
    declare faculties: HasMany<typeof Faculty>

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime

    @column.dateTime()
    declare deletedAt: DateTime | null

    @beforeSave()
    public static async hashPassword(institute: Institute) {
        if (institute.$dirty.institutePassword) {
            institute.institutePassword = await hash.make(institute.institutePassword)
        }
    }

    async verifyPassword(password: string): Promise<boolean> {
        return await hash.verify(this.institutePassword, password)
    }
}