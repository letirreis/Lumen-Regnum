// Rótulos de valores gravados no banco (em inglês): opt.<campo>.<valor_em_slug>.
// O VALOR no banco NÃO muda; só o texto exibido. Valores sem tradução aparecem como foram digitados.
export const options = {
  // race
  'opt.race.dragonborn': 'Draconato', 'opt.race.dwarf': 'Anão', 'opt.race.elf': 'Elfo', 'opt.race.gnome': 'Gnomo',
  'opt.race.half_elf': 'Meio-elfo', 'opt.race.half_orc': 'Meio-orc', 'opt.race.halfling': 'Halfling',
  'opt.race.human': 'Humano', 'opt.race.tiefling': 'Tiefling', 'opt.race.other': 'Outra',
  // class
  'opt.class.artificer': 'Artífice', 'opt.class.barbarian': 'Bárbaro', 'opt.class.bard': 'Bardo', 'opt.class.cleric': 'Clérigo',
  'opt.class.druid': 'Druida', 'opt.class.fighter': 'Guerreiro', 'opt.class.monk': 'Monge', 'opt.class.paladin': 'Paladino',
  'opt.class.ranger': 'Patrulheiro', 'opt.class.rogue': 'Ladino', 'opt.class.sorcerer': 'Feiticeiro', 'opt.class.warlock': 'Bruxo',
  'opt.class.wizard': 'Mago',
  // npc_type
  'opt.npc_type.citizen': 'Cidadão', 'opt.npc_type.merchant': 'Mercador', 'opt.npc_type.guard': 'Guarda', 'opt.npc_type.soldier': 'Soldado',
  'opt.npc_type.noble': 'Nobre', 'opt.npc_type.thief': 'Ladrão', 'opt.npc_type.criminal': 'Criminoso', 'opt.npc_type.politician': 'Político',
  'opt.npc_type.cultist': 'Cultista', 'opt.npc_type.mage': 'Mago', 'opt.npc_type.cleric': 'Clérigo', 'opt.npc_type.artisan': 'Artesão',
  'opt.npc_type.beast': 'Fera', 'opt.npc_type.monster': 'Monstro',
  // status (npc / monster / item)
  'opt.status.ally': 'Aliado', 'opt.status.neutral': 'Neutro', 'opt.status.hostile': 'Hostil', 'opt.status.rival': 'Rival',
  'opt.status.unknown': 'Desconhecido', 'opt.status.deceased': 'Falecido', 'opt.status.alive': 'Vivo', 'opt.status.dead': 'Morto',
  'opt.status.enemy': 'Inimigo', 'opt.status.captured': 'Capturado', 'opt.status.fled': 'Fugiu',
  'opt.status.intact': 'Intacto', 'opt.status.corrupted': 'Corrompido', 'opt.status.sealed': 'Selado',
  'opt.status.incomplete': 'Incompleto', 'opt.status.broken': 'Quebrado', 'opt.status.awakened': 'Desperto',
  // magic_level
  'opt.magic_level.zero': 'Nenhum', 'opt.magic_level.latent': 'Latente', 'opt.magic_level.basic': 'Básico',
  'opt.magic_level.intermediate': 'Intermediário', 'opt.magic_level.advanced': 'Avançado', 'opt.magic_level.arcane_entity': 'Entidade arcana',
  // alignment
  'opt.alignment.lg': 'LB (Leal e Bom)', 'opt.alignment.ng': 'NB (Neutro e Bom)', 'opt.alignment.cg': 'CB (Caótico e Bom)',
  'opt.alignment.ln': 'LN (Leal e Neutro)', 'opt.alignment.n': 'N (Neutro)', 'opt.alignment.cn': 'CN (Caótico e Neutro)',
  'opt.alignment.le': 'LM (Leal e Mau)', 'opt.alignment.ne': 'NM (Neutro e Mau)', 'opt.alignment.ce': 'CM (Caótico e Mau)',
  'opt.alignment.unaligned': 'Sem tendência',
  // importance (npc / location)
  'opt.importance.flavor': 'Ambientação', 'opt.importance.relevant': 'Relevante', 'opt.importance.key_critical': 'Chave / Crítico',
  'opt.importance.antagonist': 'Antagonista', 'opt.importance.unknown': 'Desconhecida', 'opt.importance.irrelevant': 'Irrelevante',
  'opt.importance.important': 'Importante', 'opt.importance.critical': 'Crítica', 'opt.importance.epic': 'Épica',
  // monster_type
  'opt.monster_type.aberration': 'Aberração', 'opt.monster_type.beast': 'Fera', 'opt.monster_type.celestial': 'Celestial',
  'opt.monster_type.construct': 'Constructo', 'opt.monster_type.dragon': 'Dragão', 'opt.monster_type.elemental': 'Elemental',
  'opt.monster_type.fey': 'Fada', 'opt.monster_type.fiend': 'Ínfero', 'opt.monster_type.giant': 'Gigante',
  'opt.monster_type.humanoid': 'Humanoide', 'opt.monster_type.monstrosity': 'Monstruosidade', 'opt.monster_type.ooze': 'Gosma',
  'opt.monster_type.plant': 'Planta', 'opt.monster_type.undead': 'Morto-vivo',
  // size
  'opt.size.tiny': 'Miúdo', 'opt.size.small': 'Pequeno', 'opt.size.medium': 'Médio', 'opt.size.large': 'Grande',
  'opt.size.huge': 'Enorme', 'opt.size.gargantuan': 'Imenso',
  // intelligence_level
  'opt.intelligence_level.instinctive': 'Instintivo', 'opt.intelligence_level.animalistic': 'Animalesco',
  'opt.intelligence_level.human_like': 'Semelhante a humano', 'opt.intelligence_level.genius': 'Gênio', 'opt.intelligence_level.omniscient': 'Onisciente',
  // location type
  'opt.type.city': 'Cidade', 'opt.type.village': 'Vila', 'opt.type.district': 'Distrito', 'opt.type.forest': 'Floresta',
  'opt.type.swamp': 'Pântano', 'opt.type.ruins': 'Ruínas', 'opt.type.temple': 'Templo', 'opt.type.dungeon': 'Masmorra',
  'opt.type.plane': 'Plano', 'opt.type.other': 'Outro',
  // item type
  'opt.type.weapon': 'Arma', 'opt.type.armor': 'Armadura', 'opt.type.wondrous_item': 'Item maravilhoso', 'opt.type.ring': 'Anel',
  'opt.type.amulet': 'Amuleto', 'opt.type.potion': 'Poção', 'opt.type.scroll': 'Pergaminho', 'opt.type.wand': 'Varinha',
  'opt.type.staff': 'Cajado', 'opt.type.rod': 'Bastão', 'opt.type.tool': 'Ferramenta',
  // accent_color
  'opt.accent_color.none': 'Nenhuma', 'opt.accent_color.red': 'Vermelho', 'opt.accent_color.blue': 'Azul', 'opt.accent_color.green': 'Verde',
  'opt.accent_color.purple': 'Roxo', 'opt.accent_color.orange': 'Laranja', 'opt.accent_color.yellow': 'Amarelo',
  // magic_intensity
  'opt.magic_intensity.dead_magic': 'Magia morta', 'opt.magic_intensity.low': 'Baixa', 'opt.magic_intensity.normal': 'Normal',
  'opt.magic_intensity.wild': 'Selvagem', 'opt.magic_intensity.high': 'Alta',
  // rarity
  'opt.rarity.common': 'Comum', 'opt.rarity.uncommon': 'Incomum', 'opt.rarity.rare': 'Raro', 'opt.rarity.very_rare': 'Muito raro',
  'opt.rarity.legendary': 'Lendário', 'opt.rarity.artifact': 'Artefato',
  // item_class
  'opt.item_class.minor_magic': 'Magia menor', 'opt.item_class.major_magic': 'Magia maior',
  'opt.item_class.campaign_artifact': 'Artefato de campanha', 'opt.item_class.divine_artifact': 'Artefato divino',
  // horror_scale
  'opt.horror_scale.1': '1', 'opt.horror_scale.2': '2', 'opt.horror_scale.3': '3', 'opt.horror_scale.4': '4', 'opt.horror_scale.5': '5',

  // cenas (SceneCard) — grupo scene_type
  'opt.scene_type.social': 'Social', 'opt.scene_type.combat': 'Combate', 'opt.scene_type.exploration': 'Exploração',
  'opt.scene_type.investigation': 'Investigação', 'opt.scene_type.flashback': 'Flashback', 'opt.scene_type.downtime': 'Intervalo',
  'opt.scene_type.travel': 'Viagem', 'opt.scene_type.other': 'Outro',
  // codex
  'opt.arc_status.beginning': 'Início', 'opt.arc_status.rising_conflict': 'Conflito crescente',
  'opt.arc_status.climax': 'Clímax', 'opt.arc_status.resolution': 'Resolução',
  'opt.plot_status.active': 'Ativa', 'opt.plot_status.future': 'Futura', 'opt.plot_status.resolved': 'Resolvida', 'opt.plot_status.dropped': 'Abandonada',
  // combate
  'opt.encounter_status.planned': 'Planejado', 'opt.encounter_status.active': 'Em andamento', 'opt.encounter_status.done': 'Concluído',
  'opt.campaign_status.active': 'Ativa',
  // tipos de combatente
  'opt.combatant_type.pc': 'PJ', 'opt.combatant_type.npc': 'NPC', 'opt.combatant_type.monster': 'Monstro',
} as const;
