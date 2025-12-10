# Tags Normalizadas e Multi-Seleção de Facções - Guia de Implementação

Este documento explica as mudanças implementadas neste PR para suportar tags normalizadas e multi-seleção de facções no Lumen Regnum.

## 📋 Resumo das Mudanças

### 1. Sistema de Tags Normalizadas

**Antes**: Tags eram armazenadas como strings de texto livre (comma-separated) diretamente nos registros.

**Depois**: Tags são entidades próprias na tabela `dmos_tags`, com propriedades como cor, tipo (type/status), e podem ser reutilizadas em múltiplas facções.

**Benefícios**:
- ✅ Consistência: mesma tag usada em várias facções
- ✅ Busca e filtragem mais eficientes
- ✅ Tags visuais coloridas
- ✅ Categorização por tipo (type, status, custom)

### 2. Multi-Seleção de Facções em Locations

**Antes**: Campo de texto livre `faction_influence` para descrever facções presentes.

**Depois**: Campo `faction_ids` (array de UUIDs) para conectar múltiplas facções diretamente a uma location.

**Benefícios**:
- ✅ Relacionamento estruturado entre locations e factions
- ✅ Queries mais eficientes para encontrar locations de uma faction
- ✅ Interface visual com chips removíveis
- ✅ Compatibilidade mantida: campo `faction_influence` ainda existe

### 3. Renomeação do Menu

**Antes**: Menu "Factions"

**Depois**: Menu "Families & Factions"

## 🗂️ Arquivos Modificados

### **types.ts**
- Adicionada interface `Tag` com campos: id, campaign_id, name, color, tag_type, created_by, created_at
- Adicionado campo `tag_ids?: UUID[]` na interface `Faction`
- Adicionado campo `faction_ids?: UUID[]` na interface `Location`

### **services/store.ts**
- Adicionadas constantes de tabela: `TABLES.TAGS` e `TABLES.FACTION_TAGS`
- Adicionada API `db.tags` com métodos: list, add, update, delete
- Adicionada API `db.faction_tags` com métodos: list, add, delete, deleteAll
- Comentários documentando dependência das migrations SQL

### **components/Layout.tsx**
- Alterado label do menu de 'Factions' para 'Families & Factions'

### **App.tsx**
- Adicionado campo `{ key: 'faction_ids', label: 'Facções (conectar)', type: 'faction-multi-select' }` no schema de location
- Adicionado campo `{ key: 'tag_ids', label: 'Tags (type & status)', type: 'tags-select' }` no schema de faction
- Mantido campo `faction_influence` para compatibilidade com dados existentes

### **pages/GenericList.tsx**
- Importados componentes `MultiFactionSelect` e `TagSelector`
- Adicionados estados `availableFactions` e `availableTags`
- Criada função `loadFormDependencies()` para carregar factions e tags ao abrir modal
- Modificado `handleSave()` para:
  - Garantir que `tag_ids` e `faction_ids` sejam arrays
  - Sincronizar tabela pivot `dmos_faction_tags` ao salvar factions
  - Manter compatibilidade com `faction_influence`
- Adicionado rendering para tipos de campo `faction-multi-select` e `tags-select`

## 🆕 Novos Componentes

### **components/MultiFactionSelect.tsx**
Componente de seleção múltipla de facções para uso em locations.

**Props**:
- `factions: Faction[]` - Lista de facções disponíveis
- `selectedIds: UUID[]` - IDs das facções selecionadas
- `onChange: (ids: UUID[]) => void` - Callback quando seleção muda

**Características**:
- Exibe facções selecionadas como chips coloridos
- Botão "X" para remover seleção
- Dropdown para adicionar mais facções
- Mensagem se não houver facções disponíveis

### **components/TagSelector.tsx**
Componente de seleção e criação inline de tags para uso em factions.

**Props**:
- `campaignId: UUID` - ID da campanha atual
- `tags: Tag[]` - Lista de tags disponíveis
- `selectedIds: UUID[]` - IDs das tags selecionadas
- `onChange: (ids: UUID[]) => void` - Callback quando seleção muda
- `onTagsReload: () => Promise<void>` - Callback para recarregar tags após criar nova

**Características**:
- Exibe tags selecionadas com cores personalizadas
- Filtro por tipo de tag (type, status, custom)
- Lista de tags disponíveis clicáveis
- Criação inline de novas tags com:
  - Campo de nome
  - Seletor de cor
  - Dropdown de tipo
- Recarrega automaticamente lista após criar tag
- Tratamento de erro se tabela não existir

## 🔧 Como Usar

### Para o Usuário Final

#### 1. Criar e Gerenciar Tags

1. Navegue até **Families & Factions**
2. Crie ou edite uma faction existente
3. No campo "Tags (type & status)", clique em **"Criar nova tag"**
4. Preencha:
   - Nome da tag (ex: "Militar", "Ativa", "Em Conflito")
   - Cor (clique no seletor de cor)
   - Tipo (type, status, ou custom)
5. Clique em **"Criar Tag"**
6. A tag aparecerá automaticamente na lista
7. Clique nas tags para selecionar/deselecionar
8. Salve a faction

#### 2. Conectar Facções a Locations

1. Navegue até **Locations**
2. Crie ou edite uma location existente
3. No campo "Facções (conectar)", veja as facções disponíveis
4. Clique no dropdown para selecionar facções
5. Facções selecionadas aparecem como chips
6. Clique no "X" para remover uma facção
7. Salve a location

**Nota**: O campo "Faction Influence (texto livre)" ainda existe para compatibilidade e descrições textuais.

### Para Desenvolvedores

#### Adicionando Suporte a Tags em Outros Tipos

Para adicionar suporte a tags em outros entity types (ex: NPCs, Items):

1. **Atualizar types.ts**:
```typescript
export interface NPC {
  // ... campos existentes
  tag_ids?: UUID[]; // Adicionar campo
}
```

2. **Criar tabela pivot no SQL** (se desejar pivot separada):
```sql
CREATE TABLE dmos_npc_tags (
    npc_id UUID REFERENCES dmos_npcs(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES dmos_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (npc_id, tag_id)
);
```

3. **Adicionar no schema (App.tsx)**:
```typescript
npc: [
  // ... campos existentes
  { key: 'tag_ids', label: 'Tags', type: 'tags-select' },
]
```

4. **Renderizar no modal já funciona automaticamente** (GenericList.tsx detecta o tipo)

## 📊 Estrutura do Banco de Dados

### Tabela: dmos_tags
```
┌─────────────┬──────┬────────────────────────────────┐
│ Column      │ Type │ Description                     │
├─────────────┼──────┼────────────────────────────────┤
│ id          │ UUID │ Primary key                     │
│ campaign_id │ UUID │ FK para dmos_campaigns          │
│ name        │ TEXT │ Nome da tag                     │
│ color       │ TEXT │ Cor (hex ou nome)               │
│ tag_type    │ TEXT │ Tipo: type, status, custom      │
│ created_by  │ UUID │ FK para auth.users (opcional)   │
│ created_at  │ TS   │ Timestamp de criação            │
└─────────────┴──────┴────────────────────────────────┘
```

### Tabela: dmos_faction_tags
```
┌─────────────┬──────┬────────────────────────────────┐
│ Column      │ Type │ Description                     │
├─────────────┼──────┼────────────────────────────────┤
│ faction_id  │ UUID │ FK para dmos_factions (PK)      │
│ tag_id      │ UUID │ FK para dmos_tags (PK)          │
│ created_at  │ TS   │ Timestamp de associação         │
└─────────────┴──────┴────────────────────────────────┘
```

### Coluna Adicional: dmos_locations.faction_ids
```
faction_ids UUID[] - Array de UUIDs referenciando dmos_factions
```

## 🚨 Importante: Requisitos de Banco de Dados

**ANTES DE USAR ESTA FEATURE**, o usuário **DEVE** executar as migrations SQL localizadas em:

📁 **`supabase/migrations/`**

As migrations necessárias são:
1. **`004_create_tags.sql`** - Cria tabelas dmos_tags e dmos_faction_tags com RLS policies
2. **`005_add_faction_ids_to_locations.sql`** - Adiciona coluna faction_ids à tabela dmos_locations

### Como Aplicar as Migrations

Veja o guia detalhado em: **`supabase/migrations/README.md`**

Resumo rápido:
1. Acesse o painel do Supabase (https://supabase.com)
2. Navegue até SQL Editor
3. Execute os scripts SQL em ordem (004, depois 005)
4. Verifique que as tabelas foram criadas com sucesso

**Sem estas migrations, as novas features não funcionarão.**

### Arquivo de Referência Adicional

O arquivo **`SQL_MIGRATIONS_REFERENCE.md`** contém documentação adicional e explicações sobre as migrations, mas você deve usar os arquivos em `supabase/migrations/` para aplicar as mudanças.

## ✅ Testes Recomendados

### Teste 1: Criação de Tags
1. Abrir modal de edição de faction
2. Criar tags com diferentes tipos e cores
3. Verificar que tags aparecem na lista
4. Verificar no Supabase: `SELECT * FROM dmos_tags`

### Teste 2: Associação de Tags
1. Selecionar múltiplas tags em uma faction
2. Salvar
3. Verificar no Supabase: `SELECT * FROM dmos_faction_tags WHERE faction_id = '...'`
4. Reabrir modal e verificar que tags selecionadas persistem

### Teste 3: Multi-seleção de Facções
1. Criar algumas factions
2. Editar uma location
3. Selecionar 2-3 facções no campo "Facções (conectar)"
4. Salvar
5. Verificar no Supabase que `faction_ids` contém array de UUIDs
6. Reabrir modal e verificar que facções selecionadas persistem

### Teste 4: Compatibilidade
1. Locations antigas (sem `faction_ids`) devem continuar funcionando
2. Campo `faction_influence` deve estar presente e editável
3. Factions antigas (sem `tag_ids`) devem continuar funcionando

### Teste 5: Filtro de Tags
1. Criar tags de diferentes tipos (type, status, custom)
2. No TagSelector, usar o dropdown "Filtrar por tipo"
3. Verificar que apenas tags do tipo selecionado aparecem

## 🐛 Troubleshooting

### "Erro ao criar tag. Verifique se a tabela dmos_tags existe no banco de dados."

**Possíveis Causas**:
1. Migrations SQL não foram executadas
2. Tabela existe mas RLS policies não foram criadas
3. Usuário não tem permissão para inserir na tabela

**Solução**:

1. **Verificar se tabela existe**: No Supabase SQL Editor, execute:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_name = 'dmos_tags';
   ```
   Se retornar vazio, execute migration `004_create_tags.sql`

2. **Verificar RLS policies**: Execute:
   ```sql
   SELECT policyname FROM pg_policies WHERE tablename = 'dmos_tags';
   ```
   Deve retornar 4 policies (SELECT, INSERT, UPDATE, DELETE)
   Se retornar vazio ou menos policies, re-execute migration `004_create_tags.sql`

3. **Verificar permissões do usuário**: Certifique-se que:
   - Usuário está autenticado (logged in)
   - Usuário é dono da campanha (user_id = auth.uid())
   - Verifique no console do navegador o erro exato retornado pelo Supabase

4. **Aplicar migrations**: Vá para `supabase/migrations/` e siga o README.md para aplicar as migrations corretas

### Tags não aparecem ao editar faction

**Causa**: Tabela `dmos_tags` vazia ou permissions RLS incorretas.

**Solução**: 
1. Verifique policies RLS no Supabase
2. Tente criar uma tag manualmente via SQL Editor
3. Verifique que user tem acesso à campaign

### Facções não aparecem ao editar location

**Causa**: Nenhuma faction criada na campanha.

**Solução**: Crie pelo menos uma faction em "Families & Factions"

### Erro ao salvar faction com tags

**Causa**: Tabela pivot `dmos_faction_tags` não existe.

**Solução**: Execute a Migration 2 em `SQL_MIGRATIONS_REFERENCE.md`

## 🎨 Customização

### Alterar Cores Padrão das Tags

Em `components/TagSelector.tsx`, linha ~52:
```typescript
const [newTagColor, setNewTagColor] = useState('#6366f1'); // Mudar cor padrão aqui
```

### Adicionar Novos Tipos de Tag

Tags podem ter qualquer tipo. Os tipos padrão são:
- `type` - Classificação/categoria
- `status` - Estado atual (ativa, inativa, etc.)
- `custom` - Personalizado

Para adicionar tipos pré-definidos, edite o dropdown em `TagSelector.tsx` (linhas ~168-171).

### Customizar Aparência dos Chips

Edite os estilos inline em:
- `MultiFactionSelect.tsx` (linhas ~44-49) - Chips de facções
- `TagSelector.tsx` (linhas ~104-119) - Chips de tags

## 📝 Convenções de Código

Este PR segue as convenções do projeto:
- ✅ TypeScript strict mode
- ✅ React functional components
- ✅ Hooks (useState, useEffect)
- ✅ Tailwind CSS para estilização
- ✅ Prefixo `dmos_` para tabelas
- ✅ Patterns de RLS do Supabase
- ✅ Error handling com console.error + user alerts

## 🔄 Próximos Passos Sugeridos

1. **Visualizar Tags nas Cards**: Exibir chips coloridos nas cards de faction listadas
2. **Filtrar por Tags**: Adicionar filtro por tags na lista de factions
3. **Estatísticas**: Dashboard mostrando tags mais usadas
4. **Bulk Operations**: Adicionar/remover tags em múltiplas factions de uma vez
5. **Tag Templates**: Preset de tags comuns (militar, comercial, religiosa, etc.)
6. **Location-Faction Influence**: Adicionar níveis de influência na relação location-faction
7. **Tags em NPCs**: Estender sistema de tags para NPCs (já há estrutura)

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte `SQL_MIGRATIONS_REFERENCE.md` para instruções de database
2. Verifique console do browser para mensagens de erro
3. Verifique policies RLS no Supabase
4. Revise este documento para casos de uso

---

**Versão**: 1.0  
**Data**: 2025-12-10  
**Autor**: Copilot Agent  
**PR Branch**: `copilot/implement-normalized-tags-feature`
