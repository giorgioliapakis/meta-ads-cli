import { Args, Flags } from '@oclif/core';
import { AuthenticatedCommand, BaseCommand } from '../../lib/base-command.js';

export default class Upload extends AuthenticatedCommand {
  static override description = 'Upload an image for use in ad creatives';

  static override examples = [
    '<%= config.bin %> adimages upload ./banner.jpg',
    '<%= config.bin %> adimages upload ./ad.png --name "Q1 Campaign Banner"',
  ];

  static override args = {
    file: Args.string({ description: 'Path to image file', required: true }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    name: Flags.string({ char: 'n', description: 'Name for the image' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Upload);

    await this.runWithAuth(this.toFlagValues(flags), async () => {
      this.formatter.info(`Uploading ${args.file}...`);

      const image = await this.client.uploadImage(args.file, flags.name);

      this.formatter.success(`Uploaded image: ${image.hash}`);
      this.outputSuccess(image, this.client.getAccountId());
    });
  }
}
