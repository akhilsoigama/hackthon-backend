import 'reflect-metadata'
import { execSync } from 'child_process'

try {
  execSync('node ace migration:run', { stdio: 'inherit' })

  execSync('node ace db:seed', { stdio: 'inherit' })

} catch (error) {
  console.error(error)
}
