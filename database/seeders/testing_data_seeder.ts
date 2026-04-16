import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Institute from '#models/institute'
import Faculty from '#models/faculty'
import Student from '#models/student'
import Department from '#models/department'
import Role from '#models/role'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  public async run() {
    const instituteRole = await Role.findBy('roleKey', 'institute')
    const facultyRole = await Role.findBy('roleKey', 'faculty')
    const studentRole = await Role.findBy('roleKey', 'student')

    if (!instituteRole || !facultyRole || !studentRole) {
      throw new Error('Required roles are missing. Run role seeder first.')
    }

    const instituteEmail = 'testing.institute@example.com'
    let institute = await Institute.query().where('instituteEmail', instituteEmail).first()

    if (!institute) {
      institute = await Institute.create({
        instituteName: 'Testing Institute',
        instituteEmail,
        institutePassword: 'INS1234',
        instituteAddress: '123 Testing Street',
        institutePhone: '9876543210',
        instituteType: 'college',
        instituteWebsite: 'https://testing.example.com',
        instituteCode: 'TST001',
        affiliation: 'Testing Board',
        establishedYear: '2020',
        principalName: 'Dr. Test Principal',
        principalEmail: 'principal.testing@example.com',
        principalPhone: '9876543211',
        instituteCity: 'Test City',
        instituteState: 'Test State',
        instituteCountry: 'India',
        institutePinCode: '400001',
        principalQualification: 'phd',
        principalExperience: '10-15',
        campusArea: '50000',
        roleId: instituteRole.id,
        isActive: true,
      })
    }

    let department = await Department.query()
      .where('departmentName', 'Testing Department')
      .where('instituteId', institute.id)
      .first()

    if (!department) {
      department = await Department.create({
        departmentName: 'Testing Department',
        departmentCode: 'TSTD01',
        description: 'Seeded department for testing login and create flows',
        instituteId: institute.id,
        isActive: true,
      })
    }

    const facultyEmail = 'testing.faculty@example.com'
    const existingFaculty = await Faculty.query().where('facultyEmail', facultyEmail).first()

    if (!existingFaculty) {
      await Faculty.create({
        facultyName: 'Testing Faculty',
        facultyEmail,
        facultyPassword: 'FAC0123',
        facultyMobile: '9876543212',
        designation: 'Assistant Professor',
        departmentId: department.id,
        instituteId: institute.id,
        roleId: facultyRole.id,
        facultyId: 'FAC0001',
        isActive: true,
      })
    }

    const studentEmail = 'testing.student@example.com'
    const existingStudent = await Student.query().where('student_email', studentEmail).first()

    if (!existingStudent) {
      await Student.create({
        studentName: 'Testing Student',
        studentStd: '10th',
        studentGrNo: 2026001,
        studentGender: 'Other',
        studentEmail,
        studentPassword: 'STUD1234',
        studentMobile: '9876543213',
        roleId: studentRole.id,
        studentAddress: '123 Testing Street',
        studentCity: 'Test City',
        studentState: 'Test State',
        studentCountry: 'India',
        studentPincode: '400001',
        departmentId: department.id,
        studentAddmissionDate: DateTime.now(),
        studentId: 'STD260001',
        studentDob: null,
        instituteId: institute.id,
        isActive: true,
        createdBy: null,
        updatedBy: null,
      })
    }

   
  }
}