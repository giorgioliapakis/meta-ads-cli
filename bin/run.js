#!/usr/bin/env node

import { config } from 'dotenv';
import { execute } from '@oclif/core';

// Load .env file from current working directory (silently)
config({ quiet: true });

await execute({ dir: import.meta.url });
