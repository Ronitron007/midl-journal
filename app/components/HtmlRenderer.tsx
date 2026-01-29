import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { truncateHtml } from '../lib/rich-text-utils';

type HtmlRendererProps = {
  html: string;
  maxLength?: number;
  style?: TextStyle;
};

/**
 * Simple HTML renderer for entry previews.
 * For full rendering, consider react-native-render-html.
 * This is a lightweight solution for previews only.
 */
export default function HtmlRenderer({
  html,
  maxLength = 100,
  style,
}: HtmlRendererProps) {
  const preview = truncateHtml(html, maxLength);

  return (
    <Text style={[styles.text, style]} numberOfLines={2}>
      {preview}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    color: '#1f2937',
    fontSize: 14,
    lineHeight: 20,
  },
});
