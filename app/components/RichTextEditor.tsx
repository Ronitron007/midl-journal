import React, { useEffect } from 'react';
import { View, StyleSheet, Platform, KeyboardAvoidingView, Pressable, Text, Keyboard } from 'react-native';
import {
  RichText,
  Toolbar,
  useEditorBridge,
  useEditorContent,
  TenTapStartKit,
  CoreBridge,
  DEFAULT_TOOLBAR_ITEMS,
} from '@10play/tentap-editor';

type RichTextEditorProps = {
  initialContent?: string;
  placeholder?: string;
  onContentChange?: (html: string) => void;
  editable?: boolean;
  showToolbar?: boolean;
  minHeight?: number;
  autoFocus?: boolean;
};

export default function RichTextEditor({
  initialContent = '',
  placeholder = 'Write freely...',
  onContentChange,
  editable = true,
  showToolbar = true,
  minHeight = 200,
  autoFocus = false,
}: RichTextEditorProps) {
  const editor = useEditorBridge({
    autofocus: autoFocus,
    avoidIosKeyboard: true,
    initialContent,
    bridgeExtensions: [
      ...TenTapStartKit,
      CoreBridge.configureCSS(`
        * {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .ProseMirror {
          padding: 16px;
          min-height: ${minHeight}px;
          font-size: 16px;
          line-height: 1.6;
          color: #3a5222;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: "${placeholder}";
          color: #707927;
          pointer-events: none;
          float: left;
          height: 0;
        }
        .ProseMirror:focus {
          outline: none;
        }
      `),
    ],
  });

  // Get HTML content using the official hook
  const content = useEditorContent(editor, { type: 'html' });

  // Sync content changes to parent
  useEffect(() => {
    if (onContentChange && content) {
      onContentChange(content);
    }
  }, [content, onContentChange]);

  // Use first 5 default items: bold, italic, link, tasklist, heading
  // Indices based on actions.ts: 0=bold, 1=italic, 10=bulletList, 11=orderedList, 4=heading
  const toolbarItems = [
    DEFAULT_TOOLBAR_ITEMS[0],  // bold
    DEFAULT_TOOLBAR_ITEMS[1],  // italic
    DEFAULT_TOOLBAR_ITEMS[10], // bulletList
    DEFAULT_TOOLBAR_ITEMS[11], // orderedList
    DEFAULT_TOOLBAR_ITEMS[4],  // heading
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={[styles.editorContainer, { minHeight }]}>
        <RichText editor={editor} />
      </View>
      {showToolbar && (
        <View style={styles.toolbarContainer}>
          <View style={styles.toolbarRow}>
            <View style={styles.toolbarItems}>
              <Toolbar editor={editor} items={toolbarItems} />
            </View>
            <Pressable onPress={() => Keyboard.dismiss()} style={styles.doneButton}>
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  editorContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  toolbarContainer: {
    backgroundColor: '#f8f4e9',
    borderTopWidth: 1,
    borderTopColor: 'rgba(112,121,39,0.2)',
    paddingVertical: 8,
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toolbarItems: {
    flex: 1,
  },
  doneButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  doneButtonText: {
    color: '#de8649',
    fontWeight: '600',
    fontSize: 16,
  },
});
