// app/controllers/ping_controller.ts
import { HttpContext } from '@adonisjs/core/http'
import os from 'node:os'
import process from 'node:process'

export default class PingController {
  public async handle({ response }: HttpContext) {
    const cpus = os.cpus()
    const totalMemBytes = os.totalmem()
    const freeMemBytes = os.freemem()
    const usedMemBytes = totalMemBytes - freeMemBytes
    const memUsage = process.memoryUsage()

    return response.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      renderServer: {
        os: {
          platform: os.platform(),
          release: os.release(),
          arch: os.arch(),
          hostname: os.hostname(),
          uptimeMinutes: Number((os.uptime() / 60).toFixed(1)),
        },
        cpu: {
          model: cpus[0]?.model || 'Unknown',
          totalCores: cpus.length,
          speedMHz: cpus[0]?.speed || 0,
          loadAverage: os.loadavg(),
        },
        memory: {
          totalRAM_MB: Math.round(totalMemBytes / (1024 * 1024)),
          freeRAM_MB: Math.round(freeMemBytes / (1024 * 1024)),
          usedRAM_MB: Math.round(usedMemBytes / (1024 * 1024)),
          processRSS_MB: Math.round(memUsage.rss / (1024 * 1024)),
          processHeapUsed_MB: Math.round(memUsage.heapUsed / (1024 * 1024)),
        },
        node: {
          version: process.version,
        },
      },
    })
  }
}
