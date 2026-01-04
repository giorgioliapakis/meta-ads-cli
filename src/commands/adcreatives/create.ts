import { Flags } from '@oclif/core';
import { AuthenticatedCommand, BaseCommand } from '../../lib/base-command.js';

const CTA_TYPES = [
  'LEARN_MORE', 'SHOP_NOW', 'SIGN_UP', 'SUBSCRIBE', 'WATCH_MORE', 'APPLY_NOW',
  'BOOK_NOW', 'CONTACT_US', 'DOWNLOAD', 'GET_OFFER', 'GET_QUOTE', 'ORDER_NOW',
];

export default class Create extends AuthenticatedCommand {
  static override description = 'Create an ad creative';

  static override examples = [
    '<%= config.bin %> adcreatives create --name "Banner Ad" --page-id 123 --link https://example.com --image-hash abc123 --message "Check out our sale!"',
    '<%= config.bin %> adcreatives create --name "Video Ad" --page-id 123 --video-id 456 --title "New Product" --message "Watch now"',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    name: Flags.string({ char: 'n', description: 'Creative name', required: true }),
    'page-id': Flags.string({ description: 'Facebook Page ID', required: true }),
    link: Flags.string({ description: 'Destination URL' }),
    message: Flags.string({ description: 'Primary text/message' }),
    'image-hash': Flags.string({ description: 'Image hash from adimages upload' }),
    'video-id': Flags.string({ description: 'Video ID from advideos upload' }),
    title: Flags.string({ description: 'Headline/title (for video ads)' }),
    cta: Flags.string({ description: 'Call to action type', options: CTA_TYPES }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Create);

    if (!flags['image-hash'] && !flags['video-id']) {
      this.error('Either --image-hash or --video-id is required');
    }

    await this.runWithAuth(this.toFlagValues(flags), async () => {
      const callToAction = flags.cta && flags.link
        ? { type: flags.cta, value: { link: flags.link } }
        : undefined;

      let objectStorySpec;

      if (flags['video-id']) {
        // Video creative
        objectStorySpec = {
          page_id: flags['page-id'],
          video_data: {
            video_id: flags['video-id'],
            image_hash: flags['image-hash'], // thumbnail
            title: flags.title,
            message: flags.message,
            call_to_action: callToAction,
          },
        };
      } else {
        // Image creative
        objectStorySpec = {
          page_id: flags['page-id'],
          link_data: {
            link: flags.link ?? '',
            message: flags.message,
            image_hash: flags['image-hash'],
            call_to_action: callToAction,
          },
        };
      }

      const creative = await this.client.createCreative({
        name: flags.name,
        object_story_spec: objectStorySpec,
      });

      this.formatter.success(`Created creative: ${creative.id}`);
      this.outputSuccess(creative, this.client.getAccountId());
    });
  }
}
