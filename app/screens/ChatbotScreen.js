import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import Text from '../components/Text';
import Animated, { FadeInUp } from 'react-native-reanimated';
import apiRequest from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useAccessibility, touchTargetProps, touchTargetStyle } from '../context/AccessibilityContext';
import { SPACING, RADII, AGE_PALETTES } from '../constants/tokens';
const NAVY = AGE_PALETTES.adult.navy;
export default function ChatbotScreen() {
  const {
    theme
  } = useTheme();
  const {
    settings: a11y
  } = useAccessibility();
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const sendMessage = async () => {
    if (!message.trim()) return;
    const userMessage = message;
    setConversation(prev => [...prev, {
      role: 'user',
      text: userMessage
    }]);
    setMessage('');
    setLoading(true);
    try {
      const result = await apiRequest('/chatbot/ask', 'POST', {
        message: userMessage
      });
      setConversation(prev => [...prev, {
        role: 'bot',
        text: result.reply,
        retrieval: result.retrieval || []
      }]);
    } catch (err) {
      setConversation(prev => [...prev, {
        role: 'bot',
        text: 'Something went wrong. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };
  return <View style={[styles.container, {
    backgroundColor: theme.bg
  }]}>
      <ScrollView style={styles.messages} contentContainerStyle={{
      padding: 16
    }}>
        {conversation.map((entry, index) => <Animated.View key={index} entering={FadeInUp.duration(280)} style={[styles.bubble, entry.role === 'user' ? styles.userBubble : [styles.botBubble, {
        backgroundColor: theme.card
      }]]}>
            <Text style={entry.role === 'user' ? styles.userText : [styles.botText, {
          color: theme.text
        }]}>{entry.text}</Text>
            {entry.role === 'bot' && entry.retrieval && entry.retrieval.length > 0 && <View style={[styles.sourcesBox, {
          borderTopColor: theme.border
        }]}>
                <Text style={[styles.sourcesLabel, {
            color: theme.textSub
          }]}>Grounded in:</Text>
                {entry.retrieval.map(r => <Text key={r.id} style={[styles.sourceLine, {
            color: r.usedForGrounding ? theme.textSub : theme.textSub
          }, !r.usedForGrounding && styles.sourceLineUnused]}>
                    {r.usedForGrounding ? '✓' : '·'} {r.title} ({r.score.toFixed(2)})
                  </Text>)}
              </View>}
          </Animated.View>)}
        {loading && <ActivityIndicator style={{
        marginTop: 8
      }} />}
      </ScrollView>

      <View style={[styles.inputRow, {
      borderTopColor: theme.border
    }]}>
        <TextInput style={[styles.input, {
        borderColor: theme.border,
        color: theme.text
      }]} placeholder="Ask about disaster preparedness..." placeholderTextColor={theme.textSub} value={message} onChangeText={setMessage} />
        <TouchableOpacity style={[styles.sendButton, touchTargetStyle(a11y, 44)]} onPress={sendMessage} accessibilityRole="button" accessibilityLabel="Send message" {...touchTargetProps(a11y)}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>;
}
const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  messages: {
    flex: 1
  },
  bubble: {
    padding: SPACING.md,
    borderRadius: RADII.adult.card,
    marginBottom: SPACING.sm,
    maxWidth: '80%'
  },
  userBubble: {
    backgroundColor: NAVY,
    alignSelf: 'flex-end'
  },
  botBubble: {
    alignSelf: 'flex-start'
  },
  userText: {
    color: '#fff'
  },
  botText: {},
  sourcesBox: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm - 2,
    borderTopWidth: StyleSheet.hairlineWidth
  },
  sourcesLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2
  },
  sourceLine: {
    fontSize: 11,
    lineHeight: 16
  },
  sourceLineUnused: {
    opacity: 0.5,
    textDecorationLine: 'line-through'
  },
  inputRow: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderTopWidth: 1
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: RADII.adult.button - 4,
    padding: SPACING.sm + 2,
    marginRight: SPACING.sm
  },
  sendButton: {
    backgroundColor: NAVY,
    borderRadius: RADII.adult.button - 4,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center'
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold'
  }
});
