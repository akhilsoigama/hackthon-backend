import { randomInt } from 'node:crypto'

export type CredentialPrefix = 'INS' | 'FAC' | 'STUD'

export function generateCredentialPassword(prefix: CredentialPrefix): string {
  const digits = randomInt(0, 10000).toString().padStart(4, '0')
  return `${prefix}${digits}`
}
