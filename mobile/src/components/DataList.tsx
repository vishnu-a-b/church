import React from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';

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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={<Text style={styles.emptyText}>{emptyText}</Text>}
      renderItem={({ item }) => <View style={styles.row}>{renderItem(item)}</View>}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#9ca3af', fontSize: 14 },
  row: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#f3f4f6' },
});
