import type { CommentSummary } from '@aurora/shared';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { likeComment, submitComment } from '../api/public';
import { colors, radii, spacing } from '../theme/tokens';
import { countComments, formatCompactDate } from '../utils/format';
import { EmptyState, SectionHeader, uiStyles } from './ui';

export function CommentsSection({
  postId,
  comments,
  onReload,
}: {
  postId: string;
  comments: CommentSummary[];
  onReload: () => Promise<void>;
}) {
  const [author, setAuthor] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function send() {
    if (!author.trim() || !email.trim() || !content.trim()) {
      Alert.alert('信息不完整', '请填写昵称、邮箱和评论内容。');
      return;
    }

    setSubmitting(true);
    try {
      await submitComment(postId, {
        author: author.trim(),
        email: email.trim(),
        content: content.trim(),
      });
      setContent('');
      Alert.alert('提交成功', '评论已提交，命中审核规则后会直接显示。');
      await onReload();
    } catch (reason) {
      Alert.alert('提交失败', reason instanceof Error ? reason.message : '评论提交失败');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLike(id: string) {
    try {
      await likeComment(id);
      await onReload();
    } catch (reason) {
      Alert.alert('点赞失败', reason instanceof Error ? reason.message : '点赞失败');
    }
  }

  return (
    <View style={uiStyles.section}>
      <SectionHeader title={`评论 · ${countComments(comments)}`} />

      <View style={styles.composer}>
        <TextInput
          value={author}
          onChangeText={setAuthor}
          placeholder="你的昵称"
          placeholderTextColor={colors.textMuted}
          style={uiStyles.searchInput}
        />
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="邮箱"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
          style={uiStyles.searchInput}
        />
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="写下你的看法"
          placeholderTextColor={colors.textMuted}
          multiline
          textAlignVertical="top"
          style={[uiStyles.searchInput, styles.textarea]}
        />
        <Pressable disabled={submitting} onPress={() => void send()} style={uiStyles.primaryButton}>
          <Text style={uiStyles.primaryButtonText}>{submitting ? '提交中...' : '发表评论'}</Text>
        </Pressable>
      </View>

      {comments.length ? (
        <View style={uiStyles.verticalList}>
          {comments.map((comment) => (
            <CommentNode key={comment.id} comment={comment} depth={0} onLike={handleLike} />
          ))}
        </View>
      ) : (
        <EmptyState title="还没有评论" description="你可以成为第一个留言的人。" />
      )}
    </View>
  );
}

function CommentNode({
  comment,
  depth,
  onLike,
}: {
  comment: CommentSummary;
  depth: number;
  onLike: (id: string) => Promise<void>;
}) {
  return (
    <View style={[styles.commentCard, depth > 0 ? styles.commentReply : null]}>
      <View style={styles.commentHeader}>
        <View>
          <Text style={styles.commentAuthor}>{comment.author}</Text>
          <Text style={styles.commentDate}>{formatCompactDate(comment.createdAt)}</Text>
        </View>
        <Pressable onPress={() => void onLike(comment.id)} style={styles.likeButton}>
          <Ionicons name="heart-outline" size={14} color={colors.brand} />
          <Text style={styles.likeLabel}>{comment.likes ?? 0}</Text>
        </Pressable>
      </View>
      <Text style={styles.commentBody}>{comment.content}</Text>
      {comment.replies?.map((reply) => (
        <CommentNode key={reply.id} comment={reply} depth={depth + 1} onLike={onLike} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  composer: {
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  textarea: {
    minHeight: 120,
    paddingVertical: spacing.md,
  },
  commentCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  commentReply: {
    marginTop: spacing.sm,
    marginLeft: spacing.md,
    backgroundColor: colors.surfaceMuted,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    alignItems: 'center',
  },
  commentAuthor: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  commentDate: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  commentBody: {
    color: colors.textSoft,
    fontSize: 14,
    lineHeight: 22,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#eef4ff',
  },
  likeLabel: {
    color: colors.brandStrong,
    fontSize: 12,
    fontWeight: '700',
  },
});
