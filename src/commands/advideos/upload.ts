import { Flags } from '@oclif/core';
import { AuthenticatedCommand, BaseCommand } from '../../lib/base-command.js';
import { CliError } from '../../lib/errors/handler.js';
import { ErrorCode } from '../../lib/errors/codes.js';

export default class Upload extends AuthenticatedCommand {
  static override description = 'Upload a video for use in ad creatives';

  static override examples = [
    '<%= config.bin %> advideos upload --file ./video.mp4 --name "Product Demo"',
    '<%= config.bin %> advideos upload --url https://example.com/video.mp4 --name "Product Demo"',
    '<%= config.bin %> advideos upload --file ./video.mp4 --name "Demo" --wait',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    file: Flags.string({ char: 'f', description: 'Path to video file' }),
    url: Flags.string({ description: 'URL of video to upload' }),
    name: Flags.string({ char: 'n', description: 'Name for the video', required: true }),
    wait: Flags.boolean({
      char: 'w',
      description: 'Wait for video processing to complete before returning',
      default: false,
    }),
    'wait-timeout': Flags.integer({
      description: 'Maximum seconds to wait for processing (used with --wait)',
      default: 300,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Upload);

    if (!flags.file && !flags.url) {
      this.error('Either --file or --url is required');
    }

    await this.runWithAuth(this.toFlagValues(flags), async () => {
      this.formatter.info(`Uploading video: ${flags.name}...`);

      const video = await this.client.uploadVideo({
        filePath: flags.file,
        fileUrl: flags.url,
        name: flags.name,
      });

      this.formatter.success(`Uploaded video: ${video.id}`);

      if (flags.wait && video.id) {
        this.formatter.info('Waiting for video processing...');
        const timeoutMs = (flags['wait-timeout'] ?? 300) * 1000;
        const pollIntervalMs = 5000;
        const startTime = Date.now();

        let currentVideo = video;
        while (Date.now() - startTime < timeoutMs) {
          currentVideo = await this.client.getVideo(video.id);
          const status = currentVideo.status?.video_status;

          if (status === 'ready') {
            this.formatter.success('Video processing complete');
            this.outputSuccess(currentVideo, this.client.getAccountId());
            return;
          }

          if (status === 'error') {
            throw new CliError(
              ErrorCode.OPERATION_FAILED,
              `Video processing failed for video ${video.id}`,
              { video_status: currentVideo.status }
            );
          }

          const progress = currentVideo.status?.processing_progress;
          if (progress !== undefined) {
            this.formatter.info(`Processing: ${progress}% complete`);
          }

          await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
        }

        // Timeout reached
        this.formatter.warn(`Video processing did not complete within ${flags['wait-timeout']}s`);
        this.outputSuccess({
          ...currentVideo,
          _wait_timeout: true,
          _processing_status: currentVideo.status?.video_status,
        }, this.client.getAccountId());
        return;
      }

      this.outputSuccess(video, this.client.getAccountId());
    });
  }
}
