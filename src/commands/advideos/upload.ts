import { Flags } from '@oclif/core';
import { AuthenticatedCommand, BaseCommand } from '../../lib/base-command.js';

export default class Upload extends AuthenticatedCommand {
  static override description = 'Upload a video for use in ad creatives';

  static override examples = [
    '<%= config.bin %> advideos upload --file ./video.mp4 --name "Product Demo"',
    '<%= config.bin %> advideos upload --url https://example.com/video.mp4 --name "Product Demo"',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    file: Flags.string({ char: 'f', description: 'Path to video file' }),
    url: Flags.string({ description: 'URL of video to upload' }),
    name: Flags.string({ char: 'n', description: 'Name for the video', required: true }),
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
      this.outputSuccess(video, this.client.getAccountId());
    });
  }
}
