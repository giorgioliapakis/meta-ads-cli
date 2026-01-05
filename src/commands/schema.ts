import { Command, Flags, Args } from '@oclif/core';
import {
  DATE_PRESETS,
  CONVERSION_ACTIONS,
  OBJECTIVE_TO_ACTION,
} from '../lib/constants.js';
import {
  getFieldsForLevel,
  getVideoFields,
  BREAKDOWNS,
  ACTION_TYPES,
  CAMPAIGN_OBJECTIVES,
} from '../lib/schema-data.js';

export default class Schema extends Command {
  static override description = 'Discover available API fields, breakdowns, and presets for insights queries';

  static override examples = [
    '<%= config.bin %> schema',
    '<%= config.bin %> schema fields --level ad',
    '<%= config.bin %> schema fields --level campaign',
    '<%= config.bin %> schema breakdowns',
    '<%= config.bin %> schema date-presets',
    '<%= config.bin %> schema actions',
    '<%= config.bin %> schema objectives',
  ];

  static override args = {
    type: Args.string({
      description: 'Schema type to display',
      required: false,
      default: 'all',
      options: ['all', 'fields', 'breakdowns', 'date-presets', 'actions', 'objectives', 'video-fields'],
    }),
  };

  static override flags = {
    output: Flags.string({
      char: 'o',
      description: 'Output format',
      options: ['json', 'compact'],
      default: 'json',
    }),
    level: Flags.string({
      description: 'Entity level for fields schema',
      options: ['account', 'campaign', 'adset', 'ad'],
      default: 'ad',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Schema);
    const type = args.type as string;

    const output: Record<string, unknown> = {};

    if (type === 'all' || type === 'fields') {
      const level = flags.level ?? 'ad';
      output.fields = {
        level,
        available: getFieldsForLevel(level),
        note: 'Use --extra-fields to request additional fields not in the default set',
      };
    }

    if (type === 'all' || type === 'video-fields') {
      output.video_fields = {
        available: getVideoFields(),
        note: 'Request with --video-metrics flag or --extra-fields',
      };
    }

    if (type === 'all' || type === 'breakdowns') {
      output.breakdowns = {
        available: BREAKDOWNS,
        usage: 'Use --breakdowns age,gender to break down by multiple dimensions',
        combinations: [
          'age,gender - Demographics',
          'country,region - Geography',
          'publisher_platform,platform_position - Placement',
          'age,gender,publisher_platform - Multi-dimensional',
        ],
      };
    }

    if (type === 'all' || type === 'date-presets') {
      output.date_presets = {
        available: [...DATE_PRESETS],
        usage: 'Use --date-preset last_7d or --date-range 2024-01-01:2024-01-07',
        compare_format: 'Use --compare last_7d:previous_7d for non-overlapping period comparison',
      };
    }

    if (type === 'all' || type === 'actions') {
      output.actions = {
        conversion_priority: [...CONVERSION_ACTIONS],
        all_types: ACTION_TYPES,
        note: 'result_type is determined by first match in conversion_priority order',
      };
    }

    if (type === 'all' || type === 'objectives') {
      output.objectives = {
        available: CAMPAIGN_OBJECTIVES,
        objective_to_action_mapping: OBJECTIVE_TO_ACTION,
        note: 'Use --include-objective to add objective_result_type and objective_cost_per_result to insights',
      };
    }

    // Output formatting
    if (flags.output === 'compact') {
      // Compact output - just the names/values
      const compact: Record<string, unknown> = {};
      if (output.fields) {
        compact.fields = (output.fields as { available: { name: string }[] }).available.map((f) => f.name);
      }
      if (output.video_fields) {
        compact.video_fields = (output.video_fields as { available: { name: string }[] }).available.map((f) => f.name);
      }
      if (output.breakdowns) {
        compact.breakdowns = (output.breakdowns as { available: { name: string }[] }).available.map((b) => b.name);
      }
      if (output.date_presets) {
        compact.date_presets = (output.date_presets as { available: string[] }).available;
      }
      if (output.actions) {
        compact.actions = (output.actions as { conversion_priority: string[] }).conversion_priority;
      }
      if (output.objectives) {
        compact.objectives = (output.objectives as { available: { name: string }[] }).available.map((o) => o.name);
      }
      console.log(JSON.stringify(compact, null, 2));
    } else {
      console.log(JSON.stringify(output, null, 2));
    }
  }
}
