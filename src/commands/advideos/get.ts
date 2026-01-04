import { Args, Flags } from '@oclif/core';
import { AuthenticatedCommand, BaseCommand } from '../../lib/base-command.js';

export default class Get extends AuthenticatedCommand {
  static override description = 'Get video details';

  static override examples = ['<%= config.bin %> advideos get 120510123456789'];

  static override args = {
    video_id: Args.string({ description: 'Video ID', required: true }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    fields: Flags.string({ description: 'Comma-separated fields to include' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Get);

    await this.runWithAuth(this.toFlagValues(flags), async () => {
      const video = await this.client.getVideo(args.video_id, flags.fields?.split(','));
      this.outputSuccess(video, this.client.getAccountId());
    });
  }
}
