declare module 'fluent-ffmpeg' {
  interface FfmpegCommand {
    outputOptions(options: string | string[]): FfmpegCommand
    save(path: string): FfmpegCommand
    on(event: string, callback: Function): FfmpegCommand
    screenshots(options: {
      count: number
      folder: string
      filename: string
      size?: string
    }): FfmpegCommand
  }

  function ffmpeg(path: string): FfmpegCommand
  export = ffmpeg
}