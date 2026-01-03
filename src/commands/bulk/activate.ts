import { Flags } from '@oclif/core';
import { AuthenticatedCommand, BaseCommand } from '../../lib/base-command.js';

export default class Activate extends AuthenticatedCommand {
  static override description = 'Activate multiple entities';

  static override examples = [
    '<%= config.bin %> bulk activate --type campaign --ids 123,456,789',
    '<%= config.bin %> bulk activate --type adset --ids 123,456',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    type: Flags.string({ description: 'Entity type', required: true, options: ['campaign', 'adset', 'ad'] }),
    ids: Flags.string({ description: 'Comma-separated entity IDs', required: true }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Activate);

    await this.runWithAuth(this.toFlagValues(flags), async () => {
      const ids = flags.ids.split(',').map(id => id.trim());
      const results: Array<{ id: string; success: boolean; error?: string }> = [];

      for (const id of ids) {
        try {
          if (flags.type === 'campaign') {
            await this.client.updateCampaignStatus(id, 'ACTIVE');
          } else if (flags.type === 'adset') {
            await this.client.updateAdSetStatus(id, 'ACTIVE');
          } else if (flags.type === 'ad') {
            await this.client.updateAdStatus(id, 'ACTIVE');
          }
          results.push({ id, success: true });
        } catch (error) {
          results.push({ id, success: false, error: error instanceof Error ? error.message : String(error) });
        }
      }

      const successCount = results.filter(r => r.success).length;
      this.formatter.success(`Activated ${successCount}/${ids.length} ${flags.type}s`);
      this.outputSuccess(results, this.client.getAccountId());
    });
  }
}
