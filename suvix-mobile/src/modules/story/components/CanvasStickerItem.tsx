import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StoryObject } from '../types';

interface Props { item: StoryObject; }

// ── Emoji sticker map ────────────────────────────────────────────────────────

export const EMOJI_STICKERS: Record<string, string> = {
  emoji_fire:       '🔥',
  emoji_heart:      '❤️',
  emoji_star:       '⭐',
  emoji_100:        '💯',
  emoji_party:      '🎉',
  emoji_crown:      '👑',
  emoji_sparkles:   '✨',
  emoji_sunglasses: '😎',
  emoji_laugh:      '😂',
  emoji_cry:        '😭',
  emoji_skull:      '💀',
  emoji_rainbow:    '🌈',
  emoji_muscle:     '💪',
  emoji_eyes:       '👀',
  emoji_camera:     '📸',
  emoji_lightning:  '⚡',
  emoji_butterfly:  '🦋',
  emoji_alien:      '👽',
  emoji_clap:       '👏',
  emoji_dizzy:      '💫',
  emoji_diamond:    '💎',
  emoji_ghost:      '👻',
  emoji_rocket:     '🚀',
  emoji_bomb:       '💣',
};

// ── Poll Widget ───────────────────────────────────────────────────────────────

const PollWidget: React.FC<{ item: StoryObject }> = ({ item }) => {
  const question = item.pollQuestion ?? 'Which do you prefer?';
  const options  = item.pollOptions  ?? ['Option A', 'Option B'];
  const [votes, setVotes]   = useState<number[]>(options.map(() => 0));
  const [voted, setVoted]   = useState<number | null>(null);

  const total = votes.reduce((a, b) => a + b, 0);

  const castVote = (i: number) => {
    if (voted !== null) return;
    setVotes(v => v.map((val, idx) => (idx === i ? val + 1 : val)));
    setVoted(i);
  };

  return (
    <View style={pw.card}>
      <LinearGradient colors={['#6C63FF', '#3D35C7']} style={pw.gradient}>
        <View style={pw.header}>
          <MaterialCommunityIcons name="chart-bar" size={14} color="rgba(255,255,255,0.6)" />
          <Text style={pw.headerLabel}>POLL</Text>
        </View>
        <Text style={pw.question}>{question}</Text>

        {options.map((opt, i) => {
          const pct = total > 0 ? (votes[i] / total) * 100 : 0;
          const isWinner = voted !== null && votes[i] === Math.max(...votes);
          return (
            <TouchableOpacity
              key={i}
              onPress={() => castVote(i)}
              activeOpacity={0.85}
              style={pw.optRow}
            >
              <View style={pw.optBar}>
                <Animated.View
                  style={[
                    pw.optFill,
                    { width: `${pct}%`, backgroundColor: isWinner ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.2)' },
                  ]}
                />
                <Text style={pw.optLabel}>{opt}</Text>
              </View>
              {voted !== null && (
                <Text style={pw.pct}>{Math.round(pct)}%</Text>
              )}
            </TouchableOpacity>
          );
        })}

        {voted === null && (
          <Text style={pw.hint}>Tap to vote</Text>
        )}
      </LinearGradient>
    </View>
  );
};

const pw = StyleSheet.create({
  card:      { borderRadius: 18, overflow: 'hidden', width: 220 },
  gradient:  { padding: 16 },
  header:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  headerLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  question:  { color: '#fff', fontWeight: '800', fontSize: 14, marginBottom: 12, lineHeight: 20 },
  optRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  optBar: {
    flex: 1, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden', justifyContent: 'center', paddingLeft: 12,
  },
  optFill: {
    position: 'absolute', top: 0, left: 0, bottom: 0, borderRadius: 10,
  },
  optLabel: { color: '#fff', fontWeight: '700', fontSize: 13, zIndex: 1 },
  pct:      { color: '#fff', fontWeight: '700', fontSize: 12, marginLeft: 8, width: 34, textAlign: 'right' },
  hint:     { color: 'rgba(255,255,255,0.45)', fontSize: 11, textAlign: 'center', marginTop: 4 },
});

// ── Music Widget ──────────────────────────────────────────────────────────────

const MusicWidget: React.FC<{ item: StoryObject }> = ({ item }) => {
  const title  = item.musicTitle  ?? 'Now Playing';
  const artist = item.musicArtist ?? 'Unknown Artist';
  const spin   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 4000, useNativeDriver: true }),
    );
    anim.start();
    return () => anim.stop();
  }, [spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={mw.card}>
      <LinearGradient colors={['#1C1C1E', '#2C2C2E']} style={mw.gradient}>
        <Animated.View style={[mw.disc, { transform: [{ rotate }] }]}>
          <LinearGradient colors={['#FF3040', '#FF8C00']} style={mw.discFill}>
            <View style={mw.discCenter} />
          </LinearGradient>
        </Animated.View>
        <View style={mw.info}>
          <View style={mw.badge}>
            <Ionicons name="musical-notes" size={9} color="#fff" />
            <Text style={mw.badgeTxt}>MUSIC</Text>
          </View>
          <Text style={mw.title} numberOfLines={1}>{title}</Text>
          <Text style={mw.artist} numberOfLines={1}>{artist}</Text>
          <View style={mw.bars}>
            {[3, 6, 4, 8, 5, 7, 3, 6, 5].map((h, i) => (
              <View key={i} style={[mw.bar, { height: h * 3 }]} />
            ))}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const mw = StyleSheet.create({
  card:      { borderRadius: 16, overflow: 'hidden', width: 210 },
  gradient:  { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  disc:      { width: 54, height: 54, borderRadius: 27, overflow: 'hidden' },
  discFill:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  discCenter: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#1C1C1E' },
  info:      { flex: 1 },
  badge:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  badgeTxt:  { color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  title:     { color: '#fff', fontWeight: '800', fontSize: 13, marginBottom: 2 },
  artist:    { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginBottom: 6 },
  bars:      { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 26 },
  bar:       { width: 3, backgroundColor: '#FF3040', borderRadius: 2 },
});

// ── Countdown Widget ──────────────────────────────────────────────────────────

const CountdownWidget: React.FC<{ item: StoryObject }> = ({ item }) => {
  const target = item.countdownTargetMs ?? (Date.now() + 24 * 3_600_000);
  const label  = item.labelText ?? 'COUNTING DOWN';
  const [left, setLeft] = useState(Math.max(0, target - Date.now()));

  useEffect(() => {
    const id = setInterval(() => setLeft(Math.max(0, target - Date.now())), 1000);
    return () => clearInterval(id);
  }, [target]);

  const pad = (n: number) => String(n).padStart(2, '0');
  const days  = Math.floor(left / 86_400_000);
  const hours = Math.floor((left % 86_400_000) / 3_600_000);
  const mins  = Math.floor((left % 3_600_000) / 60_000);
  const secs  = Math.floor((left % 60_000) / 1000);

  return (
    <View style={cw.card}>
      <LinearGradient colors={['#FF3040', '#FF8C00']} style={cw.gradient}>
        <Text style={cw.label}>{label}</Text>
        <View style={cw.row}>
          {[
            { v: pad(days),  l: 'days' },
            { v: pad(hours), l: 'hrs'  },
            { v: pad(mins),  l: 'min'  },
            { v: pad(secs),  l: 'sec'  },
          ].map(({ v, l }, i) => (
            <React.Fragment key={i}>
              {i > 0 && <Text style={cw.colon}>:</Text>}
              <View style={cw.unit}>
                <Text style={cw.digit}>{v}</Text>
                <Text style={cw.sub}>{l}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
};

const cw = StyleSheet.create({
  card:    { borderRadius: 16, overflow: 'hidden' },
  gradient: { padding: 14, alignItems: 'center' },
  label:   { color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 8 },
  row:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  unit:    { alignItems: 'center' },
  digit:   { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  sub:     { color: 'rgba(255,255,255,0.65)', fontSize: 9, fontWeight: '600' },
  colon:   { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 12 },
});

// ── Mention / Hashtag Tag ─────────────────────────────────────────────────────

const MentionTag: React.FC<{ item: StoryObject; isHashtag?: boolean }> = ({ item, isHashtag }) => (
  <View style={tag.pill}>
    <Text style={tag.txt}>
      {isHashtag ? '#' : '@'}{item.labelText ?? (isHashtag ? 'trending' : 'username')}
    </Text>
  </View>
);

const tag = StyleSheet.create({
  pill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  txt: { color: '#fff', fontWeight: '800', fontSize: 18 },
});

// ── Location Tag ──────────────────────────────────────────────────────────────

const LocationTag: React.FC<{ item: StoryObject }> = ({ item }) => (
  <View style={loc.pill}>
    <Ionicons name="location" size={15} color="#FF3040" />
    <Text style={loc.txt}>{item.labelText ?? 'Location'}</Text>
  </View>
);

const loc = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  txt: { color: '#111', fontWeight: '800', fontSize: 14 },
});

// ── Main CanvasStickerItem ────────────────────────────────────────────────────

export const CanvasStickerItem: React.FC<Props> = ({ item }) => {
  const { content } = item;

  if (EMOJI_STICKERS[content]) {
    return <Text style={si.emoji}>{EMOJI_STICKERS[content]}</Text>;
  }

  switch (content) {
    case 'widget_poll':      return <PollWidget item={item} />;
    case 'widget_music':     return <MusicWidget item={item} />;
    case 'widget_countdown': return <CountdownWidget item={item} />;
    case 'widget_mention':   return <MentionTag item={item} />;
    case 'widget_hashtag':   return <MentionTag item={item} isHashtag />;
    case 'widget_location':  return <LocationTag item={item} />;
    case 'heart':            return <Ionicons name="heart" size={64} color="#FF3040" />;
    case 'star':             return <Ionicons name="star" size={64} color="#FFD700" />;
    case 'fire':             return <MaterialCommunityIcons name="fire" size={64} color="#FF4500" />;
    case 'verified':         return <MaterialCommunityIcons name="check-decagram" size={64} color="#3897f0" />;
    case 'happy':            return <Ionicons name="happy" size={64} color="#FFD700" />;
    default:                 return <Text style={si.emoji}>✨</Text>;
  }
};

const si = StyleSheet.create({
  emoji: { fontSize: 64 },
});