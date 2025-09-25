import { BaseModel, column, manyToMany, scope } from "@adonisjs/lucid/orm";
import { DateTime } from "luxon";
import Permission from "./permission.js";
import { ROLE_PERMISSIONS } from "#database/constants/table_names";
import type { ManyToMany } from '@adonisjs/lucid/types/relations'

export default class Institute extends BaseModel {

    static softDeletes = scope((query) => {
        query.whereNull('deleted_at')
    })

    @column({ isPrimary: true })
    declare id: number

    @column()
    declare instituteName: string

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

    @manyToMany(() => Permission, {
        pivotTable: ROLE_PERMISSIONS,
    })
    declare permissions: ManyToMany<typeof Permission>

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime
    
    @column.dateTime()
    declare deletedAt: DateTime | null
}