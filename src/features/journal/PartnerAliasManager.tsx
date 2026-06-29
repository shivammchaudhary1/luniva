import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import Ionicons from '@expo/vector-icons/Ionicons';

import { colors } from '../../theme/colors';
import { useAuth } from '../auth/AuthProvider';

import {
  createPartnerAlias,
  deletePartnerAlias,
  getPartnerAliases,
  setPartnerAliasArchived,
  updatePartnerAlias,
} from './repository';

import type { AliasColorKey, PartnerAlias, RelationshipCategory } from './types';

import { partnerAliasSchema } from './validation';

type FormMode =
  | {
      type: 'closed';
    }
  | {
      type: 'create';
    }
  | {
      type: 'edit';
      aliasId: string;
    };

const relationshipOptions: {
  value: RelationshipCategory;
  label: string;
}[] = [
  {
    value: 'partner',
    label: 'Partner',
  },
  {
    value: 'spouse',
    label: 'Spouse',
  },
  {
    value: 'dating',
    label: 'Dating',
  },
  {
    value: 'casual',
    label: 'Casual',
  },
  {
    value: 'other',
    label: 'Other',
  },
  {
    value: 'prefer_not_to_say',
    label: 'Prefer not to say',
  },
];

const emojiOptions = ['🌙', '💜', '✨', '🌸', '⭐', '🪷'];

const aliasColorOptions: {
  value: AliasColorKey;
  color: string;
  label: string;
}[] = [
  {
    value: 'plum',
    color: colors.primary,
    label: 'Plum',
  },
  {
    value: 'orchid',
    color: colors.primarySoft,
    label: 'Orchid',
  },
  {
    value: 'rose',
    color: colors.pink,
    label: 'Rose',
  },
  {
    value: 'lavender',
    color: colors.accent,
    label: 'Lavender',
  },
  {
    value: 'slate',
    color: colors.info,
    label: 'Slate',
  },
];

const relationshipLabels: Record<RelationshipCategory, string> = {
  partner: 'Partner',
  spouse: 'Spouse',
  dating: 'Dating',
  casual: 'Casual',
  other: 'Other',
  prefer_not_to_say: 'Prefer not to say',
};

const aliasColorMap: Record<AliasColorKey, string> = {
  plum: colors.primary,
  orchid: colors.primarySoft,
  rose: colors.pink,
  lavender: colors.accent,
  slate: colors.info,
};

function sortAliases(aliases: PartnerAlias[]): PartnerAlias[] {
  return [...aliases].sort((first, second) => {
    if (first.is_archived !== second.is_archived) {
      return first.is_archived ? 1 : -1;
    }

    return second.created_at.localeCompare(first.created_at);
  });
}

export function PartnerAliasManager() {
  const { user } = useAuth();
  const userId = user?.id;

  const [aliases, setAliases] = useState<PartnerAlias[]>([]);

  const [formMode, setFormMode] = useState<FormMode>({
    type: 'closed',
  });

  const [aliasName, setAliasName] = useState('');

  const [relationshipCategory, setRelationshipCategory] = useState<RelationshipCategory | null>(
    null,
  );

  const [emoji, setEmoji] = useState('');

  const [colorKey, setColorKey] = useState<AliasColorKey>('plum');

  const [privateNote, setPrivateNote] = useState('');

  const [isLoading, setIsLoading] = useState(true);

  const [isSaving, setIsSaving] = useState(false);

  const [changingId, setChangingId] = useState<string | null>(null);

  const [loadError, setLoadError] = useState<string | null>(null);

  const activeAliases = useMemo(() => aliases.filter((alias) => !alias.is_archived), [aliases]);

  const archivedAliases = useMemo(() => aliases.filter((alias) => alias.is_archived), [aliases]);

  const loadAliases = useCallback(async () => {
    if (!userId) {
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const result = await getPartnerAliases(userId);

      setAliases(sortAliases(result));
    } catch (error: unknown) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load private aliases.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadAliases();
  }, [loadAliases]);

  const applySavedAlias = (savedAlias: PartnerAlias) => {
    setAliases((currentAliases) => {
      const exists = currentAliases.some((alias) => alias.id === savedAlias.id);

      const nextAliases = exists
        ? currentAliases.map((alias) => (alias.id === savedAlias.id ? savedAlias : alias))
        : [savedAlias, ...currentAliases];

      return sortAliases(nextAliases);
    });
  };

  const resetForm = () => {
    setFormMode({
      type: 'closed',
    });

    setAliasName('');
    setRelationshipCategory(null);
    setEmoji('');
    setColorKey('plum');
    setPrivateNote('');
  };

  const openCreateForm = () => {
    setAliasName('');
    setRelationshipCategory(null);
    setEmoji('');
    setColorKey('plum');
    setPrivateNote('');

    setFormMode({
      type: 'create',
    });
  };

  const openEditForm = (alias: PartnerAlias) => {
    setAliasName(alias.alias_name);

    setRelationshipCategory(alias.relationship_category);

    setEmoji(alias.emoji ?? '');

    setColorKey(alias.color_key);

    setPrivateNote(alias.private_note ?? '');

    setFormMode({
      type: 'edit',
      aliasId: alias.id,
    });
  };

  const handleSave = async () => {
    if (!userId || isSaving) {
      return;
    }

    const result = partnerAliasSchema.safeParse({
      aliasName,
      relationshipCategory,
      emoji,
      colorKey,
      privateNote,
    });

    if (!result.success) {
      Alert.alert(
        'Check alias details',
        result.error.issues[0]?.message ?? 'Complete the required information.',
      );

      return;
    }

    setIsSaving(true);

    try {
      let savedAlias: PartnerAlias;

      if (formMode.type === 'edit') {
        savedAlias = await updatePartnerAlias(formMode.aliasId, userId, result.data);
      } else {
        savedAlias = await createPartnerAlias(userId, result.data);
      }

      applySavedAlias(savedAlias);
      resetForm();

      Alert.alert('Private alias saved', 'This alias is visible only inside your account.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to save this alias.';

      Alert.alert(
        'Unable to save alias',
        message.includes('partner_aliases_owner_name_unique')
          ? 'You already have an alias with this name.'
          : message,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchiveChange = async (alias: PartnerAlias, isArchived: boolean) => {
    if (!userId || changingId) {
      return;
    }

    setChangingId(alias.id);

    try {
      const savedAlias = await setPartnerAliasArchived(alias.id, userId, isArchived);

      applySavedAlias(savedAlias);
    } catch (error: unknown) {
      Alert.alert(
        'Unable to update alias',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setChangingId(null);
    }
  };

  const confirmDelete = (alias: PartnerAlias) => {
    if (!userId || changingId) {
      return;
    }

    Alert.alert('Delete private alias?', `Permanently delete “${alias.alias_name}”?`, [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void handleDelete(alias);
        },
      },
    ]);
  };

  const handleDelete = async (alias: PartnerAlias) => {
    if (!userId) {
      return;
    }

    setChangingId(alias.id);

    try {
      await deletePartnerAlias(alias.id, userId);

      setAliases((currentAliases) =>
        currentAliases.filter((currentAlias) => currentAlias.id !== alias.id),
      );
    } catch (error: unknown) {
      Alert.alert(
        'Unable to delete alias',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setChangingId(null);
    }
  };

  if (isLoading && aliases.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />

        <Text style={styles.loadingText}>Loading private aliases…</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Private aliases</Text>

          <Text style={styles.description}>
            Use discreet names without connecting contacts or notifying anyone.
          </Text>
        </View>

        {formMode.type === 'closed' ? (
          <Pressable accessibilityRole="button" onPress={openCreateForm} style={styles.addButton}>
            <Ionicons color={colors.textOnPrimary} name="add" size={19} />

            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.summaryCard}>
        <SummaryItem label="Active" value={activeAliases.length} />

        <View style={styles.summaryDivider} />

        <SummaryItem label="Archived" value={archivedAliases.length} />
      </View>

      {loadError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{loadError}</Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void loadAliases();
            }}
          >
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : null}

      {formMode.type !== 'closed' ? (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {formMode.type === 'edit' ? 'Edit private alias' : 'Create private alias'}
          </Text>

          <Text style={styles.label}>Alias name</Text>

          <TextInput
            autoCapitalize="words"
            editable={!isSaving}
            maxLength={40}
            onChangeText={setAliasName}
            placeholder="Example: Moon"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={aliasName}
          />

          <Text style={styles.label}>Relationship category</Text>

          <View style={styles.chipContainer}>
            {relationshipOptions.map((option) => {
              const selected = relationshipCategory === option.value;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{
                    selected,
                  }}
                  key={option.value}
                  onPress={() => {
                    setRelationshipCategory(selected ? null : option.value);
                  }}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Optional emoji</Text>

          <View style={styles.emojiContainer}>
            {emojiOptions.map((emojiOption) => {
              const selected = emoji === emojiOption;

              return (
                <Pressable
                  accessibilityLabel={`Use ${emojiOption} emoji`}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected,
                  }}
                  key={emojiOption}
                  onPress={() => {
                    setEmoji(selected ? '' : emojiOption);
                  }}
                  style={[styles.emojiButton, selected && styles.emojiButtonSelected]}
                >
                  <Text style={styles.emojiText}>{emojiOption}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Alias color</Text>

          <View style={styles.colorContainer}>
            {aliasColorOptions.map((option) => {
              const selected = colorKey === option.value;

              return (
                <Pressable
                  accessibilityLabel={option.label}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected,
                  }}
                  key={option.value}
                  onPress={() => {
                    setColorKey(option.value);
                  }}
                  style={[styles.colorButton, selected && styles.colorButtonSelected]}
                >
                  <View
                    style={[
                      styles.colorCircle,
                      {
                        backgroundColor: option.color,
                      },
                    ]}
                  />

                  {selected ? (
                    <Ionicons color={colors.textPrimary} name="checkmark" size={17} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Optional private note</Text>

          <TextInput
            editable={!isSaving}
            maxLength={500}
            multiline
            onChangeText={setPrivateNote}
            placeholder="Only you can see this note."
            placeholderTextColor={colors.textMuted}
            style={[styles.input, styles.noteInput]}
            textAlignVertical="top"
            value={privateNote}
          />

          <Text style={styles.characterCount}>{privateNote.length}/500</Text>

          <Pressable
            accessibilityRole="button"
            disabled={isSaving}
            onPress={() => {
              void handleSave();
            }}
            style={[styles.saveButton, isSaving && styles.disabledButton]}
          >
            {isSaving ? (
              <ActivityIndicator color={colors.textOnPrimary} />
            ) : (
              <Text style={styles.saveButtonText}>Save private alias</Text>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={isSaving}
            onPress={resetForm}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Active aliases</Text>

      {activeAliases.length > 0 ? (
        activeAliases.map((alias) => (
          <AliasCard
            alias={alias}
            changing={changingId === alias.id}
            key={alias.id}
            onArchive={() => {
              void handleArchiveChange(alias, true);
            }}
            onDelete={() => {
              confirmDelete(alias);
            }}
            onEdit={() => {
              openEditForm(alias);
            }}
          />
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>👤</Text>

          <Text style={styles.emptyTitle}>No private aliases yet</Text>

          <Text style={styles.emptyText}>
            Create an alias before adding private journal entries.
          </Text>
        </View>
      )}

      {archivedAliases.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Archived aliases</Text>

          {archivedAliases.map((alias) => (
            <AliasCard
              alias={alias}
              changing={changingId === alias.id}
              key={alias.id}
              onDelete={() => {
                confirmDelete(alias);
              }}
              onEdit={() => {
                openEditForm(alias);
              }}
              onRestore={() => {
                void handleArchiveChange(alias, false);
              }}
            />
          ))}
        </>
      ) : null}
    </View>
  );
}

type SummaryItemProps = {
  label: string;
  value: number;
};

function SummaryItem({ label, value }: SummaryItemProps) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryValue}>{value}</Text>

      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

type AliasCardProps = {
  alias: PartnerAlias;
  changing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
};

function AliasCard({ alias, changing, onEdit, onDelete, onArchive, onRestore }: AliasCardProps) {
  const relationshipLabel = alias.relationship_category
    ? relationshipLabels[alias.relationship_category]
    : 'No category';

  return (
    <View style={[styles.aliasCard, alias.is_archived && styles.aliasCardArchived]}>
      <View
        style={[
          styles.aliasAvatar,
          {
            backgroundColor: aliasColorMap[alias.color_key],
          },
        ]}
      >
        <Text style={styles.aliasEmoji}>{alias.emoji ?? '👤'}</Text>
      </View>

      <View style={styles.aliasContent}>
        <Text style={styles.aliasName}>{alias.alias_name}</Text>

        <Text style={styles.aliasRelationship}>{relationshipLabel}</Text>

        {alias.private_note ? (
          <Text numberOfLines={2} style={styles.aliasNote}>
            🔒 {alias.private_note}
          </Text>
        ) : null}
      </View>

      {changing ? (
        <ActivityIndicator color={colors.primary} size="small" />
      ) : (
        <View style={styles.actionContainer}>
          <Pressable
            accessibilityLabel="Edit alias"
            accessibilityRole="button"
            onPress={onEdit}
            style={styles.iconButton}
          >
            <Ionicons color={colors.primary} name="create-outline" size={20} />
          </Pressable>

          {onArchive ? (
            <Pressable
              accessibilityLabel="Archive alias"
              accessibilityRole="button"
              onPress={onArchive}
              style={styles.iconButton}
            >
              <Ionicons color={colors.textMuted} name="archive-outline" size={20} />
            </Pressable>
          ) : null}

          {onRestore ? (
            <Pressable
              accessibilityLabel="Restore alias"
              accessibilityRole="button"
              onPress={onRestore}
              style={styles.iconButton}
            >
              <Ionicons color={colors.success} name="refresh-outline" size={20} />
            </Pressable>
          ) : null}

          <Pressable
            accessibilityLabel="Delete alias"
            accessibilityRole="button"
            onPress={onDelete}
            style={styles.iconButton}
          >
            <Ionicons color={colors.danger} name="trash-outline" size={20} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 26,
  },
  centered: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 13,
    fontSize: 14,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 21,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  description: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  addButton: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 13,
    backgroundColor: colors.primary,
  },
  addButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
  summaryCard: {
    flexDirection: 'row',
    marginTop: 18,
    paddingVertical: 16,
    borderRadius: 17,
    backgroundColor: colors.surface,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  summaryLabel: {
    marginTop: 3,
    fontSize: 12,
    color: colors.textMuted,
  },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },
  errorCard: {
    marginTop: 14,
    padding: 16,
    borderRadius: 14,
    backgroundColor: colors.dangerSurface,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.danger,
  },
  retryText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  formCard: {
    marginTop: 18,
    padding: 18,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  formTitle: {
    marginBottom: 19,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  label: {
    marginTop: 4,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  input: {
    minHeight: 50,
    marginBottom: 17,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    backgroundColor: colors.surfaceSoft,
    fontSize: 16,
    color: colors.textPrimary,
  },
  noteInput: {
    minHeight: 100,
    paddingTop: 14,
    paddingBottom: 14,
  },
  characterCount: {
    marginTop: -12,
    fontSize: 12,
    textAlign: 'right',
    color: colors.textMuted,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 13,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.surfaceSoft,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySurface,
  },
  chipText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    fontWeight: '700',
    color: colors.primary,
  },
  emojiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  emojiButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    backgroundColor: colors.surfaceSoft,
  },
  emojiButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySurface,
  },
  emojiText: {
    fontSize: 22,
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  colorButton: {
    width: 52,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surfaceSoft,
  },
  colorButtonSelected: {
    borderColor: colors.primary,
  },
  colorCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  saveButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 13,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  sectionTitle: {
    marginTop: 27,
    marginBottom: 10,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  aliasCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 11,
    padding: 15,
    borderRadius: 17,
    backgroundColor: colors.surface,
  },
  aliasCardArchived: {
    opacity: 0.72,
  },
  aliasAvatar: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
  },
  aliasEmoji: {
    fontSize: 24,
  },
  aliasContent: {
    flex: 1,
    marginLeft: 13,
  },
  aliasName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  aliasRelationship: {
    marginTop: 3,
    fontSize: 13,
    color: colors.textMuted,
  },
  aliasNote: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 38,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderRadius: 17,
    backgroundColor: colors.surface,
  },
  emptyEmoji: {
    fontSize: 30,
  },
  emptyTitle: {
    marginTop: 11,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    color: colors.textSecondary,
  },
});
