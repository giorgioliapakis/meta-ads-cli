import { Args, Flags } from '@oclif/core';
import { AuthenticatedCommand, BaseCommand } from '../../lib/base-command.js';
import type { AdSet, Ad } from '../../types/index.js';

// Extended ad set type with nested entities
interface AdSetWithChildren extends AdSet {
  ads?: Ad[];
}

export default class Get extends AuthenticatedCommand {
  static override description = 'Get ad set details';

  static override examples = [
    '<%= config.bin %> adsets get 120310123456789',
    '<%= config.bin %> adsets get 120310123456789 --include ads',
  ];

  static override args = {
    adset_id: Args.string({ description: 'Ad set ID', required: true }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    fields: Flags.string({ description: 'Comma-separated fields to include' }),
    include: Flags.string({
      description: 'Include nested entities (ads)',
      options: ['ads'],
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Get);

    await this.runWithAuth(this.toFlagValues(flags), async () => {
      const adset = await this.client.getAdSet(args.adset_id, {
        fields: flags.fields?.split(','),
        full: flags.full,
      });

      // Build result with optional nested entities
      const result: AdSetWithChildren = { ...adset };

      if (flags.include?.includes('ads')) {
        // Fetch ads for this ad set
        const adsResponse = await this.client.listAds({
          adsetId: args.adset_id,
          all: true,
        });
        result.ads = adsResponse.data;
      }

      this.outputSuccess(result, this.client.getAccountId());
    });
  }
}
