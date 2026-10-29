import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'

// npm pack also runs prepare; source archives do not contain Git metadata.
if (existsSync('.git')) execFileSync('lefthook', ['install'], { stdio: 'inherit' })
