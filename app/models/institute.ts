// app/models/institute.ts
import { BaseModel, belongsTo, column, scope, hasMany, beforeSave } from "@adonisjs/lucid/orm";
import { DateTime } from "luxon";

import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
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

    @column({ serializeAs: null })
    declare institutePassword: string

    @column()
    declare instituteAddress: string

    @column()
    declare institutePhone: string

    @column()
    declare instituteType: string

    @column()
    declare instituteEmail: string

    @column()
    declare instituteWebsite: string

    @column()
    declare instituteCode: string

    @column()
    declare affiliation: string

    @column()
    declare establishedYear: string

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
    declare principalExperience: string

    @column()
    declare campusArea: string

    @column()
    declare isActive: boolean

    @column()
    declare roleId: number

    // Relationships
    @belongsTo(() => Role)
    declare role: BelongsTo<typeof Role>


    @hasMany(() => User)
    declare users: HasMany<typeof User>

    @hasMany(() => Faculty)
    declare faculties: HasMany<typeof Faculty>

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime

    @column.dateTime({ columnName: 'deleted_at' })
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