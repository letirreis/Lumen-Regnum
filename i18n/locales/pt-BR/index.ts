import { common } from './common';
import { entities } from './entities';
import { fields } from './fields';
import { options } from './options';
import { stories } from './stories';

// Dicionário base (pt-BR). Para um novo idioma, crie `locales/<codigo>/` com as mesmas chaves.
export const ptBR = { ...common, ...entities, ...fields, ...options, ...stories } as const;
