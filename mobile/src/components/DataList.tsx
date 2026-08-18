import React from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, RefreshControl, Platform } from 'react-native';

interface Props<T> {
  data: T[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  keyExtractor: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
  emptyText: string;
}

export function DataList<T>({ data, loading, refreshing, onRefresh, keyExtractor, renderItem, emptyText }: Props<T>) {
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0d9488" />
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={keyExtractor}
      contentContainerStyle={data.length === 0 ? styles.emptyContainer : styles.listContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0d9488" />}
      ListEmptyComponent={
        <View style={styles.emptyInner}>
          <Text style={styles.emptyText}>{emptyText}</Text>
        </View>
      }
      renderItem={({ item }) => <View style={styles.row}>{renderItem(item)}</View>}
      keyboardShouldPersistTaps="handled"
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 16, paddingBottom: 100 },
  emptyContainer: { flexGrow: 1 },
  emptyInner: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { color: '#9ca3af', fontSize: 15, textAlign: 'center' },
  row: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
});
