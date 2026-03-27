import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { LoadingState, Screen, SectionHeader, uiStyles } from '../components/ui';
import { useAuthSession } from '../state/auth-session';
import { useReadingHistory } from '../state/reading-history';
import { useReadingList } from '../state/reading-list';
import { colors, radii, shadows, spacing } from '../theme/tokens';

type AuthMode = 'login' | 'register';

const DEFAULT_ADMIN_EMAIL = 'admin@aurora.local';
const DEFAULT_ADMIN_PASSWORD = 'Admin@123456';

export function ProfileScreen() {
  const auth = useAuthSession();
  const readingHistory = useReadingHistory();
  const readingList = useReadingList();
  const [mode, setMode] = useState<AuthMode>('login');
  const [message, setMessage] = useState('');
  const [codeHint, setCodeHint] = useState('');
  const [loginEmail, setLoginEmail] = useState(DEFAULT_ADMIN_EMAIL);
  const [loginPassword, setLoginPassword] = useState(DEFAULT_ADMIN_PASSWORD);
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerCode, setRegisterCode] = useState('');
  const [profileName, setProfileName] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');
  const [profileJobTitle, setProfileJobTitle] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileLocation, setProfileLocation] = useState('');
  const [profileWebsite, setProfileWebsite] = useState('');
  const [profileBio, setProfileBio] = useState('');

  useEffect(() => {
    if (!auth.user) {
      return;
    }

    setProfileName(auth.user.name || '');
    setProfileAvatar(auth.user.avatar || '');
    setProfileJobTitle(auth.user.jobTitle || '');
    setProfilePhone(auth.user.phone || '');
    setProfileLocation(auth.user.location || '');
    setProfileWebsite(auth.user.website || '');
    setProfileBio(auth.user.bio || '');
  }, [auth.user]);

  async function handleLogin() {
    setMessage('');
    try {
      await auth.login({
        email: loginEmail.trim(),
        password: loginPassword,
      });
      setMessage('登录成功，个人中心已启用。');
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : '登录失败');
    }
  }

  async function handleSendCode() {
    setMessage('');
    setCodeHint('');
    try {
      const response = await auth.requestRegisterCode(registerEmail.trim());
      setMessage(response.message);
      setCodeHint(response.debugCode ? `开发验证码：${response.debugCode}` : '');
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : '验证码发送失败');
    }
  }

  async function handleRegister() {
    setMessage('');
    try {
      await auth.register({
        name: registerName.trim(),
        email: registerEmail.trim(),
        password: registerPassword,
        code: registerCode.trim(),
      });
      setRegisterPassword('');
      setRegisterCode('');
      setCodeHint('');
      setMessage('注册完成，已自动登录。');
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : '注册失败');
    }
  }

  async function handleSaveProfile() {
    setMessage('');
    try {
      await auth.updateProfile({
        name: profileName.trim(),
        avatar: profileAvatar.trim(),
        jobTitle: profileJobTitle.trim(),
        phone: profilePhone.trim(),
        location: profileLocation.trim(),
        website: profileWebsite.trim(),
        bio: profileBio.trim(),
      });
      setMessage('个人资料已保存。');
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : '保存失败');
    }
  }

  function fillDefaultAdmin() {
    setLoginEmail(DEFAULT_ADMIN_EMAIL);
    setLoginPassword(DEFAULT_ADMIN_PASSWORD);
    setMessage('已填入默认管理员账号。');
  }

  return (
    <Screen>
      {!auth.loaded ? (
        <LoadingState label="正在恢复账号状态" />
      ) : !auth.isAuthenticated || !auth.user ? (
        <ScrollView contentContainerStyle={uiStyles.scrollContent} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={['#0f172a', '#165dff', '#4db7ff']} style={styles.hero}>
            <Text style={styles.heroEyebrow}>Account Hub</Text>
            <Text style={styles.heroTitle}>把移动端变成你的个人工作台</Text>
            <Text style={styles.heroDescription}>登录后可以获得个人中心、通知中心以及后续的收藏同步能力。</Text>
          </LinearGradient>

          <View style={styles.modeSwitch}>
            <Pressable onPress={() => setMode('login')} style={[styles.modeButton, mode === 'login' ? styles.modeButtonActive : null]}>
              <Text style={[styles.modeText, mode === 'login' ? styles.modeTextActive : null]}>登录</Text>
            </Pressable>
            <Pressable onPress={() => setMode('register')} style={[styles.modeButton, mode === 'register' ? styles.modeButtonActive : null]}>
              <Text style={[styles.modeText, mode === 'register' ? styles.modeTextActive : null]}>注册</Text>
            </Pressable>
          </View>

          <View style={styles.formCard}>
            {mode === 'login' ? (
              <>
                <SectionHeader title="账号登录" actionLabel="填入管理员" onPress={fillDefaultAdmin} />
                <Text style={styles.helperText}>当前开发默认管理员：`admin@aurora.local / Admin@123456`</Text>
                <LabeledInput
                  label="邮箱"
                  value={loginEmail}
                  onChangeText={setLoginEmail}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <LabeledInput
                  label="密码"
                  value={loginPassword}
                  onChangeText={setLoginPassword}
                  placeholder="至少 6 位"
                  secureTextEntry
                />
                <Pressable onPress={() => void handleLogin()} style={uiStyles.primaryButton}>
                  <Text style={uiStyles.primaryButtonText}>{auth.pending ? '正在登录...' : '登录'}</Text>
                </Pressable>
              </>
            ) : (
              <>
                <SectionHeader title="创建账号" />
                <LabeledInput label="显示名称" value={registerName} onChangeText={setRegisterName} placeholder="你的名字" />
                <LabeledInput
                  label="邮箱"
                  value={registerEmail}
                  onChangeText={setRegisterEmail}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <View style={styles.inlineActionRow}>
                  <View style={styles.inlineField}>
                    <LabeledInput
                      label="验证码"
                      value={registerCode}
                      onChangeText={setRegisterCode}
                      placeholder="6 位数字"
                      keyboardType="number-pad"
                    />
                  </View>
                  <Pressable onPress={() => void handleSendCode()} style={styles.inlineActionButton}>
                    <Text style={styles.inlineActionText}>{auth.pending ? '...' : '发送'}</Text>
                  </Pressable>
                </View>
                <LabeledInput
                  label="设置密码"
                  value={registerPassword}
                  onChangeText={setRegisterPassword}
                  placeholder="至少 8 位"
                  secureTextEntry
                />
                <Pressable onPress={() => void handleRegister()} style={uiStyles.primaryButton}>
                  <Text style={uiStyles.primaryButtonText}>{auth.pending ? '正在注册...' : '注册并登录'}</Text>
                </Pressable>
              </>
            )}

            {message ? <Text style={styles.messageText}>{message}</Text> : null}
            {codeHint ? <Text style={styles.codeHint}>{codeHint}</Text> : null}
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={uiStyles.scrollContent} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={['#0f172a', '#1148cc', '#2b84ff']} style={styles.profileHero}>
            {profileAvatar ? (
              <Image source={{ uri: profileAvatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{(auth.user.name?.slice(0, 1) || auth.user.email.slice(0, 1) || 'U').toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.profileHeroText}>
              <Text style={styles.profileName}>{auth.user.name}</Text>
              <Text style={styles.profileMeta}>{auth.user.email}</Text>
              <Text style={styles.profileMeta}>{auth.user.roles.map((role) => role.name).join(' · ') || 'Member'}</Text>
            </View>
          </LinearGradient>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{readingList.items.length}</Text>
              <Text style={styles.statText}>收藏文章</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{auth.user.permissions.length}</Text>
              <Text style={styles.statText}>已开通权限</Text>
            </View>
          </View>

          <View style={styles.localSummary}>
            <Text style={styles.localSummaryTitle}>本机阅读状态</Text>
            <Text style={styles.localSummaryText}>最近阅读 {readingHistory.items.length} 篇，阅读清单 {readingList.items.length} 篇。</Text>
          </View>

          <View style={styles.formCard}>
            <SectionHeader title="个人资料" actionLabel={auth.pending ? '保存中...' : '保存'} onPress={() => void handleSaveProfile()} />
            <LabeledInput label="显示名称" value={profileName} onChangeText={setProfileName} placeholder="你的名字" />
            <LabeledInput label="头像地址" value={profileAvatar} onChangeText={setProfileAvatar} placeholder="https://..." autoCapitalize="none" />
            <LabeledInput label="职位" value={profileJobTitle} onChangeText={setProfileJobTitle} placeholder="Content Editor" />
            <LabeledInput label="手机" value={profilePhone} onChangeText={setProfilePhone} placeholder="138..." keyboardType="phone-pad" />
            <LabeledInput label="地理位置" value={profileLocation} onChangeText={setProfileLocation} placeholder="Shanghai" />
            <LabeledInput label="个人网站" value={profileWebsite} onChangeText={setProfileWebsite} placeholder="https://..." autoCapitalize="none" />
            <LabeledInput label="简介" value={profileBio} onChangeText={setProfileBio} placeholder="介绍一下你自己" multiline />

            {message ? <Text style={styles.messageText}>{message}</Text> : null}

            <View style={styles.actionRow}>
              <Pressable onPress={() => void handleSaveProfile()} style={uiStyles.primaryButton}>
                <Text style={uiStyles.primaryButtonText}>{auth.pending ? '正在保存...' : '保存资料'}</Text>
              </Pressable>
              <Pressable onPress={() => void auth.logout()} style={uiStyles.secondaryButton}>
                <Text style={uiStyles.secondaryButtonText}>退出登录</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

function LabeledInput({
  label,
  multiline = false,
  ...props
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'number-pad' | 'phone-pad';
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={colors.textMuted}
        style={[styles.fieldInput, multiline ? styles.fieldInputMultiline : null]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: radii.hero,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadows.hero,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
  },
  heroDescription: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 15,
    lineHeight: 23,
  },
  modeSwitch: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: '#eaf1fb',
    borderRadius: 999,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  modeButtonActive: {
    backgroundColor: colors.surface,
  },
  modeText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  modeTextActive: {
    color: colors.brandStrong,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.card,
  },
  helperText: {
    color: colors.textSoft,
    fontSize: 13,
    lineHeight: 20,
  },
  inlineActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-end',
  },
  inlineField: {
    flex: 1,
  },
  inlineActionButton: {
    minHeight: 48,
    borderRadius: 18,
    backgroundColor: '#dcebff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  inlineActionText: {
    color: colors.brandStrong,
    fontSize: 13,
    fontWeight: '800',
  },
  messageText: {
    color: colors.textSoft,
    fontSize: 13,
    lineHeight: 20,
  },
  codeHint: {
    color: colors.brandStrong,
    fontSize: 13,
    fontWeight: '700',
  },
  profileHero: {
    borderRadius: radii.hero,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    ...shadows.hero,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  avatarFallback: {
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  profileHeroText: {
    flex: 1,
    gap: spacing.xs,
  },
  profileName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  profileMeta: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadows.card,
  },
  statNumber: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
  },
  statText: {
    color: colors.textSoft,
    fontSize: 13,
  },
  localSummary: {
    backgroundColor: '#ecf4ff',
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: '#d4e5ff',
    padding: spacing.lg,
    gap: spacing.xs,
  },
  localSummaryTitle: {
    color: colors.brandStrong,
    fontSize: 15,
    fontWeight: '800',
  },
  localSummaryText: {
    color: colors.textSoft,
    fontSize: 14,
    lineHeight: 22,
  },
  field: {
    gap: spacing.xs,
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  fieldInput: {
    minHeight: 48,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: spacing.md,
  },
  fieldInputMultiline: {
    minHeight: 112,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    textAlignVertical: 'top',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
