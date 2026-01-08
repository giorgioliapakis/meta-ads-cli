import { Args, Flags } from '@oclif/core';
import { AuthenticatedCommand, BaseCommand } from '../../lib/base-command.js';
import type { Campaign, AdSet, Ad } from '../../types/index.js';

// Extended campaign type with nested entities
interface CampaignWithChildren extends Campaign {
  adsets?: AdSet[];
  ads?: Ad[];
}

export default class Get extends AuthenticatedCommand {
  static override description = 'Get campaign details';

  static override examples = [
    '<%= config.bin %> campaigns get 120210123456789',
    '<%= config.bin %> campaigns get 120210123456789 --include adsets',
    '<%= config.bin %> campaigns get 120210123456789 --include adsets,ads',
  ];

  static override args = {
    campaign_id: Args.string({ description: 'Campaign ID', required: true }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    fields: Flags.string({ description: 'Comma-separated fields to include' }),
    include: Flags.string({
      description: 'Include nested entities (comma-separated: adsets, ads)',
      options: ['adsets', 'ads', 'adsets,ads'],
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Get);

    await this.runWithAuth(this.toFlagValues(flags), async () => {
      const campaign = await this.client.getCampaign(args.campaign_id, {
        fields: flags.fields?.split(','),
        full: flags.full,
      });

      // Build result with optional nested entities
      const result: CampaignWithChildren = { ...campaign };

      if (flags.include) {
        const includes = flags.include.split(',').map(s => s.trim());

        if (includes.includes('adsets') || includes.includes('ads')) {
          // Fetch ad sets for this campaign
          const adsetsResponse = await this.client.listAdSets({
            campaignId: args.campaign_id,
            all: true,
          });
          result.adsets = adsetsResponse.data;
        }

        if (includes.includes('ads')) {
          // Fetch ads for this campaign
          const adsResponse = await this.client.listAds({
            campaignId: args.campaign_id,
            all: true,
          });
          result.ads = adsResponse.data;
        }
      }

      this.outputSuccess(result, this.client.getAccountId());
    });
  }
}
