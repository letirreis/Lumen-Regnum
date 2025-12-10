# Migrations SQL Necessárias para Tags Normalizadas

**IMPORTANTE**: Este arquivo contém as migrations SQL que o usuário precisa executar **manualmente** no Supabase antes de utilizar as novas funcionalidades de tags e multi-seleção de facções.

## Por que este arquivo existe?

O usuário solicitou que **não incluíssemos** migrations SQL diretamente no repositório. Este é um arquivo de referência que documenta as tabelas necessárias.

## Instruções de Execução

1. Acesse o painel do Supabase (https://supabase.com)
2. Navegue até SQL Editor
3. Execute os scripts SQL abaixo na ordem indicada
4. Verifique que as tabelas foram criadas com sucesso

---

## Migration 1: Criar tabela dmos_tags

```sql
-- Tabela para armazenar tags normalizadas (type, status, custom tags)
-- Substitui o campo texto "tags" por um sistema estruturado

CREATE TABLE IF NOT EXISTS public.dmos_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.dmos_campaigns(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT, -- Hex color code ou nome de cor preset (ex: '#6366f1' ou 'indigo')
    tag_type TEXT, -- Tipo da tag: 'type', 'status', 'custom', etc.
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT unique_tag_per_campaign UNIQUE (campaign_id, name)
);

-- Índices para melhor performance
CREATE INDEX idx_dmos_tags_campaign_id ON public.dmos_tags(campaign_id);
CREATE INDEX idx_dmos_tags_type ON public.dmos_tags(tag_type);

-- Row Level Security (RLS)
ALTER TABLE public.dmos_tags ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver tags das suas campanhas
CREATE POLICY "Users can view tags from their campaigns"
    ON public.dmos_tags
    FOR SELECT
    USING (
        campaign_id IN (
            SELECT id FROM public.dmos_campaigns 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Usuários podem criar tags nas suas campanhas
CREATE POLICY "Users can create tags in their campaigns"
    ON public.dmos_tags
    FOR INSERT
    WITH CHECK (
        campaign_id IN (
            SELECT id FROM public.dmos_campaigns 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Usuários podem atualizar tags das suas campanhas
CREATE POLICY "Users can update tags from their campaigns"
    ON public.dmos_tags
    FOR UPDATE
    USING (
        campaign_id IN (
            SELECT id FROM public.dmos_campaigns 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Usuários podem deletar tags das suas campanhas
CREATE POLICY "Users can delete tags from their campaigns"
    ON public.dmos_tags
    FOR DELETE
    USING (
        campaign_id IN (
            SELECT id FROM public.dmos_campaigns 
            WHERE user_id = auth.uid()
        )
    );
```

---

## Migration 2: Criar tabela pivot dmos_faction_tags

```sql
-- Tabela pivot para relacionamento many-to-many entre factions e tags
-- Permite que uma faction tenha múltiplas tags e uma tag seja usada por múltiplas factions

CREATE TABLE IF NOT EXISTS public.dmos_faction_tags (
    faction_id UUID NOT NULL REFERENCES public.dmos_factions(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.dmos_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Primary key composta
    PRIMARY KEY (faction_id, tag_id)
);

-- Índices para melhor performance em queries
CREATE INDEX idx_dmos_faction_tags_faction_id ON public.dmos_faction_tags(faction_id);
CREATE INDEX idx_dmos_faction_tags_tag_id ON public.dmos_faction_tags(tag_id);

-- Row Level Security (RLS)
ALTER TABLE public.dmos_faction_tags ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver associações de factions das suas campanhas
CREATE POLICY "Users can view faction-tag associations from their campaigns"
    ON public.dmos_faction_tags
    FOR SELECT
    USING (
        faction_id IN (
            SELECT id FROM public.dmos_factions 
            WHERE campaign_id IN (
                SELECT id FROM public.dmos_campaigns 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Policy: Usuários podem criar associações para factions das suas campanhas
CREATE POLICY "Users can create faction-tag associations in their campaigns"
    ON public.dmos_faction_tags
    FOR INSERT
    WITH CHECK (
        faction_id IN (
            SELECT id FROM public.dmos_factions 
            WHERE campaign_id IN (
                SELECT id FROM public.dmos_campaigns 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Policy: Usuários podem deletar associações de factions das suas campanhas
CREATE POLICY "Users can delete faction-tag associations from their campaigns"
    ON public.dmos_faction_tags
    FOR DELETE
    USING (
        faction_id IN (
            SELECT id FROM public.dmos_factions 
            WHERE campaign_id IN (
                SELECT id FROM public.dmos_campaigns 
                WHERE user_id = auth.uid()
            )
        )
    );
```

---

## Migration 3 (Opcional): Adicionar coluna faction_ids em dmos_locations

```sql
-- Adiciona suporte para múltiplas facções associadas a uma location
-- Pode ser implementado como array de UUIDs ou como tabela pivot separada

-- Opção A: Array de UUIDs (mais simples, para casos básicos)
ALTER TABLE public.dmos_locations 
ADD COLUMN IF NOT EXISTS faction_ids UUID[];

-- Opção B (Alternativa): Criar tabela pivot location_factions
-- Apenas execute se preferir relacionamento many-to-many completo

-- CREATE TABLE IF NOT EXISTS public.dmos_location_factions (
--     location_id UUID NOT NULL REFERENCES public.dmos_locations(id) ON DELETE CASCADE,
--     faction_id UUID NOT NULL REFERENCES public.dmos_factions(id) ON DELETE CASCADE,
--     influence_level TEXT, -- Ex: 'Dominant', 'Present', 'Hidden'
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
--     PRIMARY KEY (location_id, faction_id)
-- );
```

---

## Verificação

Após executar as migrations, verifique que:

1. Tabela `dmos_tags` foi criada com 7 colunas
2. Tabela `dmos_faction_tags` foi criada com 3 colunas
3. Todas as policies RLS foram aplicadas corretamente
4. As foreign keys estão funcionando

Execute no SQL Editor:

```sql
-- Verificar estrutura das tabelas
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('dmos_tags', 'dmos_faction_tags')
ORDER BY table_name, ordinal_position;

-- Verificar policies RLS
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('dmos_tags', 'dmos_faction_tags');
```

---

## Testes Manuais Recomendados

Após aplicar as migrations e iniciar a aplicação:

1. **Criar Tags**
   - Navegue até "Families & Factions"
   - Crie ou edite uma faction
   - Clique em "Criar nova tag"
   - Crie tags de diferentes tipos (type, status)
   - Verifique que as tags aparecem no banco (`SELECT * FROM dmos_tags`)

2. **Associar Tags a Factions**
   - No editor de faction, selecione algumas tags
   - Salve a faction
   - Verifique as associações no banco (`SELECT * FROM dmos_faction_tags`)

3. **Multi-seleção de Facções em Locations**
   - Navegue até "Locations"
   - Crie ou edite uma location
   - Use o campo "Facções (conectar)" para selecionar múltiplas factions
   - Salve e verifique que `faction_ids` foi populado

4. **Compatibilidade com Dados Antigos**
   - Verifique que locations e factions existentes ainda funcionam
   - O campo `faction_influence` (texto livre) ainda deve estar presente e funcional

---

## Rollback (Se Necessário)

Se precisar reverter as mudanças:

```sql
-- ATENÇÃO: Isso apagará todos os dados das tabelas!

DROP TABLE IF EXISTS public.dmos_faction_tags;
DROP TABLE IF EXISTS public.dmos_tags;

-- Se adicionou faction_ids na tabela locations:
ALTER TABLE public.dmos_locations DROP COLUMN IF EXISTS faction_ids;
```

---

## Notas Adicionais

- As migrations seguem o padrão de nomenclatura `dmos_` usado em todas as outras tabelas do projeto
- As policies RLS garantem que usuários só podem acessar tags das suas próprias campanhas
- O sistema é totalmente compatível com dados existentes (não quebra locations/factions antigas)
- Tags podem ser filtradas por `tag_type` no componente TagSelector
