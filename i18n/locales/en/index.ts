import type { Messages } from '../../index';
import { common } from './common';
import { entities } from './entities';
import { fields } from './fields';
import { options } from './options';
import { stories } from './stories';
import { plan } from './plan';

// English dictionary. Missing keys fall back to pt-BR (the source of truth).
export const en: Messages = { ...common, ...entities, ...fields, ...options, ...stories, ...plan };
