import fs from 'fs'
import path from 'path'
import {
  download,
  getBinaryName,
  checkVersionCommand,
  getVersion,
} from '../download'
import { getPlatform } from '@prisma/get-platform'
import { cleanupCache } from '../cleanupCache'
import del from 'del'

const CURRENT_BINARIES_HASH = require('../../../sdk/package.json').prisma
  .version
const FIXED_BINARIES_HASH = 'ff6959d77f8880ec037ed8201fff4a92f3aabaa0'

jest.setTimeout(30000)

describe('download', () => {
  beforeAll(async () => {
    // completely clean up the cache and keep nothing
    await cleanupCache(0)
    await del(__dirname + '/**/*engine*')
    await del(__dirname + '/**/prisma-fmt*')
  })

  test('basic download', async () => {
    const platform = await getPlatform()
    const queryEnginePath = path.join(
      __dirname,
      getBinaryName('query-engine', platform),
    )
    const introspectionEnginePath = path.join(
      __dirname,
      getBinaryName('introspection-engine', platform),
    )
    const migrationEnginePath = path.join(
      __dirname,
      getBinaryName('migration-engine', platform),
    )
    const prismafmtPath = path.join(
      __dirname,
      getBinaryName('prisma-fmt', platform),
    )

    await download({
      binaries: {
        'query-engine': __dirname,
        'introspection-engine': __dirname,
        'migration-engine': __dirname,
        'prisma-fmt': __dirname,
      },
      version: FIXED_BINARIES_HASH,
    })

    expect(await getVersion(queryEnginePath)).toMatchInlineSnapshot(
      `"query-engine ff6959d77f8880ec037ed8201fff4a92f3aabaa0"`,
    )
    expect(await getVersion(introspectionEnginePath)).toMatchInlineSnapshot(
      `"introspection-core ff6959d77f8880ec037ed8201fff4a92f3aabaa0"`,
    )
    expect(await getVersion(migrationEnginePath)).toMatchInlineSnapshot(
      `"migration-engine-cli ff6959d77f8880ec037ed8201fff4a92f3aabaa0"`,
    )
    expect(await getVersion(prismafmtPath)).toMatchInlineSnapshot(
      `"prisma-fmt ff6959d77f8880ec037ed8201fff4a92f3aabaa0"`,
    )
  })

  test('basic download all current binaries', async () => {
    await download({
      binaries: {
        'query-engine': __dirname,
        'introspection-engine': __dirname,
        'migration-engine': __dirname,
        'prisma-fmt': __dirname,
      },
      binaryTargets: [
        'darwin',
        'debian-openssl-1.0.x',
        'debian-openssl-1.1.x',
        'rhel-openssl-1.0.x',
        'rhel-openssl-1.1.x',
        'windows',
        'linux-musl',
      ],
      version: CURRENT_BINARIES_HASH,
    })
  })

  test('auto heal corrupt binary', async () => {
    const platform = await getPlatform()
    const baseDir = path.join(__dirname, 'corruption')
    const targetPath = path.join(
      baseDir,
      getBinaryName('query-engine', platform),
    )
    if (fs.existsSync(targetPath)) {
      try {
        fs.unlinkSync(targetPath)
      } catch (e) {
        console.error(e)
      }
    }

    await download({
      binaries: {
        'query-engine': baseDir,
      },
      version: FIXED_BINARIES_HASH,
    })

    fs.writeFileSync(targetPath, 'incorrect-binary')

    // please heal it
    await download({
      binaries: {
        'query-engine': baseDir,
      },
      version: FIXED_BINARIES_HASH,
    })

    expect(fs.existsSync(targetPath)).toBe(true)

    expect(await checkVersionCommand(targetPath)).toBe(true)
  })

  test('handle non-existent binary target', async () => {
    await expect(
      download({
        binaries: {
          'query-engine': __dirname,
        },
        version: FIXED_BINARIES_HASH,
        binaryTargets: ['darwin', 'marvin'] as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Unknown binaryTargets marvin"`,
    )
  })

  test('download all binaries & cache them', async () => {
    const baseDir = path.join(__dirname, 'all')
    await download({
      binaries: {
        'query-engine': baseDir,
        'introspection-engine': baseDir,
        'migration-engine': baseDir,
        'prisma-fmt': baseDir,
      },
      binaryTargets: [
        'darwin',
        'debian-openssl-1.0.x',
        'debian-openssl-1.1.x',
        'rhel-openssl-1.0.x',
        'rhel-openssl-1.1.x',
        'windows',
        'linux-musl',
      ],
      version: FIXED_BINARIES_HASH,
    })
    const files = getFiles(baseDir)
    expect(files).toMatchInlineSnapshot(`
      Array [
        Object {
          "name": ".gitkeep",
          "size": 0,
        },
        Object {
          "name": "introspection-engine-darwin",
          "size": 11073588,
        },
        Object {
          "name": "introspection-engine-debian-openssl-1.0.x",
          "size": 14162168,
        },
        Object {
          "name": "introspection-engine-debian-openssl-1.1.x",
          "size": 14139536,
        },
        Object {
          "name": "introspection-engine-linux-musl",
          "size": 17111544,
        },
        Object {
          "name": "introspection-engine-rhel-openssl-1.0.x",
          "size": 14224308,
        },
        Object {
          "name": "introspection-engine-rhel-openssl-1.1.x",
          "size": 14202662,
        },
        Object {
          "name": "introspection-engine-windows.exe",
          "size": 23227789,
        },
        Object {
          "name": "migration-engine-darwin",
          "size": 14499444,
        },
        Object {
          "name": "migration-engine-debian-openssl-1.0.x",
          "size": 17714760,
        },
        Object {
          "name": "migration-engine-debian-openssl-1.1.x",
          "size": 17683720,
        },
        Object {
          "name": "migration-engine-linux-musl",
          "size": 20504024,
        },
        Object {
          "name": "migration-engine-rhel-openssl-1.0.x",
          "size": 17788921,
        },
        Object {
          "name": "migration-engine-rhel-openssl-1.1.x",
          "size": 17763228,
        },
        Object {
          "name": "migration-engine-windows.exe",
          "size": 27496535,
        },
        Object {
          "name": "query-engine-darwin",
          "size": 16149612,
        },
        Object {
          "name": "query-engine-debian-openssl-1.0.x",
          "size": 19680168,
        },
        Object {
          "name": "query-engine-debian-openssl-1.1.x",
          "size": 19652760,
        },
        Object {
          "name": "query-engine-linux-musl",
          "size": 22338512,
        },
        Object {
          "name": "query-engine-rhel-openssl-1.0.x",
          "size": 19721089,
        },
        Object {
          "name": "query-engine-rhel-openssl-1.1.x",
          "size": 19699148,
        },
        Object {
          "name": "query-engine-windows.exe",
          "size": 29877206,
        },
      ]
    `)
    await del(baseDir + '/*engine*')
    await del(baseDir + '/prisma-fmt*')
    const before = Date.now()
    await download({
      binaries: {
        'query-engine': baseDir,
        'introspection-engine': baseDir,
        'migration-engine': baseDir,
        'prisma-fmt': baseDir,
      },
      binaryTargets: [
        'darwin',
        'debian-openssl-1.0.x',
        'debian-openssl-1.1.x',
        'rhel-openssl-1.0.x',
        'rhel-openssl-1.1.x',
        'windows',
        'linux-musl',
      ],
      version: FIXED_BINARIES_HASH,
    })
    const after = Date.now()
    // cache should take less than 2s
    // value on Mac: 1440
    expect(after - before).toBeLessThan(4000)
    const before2 = Date.now()
    await download({
      binaries: {
        'query-engine': baseDir,
        'introspection-engine': baseDir,
        'migration-engine': baseDir,
        'prisma-fmt': baseDir,
      },
      binaryTargets: [
        'darwin',
        'debian-openssl-1.0.x',
        'debian-openssl-1.1.x',
        'rhel-openssl-1.0.x',
        'rhel-openssl-1.1.x',
        'windows',
        'linux-musl',
      ],
      version: FIXED_BINARIES_HASH,
    })
    const after2 = Date.now()
    // if binaries are already there, it should take less than 100ms to check all of them
    // value on Mac: 33ms
    expect(after2 - before2).toBeLessThan(3000)
  })
})

function getFiles(dir: string): Array<{ name: string; size: number }> {
  const files = fs.readdirSync(dir, 'utf8')
  return files.map((name) => {
    const size = fs.statSync(path.join(dir, name)).size

    return { name, size }
  })
}
